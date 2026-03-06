"""
Real-Time Scoring Pipeline
===========================
Kafka consumer that scores behavioral sessions as events stream in —
updating the risk score LIVE while the user is still filling the form.

Without Kafka: falls back to polling mode using PostgreSQL.

Run this as a separate process:
    python realtime_pipeline.py
"""

import asyncio
import json
import logging
import os
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

KAFKA_AVAILABLE = False
try:
    from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
    KAFKA_AVAILABLE = True
except ImportError:
    logger.warning("aiokafka not installed. Running in polling fallback mode.")

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_INPUT_TOPIC = "behavioral-events"
KAFKA_OUTPUT_TOPIC = "behavioral-scores"
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_MS", "3000"))  # ms


# ── Interim scorer (scores partial sessions in real time) ───────────────────

def interim_score(events: list, session_duration_ms: int) -> dict:
    """
    Fast heuristic score on partial event stream.
    Called every 5 seconds as batches arrive — before final ML scoring.
    """
    keydowns = [e for e in events if e.get('type') == 'keydown']
    pastes   = [e for e in events if e.get('type') == 'paste']
    ikis = [e['iki'] for e in keydowns if e.get('iki') is not None and e['iki'] < 5000]

    risk_score = 0.5  # neutral start
    signals = []

    # Fast typing check
    if ikis:
        avg_iki = sum(ikis) / len(ikis)
        if avg_iki < 80:
            risk_score -= 0.25
            signals.append(f"avg_iki={avg_iki:.0f}ms (bot-like)")
        elif avg_iki > 150:
            risk_score += 0.1

    # Paste check
    if len(pastes) >= 2:
        risk_score -= 0.2
        signals.append(f"{len(pastes)} paste events")

    # Backspace check
    backspaces = [e for e in keydowns if e.get('key') == 'Backspace']
    if len(keydowns) > 20 and len(backspaces) == 0:
        risk_score -= 0.15
        signals.append("zero corrections")

    # Session speed
    if session_duration_ms < 15000 and len(keydowns) > 30:
        risk_score -= 0.2
        signals.append(f"session too fast ({session_duration_ms/1000:.1f}s)")

    authenticity = max(0.0, min(1.0, risk_score))
    anomaly_prob = 1.0 - authenticity

    if anomaly_prob >= 0.65:
        risk_level = "HIGH"
    elif anomaly_prob >= 0.35:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "authenticity_score": round(authenticity, 3),
        "anomaly_probability": round(anomaly_prob, 3),
        "risk_level": risk_level,
        "is_interim": True,
        "signals": signals,
        "events_processed": len(events),
        "scored_at": datetime.utcnow().isoformat()
    }


# ── Kafka pipeline ──────────────────────────────────────────────────────────

async def run_kafka_pipeline():
    logger.info("Starting Kafka real-time scoring pipeline...")

    consumer = AIOKafkaConsumer(
        KAFKA_INPUT_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        value_deserializer=lambda v: json.loads(v.decode()),
        group_id="digital-dna-scorer",
        auto_offset_reset="latest"
    )
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP,
        value_serializer=lambda v: json.dumps(v).encode()
    )

    await consumer.start()
    await producer.start()
    logger.info(f"Connected to Kafka at {KAFKA_BOOTSTRAP}")

    # In-memory session event buffer
    session_buffer: dict[str, list] = {}
    session_meta: dict[str, dict] = {}

    try:
        async for msg in consumer:
            payload = msg.value
            session_id = payload.get("session_id")
            events = payload.get("events", [])
            duration = payload.get("session_duration", 0)
            is_final = payload.get("is_final", False)

            if not session_id:
                continue

            # Accumulate events
            if session_id not in session_buffer:
                session_buffer[session_id] = []
                session_meta[session_id] = {"form_id": payload.get("form_id")}

            session_buffer[session_id].extend(events)

            # Score this partial/final batch
            all_events = session_buffer[session_id]
            score = interim_score(all_events, duration)
            score["session_id"] = session_id
            score["form_id"] = session_meta[session_id].get("form_id")

            if is_final:
                score["is_interim"] = False
                del session_buffer[session_id]
                del session_meta[session_id]
                logger.info(f"FINAL score for {session_id}: {score['risk_level']} ({score['authenticity_score']})")
            else:
                logger.info(f"INTERIM score for {session_id}: {score['risk_level']} ({score['authenticity_score']}) — {len(all_events)} events so far")

            # Publish score to output topic
            await producer.send(KAFKA_OUTPUT_TOPIC, value=score)

    finally:
        await consumer.stop()
        await producer.stop()


# ── Polling fallback (no Kafka) ─────────────────────────────────────────────

async def run_polling_pipeline():
    """
    Fallback: poll PostgreSQL for new unscored batches every N seconds.
    Produces interim scores stored back to DB.
    """
    import asyncpg

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://digitaldna:digitaldna@localhost:5432/digitaldna"
    ).replace("postgresql+asyncpg://", "postgresql://")

    logger.info(f"Polling pipeline active — checking every {POLL_INTERVAL}ms")

    conn = await asyncpg.connect(DATABASE_URL)
    session_buffer: dict[str, list] = {}

    try:
        while True:
            # Fetch unprocessed event batches
            rows = await conn.fetch("""
                SELECT session_id, batch_data, received_at
                FROM event_batches
                WHERE received_at > NOW() - INTERVAL '10 minutes'
                ORDER BY received_at ASC
                LIMIT 100
            """)

            for row in rows:
                session_id = row["session_id"]
                data = json.loads(row["batch_data"])
                events = data.get("events", [])
                duration = data.get("session_duration", 0)

                if session_id not in session_buffer:
                    session_buffer[session_id] = []
                session_buffer[session_id].extend(events)

                score = interim_score(session_buffer[session_id], duration)

                # Update interim score in DB
                await conn.execute("""
                    UPDATE behavioral_sessions
                    SET authenticity_score = $1,
                        anomaly_probability = $2,
                        risk_level = $3,
                        updated_at = NOW()
                    WHERE session_id = $4
                """, score["authenticity_score"], score["anomaly_probability"],
                     score["risk_level"], session_id)

            await asyncio.sleep(POLL_INTERVAL / 1000)

    finally:
        await conn.close()


# ── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if KAFKA_AVAILABLE:
        asyncio.run(run_kafka_pipeline())
    else:
        logger.info("Kafka not available — running PostgreSQL polling pipeline")
        asyncio.run(run_polling_pipeline())
