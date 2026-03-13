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
