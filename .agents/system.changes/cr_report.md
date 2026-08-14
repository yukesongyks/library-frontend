# 代码评审报告 (Code Review Report)

> **评审日期**：2025-08-14  
> **评审范围**：library-backend (Java/Spring Boot) + library-frontend (React/TypeScript/Vite)  
> **评审人**：DTCoder  
> **评审基准**：需求描述 — 三个接口（helloworld、哈希、冒泡排序）+ 前端三Tab页面 + 导出 + 埋点报表

---

## 一、评审概览

| 维度 | 结果 |
|------|------|
| Blocker | **3** |
| Major | **5** |
| Minor | **6** |
| 跨库契约一致性 | ⚠️ 存在路径不匹配问题 |
| 安全性 | ❌ SQL 注入风险 |
| 异常处理 | ❌ 校验异常未覆盖 |

---

## 二、Blocker 问题（必须修复）

### 🔴 B1 — SQL 注入漏洞：`ApiMetricsMapper.selectStatsByDimension`

- **文件**：`[library-backend] src/main/java/com/library/mapper/ApiMetricsMapper.java:15`
- **严重级别**：Blocker / Security
- **问题描述**：`${dimension}` 使用 MyBatis 字符串替换（非参数化绑定），直接将 `dimension` 拼入 SQL 的 `SELECT ${dimension} AS label` 和 `GROUP BY ${dimension}`。虽然 `MetricsService` 中使用白名单 `VALID_DIMENSIONS` 进行了校验，但 **Mapper 层自身缺乏防御**，若未来新增调用路径绕过 Service 校验，将直接导致 SQL 注入。
- **修复建议**：在 Mapper 中增加动态列名白名单校验，或改用 CASE WHEN 替代动态列名：

```java
// 方案A：在 Mapper 层增加白名单
private static final Set<String> ALLOWED_DIMENSIONS = Set.of("caller_type", "caller_level", "caller_dept");
if (!ALLOWED_DIMENSIONS.contains(dimension)) {
    throw new IllegalArgumentException("Invalid dimension: " + dimension);
}
```

---

### 🔴 B2 — `ConstraintViolationException` 未被全局异常处理器捕获

- **文件**：`[library-backend] src/main/java/com/library/common/GlobalExceptionHandler.java`
- **严重级别**：Blocker / Functional
- **问题描述**：`HelloWorldController` 类级别标注了 `@Validated`，方法参数 `@Size(max=200) String name` 校验失败时抛出的是 `ConstraintViolationException`（而非 `MethodArgumentNotValidException`）。但 `GlobalExceptionHandler` 仅处理了 `MethodArgumentNotValidException`，导致参数校验失败返回 **HTTP 500** 而非预期的 **HTTP 400**。
- **修复建议**：增加 `ConstraintViolationException` 处理器：

```java
@ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public Result<Void> handleConstraintViolation(ConstraintViolationException e) {
    String msg = e.getConstraintViolations().stream()
            .map(v -> v.getPropertyPath() + ": " + v.getMessage())
            .reduce((a, b) -> a + "; " + b).orElse("校验失败");
    return Result.fail(400, "参数错误: " + msg);
}
```

---

### 🔴 B3 — MetricsService 白名单路径与 MetricsAspect 生成路径不匹配

- **文件**：
  - `[library-backend] src/main/java/com/library/aspect/MetricsAspect.java:78-83`
  - `[library-backend] src/main/java/com/library/service/MetricsService.java:12-17`
- **严重级别**：Blocker / Functional
- **问题描述**：`MetricsAspect.extractApiPath()` 使用 Java **方法名** 拼接路径，而 `MetricsService.VALID_API_PATHS` 使用了**不同的命名**。具体差异：

| Controller | 方法名 | extractApiPath 生成 | VALID_API_PATHS 期望 |
|------------|--------|--------------------|--------------------|
| HashController | `hash()` | `/api/hash/hash` | `/api/hash/compute` ❌ |
| BubbleSortController | `bubbleSort()` | `/api/bubblesort/bubblesort` | `/api/bubblesort/sort` ❌ |

结果：前端按 `apiPath` 过滤时，**永远匹配不到** Hash 和 BubbleSort 的埋点数据。

- **修复建议**：统一两处路径生成逻辑。推荐方案：在 Controller 方法上使用 `@RequestMapping` 的实际路径，或统一使用 `@PostMapping` 的 value 作为路径片段。

---

## 三、Major 问题（建议优先修复）

### 🟠 M1 — MetricsAspect 自拦截导致数据污染

- **文件**：`[library-backend] src/main/java/com/library/aspect/MetricsAspect.java:32`
- **问题**：Pointcut `execution(* com.library.controller.*.*(..))` 匹配所有 Controller 方法，包括 `MetricsController.metrics()`。每次查询报表都会新增一条埋点记录，造成数据自我污染。
- **建议**：排除 MetricsController 和 ExportController：

```java
@Around("execution(* com.library.controller.*.*(..)) "
      + "&& !execution(* com.library.controller.MetricsController.*(..)) "
      + "&& !execution(* com.library.controller.ExportController.*(..))")
```

---

### 🟠 M2 — HashService 字符集未指定

- **文件**：`[library-backend] src/main/java/com/library/service/HashService.java:14`
- **问题**：`input.getBytes()` 使用平台默认字符集，不同 JVM/OS 可能产生不同哈希结果，破坏跨平台一致性。
- **建议**：改为 `input.getBytes(StandardCharsets.UTF_8)`。

---

### 🟠 M3 — CORS 配置过于宽松

- **文件**：`[library-backend] src/main/java/com/library/config/WebConfig.java:11-15`
- **问题**：`allowedOriginPatterns("*")` + `allowedMethods("*")` + `allowedHeaders("*")` 允许任意来源访问。虽然 `allowCredentials(false)` 降低了风险，但在生产环境中仍不安全。
- **建议**：生产环境应限定具体域名列表。

---

### 🟠 M4 — BubbleSortTab 导出数据格式不一致

- **文件**：`[library-frontend] src/pages/AlgorithmTools/BubbleSortTab.tsx:57-61`
- **问题**：BubbleSortTab 导出时将 `sorted` 和 `original` 数组通过 `JSON.stringify()` 转为字符串再发送，而 HelloWorldTab/HashTab 直接传递原始对象。后端 `ExportService.formatValue()` 中 `instanceof Object[]` 无法匹配 `int[]`，导致导出时数组显示为 `[I@xxx` 而非内容。
- **建议**：统一后端 `formatValue` 处理 `int[]`：

```java
if (value instanceof int[]) return Arrays.toString((int[]) value);
```

---

### 🟠 M5 — MetricsDashboard 折线图 Legend 数据源错误

- **文件**：`[library-frontend] src/pages/AlgorithmTools/MetricsDashboard.tsx:78`
- **问题**：折线图的 `legend.data` 取自 `data.breakdown.map(b => b.label)`（维度拆分数据），但折线图展示的是 `data.trend`（时间趋势数据），两者语义不匹配，legend 显示的是维度标签而非趋势含义。
- **建议**：折线图 legend 应使用 `['调用次数']` 或根据实际数据含义设置。

---

## 四、Minor 问题

### 🔵 m1 — ExportService.formatValue 不处理原始类型数组

- **文件**：`[library-backend] src/main/java/com/library/service/ExportService.java:54-58`
- **问题**：`instanceof Object[]` 仅匹配包装类型数组，`int[]`、`long[]` 等原始类型数组会走 `toString()` 分支，输出不可读。
- **建议**：增加 `int[]`、`long[]`、`double[]` 的判断分支。

### 🔵 m2 — HelloWorldTab 无客户端长度校验

- **文件**：`[library-frontend] src/pages/AlgorithmTools/HelloWorldTab.tsx`
- **问题**：`Input` 组件未设置 `maxLength={200}`，与后端 `@Size(max=200)` 不一致，用户体验差（提交后才知道超长）。
- **建议**：添加 `maxLength={200}` 属性。

### 🔵 m3 — 导出按钮无 loading 状态

- **文件**：`[library-frontend] src/pages/AlgorithmTools/HelloWorldTab.tsx`、`HashTab.tsx`、`BubbleSortTab.tsx`
- **问题**：导出操作无 loading 指示器，用户可能重复点击。
- **建议**：增加 `exporting` 状态控制按钮 `loading` 属性。

### 🔵 m4 — BubbleSortService 暴露内部数组引用

- **文件**：`[library-backend] src/main/java/com/library/service/BubbleSortService.java:32`
- **问题**：`record BubbleSortResult(int[] sorted, int steps)` 直接暴露内部数组引用，调用方可能修改。
- **建议**：使用 `Arrays.copyOf` 防御性拷贝，或改用 `List<Integer>`。

### 🔵 m5 — 无 flyway/migration 自动执行配置

- **文件**：`[library-backend] pom.xml`、`src/main/resources/db/migration/V1__create_api_metrics.sql`
- **问题**：已编写 Flyway 迁移脚本但 `pom.xml` 中未引入 `flyway-core` 依赖，迁移不会自动执行。
- **建议**：添加 `flyway-core` + `flyway-mysql` 依赖，或改用 MyBatis-Plus 自动建表。

### 🔵 m6 — `BubbleSortRequest` 中 `@NotNull` + 自定义 `validate()` 冗余校验

- **文件**：`[library-backend] src/main/java/com/library/dto/BubbleSortRequest.java:10-11,17-27`
- **问题**：`@NotNull` 和 `validate()` 方法中重复校验 `array` 非空及长度，逻辑冗余且可能产生不一致的错误信息。
- **建议**：统一使用一种校验方式（推荐 Jakarta Validation 注解），移除 `validate()` 中的冗余校验。

---

## 五、跨库契约对齐检查

| 检查项 | 前端 (TypeScript) | 后端 (Java) | 对齐状态 |
|--------|-------------------|-------------|----------|
| HelloWorld GET /api/helloworld | `{ name?: string }` → `HelloWorldResult` | `@RequestParam name` → `Result<Map>` | ✅ |
| Hash POST /api/hash | `{ input, algorithm? }` → `HashResult` | `@RequestBody HashRequest` → `Result<Map>` | ✅ |
| BubbleSort POST /api/bubblesort | `{ array, order? }` → `BubbleSortResult` | `@RequestBody BubbleSortRequest` → `Result<Map>` | ✅ |
| Export POST /api/export | `ExportParams` → Blob (responseType blob) | `@RequestBody ExportRequest` → `ResponseEntity<byte[]>` | ✅ |
| Metrics GET /api/metrics | `MetricsQueryParams` → `MetricsData` | `@RequestParam` → `Result<Map>` | ✅ |
| Result 解包 | `client.interceptors` 解包 `res.data.data` | `Result<T>` 包装 `{code, message, data}` | ✅ |
| 用户身份 Header | `X-User-Id/Name/Type/Level/Dept` | MetricsAspect 读取相同 Header | ✅ |
| apiPath 过滤 | 前端 `MetricsQueryParams.apiPath` 可选 | `MetricsService.validateApiPath` 白名单 | ❌ (B3) |

---

## 六、评审结论

- **Blocker 数量**：3
- **建议**：修复 3 个 Blocker 后方可进入集成测试阶段。Major 问题建议在测试阶段修复，Minor 问题可在后续迭代中处理。
- **重点关注**：B3（apiPath 不匹配）将导致报表按接口过滤功能完全失效，是最高优先级修复项。

---

*报告由 DTCoder 自动生成，基于代码评审标准。*