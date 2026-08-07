# 代码评审报告 (Code Review Report)

> **评审阶段**: review（第二轮问题修复后的最终评审）
> **评审日期**: 2026-08-07
> **评审技能**: /code-review-skill
> **评审范围**: library-frontend + library-backend 第二轮修复文件
> **blocker_count**: 0

---

## 一、评审概览

本次评审针对 review 阶段第二轮"问题修复"后的 7 个源文件，验证上一轮评审提出的 10 项 P3 建议中哪些已修复、哪些仍保留，并检查是否引入新问题。

### 评审文件清单

**library-frontend (4 文件)**:
- `src/api/index.ts`
- `src/components/CallReport.tsx`
- `src/components/HashTab.tsx`
- `src/components/BubbleSortTab.tsx`

**library-backend (3 文件)**:
- `src/main/java/com/library/service/AlgoService.java`
- `src/main/java/com/library/aspect/CallLogAspect.java`
- `src/main/java/com/library/controller/ExportController.java`

---

## 二、P3 建议修复验证

### P3-1: sha256() 字符集显式化 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-backend] `AlgoService.java` L43 | `base.getBytes(StandardCharsets.UTF_8)` 替代 `base.getBytes()` | ✅ 正确。显式指定 UTF-8 字符集，保证非 ASCII 输入跨环境哈希结果一致。`import java.nio.charset.StandardCharsets` 已添加（L5） |

### P3-2: apiName 格式规范 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-backend] `CallLogAspect.java` L51 | `pjp.getSignature().getName()` 替代 `toShortString()` | ✅ 正确。`getName()` 返回简单方法名（如 `"helloworld"`），而非签名格式（`"AlgoController.helloworld()"`）。后续按接口维度统计时 `api_name` 列数据格式统一 |

### P3-3: 埋点同步写入 DB — ⏸ 保留（可接受）

| 文件 | 状态 | 说明 |
|------|------|------|
| [library-backend] `CallLogAspect.java` L65 | 仍为 `callLogRepository.save(logEntry)` 同步写入 | 演示场景无并发压力，保留不影响功能。生产环境建议异步化，属后续迭代优化项 |

### P3-4: durationMs 统一 csvEscape — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-backend] `ExportController.java` | `csvRow()` 中 `durationMs` 改为 `csvEscape(durationMs)` | ✅ 正确。所有字段统一走 csvEscape，一致性改善。注释标注"P3-4: 统一调用 csvEscape 保持一致性" |

### P3-5: CallLog.success 包装类 — ⏸ 保留（可接受）

| 文件 | 状态 | 说明 |
|------|------|------|
| [library-backend] `CallLog.java` | 未在第二轮修复文件列表中，`success` 仍为 `Boolean` | CallLogAspect 中 `success` 为原生 `boolean`（L39），不会产生 null。实体层未改动可接受，属后续迭代优化项 |

### P3-6: getUserId() 默认 U001 — ⏸ 保留（可接受）

| 文件 | 状态 | 说明 |
|------|------|------|
| [library-frontend] `api/index.ts` L7 | 仍为 `localStorage.getItem(USER_KEY) || 'U001'` | 演示场景需要默认用户便于测试，保留不影响功能。匿名调用场景被前端屏蔽属设计取舍 |

### P3-7: exportUrl() URL 编码 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-frontend] `api/index.ts` L41 | `encodeURIComponent(apiName)` 编码防御 | ✅ 正确。注释标注"P3-7: 对 apiName 做 URL 编码防御，当前硬编码无风险但增强健壮性" |

### P3-8: 导出按钮 disabled 一致性 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-frontend] `HashTab.tsx` L35 | 导出按钮移除 `disabled={!result}`，改为 `<Button onClick={doExport}>导出 CSV</Button>` | ✅ 正确。与 HelloWorldTab 导出始终可用保持一致 |
| [library-frontend] `BubbleSortTab.tsx` L36 | 同上，导出按钮移除 `disabled` | ✅ 正确。三个 Tab 导出按钮 UX 一致 |

### P3-9: CallReport Select 响应式模式 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-frontend] `CallReport.tsx` L34 | `const [userId, setUserIdState] = useState<string>(getUserId())` | ✅ 正确。用 useState 管理 userId，符合 React 响应式模式 |
| [library-frontend] `CallReport.tsx` L107-108 | `value={userId}` + `onChange` 中 `setUserIdState(v)` | ✅ 正确。Select value 绑定 state，切换用户后 UI 响应式更新 |

### P3-10: ECharts resize 自适应 — ✅ 已修复

| 文件 | 修复点 | 验证结论 |
|------|--------|----------|
| [library-frontend] `CallReport.tsx` L53-61 | `window.addEventListener('resize', handleResize)` + cleanup 时 `removeEventListener` | ✅ 正确。窗口大小变化时 ECharts 图表自适应。卸载时同时移除监听 + dispose 实例，无内存泄漏 |

### P3 修复汇总

| 编号 | 状态 | 说明 |
|------|------|------|
| P3-1 | ✅ 已修复 | sha256 显式 UTF-8 字符集 |
| P3-2 | ✅ 已修复 | apiName 使用 getName() |
| P3-3 | ⏸ 保留 | 同步 DB 写入，演示场景可接受 |
| P3-4 | ✅ 已修复 | durationMs 统一 csvEscape |
| P3-5 | ⏸ 保留 | CallLog.success 包装类，实体未改 |
| P3-6 | ⏸ 保留 | 默认 U001，演示场景设计取舍 |
| P3-7 | ✅ 已修复 | exportUrl URL 编码防御 |
| P3-8 | ✅ 已修复 | 导出按钮 disabled 一致性 |
| P3-9 | ✅ 已修复 | useState 管理 userId |
| P3-10 | ✅ 已修复 | resize 自适应监听 |

**修复率: 7/10 (70%)，保留 3 项均为可接受的演示场景取舍**

---

## 三、逐文件功能核对

### library-backend

#### `AlgoService.java` — ✅ 通过
- `helloworld()`: 返回 "Hello, World!"，计时 ✓
- `hash()`: SHA-256 摘要 + 十六进制输出，显式 UTF-8 字符集 ✓ (P3-1)
- `bubblesort()`: `parseInput` → `bubbleSort`（复制原数组排序）✓
- `sha256()`: NoSuchAlgorithmException → IllegalStateException ✓ (B1 保留)
- `parseInput()`: 空输入/非法数字/空数组 → IllegalArgumentException ✓ (B2 保留)
- `import java.nio.charset.StandardCharsets` 已添加 ✓

#### `CallLogAspect.java` — ✅ 通过
- `@Around` 仅切入 AlgoController ✓ (B4 保留)
- `finally` 块埋点，区分 success/error ✓ (B1 保留)
- `resolveCallerId()` 从 `X-User-Id` header 读取，无则 ANONYMOUS ✓ (B1 保留)
- `pjp.getSignature().getName()` 返回简单方法名 ✓ (P3-2)
- 埋点异常 `log.warn` 记录 ✓
- 用户信息缺失时填充 "匿名"/"UNKNOWN" ✓

#### `ExportController.java` — ✅ 通过
- apiName 白名单校验 ✓ (B3 保留)
- Content-Disposition RFC 5987 编码 ✓ (B3 保留)
- CSV 转义（公式注入防护 + 特殊字符包裹）✓ (B3 保留)
- `csvRow()` 所有字段统一走 `csvEscape()` ✓ (P3-4)
- switch 分支覆盖三个算法 ✓
- default 分支返回 404 ✓

### library-frontend

#### `src/api/index.ts` — ✅ 通过
- axios 实例 + 请求拦截器设置 `X-User-Id` header ✓
- `getUserId()`/`setUserId()` 从 localStorage 读写 ✓
- 五个 API 函数覆盖算法调用/统计/导出 ✓
- `exportUrl()` 返回导出 URL，`encodeURIComponent` 编码 ✓ (P3-7)

#### `src/components/CallReport.tsx` — ✅ 通过
- ECharts 实例管理：创建 + 卸载时 `dispose()` ✓
- `useState<string>(getUserId())` 管理 userId ✓ (P3-9)
- Select `value={userId}` 绑定 state，onChange 中 `setUserIdState(v)` ✓ (P3-9)
- `window.addEventListener('resize', handleResize)` + cleanup ✓ (P3-10)
- 维度切换 Segmented（userType/userLevel/department）✓
- 图表类型切换 Segmented（line/pie/bar）✓
- 加载错误处理 `message.error` ✓
- 图表 option 按 chartType 分支构建 ✓

#### `src/components/HashTab.tsx` — ✅ 通过
- 输入框 + 执行 + 导出 ✓
- 导出 URL 拼接 input 参数并 `encodeURIComponent` ✓
- 导出按钮无 `disabled`，始终可用 ✓ (P3-8)

#### `src/components/BubbleSortTab.tsx` — ✅ 通过
- 参数名统一为 `input` ✓
- 导出 URL 拼接 input 参数 ✓
- 导出按钮无 `disabled`，始终可用 ✓ (P3-8)

---

## 四、跨仓对齐点检查

| 契约项 | 后端 | 前端 | 对齐结论 |
|--------|------|------|----------|
| 算法接口路径 | `/api/algo/helloworld` `/hash` `/bubblesort` | `client.get('/algo/helloworld')` 等 | ✅ 对齐 |
| 统计接口路径 | `/api/stats` | `client.get('/stats')` | ✅ 对齐 |
| 导出接口路径 | `/api/export/{apiName}` | `exportUrl()` → `/api/export/${encodeURIComponent(apiName)}` | ✅ 对齐 |
| AlgoResult 契约 | `record(String apiName, Object input, Object output, long durationMs)` | `interface { apiName, input, output, durationMs }` | ✅ 对齐 |
| CallStats 契约 | `Map<String, List<CallStatRow>>` | `CallStats = Record<string, CallStatRow[]>` | ✅ 对齐 |
| 用户标识传递 | `X-User-Id` header | axios 拦截器设置 `X-User-Id` | ✅ 对齐 |
| apiName 格式 | `getName()` → `"helloworld"` 等 | 前端不依赖 apiName 字段格式 | ✅ 对齐 |
| durationMs CSV | `csvEscape(durationMs)` | 前端不涉及 | ✅ 无冲突 |

---

## 五、问题汇总

### Blocker 级别（阻断发布）— 0 项

无。第二轮修复未引入任何新的 blocker 级别问题。

### 保留项（不阻断发布）— 3 项

| 编号 | 级别 | 仓库 | 文件 | 描述 | 保留理由 |
|------|------|------|------|------|----------|
| P3-3 | 建议 | library-backend | `CallLogAspect.java` | 埋点同步写入 DB | 演示场景无并发压力，属生产环境优化项 |
| P3-5 | 建议 | library-backend | `CallLog.java` | `success` 用 `Boolean` 包装类 | 实体未在修复范围，Aspect 中为原生 boolean 不会 null |
| P3-6 | 建议 | library-frontend | `api/index.ts` | `getUserId()` 默认 U001 | 演示场景设计取舍，需要默认用户便于测试 |

### 已修复项 — 7 项

| 编号 | 仓库 | 文件 | 修复内容 |
|------|------|------|----------|
| P3-1 | library-backend | `AlgoService.java` | `base.getBytes(StandardCharsets.UTF_8)` |
| P3-2 | library-backend | `CallLogAspect.java` | `pjp.getSignature().getName()` |
| P3-4 | library-backend | `ExportController.java` | `csvEscape(durationMs)` 统一调用 |
| P3-7 | library-frontend | `api/index.ts` | `encodeURIComponent(apiName)` |
| P3-8 | library-frontend | `HashTab.tsx` / `BubbleSortTab.tsx` | 导出按钮移除 `disabled` |
| P3-9 | library-frontend | `CallReport.tsx` | `useState` 管理 userId |
| P3-10 | library-frontend | `CallReport.tsx` | `window resize` 监听 + cleanup |

---

## 六、可靠性检查

### 异常处理
- [library-backend] AlgoService: 所有异常路径抛出语义化异常 ✓
- [library-backend] CallLogAspect: 埋点异常 `log.warn` 记录，不影响主流程 ✓
- [library-backend] ExportController: 白名单校验 + default 404 ✓
- [library-frontend] 各 Tab 组件: try-catch + `message.error` ✓
- [library-frontend] CallReport: `fetchStats().catch()` 错误处理 ✓

### 资源管理
- [library-frontend] CallReport: ECharts 实例卸载时 `dispose()` ✓
- [library-frontend] CallReport: resize 监听卸载时 `removeEventListener` ✓ (P3-10)
- [library-backend] AlgoService: bubbleSort 复制原数组，不修改输入 ✓

### 响应式模式
- [library-frontend] CallReport: `useState` 管理 userId，Select value 绑定 state ✓ (P3-9)
- [library-frontend] CallReport: useEffect 依赖数组正确 `[stats, dim, chartType]` ✓

---

## 七、安全性检查

- [library-backend] ExportController: CSV 公式注入防护 ✓
- [library-backend] ExportController: 响应头注入防护（RFC 5987）✓
- [library-backend] ExportController: apiName 白名单防路径遍历 ✓
- [library-backend] AlgoService: sha256 显式 UTF-8 字符集 ✓ (P3-1)
- [library-frontend] 导出 URL 参数 `encodeURIComponent` 编码 ✓
- [library-frontend] exportUrl apiName `encodeURIComponent` 编码 ✓ (P3-7)

---

## 八、评审结论

**通过 ✅**

第二轮修复成功解决了 10 项 P3 建议中的 7 项（P3-1/2/4/7/8/9/10），保留的 3 项（P3-3/5/6）均为演示场景可接受的取舍：

| P3 编号 | 修复状态 | 验证结论 |
|---------|----------|----------|
| P3-1 sha256 字符集 | ✅ 已修复 | `StandardCharsets.UTF_8` 显式指定 |
| P3-2 apiName 格式 | ✅ 已修复 | `getName()` 返回简单方法名 |
| P3-3 同步 DB 写入 | ⏸ 保留 | 演示场景可接受 |
| P3-4 durationMs csvEscape | ✅ 已修复 | 统一调用 csvEscape |
| P3-5 Boolean 包装类 | ⏸ 保留 | 实体未在修复范围 |
| P3-6 默认 U001 | ⏸ 保留 | 演示场景设计取舍 |
| P3-7 exportUrl 编码 | ✅ 已修复 | `encodeURIComponent` 防御 |
| P3-8 导出按钮一致性 | ✅ 已修复 | 移除 disabled，三 Tab 一致 |
| P3-9 useState userId | ✅ 已修复 | 响应式模式 |
| P3-10 resize 监听 | ✅ 已修复 | window resize + cleanup |

跨仓接口契约全部对齐。第二轮修复未引入任何新的 blocker 或功能回归。

**blocker_count: 0**

---

> 本报告基于静态审查，未执行编译/测试验证（遵循降级协议：审查阶段不触发构建）。
