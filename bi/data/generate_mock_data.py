import random
import json
import psycopg2
from datetime import datetime, timedelta, timezone

DB_URL = "postgresql://host:hostpassword@127.0.0.1:15432/flashsale_db"
ACTIONS = ["CLICK", "FAVORITE", "ADD_TO_CART", "BROWSE", "SHARE", "PURCHASE"]
ACTION_WEIGHTS = [0.35, 0.10, 0.08, 0.30, 0.05, 0.12]


def generate_mock_data(num_users=500, num_products=20, num_events=50000):
    random.seed(42)
    events = []
    now = datetime.now(timezone.utc)

    for _ in range(num_events):
        user_id = random.randint(1, num_users)
        product_id = random.randint(1, num_products)
        action = random.choices(ACTIONS, weights=ACTION_WEIGHTS, k=1)[0]
        dwell = random.randint(5, 300) if action == "BROWSE" else None
        days_ago = random.uniform(0, 30)
        created_at = now - timedelta(days=days_ago)

        high_intent_user = user_id % 5 == 0
        if high_intent_user:
            if random.random() < 0.4:
                action = "ADD_TO_CART"
            elif random.random() < 0.3:
                action = "PURCHASE"
            if dwell is not None:
                dwell = random.randint(60, 600)

        events.append({
            "user_id": user_id,
            "product_id": product_id,
            "action": action,
            "dwell_seconds": dwell,
            "extra": json.dumps({"source": "mock", "device": random.choice(["mobile", "pc", "tablet"])}),
            "created_at": created_at,
        })

    return events


def insert_mock_data(events):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    for e in events:
        cur.execute(
            "INSERT INTO user_behavior_event(user_id, product_id, action, dwell_seconds, extra, created_at) "
            "VALUES(%s, %s, %s, %s, %s::jsonb, %s)",
            (e["user_id"], e["product_id"], e["action"], e["dwell_seconds"], e["extra"], e["created_at"]),
        )
    conn.commit()
    cur.close()
    conn.close()
    print(f"Inserted {len(events)} mock behavior events")


if __name__ == "__main__":
    events = generate_mock_data()
    insert_mock_data(events)
