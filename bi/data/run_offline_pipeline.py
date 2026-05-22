import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import redis as redis_lib
from app.config import (
    REDIS_HOST, REDIS_PORT, REDIS_DB,
    INTENT_SCORE_KEY_PREFIX, INTENT_TIER_KEY_PREFIX,
    INTENT_HIGH_THRESHOLD, INTENT_LOW_THRESHOLD,
)
from app.pipeline.data_loader import DataLoader
from app.pipeline.feature_engine import FeatureEngineer
from app.model.predictor import IntentPredictor
from app.model.explainer import ShapExplainer


def run_offline_pipeline(algorithm="lightgbm"):
    print("=" * 60)
    print("FlashSale BI Offline Pipeline - Start")
    print("=" * 60)

    print("\n[1/5] Loading labeled data from database...")
    loader = DataLoader()
    labeled_data = loader.load_orders_with_labels()
    print(f"  Loaded {len(labeled_data)} labeled records")

    if not labeled_data:
        print("  ERROR: No labeled data found. Run generate_mock_data.py first.")
        return

    label_1 = sum(1 for r in labeled_data if r.get("label") == 1)
    print(f"  Positive: {label_1}, Negative: {len(labeled_data) - label_1}")

    print(f"\n[2/5] Training {algorithm} model...")
    predictor = IntentPredictor()
    train_result = predictor.train(labeled_data, algorithm=algorithm)
    print(f"  AUC: {train_result['auc']:.4f}")
    print(f"  Feature count: {len(train_result['feature_names'])}")

    fe = FeatureEngineer()
    feature_names = predictor.feature_names or fe.get_all_feature_columns()

    print("\n[3/5] Computing SHAP global explanation...")
    explainer = ShapExplainer(model=predictor.model)
    matrix = loader.load_feature_matrix()
    if matrix:
        df = fe.transform(matrix)
        X = df[feature_names].values
        global_shap = explainer.explain_global(X, feature_names)
        print("  Top 5 features:")
        for item in global_shap["global_importance"][:5]:
            print(f"    {item['feature']}: {item['importance']:.6f}")

    print("\n[4/5] Batch prediction & syncing to Redis...")
    redis_client = redis_lib.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
    if matrix:
        scores = predictor.predict(matrix)
        high_count = 0
        for record, score in zip(matrix, scores):
            uid = record["user_id"]
            tier = "HIGH" if score >= INTENT_HIGH_THRESHOLD else ("MEDIUM" if score >= INTENT_LOW_THRESHOLD else "LOW")
            redis_client.set(f"{INTENT_SCORE_KEY_PREFIX}{uid}", round(score, 4))
            redis_client.set(f"{INTENT_TIER_KEY_PREFIX}{uid}", tier)
            if tier == "HIGH":
                high_count += 1
        print(f"  Synced {len(scores)} scores to Redis")
        print(f"  HIGH: {high_count}, MEDIUM: {len(scores) - high_count - sum(1 for s in scores if s < INTENT_LOW_THRESHOLD)}, LOW: {sum(1 for s in scores if s < INTENT_LOW_THRESHOLD)}")

    print("\n[5/5] Pipeline complete!")
    print("=" * 60)
    return train_result


if __name__ == "__main__":
    algo = sys.argv[1] if len(sys.argv) > 1 else "lightgbm"
    run_offline_pipeline(algo)
