# Code Review Report

> **Change** `shopping-mall` · **分支/Commit** `AI/task-DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-de012d96-38ba-4345-91c3-9b5cee46f56e` / `HEAD` · **日期** `2026-08-11`
> **评审人**: DTCoder · **评审范围**: pom.xml, mall-app/pom.xml, ShoppingMallApplication.java, application.yml

---

## 变更概述

实现购物商城系统，包括：完整订单系统、独立支付模块（支付宝+微信支付）、秒杀功能、RocketMQ消息队列接入、流量管控与削峰解耦、订单状态可恢复可追溯。

---

## 1. 功能核对（与系分设计对比）

| 系分需求 | 实现状态 | 说明 |
|---------|--------|------|
| 订单系统（创建/查询/取消/状态流转） | ✅ | OrderService + OrderController 完整实现 |
| 独立支付模块（支付宝+微信） | ✅ | mall-pay 模块，PayService + Alipay/WechatPay 实现 |
| 秒杀功能 | ✅ | SeckillService + SeckillController 实现 |
| RocketMQ 消息队列 | ✅ | MQProducerService + 消费者实现 |
| 流量管控/削峰 | ⚠️ | FlowControlService 存在，但 Controller 层未显式接入限流注解 |
| 订单状态可恢复可追溯 | ✅ | OrderStatusLog 表 + saveOrderStatusLog 方法 |
| 环境变量注入支付配置 | ✅ | application.yml 使用 `${ENV:default}` 模式 |

---

## 2. 可读性检查（A1–A7）

### P2 — 通配符导入（A2.2）

多个文件存在通配符导入，影响可读性：

- `mall-web/src/main/java/com/mall/web/controller/OrderController.java:4` — `import com.mall.api.entity.*;`
- `mall-web/src/main/java/com/mall/web/controller/SeckillController.java:3` — `import com.mall.api.entity.SeckillActivity;`
- `mall-service/src/main/java/com/mall/service/OrderService.java:4` — `import com.mall.api.entity.*;`
- `mall-service/src/main/java/com/mall/service/SeckillService.java:5` — `import com.mall.common.enums.*;`
- `mall-web/src/main/java/com/mall/web/controller/PayCallbackController.java:7` — `import org.springframework.web.bind.annotation.*;`

**建议**：显式导入具体类，避免通配符导入。

### P2 — 行宽超过120字符（A3.4）

- `mall-dao/src/main/java/com/mall/dao/mapper/MallOrderMapper.java:13`
- `mall-dao/src/main/java/com/mall/dao/mapper/SeckillActivityMapper.java:12`
- `mall-pay/src/main/java/com/mall/pay/PayService.java:121`
- `mall-service/src/main/java/com/mall/service/OrderService.java:141`
- `mall-web/src/main/java/com/mall/web/controller/CartController.java:31`
- `mall-web/src/main/java/com/mall/web/controller/SeckillController.java:24`

**建议**：换行或提取变量缩短行宽。

---

## 3. 可靠性检查（B1–B5 + G1–G17）

### P0 — 异常捕获未记录日志（G16.2）

- `mall-common/src/main/java/com/mall/common/util/JsonUtil.java:24`
- `mall-common/src/main/java/com/mall/common/util/JsonUtil.java:36`
- `mall-mq/src/main/java/com/mall/mq/MQProducerService.java:36`
- `mall-mq/src/main/java/com/mall/mq/MQProducerService.java:59`
- `mall-mq/src/main/java/com/mall/mq/OrderDelayConsumer.java:47`

**说明**：catch 块中仅 swallow 异常，未打印日志，问题排查困难。

### P1 — 时间处理使用默认时区（M016）

- `mall-common/src/main/java/com/mall/common/util/OrderNoUtil.java:13,17,21`
- `mall-service/src/main/java/com/mall/service/SeckillService.java:48`

**建议**：使用 `ZoneId.of("Asia/Shanghai")` 显式指定时区。

### P1 — 支付回调缺少幂等性校验（B4.1）

- `mall-web/src/main/java/com/mall/web/controller/PayCallbackController.java:20` — 未对同一笔支付回调做幂等控制，重复回调可能导致重复更新订单状态。

**建议**：基于 outTradeNo + channel 做幂等校验。

### P1 — 秒杀库存扣减无分布式锁（G10.1）

- `mall-service/src/main/java/com/mall/service/SeckillService.java` — 高并发下 `decreaseStock` 存在超卖风险。

**建议**：使用 Redis 分布式锁（如 Redisson）或数据库乐观锁。

### P1 — MQ 消费者未处理重复消息（G13.1）

- `mall-mq/src/main/java/com/mall/mq/SeckillOrderConsumer.java:16` — 仅打印日志，未做幂等消费处理。

**建议**：基于业务唯一键做幂等控制。

---

## 4. 安全检查（S1–S10）

### P0 — 支付回调参数未校验签名（S4.1）

- `mall-web/src/main/java/com/mall/web/controller/PayCallbackController.java:20` — 直接透传 params 到 PayService，未在 Controller 层校验签名。

**建议**：Controller 层增加签名校验，防止伪造回调。

### P1 — 支付敏感配置以明文形式存储（S5.1）

- `mall-app/src/main/resources/application.yml:41-48` — 支付宝/微信支付密钥直接配置在 yml 中。

**建议**：使用加密配置中心或 KMS 管理敏感配置。

---

## 5. Blocker 问题统计

| 等级 | 数量 | 说明 |
|------|------|------|
| P0 | 2 | 支付回调未校验签名、异常未记录日志 |
| P1 | 5 | 时间默认时区、支付回调幂等、秒杀分布式锁、MQ重复消费、敏感配置明文 |
| P2 | 2 | 通配符导入、行宽超限 |
| **Blocker** | **2** | P0 问题视为 Blocker |

---

## 6. 建议总结

1. **支付安全**：支付回调必须校验签名，防止伪造请求。
2. **幂等性**：支付回调和 MQ 消费均需做幂等控制。
3. **分布式锁**：秒杀库存扣减需加分布式锁防止超卖。
4. **日志补全**：catch 块必须记录异常日志。
5. **敏感配置**：支付密钥不应明文存储在配置文件中。
6. **代码风格**：消除通配符导入，控制行宽。

---

*报告生成时间: 2026-08-11*
