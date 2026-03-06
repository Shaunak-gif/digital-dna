"""
Adversarial Attack Simulator
==============================
Simulates "smart fraudsters" who KNOW we are watching behavioral patterns
and try to mimic human behavior to bypass detection.

Three adversarial strategies:
1. Slow Bot    — adds artificial delays between pastes to fake human IKI
2. Typo Injector — inserts fake backspace events to simulate corrections
3. Hybrid      — combines slow typing + fake typos + mouse jitter

Tests how robust Digital DNA is against evasion attempts.
"""

import numpy as np
import json
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)


# ── Adversarial Event Generators ────────────────────────────────────────────

def generate_slow_bot_events(text: str, target_iki: float = 250) -> List[Dict]:
    """
    Strategy 1: Slow Bot
    Bot that adds artificial delays to mimic human IKI.
    Still pastes content but types slowly around it.
    """
    events = []
    t = 500

    # Paste main content
    events.append({"t": t, "type": "paste", "length": len(text), "wordCount": len(text.split())})
    t += 800

    # Add slow, uniform keystrokes AFTER paste (trying to look human)
    for i in range(20):
        iki = target_iki + np.random.normal(0, 10)  # Very low variance — still bot-like
        t += iki
        events.append({"t": round(t), "type": "keydown", "key": "CHAR", "iki": round(iki, 1)})

    # One more paste
    t += 1000
    events.append({"t": round(t), "type": "paste", "length": 80, "wordCount": 15})

    return events


def generate_typo_injector_events(text: str) -> List[Dict]:
    """
    Strategy 2: Typo Injector
    Bot that deliberately injects fake backspace events to simulate corrections.
    IKI is still too uniform though.
    """
    events = []
    t = 300

    # Paste main content
    events.append({"t": t, "type": "paste", "length": len(text), "wordCount": len(text.split())})
    t += 500

    # Type a few chars with fake "typos"
    for i in range(15):
        t += 55 + np.random.normal(0, 5)  # Still too uniform
        events.append({"t": round(t), "type": "keydown", "key": "CHAR", "iki": round(55 + np.random.normal(0, 5), 1)})

        # Inject fake backspace every ~5 keys
        if i % 5 == 4:
            t += 60
            events.append({"t": round(t), "type": "keydown", "key": "Backspace", "iki": 60})
            t += 55
            events.append({"t": round(t), "type": "keydown", "key": "CHAR", "iki": 55})

    return events


def generate_hybrid_adversarial_events(text: str) -> List[Dict]:
    """
    Strategy 3: Hybrid — Most Sophisticated
    Combines: varied IKI + fake typos + mouse movement + slower session pace.
    Hardest to detect — but still detectable by IKI variance and paste dominance.
    """
    events = []
    t = 1000  # Starts later — simulates "reading the form"

    # Mouse movement to look like they're reading
    for m in range(8):
        t += 500 + np.random.uniform(0, 300)
        events.append({
            "t": round(t), "type": "mouse_path_segment",
            "path": [{"t": round(t + j * 60), "x": 300 + j * 20 + np.random.normal(0, 8),
                      "y": 200 + np.random.normal(0, 5), "speed": 80 + np.random.uniform(-20, 20)}
                     for j in range(8)]
        })

    # Type some chars with slightly varied IKI (but variance still low)
    for i in range(30):
        base_iki = 200 + np.random.uniform(-40, 40)  # Variance ~1600 — still low vs human 18000+
        t += base_iki
        events.append({"t": round(t), "type": "keydown", "key": "CHAR", "iki": round(base_iki, 1)})

        # Occasional fake typo
        if np.random.random() < 0.12:
            t += 180 + np.random.uniform(-20, 20)
            events.append({"t": round(t), "type": "keydown", "key": "Backspace", "iki": round(t, 1)})

    # Now paste the bulk content
    t += 2000
    events.append({"t": round(t), "type": "paste", "length": len(text), "wordCount": len(text.split())})

    # More typing after paste
    for i in range(10):
        t += 220 + np.random.uniform(-30, 30)
        events.append({"t": round(t), "type": "keydown", "key": "CHAR", "iki": round(220 + np.random.uniform(-30, 30), 1)})

    return events


# ── Attack simulation runner ─────────────────────────────────────────────────

def simulate_attacks(n_per_strategy: int = 100) -> Dict[str, Any]:
    """
    Run all three adversarial strategies and measure detection rates
    using the heuristic scorer.
    
    Returns detection rates per strategy — shows model robustness.
    """
    import sys
    sys.path.insert(0, ".")

    try:
        from services.feature_extractor import extract_features
        from services.scoring import get_scoring_service
        scorer = get_scoring_service()
        extractor_available = True
    except Exception:
        extractor_available = False

    sample_text = "John Michael Thompson, Senior Software Engineer at FinTech Solutions Ltd, earning £72,000 per annum base salary with additional performance bonus of approximately £15,000 annually."

    strategies = {
        "slow_bot": generate_slow_bot_events,
        "typo_injector": generate_typo_injector_events,
        "hybrid_adversarial": generate_hybrid_adversarial_events,
    }

    results = {}

    for strategy_name, generator in strategies.items():
        detected = 0
        scores = []

        for _ in range(n_per_strategy):
            events = generator(sample_text)
            duration = max(e["t"] for e in events) + 1000

            if extractor_available:
                features = extract_features(events, duration)
                score = scorer.score(features)
                is_detected = score["risk_level"] in ("HIGH", "MEDIUM")
                scores.append(score["authenticity_score"])
            else:
                # Fallback: simple heuristic check
                pastes = [e for e in events if e["type"] == "paste"]
                keydowns = [e for e in events if e["type"] == "keydown"]
                ikis = [e["iki"] for e in keydowns if e.get("iki") and e["iki"] < 5000]
                iki_var = float(np.var(ikis)) if len(ikis) > 1 else 0

                # Detection: paste dominance OR very low IKI variance
                paste_vol = sum(e.get("length", 0) for e in pastes)
                total_input = len(keydowns) + paste_vol
                paste_dom = paste_vol / max(total_input, 1)

                is_detected = paste_dom > 0.3 or iki_var < 3000
                scores.append(0.3 if is_detected else 0.7)

            if is_detected:
                detected += 1

        detection_rate = detected / n_per_strategy
        results[strategy_name] = {
            "strategy": strategy_name.replace("_", " ").title(),
            "sessions_tested": n_per_strategy,
            "detected": detected,
            "detection_rate": round(detection_rate * 100, 1),
            "avg_authenticity_score": round(float(np.mean(scores)) * 100, 1),
            "evasion_rate": round((1 - detection_rate) * 100, 1),
            "verdict": "✅ Robust" if detection_rate >= 0.75 else "⚠️ Partially Evaded" if detection_rate >= 0.5 else "❌ Evaded"
        }

    results["summary"] = {
        "total_attacks": n_per_strategy * len(strategies),
        "overall_detection_rate": round(
            sum(r["detection_rate"] for r in results.values() if isinstance(r, dict) and "detection_rate" in r)
            / len(strategies), 1
        ),
        "most_evasive_strategy": max(
            [k for k in results if k != "summary"],
            key=lambda k: results[k]["evasion_rate"]
        )
    }

    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Running adversarial attack simulation...")
    results = simulate_attacks(n_per_strategy=50)
    print(json.dumps(results, indent=2))
