CREATE TABLE "user" (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
);

-- 商品基础信息表
CREATE TABLE product (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    original_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 例如: AVAILABLE, UNAVAILABLE
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 秒杀活动表
CREATE TABLE flash_sale_event (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL, -- 例如: DRAFT, UPCOMING, RUNNING, ENDED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 秒杀活动中的具体商品配置
CREATE TABLE flash_sale_item (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES flash_sale_event(id),
    product_id BIGINT NOT NULL REFERENCES product(id),
    flash_price NUMERIC(10, 2) NOT NULL,
    total_stock INT NOT NULL,
    available_stock INT NOT NULL,
    sold_count INT NOT NULL DEFAULT 0,
    per_user_limit INT NOT NULL DEFAULT 1,
    version INT NOT NULL DEFAULT 0, -- 乐观锁版本号
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_flash_sale_item UNIQUE (event_id, product_id)
);

-- 秒杀订单表
CREATE TABLE flash_sale_order (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    order_status VARCHAR(20) NOT NULL, -- 例如: PENDING_PAYMENT, PAID, CANCELLED, EXPIRED
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    CONSTRAINT uq_user_item UNIQUE (user_id, item_id)
);

-- 用户行为事件表 (FR1: 多维用户行为数据采集)
CREATE TABLE user_behavior_event (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT,
    event_id BIGINT,
    item_id BIGINT,
    action VARCHAR(30) NOT NULL,  -- CLICK, FAVORITE, ADD_TO_CART, BROWSE, SHARE, PURCHASE
    dwell_seconds INT,            -- 浏览时长(秒)
    extra JSONB,                  -- 扩展属性(如来源页面、设备信息等)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_behavior_user ON user_behavior_event(user_id);
CREATE INDEX idx_behavior_user_product ON user_behavior_event(user_id, product_id);
CREATE INDEX idx_behavior_action ON user_behavior_event(action);
CREATE INDEX idx_behavior_created ON user_behavior_event(created_at);

-- 用户特征矩阵表 (特征工程管道输出)
CREATE TABLE user_feature_matrix (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    event_id BIGINT,
    click_count INT NOT NULL DEFAULT 0,
    favorite_count INT NOT NULL DEFAULT 0,
    add_to_cart_count INT NOT NULL DEFAULT 0,
    browse_count INT NOT NULL DEFAULT 0,
    share_count INT NOT NULL DEFAULT 0,
    purchase_count INT NOT NULL DEFAULT 0,
    avg_dwell_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
    recent_7d_action_count INT NOT NULL DEFAULT 0,
    recent_1d_action_count INT NOT NULL DEFAULT 0,
    action_decay_score NUMERIC(10,4) NOT NULL DEFAULT 0,
    cross_product_count INT NOT NULL DEFAULT 0,
    price_sensitivity NUMERIC(10,4) NOT NULL DEFAULT 0,
    purchase_intent_score NUMERIC(5,4),          -- 购买意愿得分 [0,1]
    intent_score_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_feature_user ON user_feature_matrix(user_id);
CREATE INDEX idx_feature_event ON user_feature_matrix(event_id);
