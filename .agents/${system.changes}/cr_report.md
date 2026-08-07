# Code Review Report

> **Change** `algorithm-demo-tracking` · **分支/Commit** `AI/task-DEV-966dcd0a` / `HEAD` · **日期** `2026-08-07` · **审查者** AI
>
> **AI**：等级 **P0 / P1 / P2**；G/S 以 checklist 行内定义为准；Bug 模式以 `bug-pattern-checklist.md` 表头为准（Blocker→P0、Major→P1、Info→P2）。**须先**运行 `scan-all-rules.sh` 并将要点并入 §5，**再**写 LLM 结论。问题须含 `path:line` 或清单 ID：可读性 `A3.4`，安全 `S1.1`，可靠性 `G16.2`，Bug 模式 `B012` / `M005` 等。**每个 ❌/⚠️ 问题在 §7 后必须附 `.java` 问题片段**（见 §7.1）。

---

## 1. 审查范围

| 项 | 值 |
|----|-----|
| `.java` 文件数 | `15` |
| 变更行数 | `+约 900 / -约 200`（问题修复后轮次） |

| 类/接口 | 路径 | 角色（可选） |
|---------|------|--------------|
| `AlgorithmServiceImpl` | `src/main/java/com/antfin/library/algorithm/service/impl/AlgorithmServiceImpl.java` | 三算法接口实现 + 埋点调用 |
| `AlgorithmController` | `src/main/java/com/antfin/library/algorithm/api/controller/AlgorithmController.java` | 算法接口入口 |
| `HashAlgorithmEnum` | `src/main/java/com/antfin/library/common/enums/HashAlgorithmEnum.java` | 哈希算法枚举 + MessageDigest 工厂 |
| `AlgorithmTypeEnum` | `src/main/java/com/antfin/library/common/enums/AlgorithmTypeEnum.java` | 算法类型枚举（含 EXPORT） |
| `ExportServiceImpl` | `src/main/java/com/antfin/library/export/service/impl/ExportServiceImpl.java` | 导出 Excel 实现 |
| `ExportController` | `src/main/java/com/antfin/library/export/api/controller/ExportController.java` | 导出入口 |
| `ReportServiceImpl` | `src/main/java/com/antfin/library/report/service/impl/ReportServiceImpl.java` | 报表聚合查询 + 缓存 |
| `ReportController` | `src/main/java/com/antfin/library/report/api/controller/ReportController.java` | 报表入口 |
| `TrackServiceImpl` | `src/main/java/com/antfin/library/tracking/service/impl/TrackServiceImpl.java` | 异步埋点落库 |
| `TrackAsyncConfig` | `src/main/java/com/antfin/library/common/config/TrackAsyncConfig.java` | 埋点线程池配置 |
| `WebConfig` | `src/main/java/com/antfin/library/common/config/WebConfig.java` | CORS 配置 |
| `UserContextUtil` | `src/main/java/com/antfin/library/common/util/UserContextUtil.java` | 用户上下文工具 |
| `schema.sql` | `src/main/resources/schema.sql` | 埋点表 + 用户表 DDL |

> spec/设计文档来源：`[library-frontend] .agents/${system.changes}/design.md`（F01–F08 功能清单 + A01–A08 假设约束）。

---

## 2. 问题计数

| P0 | P1 | P2 |
|----|----|-----|
| 1 | 1 | 1 |

---

## 3. Step 2 — 功能（REQ）

### REQ-1: HelloWorld 接口（F01）
| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 返回固定问候串 | ✅ | `design.md §1.5 F01` | `AlgorithmServiceImpl.java:36-38` | `HELLO_WORLD_MESSAGE` 常量，返回 `HelloWorldVO`，符合 |

### REQ-2: 哈希算法接口（F02）
| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 支持 MD5/SHA-256/SHA-512 | ✅ | `design.md §1.6 A04` | `HashAlgorithmEnum.java:14-16` | 三枚举值齐全 |
| 非法值降级 SHA-256 | ✅ | `design.md §1.6 A04` | `HashAlgorithmEnum.java:50-53` `fromCodeOrDefault` | null/未知返回 SHA256 |
| 返回 hashHex + inputLength | ✅ | `design.md §1.5 F02` | `AlgorithmServiceImpl.java:48-54` | `HashResultVO(hashHex, inputLength)` |

### REQ-3: 冒泡排序接口（F03）
| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 返回升序结果 + 比较次数 + 交换次数 | ✅ | `design.md §1.5 F03` | `AlgorithmServiceImpl.java:58-88` | `BubbleSortResultVO(arr, compareCount, swapCount, durationMillis)` |
| 数组长度上限 1000 | ⚠️ | `design.md §1.6 A05` | `ExportServiceImpl.java:36,129` | 仅在导出链路有 `MAX_ROWS=10000` 校验；`AlgorithmServiceImpl.bubbleSort` 入参未做长度上限校验（spec A05 约定 1000）。主接口与导出链路约束不一致，建议在 `bubbleSort` 入口加 `numbers.size() > 1000` 校验 |

### REQ-4: 算法结果导出接口（F04）
| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 导出 Excel(.xlsx) | ✅ | `design.md §1.6 A06` | `ExportServiceImpl.java:57,15,149-150` | Apache POI `XSSFWorkbook`，Content-Type 为 `openxmlformats-officedocument.spreadsheetml.sheet` |
| 按 Tab 维度导出 | ✅ | `design.md §1.5 F04` | `ExportServiceImpl.java:60-94` | switch 按 `AlgorithmTypeEnum` 分支 |
| 单次上限 10000 行 | ✅ | `design.md §1.6 A06` | `ExportServiceImpl.java:36,129` | `MAX_ROWS=10000` |

### REQ-5: 算法调用埋点（F05）
| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 记录调用次数 + 调用人 | ✅ | `design.md §1.5 F05` | `TrackServiceImpl.java:50-60` | `algoCallLogMapper.insert(entity)` 含 userId/algorithmType |
| 记录维度信息 | ✅ | `design.md §1.6 A03` | `TrackServiceImpl.java:48-55` | 回查 sysUser 冗余 userType/userLevel/department |
| 真实用户 ID（非硬编码） | ✅ | `design.md §1.6 A03` | `UserContextUtil.java:23-35` | 从 `X-User-Id` 请求头获取，空回 `anonymous` |
| 异步落库不阻塞主链路 | ❌ | `design.md §1.6 A08` | `TrackAsyncConfig.java:29` | 见 §5 P0，`CallerRunsPolicy` 队列满时退化为同步执行，违背 A08 |
| 队列满丢弃+记日志告警 | ❌ | `design.md §1.6 A08` | `TrackAsyncConfig.java:29` | 应为 `DiscardPolicy` 或 `AbortPolicy`+catch 记日志，当前为 `CallerRunsPolicy` |

### REQ-8: 调用情况报表可视化（F08）
| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 折线/饼图/柱状图数据 | ✅ | `design.md §1.5 F08` | `ReportServiceImpl.java:97-130` | `selectDailyTrend`/`selectDimensionRatio`/`selectDimensionComparison` 三查询 |
| 维度切换 人员类型/层级/部门 | ✅ | `design.md §1.5 F08` | `ReportServiceImpl.java:54-57` | `DimensionEnum.isValid` 校验 |
| 报表查询缓存 | ✅ | `design.md §1.3` | `ReportServiceImpl.java:45,70-82` | `ConcurrentHashMap` + TTL 5min |

---

## 4. Step 3 — 可读性检查

> 对照 `references/readability-checklist.md`（A1–A7）。

| 结果 | 说明（违规写 Ax.x 与 `path:行`） |
|------|--------------------------------|
| ✅ | A1 源文件格式：包名/类名/枚举命名规范，无明显违规 |
| ✅ | A2 命名：方法名小驼峰，常量全大写下划线，符合 |
| ⚠️ | A3.4 超长行：`ReportServiceImpl.java:56-57`、`ExportServiceImpl.java:149-150` 行宽接近 120 字符（已换行处理，边界情况，P2 可选改进） |
| ✅ | A4 注释：关键逻辑有注释，catch 块标注 G16.2 修复说明 |
| ✅ | A5 方法行数：`bubbleSort` 约 30 行，在阈值内 |
| ✅ | A6 参数个数：controller 方法参数 ≤5，符合 |
| ✅ | A7 复杂条件：无嵌套过深三元/条件表达式 |

---

## 5. Step 4 — 可靠性检查

| 域 | 参考 | 结果 | 等级 | 说明（列命中 ID 或「已扫无命中」） |
|----|------|------|------|-------------------------------------|
| 可靠性 | `reliability-checklist.md` G1–G17 | ❌ | P0 | `G5 资源隔离`：`TrackAsyncConfig.java:29` `CallerRunsPolicy` 队列满时主线程同步执行埋点，违背 A08「不影响算法接口」 |
| 安全 | `security-checklist.md` S1–S10 | ✅ | — | S10.2 前轮 CORS 通配符+凭证已修复（`WebConfig.java:17` 改白名单 + 移除 `allowCredentials`）；SQL 查询用 MyBatis `#{}` 参数化，无注入 |
| Bug 模式 | `bug-pattern-checklist.md` B/M/I（120） | ✅ | — | 预扫见下 |

### 预扫结果（`scan-all-rules.sh`）

```
[P0] G16.2 — CatchWithoutLogging: HashAlgorithmEnum.java:60
[P0] G16.2 — CatchWithoutLogging: ExportServiceImpl.java:137
[P0] G16.2 — CatchWithoutLogging: ExportServiceImpl.java:99
[P0] G16.2 — CatchWithoutLogging: ReportServiceImpl.java:152
[P0] G16.2 — CatchWithoutLogging: ReportServiceImpl.java:168
[P0] G16.2 — CatchWithoutLogging: TrackServiceImpl.java:61
[P1] M016 — JavaTimeDefaultTimeZone: TrackServiceImpl.java:57
[P2] I004 — JavaUtilDate: TrackServiceImpl.java:56
Summary: 8 findings (P0=6, P1=1, P2=1) | 52/222 rules scanned
```

**误报核实（6 个 G16.2 P0 全部为脚本误报，不计入 blocker）**：

| 脚本报点 | 实际代码 | 核实结论 |
|----------|----------|----------|
| `HashAlgorithmEnum.java:60` | L61-63 catch 内有 `log.error("不支持的哈希算法: {}", getJceName(), ex)` | 误报 |
| `ExportServiceImpl.java:99` | L99-101 catch 内有 `log.error("导出Excel失败", e)` | 误报 |
| `ExportServiceImpl.java:137` | L137-139 catch 内有 `log.warn("数字格式错误: {}", e.getMessage())` | 误报 |
| `ReportServiceImpl.java:152` | L152-154 catch 内有 `log.warn("开始日期格式错误，应为 yyyy-MM-dd: {}", dateStr)` | 误报 |
| `ReportServiceImpl.java:168` | L168-170 catch 内有 `log.warn("结束日期格式错误，应为 yyyy-MM-dd: {}", dateStr)` | 误报 |
| `TrackServiceImpl.java:61` | L61-63 catch 内有 `log.error("埋点记录失败: algorithmType={}, userId={}", algorithmType, userId, e)` | 误报 |

> 原因：`scan-all-rules.sh` 用正则匹配 catch 行，无法识别 try-catch 块**内部**的 `log.error`/`log.warn` 调用。6 处 catch 块经人工逐文件核实均含日志记录，G16.2 不成立。

**真实命中**：
- `[P1] M016` `TrackServiceImpl.java:57` `LocalDateTime.now()` 使用系统默认时区——埋点时间戳依赖容器时区，跨时区部署时埋点时间可能偏移。建议显式 `LocalDateTime.now(ZoneId.of("Asia/Shanghai"))` 或统一用 `Instant.now()`。
- `[P2] I004` `TrackServiceImpl.java:56` `Date.from(LocalDateTime.now().atZone(...).toInstant())` —— 已用 java.time API 但最终转回 `java.util.Date`（entity.callTime 字段类型所致），半改半未改。建议 entity 字段改 `LocalDateTime`。

---

## 6. Step 5 — 自定义扩展检查

| 域 | 参考 | 结果 | 等级 | 说明（列命中 ID 或「未启用自定义规则」） |
|----|------|------|------|------------------------------------------|
| 自定义扩展 | `customized-checklist.md` U* | N/A | — | N/A(未启用自定义规则) |

---

## 7. 结论

- **合并建议**：修复后合并
- **P0**：1. `TrackAsyncConfig.java:29` `CallerRunsPolicy` 队列满时同步执行埋点，违背 spec A08「队列满则丢弃埋点并记日志告警，不影响算法接口」——高并发下可能阻塞算法接口主链路。
- **P1/P2**：
  1. `TrackServiceImpl.java:57` `LocalDateTime.now()` 默认时区（M016）
  2. `TrackServiceImpl.java:56` `Date.from` 残留 java.util.Date 转换（I004）
  3. `ReportServiceImpl.java:56-57`、`ExportServiceImpl.java:149-150` 行宽边界（A3.4，可选）
- **一句话**：前轮 7 个 P0 已全部修复（异步埋点/用户上下文/报表缓存/异常日志/CORS/导出格式），本次仅剩 1 个线程池拒绝策略与 spec A08 不符的可靠性缺陷，修复后可合并。

---

## 7.1 问题片段（必填）

### P0 — `G5` `TrackAsyncConfig.java:29` — CallerRunsPolicy 违背 A08 资源隔离

片段范围：`src/main/java/com/antfin/library/common/config/TrackAsyncConfig.java:22-34`

```java
L22|    public Executor trackExecutor() {
L23|        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
L24|        executor.setCorePoolSize(2);
L25|        executor.setMaxPoolSize(4);
L26|        executor.setQueueCapacity(2000);
L27|        executor.setKeepAliveSeconds(60);
L28|        executor.setThreadNamePrefix("track-async-");
L29|        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());  // 问题：队列满时主线程同步执行，违背 A08
L30|        executor.setWaitForTasksToCompleteOnShutdown(true);
L31|        executor.setAwaitTerminationSeconds(5);
L32|        executor.initialize();
L33|        return executor;
L34|    }
```

### P1 — `M016` `TrackServiceImpl.java:57` — JavaTimeDefaultTimeZone

片段范围：`src/main/java/com/antfin/library/tracking/service/impl/TrackServiceImpl.java:55-58`

```java
L55|            entity.setDepartment(user != null ? user.getDepartment() : "");
L56|            // I004: 使用 java.time API 替代 new Date()
L57|            entity.setCallTime(Date.from(LocalDateTime.now()  // 问题 M016：LocalDateTime.now() 默认时区
L58|                    .atZone(ZoneId.systemDefault()).toInstant()));
```

### P2 — `I004` `TrackServiceImpl.java:56` — JavaUtilDate 残留

> 同上片段 `TrackServiceImpl.java:55-58`，`Date.from(...)` 最终仍产出 `java.util.Date`，建议 entity 字段改 `LocalDateTime` 从根上消除 Date。

---

## 8. 修复任务列表

### P0

- [ ] **P0** `TrackAsyncConfig.java:29` — 将 `CallerRunsPolicy` 改为 `DiscardPolicy`（直接丢弃）或自定义 `RejectedExecutionHandler`（丢弃 + `log.warn` 告警），确保队列满时不阻塞算法接口主链路，符合 spec A08

### P1

- [ ] **P1** `TrackServiceImpl.java:57` — `LocalDateTime.now()` 显式指定时区（如 `LocalDateTime.now(ZoneId.of("Asia/Shanghai"))`）或改用 `Instant.now()`，消除 M016 默认时区隐患

### P2（可选）

- [ ] **P2** `TrackServiceImpl.java:56` — 将 `AlgoCallLogEntity.callTime` 字段类型从 `Date` 改为 `LocalDateTime`，消除 `Date.from` 转换（I004 残留）
- [ ] **P2** `AlgorithmServiceImpl.java:58` — `bubbleSort` 入口增加 `numbers.size() > 1000` 校验（spec A05），与导出链路 `MAX_ROWS` 约束对齐
- [ ] **P2** `ReportServiceImpl.java:56-57`、`ExportServiceImpl.java:149-150` — 拆分超长行，控制行宽 120 字符以内（A3.4）
