# 代码评审报告 (Code Review Report)

> **技能**: /code-review-skill  
> **审查范围**: `library-frontend` (React 18 + TypeScript + Vite + Ant Design 5 + ECharts) 与 `library-backend` (Spring Boot 3.2.5 / Java 17 + Spring Data JPA + H2 + AOP)  
> **需求**: 三算法接口(helloworld/hash/bubblesort) + 前端三Tab页面 + 导出按钮/接口 + 后端埋点(AOP) + 前端可视化报表(折线/饼/柱)  
> **审查日期**: 2026-08-07  
> **Blocker 数量**: 4  

---

## 一、通览 (Overview)

本次变更在两个仓库中完整实现了需求链条：

| 仓库 | 改动文件数 | 核心改动 |
|------|-----------|---------|
| library-backend | 17 文件 (+1731 行) | AlgoService 三算法、AlgoController 三接口、ExportController CSV 导出、CallLogAspect AOP 埋点、CallLogController 统计聚合、AppUser/CallLog 实体、CallLogRepository 维度统计 SQL |
| library-frontend | 9 源码文件 (+213 行, 剔除 node_modules) | AlgoPage 三 Tab、HelloWorldTab/HashTab/BubbleSortTab、CallReport ECharts 可视化、api/index.ts 封装、types 定义 |

**跨仓契约对齐**: 前端 `X-User-Id: U001` 请求头 ↔ 后端 `resolveCallerId()` 读取；前端 `AlgoResult{apiName,input,output,durationMs}` ↔ 后端 `record AlgoResult`；前端 `CallStats=Record<string,CallStatRow[]>` ↔ 后端 `Map<String,List<CallStatRow>>`；导出路由 `/api/export/{apiName}` 前后端一致。

---

## 二、审查发现 (Findings)

### 严重级别说明
- **Blocker (B)**: 必须修复，存在安全/数据正确性/生产可用性风险
- **Major (M)**: 强烈建议修复，影响健壮性或可维护性
- **Minor (m)**: 改进建议

---

### [library-backend] B1 — AOP 埋点吞没异常且不记录失败调用

**文件**: `[library-backend] src/main/java/com/library/aspect/CallLogAspect.java`  
**级别**: Blocker  
**行**: `} catch (Exception ignored) {}`

```java
@Around("execution(* com.library.controller..*.*(..))")
public Object logCall(ProceedingJoinPoint pjp) throws Throwable {
    Object result = pjp.proceed();   // ← 业务异常会直接抛出，埋点不执行
    try {
        // ... 保存 CallLog
    } catch (Exception ignored) {     // ← 埋点自身异常被静默吞没
    }
    return result;
}
```

**问题**:
1. `pjp.proceed()` 在 try 块之外——当业务方法抛异常时，**埋点逻辑完全不执行**，失败调用永远不会被记录。需求要求"获取调用次数和调用人"，失败调用也是调用，应被统计。
2. 内层 `catch (Exception ignored)` 静默吞没所有埋点异常（如 DB 连接失败），无任何日志，排障困难。
3. `resolveCallerId()` 在无 HTTP 上下文时硬编码返回 `"U001"`，生产环境下无法区分真实调用者。

**修复建议**:
- 将 `pjp.proceed()` 移入 try 内，或在 `finally` 中执行埋点（区分成功/失败状态）。
- 埋点 catch 块至少 `log.warn("埋点失败", e)`。
- 无用户标识时应返回 `"ANONYMOUS"` 而非伪造 `"U001"`。

---

### [library-backend] B2 — `parseInput` 未处理非法输入，`NumberFormatException` 直接抛 500

**文件**: `[library-backend] src/main/java/com/library/service/AlgoService.java`  
**级别**: Blocker  
**行**: `arr.add(Integer.parseInt(p.trim()));`

```java
private List<Integer> parseInput(String input) {
    String[] parts = input.split(",");
    List<Integer> arr = new ArrayList<>();
    for (String p : parts) {
        arr.add(Integer.parseInt(p.trim()));  // ← 非数字/空字符串直接抛 NumberFormatException
    }
    return arr;
}
```

**问题**: 用户输入 `5,,3` 或 `abc` 时抛 `NumberFormatException`，Spring 默认返回 500 Internal Server Error。前端 `BubbleSortTab` 的 Input 无任何输入校验，用户极易触发。

**修复建议**: 使用 try-catch 或 `NumberFormatException` 检查，返回 400 Bad Request + 友好错误消息，或过滤非法元素。

---

### [library-backend] B3 — CSV 导出存在注入风险且未转义

**文件**: `[library-backend] src/main/java/com/library/controller/ExportController.java`  
**级别**: Blocker  
**行**: `writer.println(r.apiName() + "," + r.input() + "," + r.output() + "," + r.durationMs());`

```java
case "helloworld" -> {
    AlgoResult r = algoService.helloworld();
    writer.println("apiName,input,output,durationMs");
    writer.println(r.apiName() + "," + r.input() + "," + r.output() + "," + r.durationMs());
}
case "hash" -> {
    AlgoResult r = algoService.hash(input);
    writer.println(r.apiName() + "," + r.input() + "," + r.output() + "," + r.durationMs());
    // ← hash 的 input 来自用户，可能含逗号/引号/换行/公式(=、+、-、@)
}
```

**问题**:
1. `hash` 分支的 `input` 来自用户请求参数，直接拼入 CSV **未加引号**，含逗号会破坏列结构。
2. `bubblesort` 分支虽加了引号但未转义内部引号（`""` 转义），且 `input` 是 `List<Integer>` 的 `toString()` 输出 `[5, 3, 8]`——方括号和空格不合规。
3. **CSV 公式注入**: 若用户 input 含 `=`、`+`、`-`、`@` 开头，Excel 打开时执行公式。
4. `apiName` 来自 `@PathVariable`，`Content-Disposition` 的 filename 直接拼接 `apiName + ".csv"`，含特殊字符可能导致响应头注入。

**修复建议**:
- 使用 Apache Commons CSV 或统一 `csvEscape()` 工具方法对所有字段转义。
- 对公式前缀字符前缀单引号 `'` 或制表符。
- `Content-Disposition` filename 使用 RFC 5987 `filename*=UTF-8''...` 编码。

---

### [library-backend] B4 — AOP 切入所有 Controller 导致统计接口自身也被埋点，且 ExportController 写流被埋点切面包裹

**文件**: `[library-backend] src/main/java/com/library/aspect/CallLogAspect.java`  
**级别**: Blocker  
**切点**: `@Around("execution(* com.library.controller..*.*(..))")`

**问题**:
1. 切点 `com.library.controller..*` 匹配所有 Controller 方法，包括 `CallLogController.stats()` 和 `ExportController.export()`。每次查看报表或导出都会被埋点，造成**统计自污染**——报表调用次数虚高。
2. `ExportController.export()` 直接写 `HttpServletResponse` 的 `PrintWriter`，AOP `pjp.proceed()` 返回 `null`（void 方法），切面在 `result` 上无问题，但埋点发生在 `response.getWriter()` 写完后，若埋点 save 抛异常被 catch，response 状态已不可逆。

**修复建议**:
- 切点限定到算法接口: `@Around("execution(* com.library.controller.AlgoController.*(..))")` 或用自定义注解 `@TrackCall`。
- 排除 `CallLogController` 和 `ExportController`。

---

### [library-backend] M1 — `sha256` 用 `RuntimeException` 包装受检异常，丢失上下文

**文件**: `[library-backend] src/main/java/com/library/service/AlgoService.java`  
**级别**: Major  
**行**: `} catch (Exception e) { throw new RuntimeException(e); }`

```java
private String sha256(String base) {
    try {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        // ...
    } catch (Exception e) {
        throw new RuntimeException(e);  // ← NoSuchAlgorithmException 实际不可能发生(SHA-256 是 JRE 标准)
    }
}
```

**问题**: `NoSuchAlgorithmException` 对 SHA-256 不会发生（JVM 规范保证），但用 `RuntimeException` 包装会丢失类型信息，调用方无法区分。  
**修复建议**: 捕获 `NoSuchAlgorithmException` 后包装为 `IllegalStateException`（表示"不应发生"），或用 `Lombok @SneakyThrows`。

---

### [library-backend] M2 — `CallLogController` 字段注入而非构造注入，且 `@Autowired` 可省略

**文件**: `[library-backend] src/main/java/com/library/controller/CallLogController.java`  
**级别**: Major  
**行**: `@Autowired private CallLogRepository callLogRepository;`

**问题**: 项目其他类（AlgoController、ExportController、CallLogAspect）均使用构造注入，唯独此类用字段注入，风格不一致且不利于测试。Spring 4.3+ 单构造器可省略 `@Autowired`。  
**修复建议**: 改为构造注入，删除 `@Autowired`。

---

### [library-backend] M3 — native SQL UNION ALL 缺少 NULL 值处理与维度硬编码

**文件**: `[library-backend] src/main/java/com/library/repository/CallLogRepository.java`  
**级别**: Major

```sql
SELECT 'userType' AS dimension, c.user_type AS value, COUNT(*) AS cnt
FROM call_log c GROUP BY c.user_type
UNION ALL
SELECT 'userLevel', c.user_level, COUNT(*)
FROM call_log c GROUP BY c.user_level
UNION ALL
SELECT 'department', c.department, COUNT(*)
FROM call_log c GROUP BY c.department
```

**问题**:
1. 若 `user_type` 等列为 NULL，`value` 为 NULL，前端 `CallStatRow.value` 为 null 会渲染异常。
2. 维度维度硬编码在 SQL 中，新增维度需改 SQL。
3. `CallLogController.stats()` 用 `grouped.get(row.dimension())` 但未防御 SQL 返回未预期 dimension 时的 NPE。

**修复建议**: SQL 中 `COALESCE(c.user_type, 'UNKNOWN')`，或 Controller 端 `grouped.computeIfAbsent`。

---

### [library-frontend] M4 — `CallReport` ECharts 实例未在组件卸载时销毁

**文件**: `[library-frontend] src/components/CallReport.tsx`  
**级别**: Major

```typescript
useEffect(() => {
    if (!chartRef.current || !stats) return
    if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
    }
    // ... setOption
}, [stats, dim, chartType])
```

**问题**: 缺少 cleanup effect 销毁 ECharts 实例。组件卸载时 `echarts.init` 创建的 DOM 监听器和 timer 不会被回收，造成内存泄漏。React 18 StrictMode 下双重挂载会创建两个实例。  
**修复建议**:
```typescript
useEffect(() => {
    return () => {
        chartInstance.current?.dispose()
        chartInstance.current = null
    }
}, [])
```

---

### [library-frontend] M5 — axios 拦截器硬编码 `X-User-Id: U001`，无真实用户认证

**文件**: `[library-frontend] src/api/index.ts`  
**级别**: Major

```typescript
client.interceptors.request.use((config) => {
    config.headers['X-User-Id'] = 'U001'  // ← 全部请求伪造为 U001
    return config
})
```

**问题**: 所有请求伪造为 `U001`，埋点维度（人员类型/层级/部门）将永远只显示张三/STUDENT/L1/研发部，报表无业务价值。需求要求"根据不同的维度：人员类型、人员层级、人员部门"展示，当前实现无法满足。  
**修复建议**: 接入真实登录态或提供用户切换 UI。

---

### [library-frontend] M6 — 前端 `AlgoResult.output` 类型与后端实际返回不匹配

**文件**: `[library-frontend] src/types/index.ts`  
**级别**: Major

```typescript
export interface AlgoResult {
    apiName: string
    input: number[] | string | null
    output: string | number[]   // ← bubblesort 返回 List<Integer>，JSON 数组，但类型是 number[]
    durationMs: number
}
```

**问题**: 后端 `bubblesort` 的 `output` 是 `List<Integer>` 序列化为 JSON 数组 `[1,2,3]`，前端类型 `number[]` 匹配；但 `hash` 的 `output` 是 64 位 hex 字符串，`helloworld` 是短字符串——`string` 覆盖。但前端渲染用 `String(result.output)`，对数组会输出 `"1,2,3"`（带逗号），而非 `[1,2,3]`。`BubbleSortTab` 显示 `输出：1,3,8,9` 不直观。  
**修复建议**: 数组输出用 `JSON.stringify` 或 `[...].join(', ')`。

---

### [library-frontend] m1 — `BubbleSortTab` 导出 URL 参数名 `sortInput` 与后端 `@RequestParam` 一致但与 `HashTab` 的 `input` 不一致

**文件**: `[library-frontend] src/components/BubbleSortTab.tsx`  
**级别**: Minor

```typescript
window.open(`${exportUrl('bubblesort')}?sortInput=${encodeURIComponent(input)}`, '_blank')
```

后端 `ExportController`: `@RequestParam(defaultValue = "5,3,8,1,9,2,7") String sortInput`。参数名一致，但与 `hash` 分支用 `input` 命名不统一，增加认知负担。  
**修复建议**: 后端统一参数名为 `input`，三个导出分支一致。

---

### [library-frontend] m2 — `CallReport` 组件挂载即拉取 stats，无刷新按钮和错误处理

**文件**: `[library-frontend] src/components/CallReport.tsx`  
**级别**: Minor

```typescript
useEffect(() => {
    fetchStats().then(setStats)
}, [])
```

**问题**: 无 catch 处理，接口失败时 `stats` 永远为 null，Spin 永转。无手动刷新入口。  
**修复建议**: `.catch(err => message.error('报表加载失败'))` + 添加"刷新"按钮。

---

### [library-frontend] m3 — `HelloWorldTab` 导出按钮 `disabled={!result}` 但导出不依赖当前 result

**文件**: `[library-frontend] src/components/HelloWorldTab.tsx`  
**级别**: Minor

导出接口 `/api/export/helloworld` 无需 input 参数，后端独立调用 `algoService.helloworld()`。但前端 `disabled={!result}` 要求先执行才能导出，逻辑不一致。  
**修复建议**: 导出按钮始终可用，或导出时复用已有 result。

---

## 三、跨仓对齐点检查 (Cross-Repo Alignment)

| 契约点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 算法路由 | `/api/algo/{helloworld,hash,bubblesort}` | `@RequestMapping("/api/algo")` + `@GetMapping` | ✅ 一致 |
| AlgoResult 字段 | `{apiName,input,output,durationMs}` | `record AlgoResult(String,Object,Object,long)` | ✅ 一致（但 `input` null 时前端 `String(null)`="null"） |
| 导出路由 | `/api/export/{apiName}` | `@GetMapping("/{apiName}")` | ✅ 一致 |
| 导出参数 | hash: `input`; bubblesort: `sortInput` | hash: `input`; bubblesort: `sortInput` | ✅ 一致 |
| 统计接口 | `GET /stats` → `CallStats` | `GET /api/stats` → `Map<String,List<CallStatRow>>` | ✅ 一致（vite proxy `/api` → `:8080`） |
| 用户标识 | `X-User-Id: U001` (硬编码) | `req.getHeader("X-User-Id")` → fallback `U001` | ⚠️ 双方都 fallback U001，报表维度单一 |
| CallStatRow | `{dimension,value,count}` | `record CallStatRow(String,String,long)` | ✅ 一致 |
| 维度枚举 | `'userType'|'userLevel'|'department'` | SQL 硬编码三个 dimension | ✅ 一致 |

---

## 四、汇总 (Summary)

### 变更清单

**[library-backend]** (17 文件):
- `AlgoService.java` — 三算法实现（helloworld/hash/bubblesort），SHA-256 + 冒泡排序
- `AlgoController.java` — 三个 REST 接口
- `ExportController.java` — CSV 导出（含公式注入风险 B3）
- `CallLogAspect.java` — AOP 埋点（异常吞没 B1 + 切点过宽 B4）
- `CallLogController.java` — 统计聚合（字段注入 M2）
- `CallLogRepository.java` — 维度统计 native SQL（NULL 处理 M3）
- `AppUser.java` / `CallLog.java` — JPA 实体
- `AlgoResult.java` / `CallStatRow.java` — record DTO
- `application.yml` — H2 文件库 + JPA ddl-auto:update
- `data.sql` — 5 条用户种子数据
- `AlgoApiTest.java` — 4 个集成测试
- `pom.xml` — Spring Boot 3.2.5 + web/jpa/aop/h2

**[library-frontend]** (9 源码文件):
- `AlgoPage.tsx` — 三 Tab + 报表布局
- `HelloWorldTab.tsx` / `HashTab.tsx` / `BubbleSortTab.tsx` — 执行 + 导出
- `CallReport.tsx` — ECharts 可视化（折线/饼/柱 + 三维度切换）
- `api/index.ts` — axios 封装（硬编码 X-User-Id M5）
- `types/index.ts` — TS 类型定义
- `App.tsx` / `main.tsx` — 入口
- `vite.config.ts` — 代理 `/api` → `:8080`
- `package.json` — antd5/axios/echarts5/react18

### Blocker 结论

**Blocker 数量: 4**

| ID | 仓库 | 问题 | 影响 |
|----|------|------|------|
| B1 | backend | AOP 埋点吞没异常 + 不记录失败调用 | 调用统计不完整 |
| B2 | backend | parseInput 非法输入 500 | 用户体验差 |
| B3 | backend | CSV 导出未转义 + 公式注入 | 安全风险 |
| B4 | backend | AOP 切点过宽含统计/导出接口 | 统计自污染 |

### 剩余风险

1. **认证缺失**: 前后端均无真实用户认证，报表维度单一，不满足需求"不同维度"展示。
2. **生产配置**: `ddl-auto: update` + H2 文件库不适合生产；`show-sql: true` 性能损耗。
3. **测试覆盖**: 后端仅集成测试算法接口，未覆盖导出、统计、AOP 边界场景。
4. **前端构建**: `tsc && vite build` 但无 ESLint/Prettier 配置，代码风格无保障。
5. **react/react-dom 版本**: package.json 声明 `^18.3.1` 但 node_modules 实际安装 React 19（见 `@types/react` canary）——版本漂移风险。

---

> 本报告基于静态审查，未执行编译/测试验证（遵循降级协议：审查阶段不触发构建）。
