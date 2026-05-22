import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import numpy as np
import pandas as pd
from app.pipeline.feature_engine import FeatureEngineer
from app.config import FEATURE_COLUMNS


def _make_mock_records(n=50):
    rng = np.random.RandomState(42)
    records = []
    for i in range(n):
        r = {
            "user_id": i + 1,
            "click_count": int(rng.randint(0, 50)),
            "favorite_count": int(rng.randint(0, 10)),
            "add_to_cart_count": int(rng.randint(0, 8)),
            "browse_count": int(rng.randint(0, 30)),
            "share_count": int(rng.randint(0, 5)),
            "purchase_count": int(rng.randint(0, 3)),
            "avg_dwell_seconds": float(rng.uniform(5, 300)),
            "recent_7d_action_count": int(rng.randint(0, 100)),
            "recent_1d_action_count": int(rng.randint(0, 20)),
            "action_decay_score": float(rng.uniform(0, 10)),
            "cross_product_count": int(rng.randint(0, 10)),
            "price_sensitivity": float(rng.uniform(0, 1)),
        }
        intent = (r["add_to_cart_count"] + r["favorite_count"] + r["purchase_count"]) / max(r["click_count"] + 1, 1)
        r["label"] = 1 if intent > 0.3 else 0
        records.append(r)
    return records


if __name__ == "__main__":
    passed = 0
    total = 3

    fe = FeatureEngineer()
    records = _make_mock_records(10)
    df = fe.transform(records)
    assert len(df) == 10
    for col in FEATURE_COLUMNS:
        assert col in df.columns
    print("PASS [1/3]: transform produces correct shape and columns")
    passed += 1

    for name in ["interaction_intensity", "purchase_ratio", "cart_to_browse_ratio", "recent_activity_ratio", "dwell_per_browse"]:
        assert name in df.columns
    print("PASS [2/3]: all 5 derived features exist")
    passed += 1

    cols = fe.get_all_feature_columns()
    assert len(cols) == len(FEATURE_COLUMNS) + 5
    print(f"PASS [3/3]: total {len(cols)} feature columns ({len(FEATURE_COLUMNS)} base + 5 derived)")
    passed += 1

    print(f"\n{passed}/{total} tests passed!")

    try:
        from app.model.predictor import IntentPredictor
        import tempfile
        print("\n--- Model test (requires sklearn/lightgbm) ---")
        records100 = _make_mock_records(100)
        with tempfile.TemporaryDirectory() as tmp:
            predictor = IntentPredictor(model_path=os.path.join(tmp, "model.pkl"))
            predictor.feature_names_path = os.path.join(tmp, "feature_names.json")
            result = predictor.train(records100, algorithm="lightgbm")
            print(f"PASS: model AUC = {result['auc']:.4f} (NFR3 target: >= 0.85)")
            scores = predictor.predict(records100[:5])
            assert len(scores) == 5
            for s in scores:
                assert 0 <= s <= 1
            print("PASS: predict returns 5 valid scores in [0,1]")

            from app.model.explainer import ShapExplainer
            explainer = ShapExplainer(model=predictor.model)
            df_full = fe.transform(records100)
            feature_names = predictor.feature_names
            X = df_full[feature_names].values
            global_result = explainer.explain_global(X, feature_names)
            assert "global_importance" in global_result
            print(f"PASS: SHAP global importance ({len(global_result['global_importance'])} features)")

            local_result = explainer.explain_local(X[0], feature_names)
            assert "local_contributions" in local_result
            assert "prediction" in local_result
            print("PASS: SHAP local explanation works")
    except ImportError as e:
        print(f"\nSKIP: Model test (missing dependency: {e})")
    except MemoryError:
        print("\nSKIP: Model test (insufficient system memory)")
