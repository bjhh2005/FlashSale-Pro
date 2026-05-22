# FlashSale-Pro 路演速查

## 启动

```powershell
cd D:\Repositories\FlashSale-Pro
docker compose up -d
docker ps --format "table {{.Names}}\t{{.Status}}"
```

如果改过前端：

```powershell
cd frontend
npm run build
cd ..
docker restart flashsale_nginx
```

## 入口

- 用户侧商城：http://localhost/mall
- 管理员大屏：http://localhost/admin/dashboard
- RabbitMQ：http://localhost:15672
- Nacos：http://localhost:8930

## 3 分钟演示脚本：架构优先

1. 先打开管理员大屏，讲系统不是单体应用，而是 Nginx、Gateway、goods 双实例、order、stock、Redis、RabbitMQ、Nacos 组成的分布式秒杀系统。
2. 指“服务实例”和“商品服务副本”：goods 有 8081 和 8083 两个实例，商品读请求可以横向扩展。
3. 打开用户侧商城，点“重置路演数据”。
4. 连续点“秒杀”。讲：真实秒杀用户确实会反复抢购，所以普通用户连续秒杀不会被直接当黑流量；系统优先保障库存一致性和订单状态。
5. 看用户侧变化：库存减少、订单出现、链路追踪显示 Nginx/Gateway/Redis/Order/Admin。
6. 切回管理员大屏，看商城事件流、转化漏斗、QPS、服务链路状态变化。
7. 切用户类型为“高意向用户”，讲购买意愿更高时 Gateway 可给予更高优先级，BI 侧也能解释转化原因。
8. 最后切“疑似脚本”，再点秒杀。讲只有固定路径、高频、低熵的自动化脚本才触发 BLACK，库存不变、订单不创建。
9. 点 BI 的 SHAP / 模型训练。讲 BI 是独立服务，真实服务不可用时页面有兜底，路演不受影响。

## 重点能力怎么展示

### 普通用户连续秒杀为什么不应直接变黑

路演口径要强调：秒杀场景里，真实用户反复点“秒杀”是合理行为。系统不能只按点击次数封禁用户，否则会误伤正常抢购。

现在页面里的策略是：

- 普通用户：连续秒杀最多进入 YELLOW 观察，不直接拦截。
- 高意向用户：给予更高放行优先级，用于展示意愿分层。
- 疑似脚本：固定路径 + 高频 + 低熵时才 BLACK，库存不变、订单不创建。

### 香农条件熵在哪里发挥作用

- 用户侧：埋点队列显示 H(Y|X)、GREEN/YELLOW/BLACK 和转移矩阵。
- 管理员侧：香农条件熵保护层、分级流量、商城事件流都会同步变化。
- 后端侧：`UserBehaviorServiceImpl` 会把用户行为写入 Redis 转移矩阵，Gateway 的 `EntropyTrafficFilter` 在下单接口读取 Redis 矩阵并计算同一套 H(Y|X)。

### 分布式架构怎么讲

- Nginx：静态资源入口，也提供 goods 多实例转发演示。
- Gateway：统一 API 入口，承载 JWT、意愿过滤、熵染色、PID 指标。
- goods / goods-2：两个商品服务实例，体现横向扩展。
- order：订单创建和支付状态机。
- stock：库存服务，配合 Redis 做扣减。
- Redis：库存、用户意愿、熵转移矩阵、PID 令牌状态。
- RabbitMQ：用于订单异步削峰链路。
- Nacos：服务注册发现，Gateway 使用 `lb://flashsale-goods`、`lb://flashsale-order` 路由。

### BI 看板如果点了没真实返回

BI 决策看板现在有兜底模式。真实 Python BI 服务可用时会调用真实接口；不可用时会显示“BI 演示兜底”，并给出可讲的转化漏斗、SHAP 特征归因和 AUC 结果。路演时可以这样讲：

“这里优先连接独立 BI 服务。如果现场机器资源不足或 BI 容器未启动，前端会保留一份演示兜底数据，保证我们仍然能说明模型输入、特征重要性和购买意愿决策逻辑。”

## 一句话主线

FlashSale-Pro 不是只做一个秒杀接口，而是把用户体验、行为采集、网关风控、库存一致性、订单状态机和 BI 决策闭环串成了一个完整秒杀业务系统。

## 出问题时的兜底

页面显示“演示数据模式”也可以继续讲。前端已经内置路演事件总线，即使某个后端接口临时抖动，用户侧和管理员侧仍会保持可见联动。
