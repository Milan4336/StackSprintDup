from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI
from pydantic import BaseModel, Field
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

from features import FeatureEngineer
from model import AnomalyModel


class PredictRequest(BaseModel):
    userId: str = Field(min_length=1)
    amount: float = Field(gt=0)
    location: str = Field(min_length=2)
    deviceId: str = Field(min_length=1)
    timestamp: datetime


app = FastAPI(title="Fraud ML Service", version="1.0.0")

feature_engineer = FeatureEngineer()
model = AnomalyModel()
model.train_or_load()

requests_total = Counter("ml_requests_total", "Total ML requests", ["endpoint"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ml-service"}


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
    return model.predict_with_explanations(
        feats,
        location=payload.location,
        device_id=payload.deviceId,
    )
