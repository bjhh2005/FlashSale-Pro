import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
from app.config import MODEL_PATH, FEATURE_NAMES_PATH
from app.pipeline.feature_engine import FeatureEngineer


class IntentPredictor:
    def __init__(self, model_path=None):
        self.model_path = model_path or MODEL_PATH
        self.feature_names_path = FEATURE_NAMES_PATH
        self.model = None
        self.feature_names = None
        self.fe = FeatureEngineer()
        self._load()

    def _load(self):
        p = Path(self.model_path)
        if p.exists():
            self.model = joblib.load(p)
        fn = Path(self.feature_names_path)
        if fn.exists():
            with open(fn) as f:
                self.feature_names = json.load(f)

    def train(self, records: list[dict], label_col="label", algorithm="lightgbm"):
        df = self.fe.transform(records)
        if label_col not in df.columns:
            raise ValueError(f"Label column '{label_col}' not found in data")

        self.feature_names = self.fe.get_all_feature_columns()
        X = df[self.feature_names].values
        y = df[label_col].values

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        if algorithm == "lightgbm":
            self.model = lgb.LGBMClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                verbose=-1,
            )
        else:
            from xgboost import XGBClassifier
            self.model = XGBClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                verbosity=0,
                use_label_encoder=False,
                eval_metric="logloss",
            )

        self.model.fit(X_train, y_train)

        y_pred_proba = self.model.predict_proba(X_val)[:, 1]
        auc = roc_auc_score(y_val, y_pred_proba)
        y_pred = (y_pred_proba >= 0.5).astype(int)
        report = classification_report(y_val, y_pred, output_dict=True)

        self._save()
        return {"auc": auc, "report": report, "feature_names": self.feature_names}

    def predict(self, records: list[dict]) -> list[float]:
        if self.model is None:
            raise RuntimeError("Model not loaded. Train first.")
        df = self.fe.transform(records)
        X = df[self.feature_names].values
        proba = self.model.predict_proba(X)[:, 1]
        return proba.tolist()

    def predict_single(self, record: dict) -> float:
        scores = self.predict([record])
        return scores[0]

    def _save(self):
        if self.model is not None:
            joblib.dump(self.model, self.model_path)
        if self.feature_names is not None:
            with open(self.feature_names_path, "w") as f:
                json.dump(self.feature_names, f)
