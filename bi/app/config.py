import os

DB_URL = os.getenv("DB_URL", "postgresql://host:hostpassword@127.0.0.1:15432/flashsale_db")
REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

INTENT_SCORE_KEY_PREFIX = os.getenv("INTENT_SCORE_KEY_PREFIX", "intent:score:")
INTENT_TIER_KEY_PREFIX = os.getenv("INTENT_TIER_KEY_PREFIX", "intent:tier:")

MODEL_PATH = os.getenv("MODEL_PATH", "data/model.pkl")
FEATURE_NAMES_PATH = os.getenv("FEATURE_NAMES_PATH", "data/feature_names.json")
SHAP_VALUES_PATH = os.getenv("SHAP_VALUES_PATH", "data/shap_values.npy")

INTENT_HIGH_THRESHOLD = float(os.getenv("INTENT_HIGH_THRESHOLD", "0.7"))
INTENT_LOW_THRESHOLD = float(os.getenv("INTENT_LOW_THRESHOLD", "0.3"))

FEATURE_COLUMNS = [
    "click_count", "favorite_count", "add_to_cart_count", "browse_count",
    "share_count", "purchase_count", "avg_dwell_seconds",
    "recent_7d_action_count", "recent_1d_action_count", "action_decay_score",
    "cross_product_count", "price_sensitivity"
]
