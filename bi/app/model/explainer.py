import shap
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from app.config import MODEL_PATH, SHAP_VALUES_PATH


class ShapExplainer:
    def __init__(self, model=None):
        self.model = model
        self.explainer = None
        if model is not None:
            self._init_explainer()

    def _init_explainer(self):
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception:
            self.explainer = shap.Explainer(self.model)

    def load_model(self, model_path=None):
        p = Path(model_path or MODEL_PATH)
        if p.exists():
            self.model = joblib.load(p)
            self._init_explainer()

    def explain_global(self, X: np.ndarray, feature_names: list[str]) -> dict:
        if self.explainer is None:
            raise RuntimeError("Explainer not initialized")
        shap_values = self.explainer.shap_values(X)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        mean_abs_shap = np.abs(shap_values).mean(axis=0)
        global_importance = sorted(
            zip(feature_names, mean_abs_shap.tolist()),
            key=lambda x: x[1],
            reverse=True,
        )
        return {
            "global_importance": [
                {"feature": f, "importance": round(v, 6)} for f, v in global_importance
            ],
            "base_value": float(self.explainer.expected_value)
            if not isinstance(self.explainer.expected_value, list)
            else float(self.explainer.expected_value[1]),
        }

    def explain_local(self, X_single: np.ndarray, feature_names: list[str]) -> dict:
        if self.explainer is None:
            raise RuntimeError("Explainer not initialized")
        shap_values = self.explainer.shap_values(X_single.reshape(1, -1))
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        sv = shap_values[0]
        local_contrib = sorted(
            zip(feature_names, sv.tolist()),
            key=lambda x: abs(x[1]),
            reverse=True,
        )
        return {
            "local_contributions": [
                {"feature": f, "shap_value": round(v, 6)} for f, v in local_contrib
            ],
            "base_value": float(self.explainer.expected_value)
            if not isinstance(self.explainer.expected_value, list)
            else float(self.explainer.expected_value[1]),
            "prediction": float(
                (self.explainer.expected_value if not isinstance(self.explainer.expected_value, list) else self.explainer.expected_value[1])
                + sv.sum()
            ),
        }
