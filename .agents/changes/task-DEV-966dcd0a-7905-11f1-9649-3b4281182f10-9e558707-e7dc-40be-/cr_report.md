# 代码评审报告 (Code Review Report)

> **评审阶段**: review（对问题修复后的代码进行评审）  
> **评审日期**: 2026-08-07  
> **评审技能**: /code-review-skill  
> **评审范围**: library-frontend + library-backend 全部 review 阶段修复文件  
> **blocker_count**: 0

---

## 一、评审概览

本次评审针对 review 阶段"问题修复"后前后端全部源文件，验证上一轮发现的 4 个 blocker（B1-B4）是否已正确修复，并检查是否引入新问题。

### 评审文件清单

**library-frontend (7 文件)**:
- `src/api/index.ts`
- `src/types/index.ts`
- `src/components/HelloWorldTab.tsx`
- `src/components/HashTab.tsx`
- `src/components/BubbleSortTab.tsx`
- `src/components/CallReport.tsx`
- `src/App.tsx`（关联读取）

**library-backend (10 文件)**:
- `src/main/java/com/library/controller/AlgoController.java`
- `src/main/java/com/library/controller/CallLogController.java`
- `src/main/java/com/library/controller/ExportController.java`
- `src/main/java/com/library/service/AlgoService.java`
- `src/main/java/com/library/aspect/CallLogAspect.java`
- `src/main/java/com/library/entity/CallLog.java`
- `src/main/java/com/library/entity/AppUser.java`
- `src/main/java/com/library/repository/CallLogRepository.java`
- `src/main/java/com/library/repository/AppUserRepository.java`
- `src/main/java/com/library/dto/AlgoResult.java` / `CallStatRow.java`

---

## 二、上一轮 Blocker 修复验证

### B1: 埋点异常处理 / NoSuchAlgorithmException / ANONYMOUS 用户标识 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-backend] `AlgoService.java` | `NoSuchAlgorithmException` 改为抛 `IllegalStateException`（语义为"不应发生"） | ✅ 正确。SHA-256 是 JRE 标准算法，用 IllegalStateException 表达不可恢复的环境异常，优于泛化 RuntimeException |
| [library-backend] `CallLogAspect.java` | `resolveCallerId()` 无 `X-User-Id` 时返回 `"ANONYMOUS"` 而非伪造 `U001` | ✅ 正确。不再硬编码用户身份 |
| [library-backend] `CallLogAspect.java` | `finally` 块中执行埋点，区分 `success`/`error` 状态；埋点自身异常用 `log.warn` 记录 | ✅ 正确。业务异常后仍记录埋点，不再静默吞没 |

### B2: 非法输入处理 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-backend] `AlgoService.java` | `parseInput()` 对空输入抛 `IllegalArgumentException`；非法数字抛 `IllegalArgumentException`；过滤空字符串元素；空数组抛异常 | ✅ 正确。Spring 自动将 IllegalArgumentException 映射为 400 响应，前端能收到错误 |

### B3: 导出接口安全 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-backend] `ExportController.java` | apiName 白名单校验（`List.of("helloworld","hash","bubblesort")`） | ✅ 正确。防止路径遍历/响应头注入 |
| [library-backend] `ExportController.java` | `Content-Disposition` filename 使用 RFC 5987 编码（`URLEncoder.encode` + `+`→`%20`） | ✅ 正确。防止非 ASCII 文件名注入 |
| [library-backend] `ExportController.java` | `csvEscape()` 统一 CSV 转义：公式前缀(`=,+,-,@,TAB,CR`)前加单引号；含逗号/引号/换行时双引号包裹并内部引号双写 | ✅ 正确。防止 CSV 公式注入和字段分隔错误 |

### B4: AOP 切入范围 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-backend] `CallLogAspect.java` | `@Around("execution(* com.library.controller.AlgoController.*(..))")` 仅切入 AlgoController | ✅ 正确。避免统计接口(`/api/stats`)和导出接口(`/api/export`)被埋点自污染 |

---

## 三、逐文件功能核对

### library-backend

#### `AlgoController.java` — ✅ 通过
- 三个算法接口 `helloworld`/`hash`/`bubblesort` 均为 GET，路径 `/api/algo/*` ✓
- 构造注入 AlgoService ✓
- `@RequestParam(defaultValue = ...)` 提供默认值 ✓
- 无多余业务逻辑，纯转发 ✓

#### `AlgoService.java` — ✅ 通过（含建议）
- `helloworld()`: 返回 "Hello, World!"，计时 ✓
- `hash()`: SHA-256 摘要 + 十六进制输出 ✓
- `bubblesort()`: `parseInput` → `bubbleSort`（复制原数组排序）✓
- `sha256()`: NoSuchAlgorithmException → IllegalStateException ✓ (B1)
- `parseInput()`: 空输入/非法数字/空数组 → IllegalArgumentException ✓ (B2)

> **建议 P3-1**: `sha256()` 中 `base.getBytes()` 未指定字符集，使用 JVM 默认字符集。不同服务器默认字符集可能不同（UTF-8 vs GBK），导致非 ASCII 输入的哈希结果跨环境不一致。建议改为 `base.getBytes(StandardCharsets.UTF_8)`。当前不影响 ASCII 输入的功能正确性。

#### `CallLogAspect.java` — ✅ 通过（含建议）
- `@Around` 仅切入 AlgoController ✓ (B4)
- `finally` 块埋点，区分 success/error ✓ (B1)
- `resolveCallerId()` 从 `X-User-Id` header 读取，无则 ANONYMOUS ✓ (B1)
- 埋点异常 `log.warn` 记录 ✓
- 用户信息缺失时填充 "匿名"/"UNKNOWN" ✓

> **建议 P3-2**: `pjp.getSignature().toShortString()` 返回方法签名格式（如 `AlgoController.helloworld()`），而非简单 apiName 字符串。当前 `findAllByDimensions` 不按 `api_name` 分组，不影响报表。但后续若按接口维度统计，`api_name` 列数据格式不统一会产生问题。建议改为提取方法名或显式映射。

> **建议 P3-3**: 埋点 `callLogRepository.save()` 为同步 DB 写入，每次算法调用都会触发。高并发场景下可能成为性能瓶颈。当前演示场景无影响；生产环境建议改为异步队列写入。

#### `ExportController.java` — ✅ 通过
- apiName 白名单校验 ✓ (B3)
- Content-Disposition RFC 5987 编码 ✓ (B3)
- CSV 转义（公式注入防护 + 特殊字符包裹）✓ (B3)
- switch 分支覆盖三个算法 ✓
- default 分支返回 404 ✓

> **建议 P3-4**: `csvRow()` 中 `durationMs` 是 long 类型直接拼接（`+ durationMs`），未走 `csvEscape()`。数字不会有注入风险，但为一致性建议统一调用。

#### `CallLogController.java` — ✅ 通过
- 构造注入 ✓ (M2)
- `findAllByDimensions()` 返回结果按 dimension 分组，预初始化三个 key ✓ (M3)
- NULL 值防御 `r[1] != null ? (String) r[1] : "UNKNOWN"` ✓ (M3)
- `computeIfAbsent` 防御未预期 dimension ✓ (M3)

#### `CallLogRepository.java` — ✅ 通过
- native query UNION ALL 三维度 ✓
- `COALESCE(c.user_type, 'UNKNOWN')` 处理 NULL ✓
- `COUNT(*)` 按维度分组 ✓

#### `CallLog.java` / `AppUser.java` — ✅ 通过
- JPA 实体定义，字段完整，getter/setter 规范 ✓

> **建议 P3-5**: `CallLog.success` 使用 `Boolean`（包装类）而非 `boolean`。CallLogAspect 中 `success` 初始为 `true` 不会为 null，但数据库列允许 NULL。若其他写入路径产生 null，前端/查询可能出现 NPE。建议改用原生 `boolean` 或在查询时防御。

#### `AlgoResult.java` / `CallStatRow.java` — ✅ 通过
- record 定义简洁 ✓
- 字段与前端类型对齐 ✓

---

### library-frontend

#### `src/api/index.ts` — ✅ 通过
- axios 实例 + 请求拦截器设置 `X-User-Id` header ✓
- `getUserId()`/`setUserId()` 从 localStorage 读写 ✓ (M5)
- 五个 API 函数覆盖算法调用/统计/导出 ✓
- `exportUrl()` 返回导出 URL ✓

> **建议 P3-6**: `getUserId()` 默认返回 `'U001'`（localStorage 无值时）。前端拦截器始终设置 X-User-Id 至少为 U001，后端 `ANONYMOUS` 分支实际不会触发。当前演示场景无影响，但匿名调用场景被前端屏蔽。

> **建议 P3-7**: `exportUrl(apiName)` 未对 apiName 做 URL 编码。当前 apiName 来自硬编码字符串（'helloworld'/'hash'/'bubblesort'），无特殊字符，但缺少防御。

#### `src/types/index.ts` — ✅ 通过
- `AlgoResult` 接口与后端 record 对齐 ✓
- `formatOutput()` 统一格式化（数组 join，其他 String）✓ (M6)
- `CallStatRow` / `CallStats` 与后端契约对齐 ✓

#### `src/components/HelloWorldTab.tsx` — ✅ 通过
- 执行按钮调用 `callHello()` ✓
- 导出按钮不依赖 result，始终可用 ✓ (m3)
- loading 状态管理 ✓
- catch 块无 error 参数（符合 eslint）✓

#### `src/components/HashTab.tsx` — ✅ 通过（含建议）
- 输入框 + 执行 + 导出 ✓
- 导出 URL 拼接 input 参数并 `encodeURIComponent` ✓

> **建议 P3-8**: 导出按钮 `disabled={!result}`，而 HelloWorldTab 导出始终可用。UX 一致性问题。HashTab 导出时使用当前 input 值，不需要先执行，`disabled` 限制不必要。

#### `src/components/BubbleSortTab.tsx` — ✅ 通过（含建议）
- 参数名统一为 `input` ✓ (m1)
- 导出 URL 拼接 input 参数 ✓

> **建议 P3-8（同上）**: 导出按钮 `disabled={!result}` 与 HelloWorldTab 不一致。

#### `src/components/CallReport.tsx` — ✅ 通过（含建议）
- ECharts 实例管理：创建 + 卸载时 `dispose()` ✓ (M4)
- 用户切换 Select（5 个选项）✓ (M5)
- 维度切换 Segmented（userType/userLevel/department）✓
- 图表类型切换 Segmented（line/pie/bar）✓
- 加载错误处理 `message.error` ✓ (m2)
- 图表 option 按 chartType 分支构建 ✓

> **建议 P3-9**: `Select value={getUserId()}` 在每次渲染时调用 `getUserId()`，非 React 响应式模式。切换用户后 `loadStats()` 触发重渲染使 value 更新，功能正确但模式不惯用。建议用 useState 管理 userId。

> **建议 P3-10**: 无 window resize 监听，窗口大小变化时 ECharts 图表不自适应。建议添加 `ResizeObserver` 或 `window.addEventListener('resize', () => chartInstance.current?.resize())`。

#### `src/App.tsx` — ✅ 通过
- ConfigProvider + zhCN 中文 locale ✓
- 渲染 AlgoPage ✓

---

## 四、跨仓对齐点检查

| 契约项 | 后端 | 前端 | 对齐结论 |
|--------|------|------|----------|
| 算法接口路径 | `@RequestMapping("/api/algo")` + `/helloworld` `/hash` `/bubblesort` | `client.get('/algo/helloworld')` 等 | ✅ 对齐 |
| 统计接口路径 | `@RequestMapping("/api/stats")` + `@GetMapping` | `client.get('/stats')` | ✅ 对齐 |
| 导出接口路径 | `@RequestMapping("/api/export")` + `@GetMapping("/{apiName}")` | `exportUrl()` → `/api/export/${apiName}` | ✅ 对齐 |
| AlgoResult 契约 | `record(String apiName, Object input, Object output, long durationMs)` | `interface { apiName, input: number[]|string|null, output: string|number[], durationMs: number }` | ✅ 对齐（input 为 Object，实际 null/String/List） |
| CallStats 契约 | `Map<String, List<CallStatRow>>` (key: userType/userLevel/department) | `CallStats = Record<string, CallStatRow[]>` + `CallStatRow { dimension, value, count }` | ✅ 对齐 |
| 用户标识传递 | `CallLogAspect` 读取 `X-User-Id` header | axios 拦截器设置 `X-User-Id` header | ✅ 对齐 |
| 导出 input 参数 | `@RequestParam(defaultValue = "hello") String input` | `?input=${encodeURIComponent(input)}` | ✅ 对齐 |
| 维度枚举 | SQL: `'userType'`/`'userLevel'`/`'department'` | TS: `'userType' | 'userLevel' | 'department'` | ✅ 对齐 |

---

## 五、问题汇总

### Blocker 级别（阻断发布）— 0 项

无。上一轮 4 个 blocker（B1-B4）已全部正确修复，未发现新的 blocker 级别问题。

### 问题级别（建议修复，不阻断）— 10 项

| 编号 | 级别 | 仓库 | 文件 | 描述 |
|------|------|------|------|------|
| P3-1 | 建议 | library-backend | `AlgoService.java` | `sha256()` 中 `base.getBytes()` 未指定字符集，建议用 `StandardCharsets.UTF_8` |
| P3-2 | 建议 | library-backend | `CallLogAspect.java` | `apiName` 存储方法签名格式而非简单名称，后续按接口统计可能不规范 |
| P3-3 | 建议 | library-backend | `CallLogAspect.java` | 埋点同步写入 DB，高并发场景可能成为瓶颈，建议异步化 |
| P3-4 | 建议 | library-backend | `ExportController.java` | `durationMs` 未走 `csvEscape()`，建议统一调用 |
| P3-5 | 建议 | library-backend | `CallLog.java` | `success` 用 `Boolean` 包装类，建议改用原生 `boolean` 或查询时防御 |
| P3-6 | 建议 | library-frontend | `api/index.ts` | `getUserId()` 默认 U001，匿名调用场景被前端屏蔽 |
| P3-7 | 建议 | library-frontend | `api/index.ts` | `exportUrl()` 未对 apiName 做 URL 编码（当前硬编码无风险） |
| P3-8 | 建议 | library-frontend | `HashTab.tsx` / `BubbleSortTab.tsx` | 导出按钮 `disabled={!result}` 与 HelloWorldTab 不一致 |
| P3-9 | 建议 | library-frontend | `CallReport.tsx` | `Select value={getUserId()}` 非响应式模式，建议用 useState |
| P3-10 | 建议 | library-frontend | `CallReport.tsx` | 无 window resize 监听，图表不自适应窗口大小 |

---

## 六、可靠性检查

### 异常处理
- [library-backend] AlgoService: 所有异常路径（空输入、非法数字、算法不可用）均抛出语义化异常 ✓
- [library-backend] CallLogAspect: 埋点异常不影响主流程，`log.warn` 记录 ✓
- [library-backend] ExportController: 白名单校验 + default 分支 404 ✓
- [library-frontend] 各 Tab 组件: try-catch + `message.error` ✓
- [library-frontend] CallReport: `fetchStats().catch()` 错误处理 ✓

### 空值/边界防御
- [library-backend] CallLogController: NULL 值防御 + computeIfAbsent ✓ (M3)
- [library-backend] CallLogRepository: COALESCE 处理 SQL NULL ✓
- [library-backend] CallLogAspect: 用户不存在时填充 "匿名"/"UNKNOWN" ✓
- [library-frontend] formatOutput: null/undefined 返回空字符串 ✓ (M6)
- [library-frontend] CallReport: `stats[dim] || []` 空数组防御 ✓

### 资源管理
- [library-frontend] CallReport: ECharts 实例卸载时 dispose ✓ (M4)
- [library-backend] AlgoService: bubbleSort 复制原数组，不修改输入 ✓

---

## 七、可读性检查

- [library-backend] 代码结构清晰，Controller-Service-Repository 分层规范 ✓
- [library-backend] 注释标注修复编号（B1/B2/B3/B4/M2/M3）便于追溯 ✓
- [library-frontend] 组件职责单一，每个 Tab 独立 ✓
- [library-frontend] 常量提取（DIM_LABELS/CHART_LABELS/USER_OPTIONS）✓
- [library-frontend] formatOutput 统一输出格式化 ✓ (M6)

---

## 八、安全性检查

- [library-backend] ExportController: CSV 公式注入防护 ✓ (B3)
- [library-backend] ExportController: 响应头注入防护（RFC 5987）✓ (B3)
- [library-backend] ExportController: apiName 白名单防路径遍历 ✓ (B3)
- [library-backend] CallLogAspect: 用户身份从 header 读取，不伪造 ✓ (B1)
- [library-frontend] 导出 URL 参数 `encodeURIComponent` 编码 ✓

---

## 九、评审结论

**通过 ✅**

上一轮代码评审发现的 4 个 blocker（B1-B4）已在 review 阶段"问题修复"中全部正确修复：

| Blocker | 修复状态 | 验证结论 |
|---------|----------|----------|
| B1 埋点异常/用户标识 | ✅ 已修复 | CallLogAspect finally 埋点 + ANONYMOUS + log.warn；AlgoService IllegalStateException |
| B2 非法输入处理 | ✅ 已修复 | AlgoService parseInput 抛 IllegalArgumentException |
| B3 导出接口安全 | ✅ 已修复 | ExportController 白名单 + RFC 5987 + CSV 转义 |
| B4 AOP 切入范围 | ✅ 已修复 | CallLogAspect 仅切入 AlgoController |

跨仓接口契约全部对齐（API 路径、AlgoResult、CallStats、X-User-Id、维度枚举）。

剩余 10 项均为 P3 建议级别（不阻断发布），涉及字符集显式化、数据格式规范、UX 一致性、响应式模式改进等，可在后续迭代中优化。

**blocker_count: 0**

---

> 本报告基于静态审查，未执行编译/测试验证（遵循降级协议：审查阶段不触发构建）。
