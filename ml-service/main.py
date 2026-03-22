from __future__ import annotations

import time
from collections import deque
from datetime import datetime, timezone

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

from features import FeatureEngineer
from ensemble import EnsembleModel
from registry import ModelRegistry


# ── Pydantic schemas ────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    userId: str = Field(min_length=1)
    amount: float = Field(gt=0)
    location: str = Field(min_length=2)
    deviceId: str = Field(min_length=1)
    timestamp: datetime


class RetrainRequest(BaseModel):
    async_mode: bool = True


class EnsembleConfigRequest(BaseModel):
    weights: dict[str, float] | None = None
    fraud_threshold: float | None = None


# ── App bootstrap ────────────────────────────────────────────────────────────
app = FastAPI(title="Fraud ML Service", version="2.0.0")

feature_engineer = FeatureEngineer()
registry = ModelRegistry()
ensemble = EnsembleModel(registry)
ensemble.train_all()

# ── Prometheus metrics ───────────────────────────────────────────────────────
requests_total = Counter("ml_requests_total", "Total ML requests", ["endpoint"])
fraud_score_hist = Histogram("ml_fraud_score", "Distribution of fraud scores", buckets=[0.1 * i for i in range(11)])

# ── Runtime stats (in-memory ring buffer for last 1000 predictions) ──────────
_recent_scores: deque[float] = deque(maxlen=1000)
_retraining = False


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "ml-service",
        "version": "2.0.0",
        "models": [m["modelName"] for m in registry.all()],
    }


@app.get("/metrics")
def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/predict")
def predict(payload: PredictRequest) -> dict:
    requests_total.labels(endpoint="predict").inc()

    feats = feature_engineer.build(
        user_id=payload.userId,
        amount=payload.amount,
        location=payload.location,
        device_id=payload.deviceId,
        timestamp=payload.timestamp,
    )
    result = ensemble.predict(feats, location=payload.location, device_id=payload.deviceId)

    fraud_score_hist.observe(result.fraud_score)
    _recent_scores.append(result.fraud_score)

    return {
        "fraudScore":   result.fraud_score,
        "isFraud":      result.is_fraud,
        "confidence":   result.confidence,
        "modelScores":  result.model_scores,
        "modelWeights": result.model_weights,
        "explanations": result.explanations,
    }


@app.get("/model/info")
def model_info() -> dict:
    """Returns version, training date, and status for all registered models."""
    return {
        "models": registry.all(),
        "ensemble": {
            "weights": ensemble._weights,
            "fraud_threshold": ensemble._threshold,
        },
    }


@app.patch("/model/config")
def update_ensemble_config(payload: EnsembleConfigRequest) -> dict:
    """Update ensemble weights or fraud threshold dynamically."""
    if payload.weights:
        # Validate weights sum to ~1.0
        total = sum(payload.weights.values())
        if abs(total - 1.0) > 0.001:
            raise HTTPException(status_code=400, detail=f"Weights must sum to 1.0 (got {total})")
        
        # Ensure all required keys are present if we want to replace, 
        # or just update the ones provided if they exist in ensemble._weights
        for k in payload.weights:
            if k not in ensemble._weights:
                raise HTTPException(status_code=400, detail=f"Invalid model key: {k}")
        
        ensemble._weights.update(payload.weights)

    if payload.fraud_threshold is not None:
        ensemble._threshold = payload.fraud_threshold

    return {
        "weights": ensemble._weights,
        "fraud_threshold": ensemble._threshold,
    }


@app.get("/model/metrics")
def model_metrics() -> dict:
    """Runtime prediction statistics from the in-memory ring buffer."""
    scores = list(_recent_scores)
    if not scores:
        return {"message": "No predictions yet", "sampleSize": 0}

    import numpy as np  # noqa: PLC0415
    return {
        "sampleSize":    len(scores),
        "meanScore":     round(float(np.mean(scores)), 4),
        "p50":           round(float(np.percentile(scores, 50)), 4),
        "p95":           round(float(np.percentile(scores, 95)), 4),
        "fraudRate":     round(sum(s >= 0.55 for s in scores) / len(scores), 4),
        "capturedAt":    datetime.now(tz=timezone.utc).isoformat(),
    }


@app.post("/model/retrain")
def retrain(payload: RetrainRequest, background_tasks: BackgroundTasks) -> dict:
    """Trigger a full model retrain (on synthetic data for now)."""
    global _retraining  # noqa: PLW0603

    if _retraining:
        raise HTTPException(status_code=409, detail="Retrain already in progress")

    def _do_retrain() -> None:
        global _retraining  # noqa: PLW0603
        _retraining = True
        try:
            ensemble.train_all()
        finally:
            _retraining = False

    if payload.async_mode:
        background_tasks.add_task(_do_retrain)
        return {"status": "started", "async": True}

    _do_retrain()
    return {"status": "complete", "async": False, "models": registry.all()}
