import pandas as pd
import numpy as np
from app.config import FEATURE_COLUMNS


class FeatureEngineer:
    def __init__(self):
        self.feature_columns = FEATURE_COLUMNS

    def transform(self, records: list[dict]) -> pd.DataFrame:
        df = pd.DataFrame(records)
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        df[self.feature_columns] = df[self.feature_columns].fillna(0).astype(float)
        df = self._add_derived_features(df)
        return df

    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df["interaction_intensity"] = (
            df["click_count"] * 1.0
            + df["favorite_count"] * 2.5
            + df["add_to_cart_count"] * 3.0
            + df["share_count"] * 2.0
        )
        df["purchase_ratio"] = np.where(
            df["click_count"] + df["browse_count"] > 0,
            df["purchase_count"] / (df["click_count"] + df["browse_count"]),
            0.0,
        )
        df["cart_to_browse_ratio"] = np.where(
            df["browse_count"] > 0,
            df["add_to_cart_count"] / df["browse_count"],
            0.0,
        )
        df["recent_activity_ratio"] = np.where(
            df["recent_7d_action_count"] > 0,
            df["recent_1d_action_count"] / df["recent_7d_action_count"],
            0.0,
        )
        df["dwell_per_browse"] = np.where(
            df["browse_count"] > 0,
            df["avg_dwell_seconds"] / df["browse_count"],
            0.0,
        )
        return df

    def get_all_feature_columns(self):
        derived = [
            "interaction_intensity", "purchase_ratio",
            "cart_to_browse_ratio", "recent_activity_ratio", "dwell_per_browse",
        ]
        return self.feature_columns + derived
