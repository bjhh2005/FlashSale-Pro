import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import pytest
import numpy as np
import pandas as pd
from app.pipeline.feature_engine import FeatureEngineer
from app.model.predictor import IntentPredictor
from app.model.explainer import ShapExplainer
from app.config import FEATURE_COLUMNS


def _make_mock_records(n=100):
    rng = np.random.RandomState(42)
    records = []
    for i in range(n):
        r = {
            "user_id": i + 1,
            "click_count": rng.randint(0, 50),
            "favorite_count": rng.randint(0, 10),
            "add_to_cart_count": rng.randint(0, 8),
            "browse_count": rng.randint(0, 30),
            "share_count": rng.randint(0, 5),
            "purchase_count": rng.randint(0, 3),
            "avg_dwell_seconds": rng.uniform(5, 300),
            "recent_7d_action_count": rng.randint(0, 100),
            "recent_1d_action_count": rng.randint(0, 20),
            "action_decay_score": rng.uniform(0, 10),
            "cross_product_count": rng.randint(0, 10),
            "price_sensitivity": rng.uniform(0, 1),
        }
        intent = (r["add_to_cart_count"] + r["favorite_count"] + r["purchase_count"]) / max(r["click_count"] + 1, 1)
        r["label"] = 1 if intent > 0.3 else 0
        records.append(r)
    return records


class TestFeatureEngineer:
    def test_transform_basic(self):
        fe = FeatureEngineer()
        records = _make_mock_records(10)
        df = fe.transform(records)
        assert len(df) == 10
        for col in FEATURE_COLUMNS:
            assert col in df.columns

    def test_derived_features(self):
        fe = FeatureEngineer()
        records = _make_mock_records(10)
        df = fe.transform(records)
        assert "interaction_intensity" in df.columns
        assert "purchase_ratio" in df.columns
        assert "cart_to_browse_ratio" in df.columns
        assert "recent_activity_ratio" in df.columns
        assert "dwell_per_browse" in df.columns

    def test_all_feature_columns(self):
        fe = FeatureEngineer()
        cols = fe.get_all_feature_columns()
        assert len(cols) == len(FEATURE_COLUMNS) + 5


class TestIntentPredictor:
    def test_train_and_predict(self, tmp_path):
        records = _make_mock_records(200)
        predictor = IntentPredictor(
            model_path=str(tmp_path / "model.pkl"),
        )
        predictor.feature_names_path = str(tmp_path / "feature_names.json")
        result = predictor.train(records, algorithm="lightgbm")
        assert result["auc"] > 0.5
        assert "feature_names" in result

        scores = predictor.predict(records[:5])
        assert len(scores) == 5
        for s in scores:
            assert 0 <= s <= 1

    def test_predict_single(self, tmp_path):
        records = _make_mock_records(200)
        predictor = IntentPredictor(
            model_path=str(tmp_path / "model.pkl"),
        )
        predictor.feature_names_path = str(tmp_path / "feature_names.json")
        predictor.train(records, algorithm="lightgbm")
        score = predictor.predict_single(records[0])
        assert 0 <= score <= 1


class TestShapExplainer:
    def test_global_explanation(self, tmp_path):
        records = _make_mock_records(200)
        predictor = IntentPredictor(
            model_path=str(tmp_path / "model.pkl"),
        )
        predictor.feature_names_path = str(tmp_path / "feature_names.json")
        predictor.train(records, algorithm="lightgbm")

        explainer = ShapExplainer(model=predictor.model)
        fe = FeatureEngineer()
        df = fe.transform(records)
        feature_names = predictor.feature_names
        X = df[feature_names].values

        result = explainer.explain_global(X, feature_names)
        assert "global_importance" in result
        assert len(result["global_importance"]) == len(feature_names)

    def test_local_explanation(self, tmp_path):
        records = _make_mock_records(200)
        predictor = IntentPredictor(
            model_path=str(tmp_path / "model.pkl"),
        )
        predictor.feature_names_path = str(tmp_path / "feature_names.json")
        predictor.train(records, algorithm="lightgbm")

        explainer = ShapExplainer(model=predictor.model)
        fe = FeatureEngineer()
        df = fe.transform(records[:1])
        feature_names = predictor.feature_names
        X = df[feature_names].values[0]

        result = explainer.explain_local(X, feature_names)
        assert "local_contributions" in result
        assert "base_value" in result
        assert "prediction" in result
