# Code Review Report

> **Change** `算法演示与调用埋点可视化` · **分支/Commit** `AI/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-bbcab1f2-8fa2-4126-92f7-ba9af5826a63` / `HEAD` · **日期** `2026-08-07` · **审查者** AI
>
> **AI**：等级 **P0 / P1 / P2**；G/S 以 checklist 行内定义为准；Bug 模式以 `bug-pattern-checklist.md` 表头为准（Blocker→P0、Major→P1、Info→P2）。**已先**运行 `scan-all-rules.sh` 并将要点并入 §5，**再**写 LLM 结论。问题须含 `path:line` 或清单 ID。

---

## 1. 审查范围

| 项 | 值 |
|----|-----|
| `.java` 文件数 | `23` |
| 变更行数 | 全量新增（无 diff 基线，首次构建） |

| 类/接口 | 路径 | 角色（可选） |
|---------|------|--------------|
| `AlgorithmController` | `src/main/java/com/antfin/library/algorithm/api/controller/AlgorithmController.java` | 算法接口入口 |
| `AlgorithmServiceImpl` | `src/main/java/com/antfin/library/algorithm/service/impl/AlgorithmServiceImpl.java` | 算法实现 |
| `TrackServiceImpl` | `src/main/java/com/antfin/library/tracking/service/impl/TrackServiceImpl.java` | 埋点服务 |
| `ReportServiceImpl` | `src/main/java/com/antfin/library/report/service/impl/ReportServiceImpl.java` | 报表查询 |
| `ExportServiceImpl` | `src/main/java/com/antfin/library/export/service/impl/ExportServiceImpl.java` | 导出服务 |
| `HashAlgorithmEnum` | `src/main/java/com/antfin/library/common/enums/HashAlgorithmEnum.java` | 哈希枚举 |
| `WebConfig` | `src/main/java/com/antfin/library/common/config/WebConfig.java` | CORS 配置 |
| `GlobalExceptionHandler` | `src/main/java/com/antfin/library/common/exception/GlobalExceptionHandler.java` | 全局异常处理 |
| `Result` | `src/main/java/com/antfin/library/common/model/Result.java` | 统一返回 |
| `BubbleSortRequest` | `src/main/java/com/antfin/library/algorithm/model/request/BubbleSortRequest.java` | 冒泡入参 |
| `HashRequest` | `src/main/java/com/antfin/library/algorithm/model/request/HashRequest.java` | 哈希入参 |

---

## 2. 问题计数

| P0 | P1 | P2 |
|----|----|-----|
| 8 | 3 | 4 |

---

## 3. Step 2 — 功能（REQ）

### REQ-1: HelloWorld 接口 (F01)

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 调用 GET /api/algorithm/hello-world 返回固定问候串 | ✅ | `design.md §1.5 F01: 返回固定问候串` | `AlgorithmController.java:32-35` → `AlgorithmServiceImpl.java:33-36` | 返回 `HelloWorldVO(message)` 符合 spec |

### REQ-2: 哈希算法接口 (F02)

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 调用 POST /api/algorithm/hash，入参文本+算法，返回哈希值 | ✅ | `design.md §1.5 F02: 支持多算法（MD5/SHA-256 等），入参文本` | `AlgorithmController.java:40-43` → `AlgorithmServiceImpl.java:39-52` | 支持 MD5/SHA-256/SHA-512，非法值降级 SHA-256，符合 A04 |
| 入参校验：inputText 非空+长度限制 | ✅ | `design.md §1.6 A04` | `HashRequest.java:14-15` | `@NotBlank` + `@Size(max=10000)` |

### REQ-3: 冒泡排序接口 (F03)

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 调用 POST /api/algorithm/bubble-sort，入参数组，返回升序+比较次数+交换次数 | ✅ | `design.md §1.5 F03: 入参数组，返回升序结果与步骤统计` | `AlgorithmController.java:48-51` → `AlgorithmServiceImpl.java:55-85` | 返回 `BubbleSortResultVO(sortedArray, compareCount, swapCount, durationMillis)` |
| 数组长度上限 1000 | ✅ | `design.md §1.6 A05: 数组长度上限 1000` | `BubbleSortRequest.java:16` | `@Size(min=1, max=1000)` |

### REQ-4: 算法结果导出接口 (F04)

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 调用导出接口，按 Tab 维度导出结果 | ⚠️ | `design.md §1.5 F04: 按 Tab 维度导出 Excel` | `ExportServiceImpl.java:41-88` | **导出格式为 CSV 而非 spec 约定的 Excel(.xlsx)**（`design.md §1.6 A06: 导出为 Excel（.xlsx）`）。功能可用但格式不符 |
| 单次导出上限 10000 行 | ✅ | `design.md §1.6 A06: 单次导出上限 10000 行` | `ExportServiceImpl.java:33,98-99` | `MAX_ROWS=10000` 限制 |

### REQ-5: 算法调用埋点 (F05)

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 记录调用次数、调用人、维度信息 | ⚠️ | `design.md §1.5 F05: 记录调用次数、调用人、维度信息` | `TrackServiceImpl.java:31-57` | 埋点写入逻辑存在，但 `getCurrentUserId()` 硬编码返回 `"demo-user"`（`AlgorithmServiceImpl.java:101-105`），**无法获取真实调用人**，与 spec「获取调用人」不符 |
| 埋点不阻塞主链路 | ⚠️ | `design.md §1.3: 埋点记录不得阻塞主链路` | `AlgorithmServiceImpl.java:34,40,56` → `TrackServiceImpl.java:31-57` | **埋点为同步调用**（`trackService.trackAlgorithmCall` 在算法方法体内同步执行），与 spec「异步落库（线程池+队列），主链路不等待」（A08）不符。埋点异常虽 try-catch 不抛错，但 DB 写入仍同步阻塞 |
| 记录维度信息（人员类型/层级/部门） | ✅ | `design.md §1.6 A03` | `TrackServiceImpl.java:42-49` | 从 `SysUserMapper.selectByUserId` 获取用户维度并冗余存储 |

### REQ-6: 算法演示页面三 Tab (F06)

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 前端新增页面，三 Tab 展示不同执行结果 | ✅ | `design.md §1.5 F06` | `[library-frontend] src/views/AlgorithmDemoPage.vue` + `src/components/HelloWorldTab.vue / HashTab.vue / BubbleSortTab.vue` | 前端三 Tab 组件+路由已实现（非 Java 范围，仅关联确认） |

### REQ-7: 导出按钮 (F07)

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 页面级导出按钮，导出当前 Tab 结果 | ✅ | `design.md §1.5 F07` | `[library-frontend] AlgorithmDemoPage.vue` 含导出按钮 + `ExportServiceImpl.java` 提供导出接口 | 前后端联动已实现 |

### REQ-8: 调用情况报表可视化 (F08)

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 折线图（趋势） | ✅ | `design.md §1.5 F08: 折线图（趋势）` | `ReportServiceImpl.java:56-63` → `AlgoCallStatsVO.TrendItem` | 按日趋势数据已提供 |
| 饼图（占比） | ✅ | `design.md §1.5 F08: 饼图（占比）` | `ReportServiceImpl.java:66-73` → `AlgoCallStatsVO.DimensionItem` | 维度占比数据已提供 |
| 柱状图（对比） | ✅ | `design.md §1.5 F08: 柱状图（对比）` | `ReportServiceImpl.java:76-84` → `AlgoCallStatsVO.DimensionItem` | 维度对比数据已提供 |
| 维度切换：人员类型/层级/部门 | ✅ | `design.md §1.5 F08` | `ReportServiceImpl.java:38-41` → `DimensionEnum.isValid()` | 维度校验+切换已实现 |
| 报表查询接口需对聚合结果做缓存 | ❌ | `design.md §1.3: 报表查询接口需对聚合结果做缓存，避免高频打 DB` | `ReportServiceImpl.java:36-97` | **无任何缓存实现**（无 `@Cacheable` / 手动缓存），每次查询直接打 DB，与 spec 非功能要求不符 |

---

## 4. Step 3 — 可读性检查

| 结果 | 说明（违规写 Ax.x 与 `path:行`） |
|------|--------------------------------|
| ⚠️ | `A3.4` `ReportServiceImpl.java:66` — 行宽超限（预扫命中） |
| ⚠️ | `A3.4` `ReportServiceImpl.java:76` — 行宽超限（预扫命中） |
| ⚠️ | `A3.4` `ReportServiceImpl.java:94` — 行宽超限（预扫命中） |
| ✅ | 其余 A1-A7 无明显违规 |

---

## 5. Step 4 — 可靠性检查

**预扫结果**（`scan-all-rules.sh`，52/222 条规则，13 findings）：

```
[P0] B022 — DateFormatThreadSafety: ReportServiceImpl.java:104
[P0] B022 — DateFormatThreadSafety: ReportServiceImpl.java:116
[P0] G16.2 — CatchWithoutLogging: HashAlgorithmEnum.java:55
[P0] G16.2 — CatchWithoutLogging: ExportServiceImpl.java:106
[P0] G16.2 — CatchWithoutLogging: ExportServiceImpl.java:140
[P0] G16.2 — CatchWithoutLogging: ReportServiceImpl.java:106
[P0] G16.2 — CatchWithoutLogging: ReportServiceImpl.java:118
[P0] G16.2 — CatchWithoutLogging: TrackServiceImpl.java:53
[P1] S10.2 — CorsWildcard: WebConfig.java:16
[P2] A3.4 — LineWidthExceeded: ReportServiceImpl.java:66,76,94
[P2] I004 — JavaUtilDate: TrackServiceImpl.java:50
```

| 域 | 参考 | 结果 | 等级 | 说明（列命中 ID 或「已扫无命中」） |
|----|------|------|------|-------------------------------------|
| 可靠性 | `reliability-checklist.md` G1–G17 | ❌ | P0 | `G16.2` CatchWithoutLogging 命中 5 处：`HashAlgorithmEnum.java:55`、`ExportServiceImpl.java:106,140`、`ReportServiceImpl.java:106,118`、`TrackServiceImpl.java:53` |
| 安全 | `security-checklist.md` S1–S10 | ⚠️ | P1 | `S10.2` CorsWildcard 命中 `WebConfig.java:16`（`allowedOriginPatterns("*")` + `allowCredentials(true)`） |
| Bug 模式 | `bug-pattern-checklist.md` B/M/I（120） | ❌ | P0 | `B022` DateFormatThreadSafety 命中 2 处：`ReportServiceImpl.java:104,116`（`SimpleDateFormat` 局部变量线程不安全，此处为方法内局部变量风险降低，但模式命中）；`I004` JavaUtilDate `TrackServiceImpl.java:50`（P2） |

**LLM 补扫（脚本未覆盖项）**：

| ID | 等级 | path:line | 说明 |
|----|------|-----------|------|
| G1.1 | P0 | `AlgorithmServiceImpl.java:34,40,56` | 埋点调用 `trackService.trackAlgorithmCall` 在算法方法体内同步执行，高并发下成为瓶颈，与 spec A08「异步落库」不符 |
| S2.1 | P0 | `AlgorithmServiceImpl.java:101-105`、`ExportServiceImpl.java:146-148` | `getCurrentUserId()` 硬编码 `"demo-user"`，无认证授权，所有请求被视为同一用户，埋点数据失真，属安全隐患 |
| B022(复核) | P2 | `ReportServiceImpl.java:104,116` | `SimpleDateFormat` 为方法内局部变量，非共享静态字段，实际线程安全风险降级为 P2（预扫标 P0 属误报，但建议改用 `DateTimeFormatter`） |

---

## 6. Step 5 — 自定义扩展检查

| 域 | 参考 | 结果 | 等级 | 说明（列命中 ID 或「未启用自定义规则」） |
|----|------|------|------|------------------------------------------|
| 自定义扩展 | `customized-checklist.md` U* | N/A | N/A | 未启用自定义规则 |

---

## 7. 结论

- **合并建议**：**修复后合并**
- **P0**：
  1. `G16.2` `HashAlgorithmEnum.java:55` — `NoSuchAlgorithmException` 捕获后抛 `IllegalStateException` 未记录原始异常日志（虽有 `ex` 传入构造器，但无 `log.error`），排障可观测性不足
  2. `G16.2` `ExportServiceImpl.java:106` — `NumberFormatException` 捕获后直接抛 `BusinessException`，未先记录日志
  3. `G16.2` `ExportServiceImpl.java:140` — `IOException` 捕获后 `log.error` 记录（此处实际有日志，预扫误报，降级）
  4. `G16.2` `ReportServiceImpl.java:106,118` — `ParseException` 捕获后直接抛 `BusinessException`，未先记录日志
  5. `G16.2` `TrackServiceImpl.java:53` — `Exception` 捕获后 `log.error` 记录（此处实际有日志，预扫误报，降级）
  6. `G1.1` `AlgorithmServiceImpl.java:34,40,56` — 埋点同步调用阻塞主链路，与 spec A08 异步要求不符
  7. `S2.1` `AlgorithmServiceImpl.java:101-105`、`ExportServiceImpl.java:146-148` — `getCurrentUserId()` 硬编码，无法获取真实调用人
  8. `F08/REQ-8` `ReportServiceImpl.java:36-97` — 报表查询无缓存，与 spec 非功能要求不符
- **P1/P2**：
  1. **P1** `S10.2` `WebConfig.java:16` — CORS `allowedOriginPatterns("*")` + `allowCredentials(true)` 存在安全隐患，生产环境应限制为已知域名
  2. **P2** `A3.4` `ReportServiceImpl.java:66,76,94` — 行宽超限
  3. **P2** `I004` `TrackServiceImpl.java:50` — 使用 `java.util.Date`，建议改用 `java.time` API
  4. **P2** `B022` `ReportServiceImpl.java:104,116` — `SimpleDateFormat` 建议改用线程安全的 `DateTimeFormatter`
  5. **P1** `F04/REQ-4` `ExportServiceImpl.java:49,128` — 导出格式为 CSV 而非 spec 约定的 Excel(.xlsx)
- **一句话**：功能主链路已打通，但埋点同步阻塞、用户身份硬编码、报表无缓存三处与 spec 非功能要求存在偏差，导出格式也与 spec 约定不一致，需修复后合并。

---

## 7.1 问题片段（必填）

### P0 — `G16.2` `HashAlgorithmEnum.java:55` — 捕获异常未记录日志

片段范围：`src/main/java/com/antfin/library/common/enums/HashAlgorithmEnum.java:52-59`

```java
L52|    public MessageDigest newMessageDigest() {
L53|        try {
L54|            return MessageDigest.getInstance(getJceName());
L55|        } catch (NoSuchAlgorithmException ex) {  // 问题：捕获后抛 IllegalStateException 但无 log.error 记录
L56|            throw new IllegalStateException("不支持的哈希算法: " + getJceName(), ex);
L57|        }
L58|    }
L59|}
```

### P0 — `G1.1` `AlgorithmServiceImpl.java:33-36` — 埋点同步阻塞主链路

片段范围：`src/main/java/com/antfin/library/algorithm/service/impl/AlgorithmServiceImpl.java:33-36`

```java
L33|    public HelloWorldVO helloWorld() {
L34|        trackService.trackAlgorithmCall("HELLO_WORLD", getCurrentUserId());  // 问题：同步调用，阻塞主链路
L35|        return new HelloWorldVO(HELLO_WORLD_MESSAGE);
L36|    }
```

### P0 — `S2.1` `AlgorithmServiceImpl.java:101-105` — 用户身份硬编码

片段范围：`src/main/java/com/antfin/library/algorithm/service/impl/AlgorithmServiceImpl.java:98-106`

```java
L98|    /**
L99|     * 获取当前用户ID（简化实现，实际从上下文获取）
L100|     */
L101|    private String getCurrentUserId() {
L102|        // 简化实现：从请求头或上下文获取，此处使用默认值
L103|        // 实际项目中应从 SecurityContext 或 Session 获取
L104|        return "demo-user";  // 问题：硬编码，所有请求被视为同一用户
L105|    }
L106|}
```

### P0 — `G16.2` `ReportServiceImpl.java:102-109` — 捕获异常未记录日志

片段范围：`src/main/java/com/antfin/library/report/service/impl/ReportServiceImpl.java:102-109`

```java
L102|    private Date parseStartDate(String dateStr) {
L103|        try {
L104|            SimpleDateFormat sdf = new SimpleDateFormat(DATE_TIME_PATTERN);  // 问题：B022 线程不安全
L105|            return sdf.parse(dateStr + " 00:00:00");
L106|        } catch (ParseException e) {  // 问题：G16.2 捕获后直接抛异常，未 log.warn
L107|            throw new BusinessException("PARAM_ERROR", "日期格式错误，应为 yyyy-MM-dd: " + dateStr);
L108|        }
L109|    }
```

### P0 — `REQ-8` `ReportServiceImpl.java:36-56` — 报表查询无缓存

片段范围：`src/main/java/com/antfin/library/report/service/impl/ReportServiceImpl.java:36-56`

```java
L36|    public AlgoCallStatsVO queryCallStats(ReportRequest request) {
L37|        // 校验维度
L38|        if (!DimensionEnum.isValid(request.getDimension())) {
L39|            throw new BusinessException("PARAM_ERROR", "无效的聚合维度: " + request.getDimension() +
L40|                    "，可选值: USER_TYPE / USER_LEVEL / DEPARTMENT");
L41|        }
L42|
L43|        // 解析日期
L44|        Date startDate = parseStartDate(request.getStartDate());
L45|        Date endDate = parseEndDate(request.getEndDate());
L46|        if (startDate.after(endDate)) {
L47|            throw new BusinessException("PARAM_ERROR", "开始日期不能晚于结束日期");
L48|        }
L49|
L50|        String algorithmType = request.getAlgorithmType();
L51|        String dimension = request.getDimension();
L52|
L53|        AlgoCallStatsVO vo = new AlgoCallStatsVO();
L54|
L55|        // 1. 按日趋势  -- 问题：直接查 DB，无缓存
L56|        List<Map<String, Object>> trendRows = algoCallLogMapper.selectDailyTrend(algorithmType, startDate, endDate);
```

### P1 — `S10.2` `WebConfig.java:14-21` — CORS 通配符+凭证

片段范围：`src/main/java/com/antfin/library/common/config/WebConfig.java:14-21`

```java
L14|    public void addCorsMappings(CorsRegistry registry) {
L15|        registry.addMapping("/api/**")
L16|                .allowedOriginPatterns("*")  // 问题：S10.2 通配符源 + allowCredentials(true) 存在安全隐患
L17|                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
L18|                .allowedHeaders("*")
L19|                .allowCredentials(true)
L20|                .maxAge(3600);
L21|    }
```

### P1 — `REQ-4` `ExportServiceImpl.java:49,128` — 导出格式不符 spec

片段范围：`src/main/java/com/antfin/library/export/service/impl/ExportServiceImpl.java:49-50,127-128`

```java
L49|        String fileName = "algorithm-result-" + typeEnum.getCode().toLowerCase() + ".csv";  // 问题：spec 约定 .xlsx
L50|        StringBuilder csv = new StringBuilder();
...
L128|        response.setContentType("text/csv;charset=UTF-8");  // 问题：spec 约定 Excel
```

---

## 8. 修复任务列表

### P0

- [ ] **P0** `AlgorithmServiceImpl.java:34,40,56` — 将埋点调用改为异步（线程池+队列或 `@Async`），确保主链路不等待埋点 DB 写入
- [ ] **P0** `AlgorithmServiceImpl.java:101-105`、`ExportServiceImpl.java:146-148` — 实现 `getCurrentUserId()` 从 SecurityContext/Session/请求头获取真实用户 ID，替代硬编码 `"demo-user"`
- [ ] **P0** `ReportServiceImpl.java:36-97` — 为报表查询接口增加缓存层（`@Cacheable` 或手动缓存），避免高频聚合查询直接打 DB
- [ ] **P0** `HashAlgorithmEnum.java:55` — 在 `catch(NoSuchAlgorithmException)` 中增加 `log.error` 记录原始异常后再抛出
- [ ] **P0** `ReportServiceImpl.java:106,118` — 在 `catch(ParseException)` 中增加 `log.warn` 记录后再抛出 `BusinessException`
- [ ] **P0** `ExportServiceImpl.java:106` — 在 `catch(NumberFormatException)` 中增加 `log.warn` 记录后再抛出

### P1

- [ ] **P1** `WebConfig.java:16` — 将 `allowedOriginPatterns("*")` 改为生产环境已知域名白名单，或移除 `allowCredentials(true)`
- [ ] **P1** `ExportServiceImpl.java:49,128` — 将导出格式从 CSV 改为 Excel(.xlsx)（使用 Apache POI），与 spec A06 约定一致

### P2（可选）

- [ ] **P2** `ReportServiceImpl.java:104,116` — 将 `SimpleDateFormat` 改为线程安全的 `DateTimeFormatter`
- [ ] **P2** `TrackServiceImpl.java:50` — 将 `new Date()` 改为 `java.time.LocalDateTime` / `Instant`
- [ ] **P2** `ReportServiceImpl.java:66,76,94` — 拆分超长行，控制行宽在 120 字符以内
