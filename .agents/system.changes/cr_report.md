# 代码评审报告 (Code Review Report)

**评审日期**: 2026-01-24  
**评审范围**: library-backend (Java/Spring Boot) + library-frontend (React/TypeScript)  
**评审人**: DTCoder  
**评审基线**: 需求"三个接口（helloworld、哈希、冒泡排序）+ 导出 + 埋点可视化"

---

## 一、评审概要

| 维度 | 评级 | 说明 |
|------|------|------|
| 安全性 | 🔴 严重 | 存在 SQL 注入漏洞 |
| 功能完整性 | 🔴 严重 | 导出功能链路断裂，无法正常工作 |
| 代码质量 | 🟡 中 | 存在资源泄漏、类型滥用、死代码等问题 |
| 跨仓契约 | 🟡 中 | 导出接口前后端契约不一致 |
| 可维护性 | 🟢 良好 | 整体结构清晰，分层合理 |

**Blocker 数量**: 2  
**Major 数量**: 5  
**Minor 数量**: 6

---

## 二、Blocker 问题（必须修复）

### [B1] SQL 注入漏洞 — MetricsService 动态 SQL 拼接

- **仓库**: `[library-backend]`
- **文件**: `src/main/java/com/library/service/MetricsService.java` (L21-29)
- **严重级别**: 🔴 CRITICAL / Security

**问题描述**:
`MetricsService.query()` 方法将用户传入的 `startDate`、`endDate`、`apiPath` 参数通过字符串拼接直接嵌入 SQL WHERE 子句，并通过 MyBatis 的 `${whereCondition}`（字符串替换，非预编译参数）传入 Mapper：

```java
// MetricsService.java L21-29
if (startDate != null && !startDate.isEmpty()) {
    where.append(" AND call_time >= '").append(startDate).append(" 00:00:00'");
}
if (endDate != null && !endDate.isEmpty()) {
    where.append(" AND call_time <= '").append(endDate).append(" 23:59:59'");
}
if (apiPath != null && !apiPath.isEmpty()) {
    where.append(" AND api_path = '").append(apiPath).append("'");
}
```

Mapper 中使用 `${whereCondition}` 直接替换：
```java
// ApiMetricsMapper.java
@Select("SELECT COUNT(*) FROM api_metrics WHERE 1=1 ${whereCondition}")
Long selectTotalCount(@Param("whereCondition") String whereCondition);
```

**攻击向量**: 攻击者可通过 `apiPath` 参数传入 `' OR '1'='1` 或更复杂的注入 payload，从而绕过查询逻辑或窃取数据。

**修复建议**: 
1. 将所有动态条件改为 MyBatis 参数化查询（`#{}`），禁止使用 `${}` 拼接用户输入
2. 使用 MyBatis-Plus 的 `QueryWrapper` 或 LambdaQueryWrapper 构建条件
3. 对 `startDate`/`endDate` 使用正则校验日期格式，对 `apiPath` 做白名单校验

---

### [B2] 导出功能完全断裂 — Axios 拦截器与 Blob 响应冲突

- **仓库**: `[library-frontend]` + `[library-backend]`
- **文件**: 
  - `src/api/client.ts` (L17-25)
  - `src/api/export.ts` (L4-8)
  - `src/main/java/com/library/controller/ExportController.java`
- **严重级别**: 🔴 CRITICAL / Functional

**问题描述**:
前端 Axios 拦截器对所有响应统一执行 `res.data?.code !== 200` 校验并解包 `res.data.data`：

```typescript
// client.ts L17-22
client.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 200) {
      return Promise.reject(new Error(res.data?.message || '请求失败'));
    }
    return res.data.data;  // 解包 Result<T>.data
  },
);
```

但导出接口 `export.ts` 使用 `responseType: 'blob'`，此时 `res.data` 是 `Blob` 对象而非 JSON。`res.data?.code` 为 `undefined`，`undefined !== 200` 为 `true` → 必然触发 reject。

同时，后端 `ExportController` 返回 `ResponseEntity<byte[]>` 而非 `Result<byte[]>`，即使拦截器通过，也无法正确解包。

**影响**: 三个 Tab 页面的 CSV/Excel 导出功能 100% 失败。

**修复建议**:
1. **方案 A（推荐）**: 为导出接口创建独立的 axios 实例，不使用全局拦截器
2. **方案 B**: 在拦截器中判断 `responseType === 'blob'` 时跳过解包逻辑
3. **后端统一**: 将 `ExportController` 返回值也包装为 `Result<byte[]>` 保持一致

---

## 三、Major 问题（建议尽快修复）

### [M1] 线程池泄漏 — MetricsAspect 未关闭 ExecutorService

- **仓库**: `[library-backend]`
- **文件**: `src/main/java/com/library/aspect/MetricsAspect.java` (L24)
- **严重级别**: 🟠 Major

**问题**: `Executors.newFixedThreadPool(4)` 创建的线程池永不被关闭。Spring 容器销毁时，这些非守护线程会阻止 JVM 正常退出，多次热部署将导致线程累积。

**修复**: 添加 `@PreDestroy` 方法调用 `executor.shutdown()`，或使用 Spring 的 `ThreadPoolTaskExecutor`。

---

### [M2] CORS 配置无效 — credentials 与通配符互斥

- **仓库**: `[library-backend]`
- **文件**: `src/main/java/com/library/config/WebConfig.java` (L11-15)
- **严重级别**: 🟠 Major

**问题**: `allowedOriginPatterns("*")` + `allowCredentials(true)` 违反 CORS 规范。浏览器会拒绝此组合，导致跨域请求在携带 Cookie/Authorization 时失败。

**修复**: 指定具体允许的 Origin 列表，或使用 `allowedOriginPatterns` 配合具体域名模式。

---

### [M3] HashService 死代码 — algorithm.replace("-", "-") 无操作

- **仓库**: `[library-backend]`
- **文件**: `src/main/java/com/library/service/HashService.java` (L12)
- **严重级别**: 🟠 Major

**问题**: `String javaAlgo = algorithm.replace("-", "-");` 将 `-` 替换为 `-`，是一个无操作（no-op）。代码能工作仅因 Java `MessageDigest` 恰好接受带连字符的算法名。若将来需要支持 `SHA256` 等无连字符格式，此处逻辑将不正确。

**修复**: 明确注释或删除此行；如需做算法名规范化，显式实现映射逻辑。

---

### [M4] TypeScript 类型断言滥用 — as unknown as 绕过类型检查

- **仓库**: `[library-frontend]`
- **文件**: `src/pages/AlgorithmTools/HelloWorldTab.tsx` (L31, L62), `HashTab.tsx` (L43, L81), `BubbleSortTab.tsx` (L57, L98)
- **严重级别**: 🟠 Major

**问题**: 多处使用 `result as unknown as Record<string, unknown>` 将强类型结果强制转换为弱类型 Map，完全绕过 TypeScript 类型检查。例如 `HelloWorldResult` 是明确的 `{ message: string; timestamp: number }` 类型，不应被降级。

**修复**: 修改 `ResultDisplay` 组件接受泛型或具体类型，在各 Tab 中直接传递原始类型。

---

### [M5] MetricsDashboard 静默吞错

- **仓库**: `[library-frontend]`
- **文件**: `src/pages/AlgorithmTools/MetricsDashboard.tsx` (L38-40)
- **严重级别**: 🟠 Major

**问题**: `catch { /* silently fail for dashboard */ }` 完全静默所有错误。网络异常、后端返回 500、数据格式错误等场景下用户得不到任何反馈，图表显示空白。

**修复**: 至少添加 `console.error` 日志，建议显示错误提示或空状态占位。

---

## 四、Minor 问题（建议改进）

### [m1] HelloWorldController 缺少输入校验

- **仓库**: `[library-backend]`
- **文件**: `src/main/java/com/library/controller/HelloWorldController.java`
- **说明**: `name` 参数无长度限制，无 `@Valid` 注解，可传入超长字符串导致内存问题。

### [m2] GlobalExceptionHandler 过度捕获

- **仓库**: `[library-backend]`
- **文件**: `src/main/java/com/library/common/GlobalExceptionHandler.java` (L27-31)
- **说明**: `catch(Exception.class)` 返回固定 500 消息，隐藏了真实错误原因，不利于调试。建议记录异常堆栈日志。

### [m3] 硬编码测试用户身份

- **仓库**: `[library-frontend]`
- **文件**: `src/api/client.ts` (L9-13)
- **说明**: `X-User-Id: 'user-001'` 等 header 硬编码为测试值，生产环境需要对接真实认证系统。

### [m4] 缺少 React Error Boundary

- **仓库**: `[library-frontend]`
- **说明**: 应用无 `ErrorBoundary` 组件，任何未捕获的渲染异常都会导致整个页面白屏。

### [m5] 导出接口返回格式不一致

- **仓库**: `[library-backend]`
- **文件**: `src/main/java/com/library/controller/ExportController.java`
- **说明**: 其他 Controller 返回 `Result<T>`，`ExportController` 返回 `ResponseEntity<byte[]>`，破坏了 API 响应格式一致性。

### [m6] BubbleSortRequest 数组校验边界

- **仓库**: `[library-backend]`
- **文件**: `src/main/java/com/library/dto/BubbleSortRequest.java`
- **说明**: `@Size(min=2, max=1000)` 在 `int[]` 上的行为依赖 Jakarta Validation 实现，建议显式在 `validate()` 中做数组长度校验。

---

## 五、跨仓契约对齐检查

| 接口 | 前端调用 | 后端定义 | 对齐状态 |
|------|----------|----------|----------|
| `GET /api/helloworld` | `{ params: { name } }` | `@RequestParam name` | ✅ 一致 |
| `POST /api/hash` | `{ input, algorithm }` | `@RequestBody HashRequest` | ✅ 一致 |
| `POST /api/bubblesort` | `{ array, order }` | `@RequestBody BubbleSortRequest` | ✅ 一致 |
| `POST /api/export` | `{ type, data, format }` + `responseType: 'blob'` | `@RequestBody ExportRequest` → `ResponseEntity<byte[]>` | ❌ 拦截器冲突 (B2) |
| `GET /api/metrics` | `{ dimension, startDate, endDate, apiPath }` | `@RequestParam` 四个参数 | ✅ 一致 |

**结论**: 除导出接口因拦截器架构冲突导致断裂外，其余四个接口前后端契约一致。

---

## 六、修复优先级建议

| 优先级 | 问题编号 | 修复动作 | 预计工时 |
|--------|----------|----------|----------|
| P0 | B1 | 修复 SQL 注入：改用参数化查询 | 0.5h |
| P0 | B2 | 修复导出链路：独立 axios 实例 / 拦截器判断 | 0.5h |
| P1 | M1 | 添加线程池 shutdown 钩子 | 0.25h |
| P1 | M2 | 修复 CORS 配置 | 0.25h |
| P1 | M5 | 添加错误提示 | 0.25h |
| P2 | M3, M4, m1-m6 | 代码质量改进 | 2h |

---

> **评审结论**: 核心功能流程（helloworld/hash/bubblesort 执行 + 埋点收集 + 可视化报表）设计合理，代码结构清晰。但存在 **2 个 Blocker**（SQL 注入安全漏洞 + 导出功能完全不可用），必须在合并前修复。其余 Major/Minor 问题建议在后续迭代中处理。