# Code Review Report

> **Change** 算法演示模块 · **分支/Commit** `AI/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-a7e84669-40b0-4530-a25b-8e32eb0ebfa2` · **日期** 2025-08-17 · **审查者** AI
>
> **AI**：等级 **P0 / P1 / P2**；G/S 以 checklist 行内定义为准；Bug 模式以 `bug-pattern-checklist.md` 表头为准（Blocker→P0、Major→P1、Info→P2）。**已先**运行 `scan-all-rules.sh` 并将要点并入 §5，**再**写 LLM 结论。问题须含 `path:line` 或清单 ID。

---

## 1. 审查范围

| 项 | 值 |
|----|-----|
| `.java` 文件数 | 14 |
| 变更行数 | `+566 / -0` (estimated) |

| 类/接口 | 路径 | 角色 |
|---------|------|------|
| `LibraryApplication` | `library-backend/.../LibraryApplication.java` | Spring Boot 启动类 |
| `ApiResult` | `library-backend/.../common/ApiResult.java` | 统一响应包装 |
| `GlobalExceptionHandler` | `library-backend/.../common/GlobalExceptionHandler.java` | 全局异常处理 |
| `AlgorithmController` | `library-backend/.../controller/AlgorithmController.java` | REST 控制器 |
| `BubbleSortRequest` | `library-backend/.../dto/BubbleSortRequest.java` | 冒泡排序请求 DTO |
| `BubbleSortResponse` | `library-backend/.../dto/BubbleSortResponse.java` | 冒泡排序响应 DTO |
| `ExportRequest` | `library-backend/.../dto/ExportRequest.java` | 导出请求 DTO |
| `HashRequest` | `library-backend/.../dto/HashRequest.java` | 哈希请求 DTO |
| `HashResponse` | `library-backend/.../dto/HashResponse.java` | 哈希响应 DTO |
| `HelloWorldResponse` | `library-backend/.../dto/HelloWorldResponse.java` | HelloWorld 响应 DTO |
| `SortStep` | `library-backend/.../dto/SortStep.java` | 排序步骤 DTO |
| `BubbleSortService` | `library-backend/.../service/BubbleSortService.java` | 冒泡排序服务 |
| `ExportResult` | `library-backend/.../service/ExportResult.java` | 导出结果容器 |
| `ExportService` | `library-backend/.../service/ExportService.java` | 导出服务 |
| `HashService` | `library-backend/.../service/HashService.java` | 哈希计算服务 |

> 前端 TypeScript/React 文件（15 个）作为跨仓对齐参考一并审查，但不在 Java 规则范围内。

---

## 2. 问题计数

| P0 | P1 | P2 |
|----|----|-----|
| 1 | 4 | 5 |

---

## 3. Step 2 — 功能（REQ）

> REQ 来源：`dima.md` §3 跨库接口契约 + `design.md` §5 功能模块设计

### REQ-1: GET /api/helloworld — 返回问候语与时间戳

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 无参 GET 返回 `{code:0, data:{greeting, timestamp}}` | ✅ | dima.md §3.1 | `AlgorithmController.java:52-56` | greeting 固定为 "Hello, World!"，timestamp 使用 `Instant.now().toString()` (ISO-8601) |
| 前端自动加载展示 | ✅ | design.md §5.2.3.2 | `HelloWorldPanel.tsx:34-36` | useEffect 挂载时自动调用，三态正确 |

### REQ-2: POST /api/hash — SHA-256 哈希计算

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| input 必填非空，`@NotBlank` 校验 | ✅ | dima.md §3.2 | `HashRequest.java:10` | `@NotBlank(message = "Input must not be empty")` |
| algorithm 默认 "SHA-256" | ✅ | dima.md §3.2 | `HashRequest.java:13` | DTO 默认值 `= "SHA-256"` |
| 仅支持 SHA-256，其他返回错误 | ✅ | design.md §5.1.3.2 R04 | `HashService.java:32-33` | 非 SHA-256 抛 IllegalArgumentException |
| 返回十六进制小写哈希 | ✅ | dima.md §3.2 | `HashService.java:47-52` | `String.format("%02x", b)` 小写 |
| algorithm 显式传 null 时行为 | ⚠️ | design.md §5.1.3.2 R03 | `HashService.java:32` | 若 JSON 显式传 `"algorithm": null`，Jackson 覆盖 DTO 默认值，导致抛异常而非自动填充 SHA-256 |

### REQ-3: POST /api/bubblesort — 冒泡排序

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| array 必填，长度 1-100 | ✅ | dima.md §3.3 | `BubbleSortRequest.java:12-13` | `@NotNull @Size(min=1, max=100)` |
| 返回 steps（每轮 after 数组 + swapped） | ✅ | dima.md §3.3 | `BubbleSortService.java:37-53` | 标准冒泡排序，深拷贝每轮状态 |
| 返回 comparisons + swaps 统计 | ✅ | dima.md §3.3 | `BubbleSortService.java:34-35,40,45` | 内层循环计数比较，交换时计数交换 |
| 数组元素为 null 的防御 | ❌ | design.md §5.1.3.3 异常场景 | `BubbleSortService.java:41` | 若 `List<Integer>` 含 null 元素，`arr.get(j) > arr.get(j+1)` 抛 NPE，无前置校验 |

### REQ-4: POST /api/export — 结果导出

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| type 必填，枚举校验 | ✅ | dima.md §3.4 | `ExportService.java:42-46` | 严格校验 helloworld/hash/bubblesort |
| format 默认 json | ✅ | dima.md §3.4 | `ExportService.java:47-48` | null/blank 时默认 "json" |
| Content-Disposition 附件下载 | ✅ | dima.md §3.4 | `AlgorithmController.java:91-94` | 设置 attachment header |
| data 必填校验 | ❌ | design.md §5.1.3.4 异常场景 | `ExportRequest.java:14` | `data` 字段缺少 `@NotNull`，design 要求 data 为空时返回 ALG_001 |
| 前端 CSV 格式导出 | ❌ | design.md §5.1.3.4 R09 | `ExportButton.tsx:17` | 前端硬编码 `'json'`，不提供 CSV 选择 |

### REQ-5: 前端三 Tab 页面 + 导出按钮

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 路由 `/algorithm-demo` | ✅ | design.md §4.2 | `App.tsx:13` | Route 配置正确 |
| 三 Tab 独立状态管理 | ✅ | design.md §4.3 | `AlgorithmDemoPage.tsx:23-28` | 每个 Tab 独立 results |
| Loading/Error/Data 三态 | ✅ | design.md §5.2.3 | 各 Panel 组件 | 状态机实现正确 |
| 导出按钮无数据时禁用 | ✅ | design.md §5.2.3.5 | `ExportButton.tsx:37,48` | `disabled || exporting` 控制 |
| axios 30s 超时 | ✅ | design.md §5.2.3.1 R14 | `algorithm.ts:6` | `timeout: 30000` |

---

## 4. Step 3 — 可读性检查

| 结果 | 说明（违规写 Ax.x 与 `path:行`） |
|------|--------------------------------|
| ⚠️ | **A3.4** `ExportService.java:45` — 行宽超过 120 字符（脚本确认）。`throw new IllegalArgumentException("Invalid type: " + type + ". Must be one of: helloworld, hash, bubblesort");` 约 130 字符 |
| ✅ | A1.1–A1.3 文件名、编码、空白均符合规范 |
| ✅ | A2.1–A2.5 源文件结构正确，无 `import *`，import 分组有序 |
| ✅ | A3.1–A3.8 K&R 大括号、缩进 4 空格、运算符空格均符合 |
| ✅ | A4.1–A4.7 包名全小写、类名 UpperCamelCase、方法名 lowerCamelCase 均符合 |
| ✅ | A5.1–A5.4 无空 catch、无不规范调用 |
| ✅ | A6.1–A6.5 数组方括号、修饰符顺序、注解风格均符合 |
| ✅ | A7.1–A7.4 public 类/方法均有 Javadoc |

---

## 5. Step 4 — 可靠性检查

| 域 | 参考 | 结果 | 等级 | 说明 |
|----|------|------|------|------|
| 可靠性 | `reliability-checklist.md` G1–G17 | ⚠️ | — | 详见下方 |
| 安全 | `security-checklist.md` S1–S10 | ✅ | — | 无持久化/无外部输入拼接/无认证需求，S1-S10 均 N/A 或已通过 |
| Bug 模式 | `bug-pattern-checklist.md` B/M/I（120） | ⚠️ | — | 预扫已完成，详见下方 |

### 可靠性（G）逐项分析

| ID | 结果 | 等级 | 说明 |
|----|------|------|------|
| G1 并发控制 | N/A | — | 纯计算型服务，无共享状态，无并发风险 |
| G2 幂等拦截 | N/A | — | 无写操作，无需幂等 |
| G3 事务控制 | N/A | — | 无数据库操作 |
| G4 SQL与索引 | N/A | — | 无数据库操作 |
| G5 消息（MQ） | N/A | — | 无消息队列 |
| G6 缓存 | N/A | — | 无缓存 |
| G7 调度任务 | N/A | — | 无定时任务 |
| G8 防御编程 | ⚠️ | P1 | **G8.1**: `GlobalExceptionHandler.handleValidation` (line 30) 和 `handleIllegalArgument` (line 44) 未记录日志，仅返回错误响应，线上排障困难 |
| G8 防御编程 | ⚠️ | P1 | **G8.3**: `BubbleSortService.sort` (line 41) 未防御 null 元素，`arr.get(j) > arr.get(j+1)` 会 NPE |
| G9 网络调用 | N/A | — | 无外部 RPC/HTTP 调用 |
| G10 接口契约 | ✅ | — | 字段命名与契约一致，ApiResult 统一包装 |
| G11 开发自测 | ⚠️ | P1 | **G11.3**: `ExportService.export` 未校验 `data` 为 null 的情况 |
| G11 开发自测 | ⚠️ | P2 | **G11.1**: 无单元测试文件，`pom.xml` 虽引入 `spring-boot-starter-test` 但无测试类 |
| G12 资损防控 | N/A | — | 无资金相关操作 |
| G13 监控核对 | ✅ | — | `handleException` 使用 `log.error` 级别正确 |
| G14 国际化/多租户 | N/A | — | 无多租户/币种需求 |
| G15 可灰度 | N/A | — | 新功能模块，无数据库变更 |
| G16 可监控 | ⚠️ | P1 | **G16.2**: `GlobalExceptionHandler.handleValidation` (line 30) 和 `handleIllegalArgument` (line 44) 无日志输出，缺少可追溯上下文 |
| G16 可监控 | ✅ | — | 脚本报 G16.2 `HashService.java:41` 和 `ExportService.java:89` 为**误报**：两处 catch 块内均有 `log.error(...)` 调用 |
| G17 可应急 | N/A | — | 新功能模块，无开关/降级需求 |

### 安全（S）逐项分析

| ID | 结果 | 说明 |
|----|------|------|
| S1 SQL注入 | N/A | 无数据库操作 |
| S2 XSS | N/A | 后端仅返回 JSON，前端 React 默认转义 |
| S3 SSRF | N/A | 无外部 URL 请求 |
| S4 命令执行 | N/A | 无系统命令调用 |
| S5 XXE | N/A | 无 XML 解析 |
| S6 反序列化 | N/A | 无自定义反序列化 |
| S7 文件上传/下载 | N/A | 导出为内存生成，无文件系统操作 |
| S8 访问控制 | N/A | 公开页面，无需鉴权 |
| S9 数据安全 | ✅ | 无硬编码密钥/凭证 |
| S10 CORS | ⚠️ | P2 | `application.yml` 使用 `spring.mvc.cors.mappings`，Spring Boot 2.7 中可能需要 `WebMvcConfigurer` bean 补充；`allowed-headers: "*"` 在生产环境应限制 |

### Bug 模式（B/M/I）预扫结果

> 脚本 `scan-all-rules.sh` 已扫描 52/222 条可程序化规则。LLM 补扫其余规则。

| 脚本命中 | 结果 | 等级 | 说明 |
|----------|------|------|------|
| G16.2 CatchWithoutLogging `HashService.java:41` | 误报 | — | catch 块内 line 42 有 `log.error(...)`，脚本未识别到 |
| G16.2 CatchWithoutLogging `ExportService.java:89` | 误报 | — | catch 块内 line 90 有 `log.error(...)`，脚本未识别到 |
| A3.4 LineWidthExceeded `ExportService.java:45` | ✅ 确认 | P2 | 行宽约 130 字符 |

**LLM 补扫 B/M/I（选取与本次变更相关的关键规则）：**

| ID | 结果 | 等级 | 说明 |
|----|------|------|------|
| B001–B042 | ✅ | — | 无命中：无 `Executors`/`SimpleDateFormat`/`BigDecimal(double)`/`equals` 误用等 |
| B043–B081 | ✅ | — | 无命中：无 `ThreadLocal`/流关闭/资源泄漏等问题 |
| M001–M027 | ✅ | — | 无命中：无集合遍历修改/空指针模式等 |
| I001–I010 | ✅ | — | 无命中 |
| **G11.3** | ⚠️ | P1 | `BubbleSortService.java:41` — List 元素未做 null 防御 |
| **G11.3** | ⚠️ | P1 | `ExportService.java:59` — `data` 参数未做 null 防御 |

---

## 6. Step 5 — 自定义扩展检查

| 域 | 参考 | 结果 | 等级 | 说明 |
|----|------|------|------|------|
| 自定义扩展 | `customized-checklist.md` U* | N/A | — | 未启用自定义规则（`customized-checklist.md` 仅含示例项 U1.1） |

---

## 7. 结论

- **合并建议**：修复后合并（1 个 P0 阻塞项需修复）
- **P0**：
  1. `ExportRequest.java:14` — `data` 字段缺少 `@NotNull` 校验，design §5.1.3.4 要求 data 为空时返回 ALG_001
- **P1**：
  1. `GlobalExceptionHandler.java:30-33` — `handleValidation` 未记录日志（G16.2）
  2. `GlobalExceptionHandler.java:44-45` — `handleIllegalArgument` 未记录日志（G16.2）
  3. `BubbleSortService.java:41` — 未防御 List 中 null 元素导致 NPE（G11.3）
  4. `ExportService.java:59` — 未防御 `data` 为 null（G11.3）
- **P2**：
  1. `ExportService.java:45` — 行宽超过 120 字符（A3.4）
  2. `ExportButton.tsx:17` — 前端硬编码 `'json'`，不提供 CSV 格式导出选项
  3. `HashService.java:32` — `algorithm` 显式传 null 时未按 design 自动填充 SHA-256
  4. `AlgorithmDemoPage.tsx:90` — 不安全的类型断言 `as Record<string, unknown>`
  5. `application.yml:8-11` — CORS `allowed-headers: "*"` 生产环境应限制
- **一句话**：代码整体结构清晰，跨库接口契约对齐良好，核心算法逻辑正确；1 个 P0（ExportRequest.data 缺少校验）、4 个 P1（异常日志缺失 + 入参防御不足）需在合并前修复。

---

## 7.1 问题片段（必填）

### P0 问题

- **P0** `G11.3` `library-backend/src/main/java/com/example/library/dto/ExportRequest.java:14` — `data` 字段缺少 `@NotNull` 校验，design §5.1.3.4 要求 data 为空时返回 ALG_001。
  片段范围：`ExportRequest.java:9-17`

```java
L09|public class ExportRequest {
L10|
L11|    @NotBlank(message = "Type must not be blank")
L12|    private String type;
L13|
L14|    private Map<String, Object> data;   // ❌ 缺少 @NotNull 校验
L15|
L16|    private String format = "json";
L17|}
```

### P1 问题

- **P1** `G16.2` `library-backend/src/main/java/com/example/library/common/GlobalExceptionHandler.java:30-33` — 校验异常处理未记录日志，缺少可追溯上下文。
  片段范围：`GlobalExceptionHandler.java:28-34`

```java
L28|    @ExceptionHandler(MethodArgumentNotValidException.class)
L29|    @ResponseStatus(HttpStatus.BAD_REQUEST)
L30|    public ApiResult<Void> handleValidation(MethodArgumentNotValidException ex) {
L31|        FieldError fieldError = ex.getBindingResult().getFieldError();
L32|        String message = fieldError != null ? fieldError.getDefaultMessage() : "Validation failed";
L33|        return ApiResult.error(400, message);   // ❌ 未记录日志
L34|    }
```

- **P1** `G16.2` `library-backend/src/main/java/com/example/library/common/GlobalExceptionHandler.java:44-45` — 非法参数异常处理未记录日志。
  片段范围：`GlobalExceptionHandler.java:42-46`

```java
L42|    @ExceptionHandler(IllegalArgumentException.class)
L43|    @ResponseStatus(HttpStatus.BAD_REQUEST)
L44|    public ApiResult<Void> handleIllegalArgument(IllegalArgumentException ex) {
L45|        return ApiResult.error(400, ex.getMessage());   // ❌ 未记录日志
L46|    }
```

- **P1** `G11.3` `library-backend/src/main/java/com/example/library/service/BubbleSortService.java:41` — List 元素未做 null 防御，含 null 元素时 NPE。
  片段范围：`BubbleSortService.java:37-48`

```java
L37|        for (int i = 0; i < n - 1; i++) {
L38|            boolean swapped = false;
L39|            for (int j = 0; j < n - 1 - i; j++) {
L40|                comparisons++;
L41|                if (arr.get(j) > arr.get(j + 1)) {   // ❌ arr.get(j) 可能为 null
L42|                    int temp = arr.get(j);
L43|                    arr.set(j, arr.get(j + 1));
L44|                    arr.set(j + 1, temp);
L45|                    swaps++;
L46|                    swapped = true;
L47|                }
L48|            }
```

- **P1** `G11.3` `library-backend/src/main/java/com/example/library/service/ExportService.java:59` — `data` 参数未校验 null。
  片段范围：`ExportService.java:38-41,59-63`

```java
L38|    public ExportResult export(String type, Map<String, Object> data, String format) {
L39|        if (type == null || type.isBlank()) {
L40|            throw new IllegalArgumentException("Type must not be blank");
L41|        }
     // ... type/format validation ...
L59|        try {
L60|            if ("json".equals(format)) {
L61|                String json = objectMapper.writeValueAsString(data);   // ❌ data 可能为 null
L62|                byte[] content = json.getBytes(StandardCharsets.UTF_8);
L63|                return new ExportResult(content, JSON_TYPE, filename);
```

### P2 问题

- **P2** `A3.4` `library-backend/src/main/java/com/example/library/service/ExportService.java:45` — 行宽超过 120 字符。
  片段范围：`ExportService.java:42-46`

```java
L42|        if (!type.equals("helloworld")
L43|                && !type.equals("hash")
L44|                && !type.equals("bubblesort")) {
L45|            throw new IllegalArgumentException("Invalid type: " + type + ". Must be one of: helloworld, hash, bubblesort");   // ❌ 约 130 字符
L46|        }
```

---

## 8. 修复任务列表

### P0

- [ ] **P0** `library-backend/src/main/java/com/example/library/dto/ExportRequest.java:14` — 为 `data` 字段添加 `@NotNull(message = "Data must not be null")` 校验注解，同时在 `ExportService.export()` 方法开头增加 `data == null` 防御性检查并抛出 `IllegalArgumentException("Data must not be empty")`（对应 design ALG_001）

### P1

- [ ] **P1** `library-backend/src/main/java/com/example/library/common/GlobalExceptionHandler.java:30` — `handleValidation` 方法增加 `log.warn("Validation failed: {}", message, ex)` 日志
- [ ] **P1** `library-backend/src/main/java/com/example/library/common/GlobalExceptionHandler.java:44` — `handleIllegalArgument` 方法增加 `log.warn("Illegal argument: {}", ex.getMessage(), ex)` 日志
- [ ] **P1** `library-backend/src/main/java/com/example/library/service/BubbleSortService.java:41` — 在 `sort()` 方法开头（line 24 之后）增加对 List 元素 null 的遍历校验：`for (Integer v : input) { if (v == null) throw new IllegalArgumentException("Array contains null element"); }`
- [ ] **P1** `library-backend/src/main/java/com/example/library/service/ExportService.java:59` — 在 `export()` 方法开头（line 41 之后）增加 `if (data == null) { throw new IllegalArgumentException("Data must not be empty"); }`

### P2（可选）

- [ ] **P2** `library-backend/src/main/java/com/example/library/service/ExportService.java:45` — 拆分超长行：将错误消息提取为变量或换行
- [ ] **P2** `library-frontend/src/components/ExportButton.tsx:17` — 增加 format 选择（json/csv），由用户选择导出格式
- [ ] **P2** `library-backend/src/main/java/com/example/library/service/HashService.java:32` — 将 `algorithm == null` 时自动填充为 "SHA-256" 而非抛异常
- [ ] **P2** `library-frontend/src/pages/AlgorithmDemoPage.tsx:90` — 将 `as Record<string, unknown>` 类型断言改为更安全的类型守卫
- [ ] **P2** `library-backend/src/main/resources/application.yml:11` — 生产环境将 `allowed-headers: "*"` 改为明确的白名单

---

*本报告由代码评审阶段生成，基于 dima.md v1.0 需求规格与 design.md 系分设计。*