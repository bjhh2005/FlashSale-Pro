from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import redis as redis_lib
import numpy as np

from app.config import (
    REDIS_HOST, REDIS_PORT, REDIS_DB,
    INTENT_SCORE_KEY_PREFIX, INTENT_TIER_KEY_PREFIX,
    INTENT_HIGH_THRESHOLD, INTENT_LOW_THRESHOLD,
)
from app.pipeline.data_loader import DataLoader
from app.pipeline.feature_engine import FeatureEngineer
from app.model.predictor import IntentPredictor
from app.model.explainer import ShapExplainer

app = FastAPI(title="FlashSale BI Service", version="1.0.0")

redis_client = redis_lib.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
data_loader = DataLoader()
predictor = IntentPredictor()
explainer = ShapExplainer(model=predictor.model)


class PredictRequest(BaseModel):
    user_id: int
    event_id: Optional[int] = None


class BatchPredictRequest(BaseModel):
    event_id: Optional[int] = None


class TrainRequest(BaseModel):
    algorithm: str = "lightgbm"


class BehaviorEventRequest(BaseModel):
    user_id: int
    product_id: Optional[int] = None
    event_id: Optional[int] = None
    item_id: Optional[int] = None
    action: str
    dwell_seconds: Optional[int] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict_user_intent(req: PredictRequest):
    try:
        matrix = data_loader.load_feature_matrix()
        user_record = next((r for r in matrix if r["user_id"] == req.user_id), None)
        if user_record is None:
            raise HTTPException(status_code=404, detail="User feature matrix not found")
        score = predictor.predict_single(user_record)
        tier = _classify_tier(score)
        _sync_to_redis(req.user_id, score, tier)
        return {"user_id": req.user_id, "purchase_intent_score": round(score, 4), "tier": tier}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/predict/batch")
def predict_batch(req: BatchPredictRequest):
    try:
        matrix = data_loader.load_feature_matrix()
        if not matrix:
            raise HTTPException(status_code=404, detail="No feature matrix data")
        scores = predictor.predict(matrix)
        results = []
        for record, score in zip(matrix, scores):
            tier = _classify_tier(score)
            uid = record["user_id"]
            _sync_to_redis(uid, score, tier)
            results.append({"user_id": uid, "purchase_intent_score": round(score, 4), "tier": tier})
        return {"count": len(results), "results": results}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/train")
def train_model(req: TrainRequest):
    try:
        labeled_data = data_loader.load_orders_with_labels()
        if not labeled_data:
            raise HTTPException(status_code=404, detail="No labeled data for training")
        result = predictor.train(labeled_data, algorithm=req.algorithm)
        explainer.model = predictor.model
        explainer._init_explainer()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/shap/global")
def shap_global():
    if explainer.explainer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    matrix = data_loader.load_feature_matrix()
    df = FeatureEngineer().transform(matrix)
    feature_names = predictor.feature_names or FeatureEngineer().get_all_feature_columns()
    X = df[feature_names].values
    return explainer.explain_global(X, feature_names)


@app.post("/shap/local/{user_id}")
def shap_local(user_id: int):
    if explainer.explainer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    matrix = data_loader.load_feature_matrix()
    user_record = next((r for r in matrix if r["user_id"] == user_id), None)
    if user_record is None:
        raise HTTPException(status_code=404, detail="User not found")
    df = FeatureEngineer().transform([user_record])
    feature_names = predictor.feature_names or FeatureEngineer().get_all_feature_columns()
    X = df[feature_names].values[0]
    return explainer.explain_local(X, feature_names)


@app.get("/intent/{user_id}")
def get_intent_score(user_id: int):
    score = redis_client.get(f"{INTENT_SCORE_KEY_PREFIX}{user_id}")
    tier = redis_client.get(f"{INTENT_TIER_KEY_PREFIX}{user_id}")
    if score is None:
        raise HTTPException(status_code=404, detail="Intent score not found in Redis")
    return {"user_id": user_id, "purchase_intent_score": float(score), "tier": tier}


def _classify_tier(score: float) -> str:
    if score >= INTENT_HIGH_THRESHOLD:
        return "HIGH"
    elif score >= INTENT_LOW_THRESHOLD:
        return "MEDIUM"
    return "LOW"


def _sync_to_redis(user_id: int, score: float, tier: str):
    redis_client.set(f"{INTENT_SCORE_KEY_PREFIX}{user_id}", round(score, 4))
    redis_client.set(f"{INTENT_TIER_KEY_PREFIX}{user_id}", tier)
