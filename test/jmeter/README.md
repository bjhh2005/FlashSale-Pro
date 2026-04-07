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
