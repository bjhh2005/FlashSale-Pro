# FlashSale-Pro：基于智能预测的秒杀系统

> 课程作业：分布式软件原理与技术 + 商务智能

## 架构

```
浏览器 ──┬── /mall ────── 商城端（埋点采集 + 秒杀下单）
         └── /admin/dashboard  BI大屏（ECharts 三图表）
                    │
              Nginx(80) → Gateway(9080)
                    │
         ┌──────────┼──────────┐
    EntropyFilter   PID    AuthFilter
    (香农熵染色)  (自适应限流)  (JWT鉴权)
         │           │
    X-Traffic-Color  令牌桶速率
    GREEN/YELLOW/BLACK  PID反哺调整
                    │
         ┌──────────┼──────────┐
      goods(8081) order(8082) stock(8084)
                    │
              Redis ◄── BI Service(8000) ──→ PostgreSQL
                     Python/LightGBM/SHAP
```

**核心闭环**：行为矩阵 Redis 预热 → 香农条件熵实时度量 → 流量染色(GREEN/YELLOW/BLACK) → PID 反馈控制令牌桶速率 → BLACK 蜜罐延迟 → BI 大屏可视化

**技术栈**：Java 21 / Spring Boot 4 / Spring Cloud / Redis Reactive / PostgreSQL / React 19 / ECharts / React Router / Python 3.11 / LightGBM / SHAP

## 一键复现（Docker）

**前置**：Docker + Docker Compose，≥8GB 内存

```bash
# 1. 全栈启动
docker compose up --build -d

# 2. 初始化种子数据（500用户 + 5商品 + 行为矩阵预热）
docker compose exec postgres-master psql -U host -d flashsale_db -f /docker-entrypoint-initdb.d/init_bi_seeds.sql

# 3. 训练模型 & 同步 Redis
docker compose exec bi python data/generate_mock_data.py
docker compose exec bi python data/run_offline_pipeline.py lightgbm

# 4. 访问
#    商城端: http://localhost/mall
#    BI大屏: http://localhost/admin/dashboard
```

## 本地复现

```bash
# 基础设施
docker compose up -d postgres-master redis rabbitmq nacos

# 初始化种子
PGPASSWORD=hostpassword psql -h 127.0.0.1 -p 15432 -U host -d flashsale_db -f db/init_bi_seeds.sql

# Java 微服务（需 JDK 21 + Maven）
mvn -pl flashsale-goods-app spring-boot:run   # 8081
mvn -pl flashsale-order-app spring-boot:run   # 8082  ← 含 BIDataInitializer 预热
mvn -pl flashsale-stock spring-boot:run       # 8084
mvn -pl gateway spring-boot:run               # 9080  ← 含 EntropyFilter + PID

# Python BI
cd bi && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
python data/generate_mock_data.py && python data/run_offline_pipeline.py lightgbm && python run.py

# 前端（需 Node 18+）
cd frontend && npm install react-router-dom echarts echarts-for-react
VITE_BI_BASE_URL=http://localhost:8000 npm run dev
```

## 核心端点

| 端点 | 说明 |
|---|---|
| `GET /actuator/entropy/stats` | 香农熵染色统计（green/yellow/black） |
| `GET /actuator/pid/dashboard` | PID 控制器状态 + 收敛曲线数据 |
| `POST /api/behavior/event` | 行为采集（触发矩阵更新） |
| `POST /api/flash-sale/order` | 秒杀下单（经熵染色 + PID 限流） |

## 关键设计

- **香农条件熵** `H(Y|X) = -Σ p(x) Σ p(y|x) log₂ p(y|x)`：度量用户行为转移矩阵的随机性，H∈[1.5,3.5]→GREEN，H<0.5→BLACK
- **PID 增量控制** `Δu(k) = Kp[e(k)-e(k-1)] + Ki·e(k) + Kd[e(k)-2e(k-1)+e(k-2)]`：Kp=2.5, Ki=0.5, Kd=1.0，每100ms 采样，动态调整令牌桶速率
- **蜜罐延迟**：BLACK 流量在网关层挂起 500~2000ms 随机延迟后放行，消纳机器高并发
- **Redis Key 契约**：`flashsale:bi:matrix:{userId}:{from_state}:{to_state}` → INCRBY 计数
