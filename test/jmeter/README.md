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
