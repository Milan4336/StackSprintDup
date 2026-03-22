from __future__ import annotations

import os
import numpy as np
from sklearn.ensemble import IsolationForest

MODEL_PATH = os.getenv("MODEL_PATH", "model.npz")


class AnomalyModel:
    def __init__(self) -> None:
        self.model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
        self.is_fitted = False

    def train_or_load(self) -> None:
        # In production this should load persisted training vectors from object storage.
        rng = np.random.default_rng(42)
        normal = np.column_stack(
            [
                rng.normal(120, 40, 5000),
                rng.normal(0, 1, 5000),
                rng.poisson(2, 5000),
                rng.normal(15, 8, 5000),
                rng.normal(0.7, 0.2, 5000),
            ]
        )
        self.model.fit(normal)
        self.is_fitted = True

    def probability(self, features: list[float]) -> float:
        if not self.is_fitted:
            self.train_or_load()

        vec = np.array([features])
        # Higher anomaly likelihood for lower decision score.
        decision = float(self.model.decision_function(vec)[0])
        prob = 1.0 / (1.0 + np.exp(8 * decision))
        return max(0.0, min(1.0, prob))

    def predict_with_explanations(self, features: list[float], location: str, device_id: str) -> dict:
        prob = float(self.probability(features))
        amount = float(features[0])
        amount_z = abs(float(features[1]))
        tx_freq = float(features[2])
        geo_delta = float(features[3])
        device_entropy = float(features[4])

        raw_impacts = {
            "amount": min(1.0, 0.25 + amount_z * 0.25 + amount / 100000.0),
            "location": min(1.0, geo_delta / 8000.0),
            "device": min(1.0, 0.25 + device_entropy * 0.25 + (0.3 if device_id.startswith("unknown") else 0.0)),
            "velocity": min(1.0, tx_freq / 10.0),
        }
        total = sum(raw_impacts.values()) or 1.0

        reasons = {
            "amount": "Amount significantly above user average" if amount_z > 1.4 else "Amount within expected user profile",
            "location": "Unusual geographic location" if geo_delta > 2000 else f"Location {location} close to recent activity",
            "device": "Unknown device detected" if device_id.startswith("unknown") else "Device fingerprint seen previously",
            "velocity": "High transaction velocity in short window" if tx_freq >= 4 else "Normal transaction velocity",
        }

        ordered = sorted(raw_impacts.items(), key=lambda x: x[1], reverse=True)[:3]
        explanations = [
            {
                "feature": feature,
                "impact": round(impact / total, 2),
                "reason": reasons[feature],
            }
            for feature, impact in ordered
        ]

        return {
            "fraudScore": round(prob, 4),
            "isFraud": bool(prob >= 0.7),
            "explanations": explanations,
        }
