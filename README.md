## FlashSale-Pro

这是《分布式软件原理与技术》课程的小作业项目，用来演示 **动静分离 + Nginx 反向代理 + Spring Boot + PostgreSQL + Docker Compose** 的基础架构，并在此基础上实现一个简化版的 **商品秒杀系统（Flash Sale）**。

---

### 一、整体架构

**从浏览器到数据库的链路：**

1. **浏览器** 访问 `http://localhost`
2. **Nginx 容器**
   - 直接提供静态资源：`index.html`、`style.css`、`app.js`
   - 对以 `/api/...` 开头的请求做反向代理，转发到宿主机上的 Spring Boot 后端
3. **Spring Boot 后端**
   - 提供用户注册 / 登录接口
   - 通过 MyBatis 访问 PostgreSQL 数据库
   - 提供商品、秒杀活动、活动商品的后台管理接口
   - 提供面向用户的秒杀活动查询、秒杀下单与模拟支付接口
4. **PostgreSQL 容器**
   - 存储用户数据（`user` 表）
5. **Redis 容器（预留）**
   - 目前代码未使用，后续可以在这里接入登录 Token、秒杀库存等逻辑

**动静分离：**

- 静态资源由 Nginx 直接读取挂载目录中的文件返回；
- 动态接口由 Nginx 反向代理到后端服务处理；
- 前端只感知一个入口 `http://localhost`，内部结构对前端透明。

---

### 二、目录与重要文件说明

#### 1. 后端（Spring Boot）

- `src/main/java/com/flashsale/flashsale_pro/FlashsaleProApplication.java`  
  Spring Boot 启动类，`main` 方法启动整个应用，默认端口为 `8080`。

- `src/main/java/com/flashsale/flashsale_pro/controller/UserController.java`  
  用户相关的 REST 接口：
  - `POST /user/login`：登录，返回一个简单的 Token
  - `POST /user/register`：注册新用户

- `src/main/java/com/flashsale/flashsale_pro/service/UserService.java`  
  用户业务接口定义（登录、注册）。

- `src/main/java/com/flashsale/flashsale_pro/service/impl/UserServiceImpl.java`  
  用户业务实现：
  - 登录时根据用户名查询用户并校验密码
  - 登录成功后用 UUID 生成一个简单 Token
  - 注册时先检查用户名是否已存在，再执行插入

- `src/main/java/com/flashsale/flashsale_pro/mapper/UserMapper.java`  
  使用 MyBatis 的 Mapper 接口：
  - `findByUsername`：根据用户名查询
  - `insertUser`：插入新用户

- `src/main/java/com/flashsale/flashsale_pro/entity/User.java`  
  用户实体类，对应数据库中的 `"user"` 表。

- `src/main/java/com/flashsale/flashsale_pro/common/Result.java`  
  统一返回结果封装类，包含 `code`、`message`、`data`，并提供 `success`、`error` 等静态方法。

- `src/main/java/com/flashsale/flashsale_pro/entity/Product.java`  
  商品实体类，对应 `product` 表。

- `src/main/java/com/flashsale/flashsale_pro/entity/FlashSaleEvent.java`  
  秒杀活动实体类，对应 `flash_sale_event` 表。

- `src/main/java/com/flashsale/flashsale_pro/entity/FlashSaleItem.java`  
  活动商品配置实体类，对应 `flash_sale_item` 表，包含秒杀价、总库存、可用库存、已售数量、单用户限购等字段。

- `src/main/java/com/flashsale/flashsale_pro/entity/FlashSaleOrder.java`  
  秒杀订单实体类，对应 `flash_sale_order` 表，包含订单状态（待支付、已支付等）与金额等信息。

- `src/main/java/com/flashsale/flashsale_pro/mapper/*.java`  
  使用 MyBatis 的 Mapper 接口，包含用户、商品、活动、活动商品与订单的数据库访问。

- `src/main/java/com/flashsale/flashsale_pro/service/*`  
  用户、商品、秒杀活动、活动商品与订单等业务服务接口与实现。

- `src/main/java/com/flashsale/flashsale_pro/controller/UserController.java`  
  用户登录 / 注册接口。

- `src/main/java/com/flashsale/flashsale_pro/controller/AdminProductController.java`  
  商品管理后台接口：新增 / 修改 / 删除 / 查询商品。

- `src/main/java/com/flashsale/flashsale_pro/controller/AdminFlashSaleEventController.java`  
  秒杀活动管理后台接口：创建 / 修改 / 删除 / 查询活动。

- `src/main/java/com/flashsale/flashsale_pro/controller/AdminFlashSaleItemController.java`  
  活动商品管理后台接口：为活动配置商品、设置秒杀价格和库存等。

- `src/main/java/com/flashsale/flashsale_pro/controller/FlashSaleQueryController.java`  
  面向用户的秒杀活动与商品查询接口。

- `src/main/java/com/flashsale/flashsale_pro/controller/FlashSaleOrderController.java`  
  面向用户的秒杀下单、查询订单和模拟支付接口。

- `src/main/resources/application.properties`  
  应用配置：
  - `server.port=8080`
  - PostgreSQL 数据源配置（连接 Docker 中的数据库）
  - MyBatis 基本配置（驼峰命名映射）

- `pom.xml`  
  Maven 项目配置，包括 Spring Boot、MyBatis、PostgreSQL 等依赖。

#### 2. 数据库

- `db/schema.sql`  
  PostgreSQL 初始化脚本。Postgres 容器启动时会自动执行，创建 `"user"` 表：
  - `id` 主键
  - `username` 唯一且非空
  - `password` 非空

#### 3. 前端静态页面（由 Nginx 提供，也符合 Spring 静态目录习惯）

目录：`src/main/resources/static/`

- `src/main/resources/static/index.html`  
  整个页面的结构：
  - 用户名 / 密码输入框
  - 「注册」和「登录」按钮
  - 显示接口返回结果的输出区域
  - 文本说明：静态页面由 Nginx 提供，接口通过 `/api` 反代到后端

- `src/main/resources/static/app.js`  
  前端逻辑：
  - 读取输入框内容
  - 通过 `fetch` 向 `/api/user/register` 和 `/api/user/login` 发送 POST JSON 请求
  - 把返回的 JSON 或文本显示在页面上

- `src/main/resources/static/style.css`  
  页面样式文件，提供暗色风格的卡片式 UI。

> 说明：该目录既是 **Spring Boot 默认的静态资源目录**，也是通过 Docker 挂载给 Nginx 的静态资源根目录。

#### 4. Nginx 配置（动静分离 + 反向代理）

- `nginx/default.conf`  

  核心配置说明：

  - `root /usr/share/nginx/html;`  
    指定静态页面所在目录（在容器中挂载自项目的 `src/main/resources/static`）。

  - `location /`  
    静态资源入口，通过 `try_files` 优先返回文件，否则回退到 `index.html`。

  - `location /api/`  
    - 使用 `rewrite ^/api/?(.*)$ /$1 break;` 去掉 `/api` 前缀
    - 使用 `proxy_pass http://host.docker.internal:8080;` 把请求代理到宿主机上的 Spring Boot 后端

#### 5. Docker Compose

- `docker-compose.yml`  

  定义并编排了三个容器：

  - `postgres`：PostgreSQL 数据库
    - 端口映射：`15432:5432`
    - 自动执行 `./db/schema.sql` 以初始化数据库

  - `redis`：Redis 缓存（预留）
    - 端口映射：`6379:6379`

  - `nginx`：Nginx Web 服务器
    - 端口映射：`80:8080`，因此浏览器访问 `http://localhost` 实际命中该容器
    - 挂载静态资源目录 `./src/main/resources/static:/usr/share/nginx/html:ro`
    - 挂载 Nginx 配置 `./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro`

#### 6. 文档与其它

- `docs/开发日志-阶段01.md`、`docs/开发日志-阶段02.md`  
  开发过程记录，方便回顾项目演进过程。
- `docs/开发日志-阶段03.md`  
  描述从“只支持用户注册/登录”演进到“具备完整商品 / 活动 / 活动商品 / 订单模型 + 基础限流 + 前端活动查询”的阶段性成果。

- `README.md`  
  项目总览与说明文档（本文件）。

- `.gitignore` / `.gitattributes`  
  Git 相关配置。

---

### 三之前：当前阶段性成果速览

- **业务模型**：在最初仅有 `user` 表的基础上，新增了 `product`、`flash_sale_event`、`flash_sale_item`、`flash_sale_order` 等核心表，并在后端补齐对应的 Entity / Mapper / Service / Controller，形成从后台配置到用户下单的完整链路。
- **架构形态**：前端静态页由 Nginx 托管，通过 `/api/*` 访问 Spring Boot 后端；后端使用 Spring Boot + MyBatis + PostgreSQL 实现用户、商品、秒杀活动、活动商品与订单等模块；Redis 已在 Docker Compose 中预留，为后续 Token、缓存与高并发优化做准备。
- **工程能力**：引入简单的应用层限流组件 `RateLimiterService` 并配套单元测试，配合现有 Service 测试，目前可通过全局 Maven 或 Maven Wrapper 一键执行 `mvn test`，确保 25 个测试用例全部通过。

### 三、运行方式（详细）

#### 1. 前置条件

- 已安装 **Docker + Docker Compose**
- 已安装 **JDK 21**（或兼容版本）
- 已安装 **Maven**，或者使用项目自带的 `mvnw` / `mvnw.cmd`（推荐）

#### 2. 启动数据库、Redis、Nginx 容器

在项目根目录执行：

```bash
docker-compose up -d
```

可以用下面命令检查容器状态（任选其一）：

```bash
docker ps
docker-compose ps
```

确认至少看到：

- `flashsale_postgres`
- `flashsale_redis`
- `flashsale_nginx`

Postgres 启动时会自动执行 `db/schema.sql`，创建 `user` 表。

#### 3. 启动后端 Spring Boot 应用

在项目根目录执行（跨平台推荐方式）：

```bash
./mvnw spring-boot:run
```

在 Windows PowerShell / CMD 下，也可以写成：

```bash
mvnw.cmd spring-boot:run
```

如果你安装了全局 Maven，也可以使用：

```bash
mvn spring-boot:run
```

启动成功后，控制台会看到类似：

- Tomcat started on port(s): 8080
- Started FlashsaleProApplication in ... seconds

此时后端监听在：`http://localhost:8080`。

#### 4. 前端访问方式

推荐通过 Nginx 访问（动静分离的入口）：

- 在浏览器访问：`http://localhost`
- 页面加载的是 `src/main/resources/static/index.html`（由 Nginx 提供）
- 点击「注册」或「登录」按钮时：
  - 前端调用的是 `/api/user/register` 或 `/api/user/login`
  - Nginx 将请求反向代理到后端的 `/user/register`、`/user/login`

调试时，也可以绕过 Nginx，直接请求 Spring Boot：

- 登录接口：`http://localhost:8080/user/login`
- 注册接口：`http://localhost:8080/user/register`

#### 5. 使用 Maven 的常用命令

- **编译项目**：

  ```bash
  ./mvnw compile
  ```

- **运行单元测试**：

  ```bash
  ./mvnw test
  ```

- **打包为可执行 Jar**：

  ```bash
  ./mvnw package
  ```

  打包完成后，会在 `target/` 目录下生成形如 `flashsale-pro-0.0.1-SNAPSHOT.jar` 的文件。

- **通过 Jar 直接运行后端**（不走 `spring-boot:run` 插件）：

  ```bash
  java -jar target/flashsale-pro-0.0.1-SNAPSHOT.jar
  ```

---

### 四、后续扩展方向

- 接入 Redis 存储 Token，或做简单的会话管理；
- 引入 JWT 做更规范的认证与授权；
- 在 Nginx 中配置静态资源缓存、Gzip 压缩等性能优化；
- 新增商品、订单、秒杀等业务模块，逐步演进成一个完整的秒杀系统 Demo。

---

### 五、Phase A 并发核心改造成果

本阶段已在单体内完成以下改造：

- Redis + Lua 原子预扣库存，防止超卖与重复抢购；
- RabbitMQ 异步下单，接口快速返回 `QUEUING`，削峰填谷；
- 订单层幂等兜底：数据库唯一键 `uq_user_item` + 消费端冲突回收；
- 新增秒杀结果轮询接口：`GET /flash-sale/order/result?userId=&itemId=`；
- 新增压测脚本与验收模板：`test/jmeter/`。

#### 1. Phase A 接口语义

- `POST /flash-sale/order`
  - 成功受理：`status=QUEUING`
  - 失败：`status=FAILED` + message（库存不足/重复下单等）
- `GET /api/flash-sale/order/result?userId=&itemId=`
  - `QUEUING`：排队中
  - `SUCCESS`：返回 `orderId`
  - `FAILED`：返回失败原因

#### 2. 压测与验收

详见 `test/jmeter/README.md`，包含：

- 基线脚本：`test/jmeter/seckill-baseline.jmx`
- 异步脚本：`test/jmeter/seckill-async.jmx`
- 验收 SQL：超卖检查、重复订单检查
- 指标模板：QPS / RT / 失败率 / 超卖数 / 重复订单数

> 说明：由于本地环境压测数据依赖你的机器资源与并发参数，建议在你本地按脚本跑出最终数据并填入模板。

### 六、Phase B（统一鉴权与网关入口）

本阶段完成了 JWT + Gateway 的最小可用闭环，核心改动如下：

- 后端登录改为签发 JWT，并新增 `GET /api/user/me` 用于验证 token 解析；
- 业务服务新增拦截器，固定 Bearer 规则与白名单：
  - `/api/user/login`
  - `/api/user/register`
  - `/actuator/health`
- 业务控制器统一为 `/api/**`，去除对 Nginx rewrite 的路径依赖；
- 新增独立工程 `gateway/`（端口 `9080`），实现：
  - `/api/** -> backend(8080)` 路由转发
  - 全局鉴权过滤器（白名单放行、JWT 校验、透传 `X-User-Id`/`X-Username`）
- 前端请求层支持 JWT 自动注入 `Authorization`，401 自动清理 token；
- Nginx 的 `/api/` 已改为转发到 Gateway（`9080`）。

#### 1. 验收清单（Phase B）

- 登录成功拿到 JWT；
- `GET /api/user/me`：
  - 不带 token -> 401
  - 错误 token -> 401
  - 正确 token -> 200
- 非白名单接口不带 token 一律 401；
- 前端调用统一走 `/api`（网关入口）。

Phase C（2周）：从单体到“伪微服务”拆分
目标：先模块拆，再进程拆，降低风险。

先在代码层拆包：user/goods/order/stock/common
再拆为 Maven 多模块
最后把 goods/order 拆成独立服务进程（优先拆这两个）
服务间调用先用 OpenFeign（或 REST client）
验收标准：至少 2 个业务服务可独立启动，核心流程可跨服务跑通。

Phase D（1-2周）：缓存与可用性增强
目标：补齐老师项目在工程化上的“亮点项”。

商品详情 Cache Aside
防穿透（空值缓存）、防击穿（互斥锁）、防雪崩（随机TTL）
增加 Nginx 负载均衡到多实例 goods
增加最小可观测（日志追踪ID、基础监控端点）
验收标准：商品接口压测显著快于无缓存版本，实例可平滑扩展。

Phase E（持续优化）：课程展示加分项
JMeter 场景化压测脚本
性能调优报告（SQL、连接池、JVM）
架构图 + 演进路线图 + 实验结论沉淀到文档