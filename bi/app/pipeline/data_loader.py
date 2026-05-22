from sqlalchemy import create_engine, text
from app.config import DB_URL


class DataLoader:
    def __init__(self, db_url=None):
        self.engine = create_engine(db_url or DB_URL)

    def load_behavior_events(self, limit=100000):
        query = text("""
            SELECT user_id, product_id, event_id, item_id, action,
                   dwell_seconds, extra, created_at
            FROM user_behavior_event
            ORDER BY created_at DESC
            LIMIT :limit
        """)
        with self.engine.connect() as conn:
            result = conn.execute(query, {"limit": limit})
            columns = result.keys()
            rows = result.fetchall()
            return [dict(zip(columns, row)) for row in rows]

    def load_feature_matrix(self):
        query = text("""
            SELECT user_id, event_id, click_count, favorite_count,
                   add_to_cart_count, browse_count, share_count, purchase_count,
                   avg_dwell_seconds, recent_7d_action_count, recent_1d_action_count,
                   action_decay_score, cross_product_count, price_sensitivity,
                   purchase_intent_score
            FROM user_feature_matrix
        """)
        with self.engine.connect() as conn:
            result = conn.execute(query)
            columns = result.keys()
            rows = result.fetchall()
            return [dict(zip(columns, row)) for row in rows]

    def load_orders_with_labels(self):
        query = text("""
            SELECT ufm.user_id, ufm.event_id,
                   ufm.click_count, ufm.favorite_count, ufm.add_to_cart_count,
                   ufm.browse_count, ufm.share_count, ufm.purchase_count,
                   ufm.avg_dwell_seconds, ufm.recent_7d_action_count,
                   ufm.recent_1d_action_count, ufm.action_decay_score,
                   ufm.cross_product_count, ufm.price_sensitivity,
                   CASE WHEN fso.id IS NOT NULL THEN 1 ELSE 0 END AS label
            FROM user_feature_matrix ufm
            LEFT JOIN flash_sale_order fso
                ON ufm.user_id = fso.user_id
                AND (ufm.event_id IS NULL OR ufm.event_id = fso.event_id)
        """)
        with self.engine.connect() as conn:
            result = conn.execute(query)
            columns = result.keys()
            rows = result.fetchall()
            return [dict(zip(columns, row)) for row in rows]
