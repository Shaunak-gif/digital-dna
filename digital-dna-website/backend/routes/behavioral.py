"""
Behavioral API Routes
POST /events   – ingest behavioral event batches
GET  /score/{session_id} – get authenticity score for a session
GET  /sessions – list sessions for dashboard
GET  /stats    – aggregate statistics for dashboard
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_

from database import get_db, BehavioralSession, EventBatch
from services.feature_extractor import extract_features
from services.scoring import get_scoring_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic Schemas ────────────────────────────────────────────────

class EventBatchPayload(BaseModel):
    session_id: str
    form_id: str
    is_final: bool = False
    session_duration: int  # ms
    events: List[Dict[str, Any]]


class ScoreResponse(BaseModel):
    session_id: str
    authenticity_score: float
    anomaly_probability: float
    risk_level: str
    reason: str
    features: Dict[str, Any]


# ── Routes ──────────────────────────────────────────────────────────

@router.post("/events", status_code=202)
async def ingest_events(
    payload: EventBatchPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Accept behavioral event batches from the frontend SDK.
    On final batch, run full feature extraction + ML scoring.
    """
    # Store raw batch
    batch = EventBatch(
        session_id=payload.session_id,
        batch_data=json.dumps({
            "events": payload.events,
            "session_duration": payload.session_duration,
            "form_id": payload.form_id
        })
    )
    db.add(batch)

    if payload.is_final:
        # Collect all batches for this session
        result = await db.execute(
            select(EventBatch).where(EventBatch.session_id == payload.session_id)
        )
        all_batches = result.scalars().all()

        all_events = []
        for b in all_batches:
            data = json.loads(b.batch_data)
            all_events.extend(data.get("events", []))
        all_events.extend(payload.events)

        # Feature extraction
        features = extract_features(all_events, payload.session_duration)

        # ML scoring
        scorer = get_scoring_service()
        score_result = scorer.score(features)

        # Upsert session record
        existing = await db.get(BehavioralSession, payload.session_id)
        if existing:
            session_rec = existing
        else:
            session_rec = BehavioralSession(session_id=payload.session_id)
            db.add(session_rec)

        session_rec.form_id = payload.form_id
        session_rec.session_duration = payload.session_duration
        session_rec.authenticity_score = score_result['authenticity_score']
        session_rec.anomaly_probability = score_result['anomaly_probability']
        session_rec.risk_level = score_result['risk_level']
        session_rec.reason = score_result['reason']
        session_rec.avg_iki = features.get('avg_iki')
        session_rec.iki_variance = features.get('iki_variance')
        session_rec.backspace_rate = features.get('backspace_rate')
        session_rec.paste_count = int(features.get('paste_count', 0))
        session_rec.copy_count = int(features.get('copy_count', 0))
        session_rec.edit_bursts = int(features.get('edit_bursts', 0))
        session_rec.mouse_naturalness = features.get('mouse_naturalness')
        session_rec.typing_naturalness = features.get('typing_naturalness')
        session_rec.total_keystrokes = int(features.get('total_keystrokes', 0))
        session_rec.is_flagged = score_result['risk_level'] == 'HIGH'
        session_rec.updated_at = datetime.utcnow()
        session_rec.raw_events = json.dumps(all_events[-200:])  # Keep last 200 events

    await db.commit()
    return {"status": "accepted", "session_id": payload.session_id, "is_final": payload.is_final}


@router.get("/score/{session_id}", response_model=ScoreResponse)
async def get_score(session_id: str, db: AsyncSession = Depends(get_db)):
    """Return the computed authenticity score for a session."""
    result = await db.get(BehavioralSession, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found. Ensure is_final=true was sent.")

    return ScoreResponse(
        session_id=result.session_id,
        authenticity_score=result.authenticity_score or 0.5,
        anomaly_probability=result.anomaly_probability or 0.5,
        risk_level=result.risk_level or "MEDIUM",
        reason=result.reason or "",
        features={
            "typing_naturalness": result.typing_naturalness,
            "mouse_naturalness": result.mouse_naturalness,
            "avg_iki": result.avg_iki,
            "iki_variance": result.iki_variance,
            "backspace_rate": result.backspace_rate,
            "paste_count": result.paste_count,
            "edit_bursts": result.edit_bursts,
        }
    )


@router.get("/sessions")
async def list_sessions(
    risk: Optional[str] = Query("ALL"),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    """List sessions for the analyst dashboard."""
    q = select(BehavioralSession).order_by(desc(BehavioralSession.created_at)).limit(limit)
    if risk and risk != "ALL":
        q = q.where(BehavioralSession.risk_level == risk)

    result = await db.execute(q)
    sessions = result.scalars().all()

    return [
        {
            "session_id": s.session_id,
            "form_id": s.form_id,
            "session_duration": s.session_duration,
            "authenticity_score": s.authenticity_score,
            "anomaly_probability": s.anomaly_probability,
            "risk_level": s.risk_level,
            "reason": s.reason,
            "paste_count": s.paste_count,
            "is_flagged": s.is_flagged,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "features": {
                "typing_naturalness": s.typing_naturalness,
                "mouse_naturalness": s.mouse_naturalness,
                "avg_iki": s.avg_iki,
                "iki_variance": s.iki_variance,
                "backspace_rate": s.backspace_rate,
                "paste_count": s.paste_count,
                "edit_bursts": s.edit_bursts,
            }
        }
        for s in sessions
    ]


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Aggregate statistics for the dashboard."""
    # Total count
    total_result = await db.execute(select(func.count(BehavioralSession.session_id)))
    total = total_result.scalar() or 0

    # Risk counts
    high_result = await db.execute(
        select(func.count()).where(BehavioralSession.risk_level == "HIGH")
    )
    medium_result = await db.execute(
        select(func.count()).where(BehavioralSession.risk_level == "MEDIUM")
    )
    high = high_result.scalar() or 0
    medium = medium_result.scalar() or 0

    # AI detected = flagged sessions
    ai_result = await db.execute(
        select(func.count()).where(BehavioralSession.is_flagged == True)
    )
    ai_detected = ai_result.scalar() or 0

    # Avg score
    avg_result = await db.execute(select(func.avg(BehavioralSession.authenticity_score)))
    avg_score = float(avg_result.scalar() or 0.5)

    # Hourly trend (last 24h) - simplified
    hourly_trend = []
    now = datetime.utcnow()
    for h in range(23, -1, -1):
        start = now - timedelta(hours=h + 1)
        end = now - timedelta(hours=h)

        h_high = await db.execute(
            select(func.count()).where(
                and_(BehavioralSession.risk_level == "HIGH",
                     BehavioralSession.created_at >= start,
                     BehavioralSession.created_at < end)
            )
        )
        h_med = await db.execute(
            select(func.count()).where(
                and_(BehavioralSession.risk_level == "MEDIUM",
                     BehavioralSession.created_at >= start,
                     BehavioralSession.created_at < end)
            )
        )
        h_low = await db.execute(
            select(func.count()).where(
                and_(BehavioralSession.risk_level == "LOW",
                     BehavioralSession.created_at >= start,
                     BehavioralSession.created_at < end)
            )
        )
        hourly_trend.append({
            "hour": end.strftime("%H:00"),
            "high": h_high.scalar() or 0,
            "medium": h_med.scalar() or 0,
            "low": h_low.scalar() or 0,
        })

    # Score distribution buckets
    score_distribution = []
    ranges = [("0-25%", 0, 0.25), ("25-50%", 0.25, 0.5), ("50-75%", 0.5, 0.75), ("75-100%", 0.75, 1.0)]
    for label, lo, hi in ranges:
        cnt = await db.execute(
            select(func.count()).where(
                and_(BehavioralSession.authenticity_score >= lo,
                     BehavioralSession.authenticity_score < hi)
            )
        )
        score_distribution.append({"range": label, "count": cnt.scalar() or 0})

    return {
        "total_sessions": total,
        "high_risk": high,
        "medium_risk": medium,
        "ai_detected": ai_detected,
        "avg_score": avg_score,
        "hourly_trend": hourly_trend,
        "score_distribution": score_distribution,
    }


@router.post("/flag/{session_id}")
async def flag_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Manually flag a session for review."""
    session = await db.get(BehavioralSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_flagged = True
    await db.commit()
    return {"status": "flagged", "session_id": session_id}
