-- ============================================================
-- BI 种子数据：500用户 + 5商品 + 1活动 + 5秒杀商品项
-- ============================================================

-- 1. 插入 500 个虚拟用户（密码统一为 BCrypt 加密的 "password123"）
INSERT INTO "user" (id, username, password)
SELECT
    g,
    'user_' || LPAD(g::TEXT, 4, '0'),
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq7J4VQ6FjR0l3FvBv3gX2kHwP6Oi'
FROM generate_series(1, 500) AS g
ON CONFLICT (username) DO NOTHING;

-- 2. 插入 5 个热门商品
INSERT INTO product (id, name, description, original_price, status) VALUES
(1, 'iPhone 16 Pro Max',  'Apple 旗舰手机 256GB',  9999.00, 'AVAILABLE'),
(2, 'MacBook Air M4',     '苹果轻薄笔记本 16GB',  8999.00, 'AVAILABLE'),
(3, 'Sony WH-1000XM5',    '索尼降噪耳机',          2999.00, 'AVAILABLE'),
(4, 'iPad Pro M4',        '苹果平板 12.9英寸',     8999.00, 'AVAILABLE'),
(5, 'DJI Mini 4 Pro',     '大疆航拍无人机',        4788.00, 'AVAILABLE')
ON CONFLICT DO NOTHING;

-- 3. 插入 1 个跨越当前时间的秒杀活动
INSERT INTO flash_sale_event (id, name, start_time, end_time, status) VALUES
(1, '2026年618狂欢秒杀', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '7 days', 'RUNNING')
ON CONFLICT DO NOTHING;

-- 4. 插入 5 个秒杀商品项（库存1000）
INSERT INTO flash_sale_item (id, event_id, product_id, flash_price, total_stock, available_stock, sold_count, per_user_limit) VALUES
(1, 1, 1, 6999.00, 1000, 1000, 0, 1),
(2, 1, 2, 5999.00, 1000, 1000, 0, 1),
(3, 1, 3, 1499.00, 1000, 1000, 0, 1),
(4, 1, 4, 5999.00, 1000, 1000, 0, 1),
(5, 1, 5, 2988.00, 1000, 1000, 0, 1)
ON CONFLICT (event_id, product_id) DO NOTHING;
