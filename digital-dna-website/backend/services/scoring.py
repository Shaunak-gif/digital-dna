"""
ML Scoring Service
Loads trained models (Isolation Forest + LSTM) and scores sessions.
Falls back to heuristic scoring if model not yet trained.
"""
import os
import json
import numpy as np
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = os.getenv("MODEL_PATH", "../ml/models/")


class ScoringService:
    def __init__(self):
        self.isolation_forest = None
        self.scaler = None
        self._load_models()

    def _load_models(self):
        """Load trained ML models if they exist."""
        try:
            import joblib
            iso_path = os.path.join(MODEL_PATH, "isolation_forest.joblib")
            scaler_path = os.path.join(MODEL_PATH, "scaler.joblib")
            if os.path.exists(iso_path) and os.path.exists(scaler_path):
                self.isolation_forest = joblib.load(iso_path)
                self.scaler = joblib.load(scaler_path)
                logger.info("Isolation Forest model loaded.")
            else:
                logger.warning("No trained model found. Using heuristic scoring.")
        except Exception as e:
            logger.error(f"Model load error: {e}")

    def score(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Score a session's behavioral features.
        Returns authenticity_score (0-1, higher = more human) and risk level.
        """
        if self.isolation_forest and self.scaler:
            return self._ml_score(features)
        else:
            return self._heuristic_score(features)

    def _ml_score(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Use trained Isolation Forest model."""
        from services.feature_extractor import features_to_vector
        vec = np.array(features_to_vector(features)).reshape(1, -1)
        vec_scaled = self.scaler.transform(vec)

        # Isolation Forest: -1 = anomaly, 1 = normal
        prediction = self.isolation_forest.predict(vec_scaled)[0]
        score_raw = self.isolation_forest.score_samples(vec_scaled)[0]

        # Convert to 0-1 probability (more negative = more anomalous)
        # Typical range is -0.5 to 0.5
        anomaly_prob = float(1 / (1 + np.exp(score_raw * 10)))
        authenticity = 1.0 - anomaly_prob

        return self._build_result(authenticity, anomaly_prob, features, source="isolation_forest")

    def _heuristic_score(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Rule-based heuristic scoring when no ML model is trained yet.
        Based on known AI-generation behavioral patterns.
        """
        score = 0.5  # Start neutral
        reasons = []

        # --- TYPING ANALYSIS ---
        avg_iki = features.get('avg_iki', 0)
        iki_var = features.get('iki_variance', 0)
        burst_ratio = features.get('burst_typing_ratio', 0)
        backspace_rate = features.get('backspace_rate', 0)

        # Natural human typing: 150-600ms IKI average, high variance
        if avg_iki > 0:
            if avg_iki < 80:
                score -= 0.25
                reasons.append("Abnormally fast typing (avg IKI <80ms)")
            elif 150 < avg_iki < 600:
                score += 0.1
                reasons.append("Natural typing speed")

        if iki_var < 1000 and avg_iki > 0:  # Very uniform = bot-like
            score -= 0.2
            reasons.append("Suspiciously uniform keystroke timing")
        elif iki_var > 5000:
            score += 0.1
            reasons.append("Natural typing rhythm variation")

        if burst_ratio > 0.4:
            score -= 0.15
            reasons.append("High burst typing ratio (machine-like speed spikes)")

        # Humans make typos and corrections
        if backspace_rate < 0.01 and features.get('total_keystrokes', 0) > 50:
            score -= 0.15
            reasons.append("No typo corrections detected (unnaturally perfect)")
        elif 0.05 < backspace_rate < 0.25:
            score += 0.1
            reasons.append("Natural correction behavior")

        # --- PASTE ANALYSIS ---
        paste_count = features.get('paste_count', 0)
        paste_dominance = features.get('paste_dominance', 0)

        if paste_count > 2:
            score -= 0.15
            reasons.append(f"Multiple paste events ({paste_count})")
        if paste_dominance > 0.5:
            score -= 0.2
            reasons.append("Content primarily pasted, not typed")

        # --- EDIT BURSTS ---
        edit_bursts = features.get('edit_bursts', 0)
        if edit_bursts > 2:
            score += 0.1
            reasons.append("Natural edit-correct behavior observed")

        # --- MOUSE ANALYSIS ---
        mouse_naturalness = features.get('mouse_naturalness', 0)
        if mouse_naturalness < 0.2:
            score -= 0.1
            reasons.append("Mouse movement lacks natural variation")
        elif mouse_naturalness > 0.5:
            score += 0.05

        # --- SESSION TIMING ---
        session_s = features.get('session_duration_s', 0)
        total_keys = features.get('total_keystrokes', 0)
        if session_s < 10 and total_keys > 100:
            score -= 0.3
            reasons.append("Too many keystrokes in too short a time")

        # Clamp to [0, 1]
        authenticity = max(0.0, min(1.0, score))
        anomaly_prob = 1.0 - authenticity

        return self._build_result(authenticity, anomaly_prob, features, source="heuristic", reasons=reasons)

    def _build_result(self, authenticity: float, anomaly_prob: float,
                      features: Dict, source: str, reasons: List[str] = None) -> Dict[str, Any]:
        if anomaly_prob >= 0.70:
            risk_level = "HIGH"
            summary = "High probability of AI-assisted content or automated fraud."
        elif anomaly_prob >= 0.40:
            risk_level = "MEDIUM"
            summary = "Behavioral anomalies detected. Manual review recommended."
        else:
            risk_level = "LOW"
            summary = "Session exhibits natural human behavioral patterns."

        if reasons:
            summary = summary + " Signals: " + "; ".join(reasons[:3])

        return {
            "authenticity_score": round(authenticity, 4),
            "anomaly_probability": round(anomaly_prob, 4),
            "risk_level": risk_level,
            "reason": summary,
            "model_source": source,
            "features": {
                "typing_naturalness": round(features.get('typing_naturalness', 0), 3),
                "mouse_naturalness": round(features.get('mouse_naturalness', 0), 3),
                "avg_iki": round(features.get('avg_iki', 0), 1),
                "iki_variance": round(features.get('iki_variance', 0), 1),
                "backspace_rate": round(features.get('backspace_rate', 0), 3),
                "paste_count": int(features.get('paste_count', 0)),
                "edit_bursts": int(features.get('edit_bursts', 0)),
                "burst_typing_ratio": round(features.get('burst_typing_ratio', 0), 3),
                "paste_dominance": round(features.get('paste_dominance', 0), 3),
            }
        }


# Singleton instance
_scoring_service = None

def get_scoring_service() -> ScoringService:
    global _scoring_service
    if _scoring_service is None:
        _scoring_service = ScoringService()
    return _scoring_service
