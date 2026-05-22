# Phase A 压测说明

## 1. 启动依赖

```bash
docker-compose up -d postgres redis rabbitmq nginx
```

## 2. 启动后端

```bash
mvn spring-boot:run
```

## 3. 执行压测

```bash
jmeter -n -t test/jmeter/seckill-baseline.jmx -l test/jmeter/baseline.jtl
jmeter -n -t test/jmeter/seckill-async.jmx -l test/jmeter/async.jtl
```

## 4. 验收 SQL

```sql
-- 超卖检查：available_stock 不能小于 0
SELECT id, available_stock FROM flash_sale_item WHERE available_stock < 0;

-- 重复下单检查：同 user_id+item_id 不能出现多条
SELECT user_id, item_id, COUNT(*) cnt
FROM flash_sale_order
GROUP BY user_id, item_id
HAVING COUNT(*) > 1;
```

## 5. 对比指标模板

- QPS：baseline=____，async=____
- 平均 RT：baseline=____ ms，async=____ ms
- P95 RT：baseline=____ ms，async=____ ms
- 失败率：baseline=____%，async=____%
- 超卖数：____（期望 0）
- 重复订单数：____（期望 0）

---

## Phase D 商品详情缓存压测（新增）

## 1. 压测目标

对比商品详情接口在「关闭缓存」与「开启缓存」两种模式下的性能差异，验证 Cache Aside 效果。

压测接口建议使用：

- `GET /api/flash-sale/items/{itemId}`（经 Nginx + Gateway 统一入口）

## 2. 准备步骤

1) 启动基础服务与网关：

```bash
docker-compose up -d postgres redis rabbitmq gateway nginx
```

1) 启动 goods 双实例与 order：

```bash
mvn -pl flashsale-goods-app spring-boot:run
mvn -pl flashsale-goods-app spring-boot:run -Dspring-boot.run.arguments=--server.port=8083
mvn -pl flashsale-order-app spring-boot:run
```

1) 在数据库中准备可用 `itemId`（确保能稳定返回 200）。

## 3. 对比方法

- 无缓存组：将 `flashsale.cache.goods.detail-ttl-seconds=0`（或临时关闭缓存逻辑）后压测一次。
- 有缓存组：恢复配置（如 300 秒）后压测一次。
- 两组使用同并发、同压测时长。

## 4. 建议记录指标

- QPS：no-cache=____，cache=____
- 平均 RT：no-cache=____ ms，cache=____ ms
- P95 RT：no-cache=____ ms，cache=____ ms
- 错误率：no-cache=____%，cache=____%

验收建议：cache 组的平均 RT / P95 显著下降，QPS 明显提升。

---

## Phase E Nginx 多 LB 策略压测（新增）

建议分别对以下路径执行同参数压测并对比：

- 轮询：`/api/goods/detail/1`
- 最少连接：`/api/lb/least/goods/detail/1`
- IP Hash：`/api/lb/iphash/goods/detail/1`
- 一致性哈希：`/api/lb/urihash/goods/detail/1`

建议记录：

- 吞吐量（TPS/QPS）
- 平均 RT / P95 RT
- 错误率
- 上游命中分布（通过响应头 `X-Nginx-Upstream`）

---

## Phase BI NFR1 智能网关性能验收（新增）

### 1. 网关决策延迟专项测试

验证香农熵计算 + Redis 意愿查询的端到端延迟是否满足 <5ms NFR 要求：

```bash
# 在全栈启动后执行
python test/jmeter/nfr1_benchmark.py localhost 9080 latency
```

输出指标：平均/P50/P95/P99 延迟，验收标准 P95<5ms, P99<10ms

### 2. 网关吞吐量测试

验证网关在智能拦截开启时能否维持 >=10,000 QPS：

```bash
python test/jmeter/nfr1_benchmark.py localhost 9080 throughput 200 30
# 参数: host port mode concurrency duration_sec
```

### 3. JMeter 全链路压测

```bash
# 同步基线
jmeter -n -t test/jmeter/seckill-baseline.jmx -l test/jmeter/baseline.jtl
# 异步削峰
jmeter -n -t test/jmeter/seckill-async.jmx -l test/jmeter/async.jtl
# Python 自动化+分析
python test/jmeter/bi_perf_test.py run test/jmeter/seckill-async.jmx test/jmeter/results-bi.jtl
```

### 4. NFR1 验收指标

| 指标 | 验收标准 | 实测值 |
|---|---|---|
| 网关决策延迟 P95 | < 5ms | ____ms |
| 网关决策延迟 P99 | < 10ms | ____ms |
| 网关吞吐量 | >= 10,000 QPS | ____QPS |
| 超卖数 | = 0 | ____ |
| 重复订单数 | = 0 | ____ |
