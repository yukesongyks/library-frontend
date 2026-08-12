# Code Review Report

> **Change** `cost-report` · **分支/Commit** `AI/task-DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-d2045cdb-c7f5-43ab-` / `078f5d72` · **日期** `2026-08-12` · **审查者** AI
>
> **AI**：等级 **P0 / P1 / P2**；G/S 以 checklist 行内定义为准；Bug 模式以 `bug-pattern-checklist.md` 表头为准（Blocker→P0、Major→P1、Info→P2）。**已**运行 `scan-all-rules.sh` 并将要点并入 §5，**再**写 LLM 结论。问题须含 `path:line` 或清单 ID。**每个 ❌/⚠️ 问题在 §7 后附代码片段**（见 §7.1）。
>
> **适配说明**：本次变更为 TypeScript/React 前端代码（`.ts`/`.tsx`），不含 `.java` 文件。技能 Java 守卫本应终止，但任务硬性约束要求产出报告，故将 SDD 审查范式（功能核对→可读性→可靠性→自定义扩展）适配至 TS/React 代码执行。Bug 模式清单（B/M/I）以 Java 语义为基准，仅对语义等价的前端模式（如空指针等价、异常吞没、资源泄漏等）做映射审查。
>
> **复审说明**：本轮为问题修复后的复审。上一轮 CR 报告（3 P0 / 5 P1 / 3 P2）中的全部问题均已修复，本轮对修复后代码重新执行 SDD 审查范式，核验修复有效性并检查是否引入新问题。

---

## 1. 审查范围

| 项 | 值 |
|----|-----|
| `.java` 文件数 | 0（纯前端 TS/TSX 变更） |
| 变更文件数 | 21（含配置） |
| 变更行数 | `+约650 / -约50`（修复后） |
| 复审涉及文件 | 8（修复后源文件 + 测试） |

| 类/接口/组件 | 路径 | 角色 |
|---------|------|--------------|
| `CostDimension` / `TimeDimension` / `LaborRole` | `src/types/cost.ts` | 类型定义 |
| `CostStatQuery` / `LaborCostVO` / `ProjectCostVO` / `CostSummary` / `CostDashboardVO` / `CostRecordDTO` | `src/types/cost.ts` | 接口定义 |
| `getCostDashboard` / `getCostStat` / `exportCostReport` | `src/api/cost.ts` | API 封装 |
| `request` / `downloadBlob` | `src/api/request.ts` | Axios 实例 + blob 下载 |
| `CostDashboard` | `src/pages/cost/CostDashboard.tsx` | Dashboard 主页面 |
| `DimensionFilter` | `src/pages/cost/components/DimensionFilter.tsx` | 维度筛选器 |
| `LaborCostChart` | `src/pages/cost/components/LaborCostChart.tsx` | 人力成本图表 |
| `ProjectCostChart` | `src/pages/cost/components/ProjectCostChart.tsx` | 项目成本图表 |
| `CostTable` | `src/pages/cost/components/CostTable.tsx` | 成本明细表格 |
| `ExportButton` | `src/pages/cost/components/ExportButton.tsx` | 导出按钮 |
| `App` | `src/App.tsx` | 路由配置 |
| `MainLayout` | `src/layouts/MainLayout.tsx` | 布局 + 菜单 |
| `main` | `src/main.tsx` | 应用入口 |
| `cost API test` | `src/__tests__/cost.test.ts` | API 单元测试 |

---

## 2. 问题计数

| P0 | P1 | P2 |
|----|----|-----|
| 0 | 0 | 3 |

> **对比上一轮**：P0 3→0（全部修复）、P1 5→0（全部修复）、P2 3→3（原 3 项已修复，新增 3 项 P2 级观察项）。

---

## 3. Step 2 — 功能（REQ）

### REQ-1: 多维度统计（部门/项目/业务线/人员）

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 统计维度筛选器提供 DEPT/PROJECT/BUSINESS_LINE/PERSON 四选项 | ✅ | `cost-report.md` L84: "聚合维度：DEPT / PROJECT / BUSINESS_LINE / PERSON，默认 DEPT" | `src/pages/cost/components/DimensionFilter.tsx:41-45` | Select 组件含四个 Option，默认值 `DEPT` 在 CostDashboard:18 设置 |
| 维度切换后触发数据刷新 | ✅ | `cost-report.md` Task 9: "维度筛选器切换部门/项目/业务线/人员，图表与表格数据正确刷新" | `src/pages/cost/CostDashboard.tsx:26-48` | `fetchData` 通过 `useCallback` 依赖 `query`，`useEffect` 依赖 `fetchData` 实现刷新 |

### REQ-2: 时间维度统计（月份/季度/年度）

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 时间维度筛选器提供 MONTH/QUARTER/YEAR 三选项 | ✅ | `cost-report.md` L85: "时间维度：MONTH / QUARTER / YEAR，默认 MONTH" | `src/pages/cost/components/DimensionFilter.tsx:47-56` | Select 组件含三个 Option |
| 时间值输入支持 `yyyy-MM` / `yyyy-Qq` / `yyyy` 格式 | ✅ | `cost-report.md` L25: "month 格式 `yyyy-MM`，quarter 格式 `yyyy-Qq`，year 格式 `yyyy`" | `src/pages/cost/components/DimensionFilter.tsx:11-15,58-62` | **已修复**：新增 `TIME_PATTERNS` 正则校验 + `validateStatus`/`help` 错误反馈。用户输入非法格式时显示红色错误提示 |

### REQ-3: 人力成本统计（开发/测试/产品/运维）

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 人力成本按四角色展示 | ✅ | `cost-report.md` L100: `"dev": 120000.00, "qa": 50000.00, "pm": 30000.00, "ops": 20000.00` | `src/pages/cost/components/LaborCostChart.tsx:22-25` | ECharts 堆叠柱状图含开发/测试/产品/运维四 series |
| `LaborCostVO` 类型含 dev/qa/pm/ops/total | ✅ | `cost-report.md` L99-101 | `src/types/cost.ts:17-24` | 类型定义与 spec 一致 |

### REQ-4: 项目成本统计（预算/实际消耗/预算占比/预计超支金额）

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 项目成本含 budget/actualCost/budgetRatio/estimatedOverspend | ✅ | `cost-report.md` L104-109 | `src/types/cost.ts:26-33` | 类型定义与 spec 一致 |
| 项目成本图表展示预算/实际/超支 | ✅ | `cost-report.md` Task 9: "项目成本图表展示预算/实际/超支" | `src/pages/cost/components/ProjectCostChart.tsx:22-24` | ECharts 柱状图含三 series |
| 预算占比在 Dashboard 汇总卡片展示 | ✅ | `cost-report.md` L116: `"overallBudgetRatio": 0.64` | `src/pages/cost/CostDashboard.tsx:68-75` | `overallBudgetRatio * 100` + `suffix="%"` 展示百分比，已拆为多行 JSX |

### REQ-5: 报表导出

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 导出按钮触发 Excel 下载 | ✅ | `cost-report.md` L133: `Content-Disposition: attachment; filename="cost-report.xlsx"` | `src/pages/cost/components/ExportButton.tsx:12-19` | 调用 `exportCostReport` + `downloadBlob` |
| 导出 API 使用 blob responseType | ✅ | `cost-report.md` Task 8: `responseType: 'blob'` | `src/api/cost.ts:18-22` | `responseType: 'blob'` 已设置，返回类型声明为 `Promise<Blob>` |
| 导出失败时用户可见反馈 | ✅ | — | `src/pages/cost/components/ExportButton.tsx:17-18` | `catch` 块调用 `message.error('导出失败')` |

### REQ-6: Dashboard 页面

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| Dashboard 组合筛选器+图表+表格 | ✅ | `cost-report.md` L40: "成本统计 Dashboard 主页面，组合筛选器 + 图表 + 表格" | `src/pages/cost/CostDashboard.tsx:50-90` | 包含 DimensionFilter + Statistic + LaborCostChart + ProjectCostChart + CostTable |
| 汇总卡片展示五项指标 | ✅ | `cost-report.md` L112-118 | `src/pages/cost/CostDashboard.tsx:57-80` | 五个 Statistic 组件展示 totalLaborCost/totalProjectBudget/totalActualCost/overallBudgetRatio/totalEstimatedOverspend |

### REQ-7: 路由与菜单集成

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| `/cost/dashboard` 路由可访问 | ✅ | `cost-report.md` L46: "新增 `/cost/dashboard` 路由" | `src/App.tsx:10` | `<Route path="cost/dashboard" element={<CostDashboard />} />` |
| 侧边栏含「成本统计」菜单项 | ✅ | `cost-report.md` L47: "侧边栏新增「成本统计」菜单项" | `src/layouts/MainLayout.tsx:7-13` | menuItems 含 key `/cost/dashboard` + label '成本统计' |

### REQ-8: 统一响应体

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| API 返回 `{ code, message, data }` | ✅ | `cost-report.md` L24: "所有接口返回统一响应体 `{ code: number; message: string; data: T }`" | `src/api/cost.ts:4-8,10-12,14-16` | **已修复**：`cost.ts` 定义 `ApiResponse<T>` 接口，API 函数显式声明返回 `Promise<ApiResponse<T>>`，用 `as unknown as` 桥接拦截器 `response.data` 解包。类型契约现已显式且一致 |

---

## 4. Step 3 — 可读性检查

> 适配说明：原清单以 Java 风格为基准，此处对等映射至 TS/React 风格规范。

| 结果 | 说明（违规写 Ax.x 与 `path:行`） |
|------|--------------------------------|
| ✅ | A1 源文件格式：所有 `.ts`/`.tsx` 文件 UTF-8 编码、LF 换行，符合 |
| ✅ | A2 命名规范：组件 PascalCase（`CostDashboard`、`DimensionFilter`），函数 camelCase（`getCostDashboard`、`downloadBlob`），路由 kebab-case（`/cost/dashboard`），符合 `cost-report.md` L20 约束 |
| ✅ | A3.4 行宽：**已修复** — 原 `CostDashboard.tsx:53` 预算占比 Statistic 单行过长已拆为多行 JSX（L68-75），不再超标 |
| ✅ | A4 OOP 规约：TS 接口命名清晰（`CostStatQuery`、`CostDashboardVO`、`ApiResponse<T>`），符合 |
| ✅ | A5 集合处理：`data.map((d) => d.dev)` 等使用箭头函数，无不当集合操作 |
| ✅ | A6 并发处理：前端无多线程，N/A |
| ✅ | A7 控制语句：条件渲染 `{dashboard && (...)}` 简洁，符合 |

---

## 5. Step 4 — 可靠性检查

| 域 | 参考 | 结果 | 等级 | 说明（列命中 ID 或「已扫无命中」） |
|----|------|------|------|-------------------------------------|
| 可靠性 | `reliability-checklist.md` G1–G17 | ✅ | 无 P0/P1 | 上一轮全部修复，本轮无新增 |
| 安全 | `security-checklist.md` S1–S10 | ✅ | 无 P0/P1 | 上一轮全部修复，本轮无新增 |
| Bug 模式 | `bug-pattern-checklist.md` B/M/I（120） | ✅ | 无 P0/P1 | 上一轮全部修复，本轮无新增 |

### 可靠性详细

| ID | 等级 | 命中 | 说明 |
|----|------|------|------|
| G2.2 | — | ✅ 已修复 | `src/pages/cost/CostDashboard.tsx:26-44` — `fetchData` 现有 `try...catch` 块，捕获异常后调用 `message.error('数据加载失败')` 向用户展示错误信息。原 P0 已修复 |
| G5.3 | — | ✅ 已修复 | `src/pages/cost/components/LaborCostChart.tsx:28-33` / `ProjectCostChart.tsx:27-32` — 两图均新增 `window.addEventListener('resize', handleResize)` 并在清理函数中 `removeEventListener` + `chart.dispose()`。原 P1 已修复 |
| G16.2 | — | ✅ 已修复 | `src/api/request.ts:12-14` — 错误拦截器现含 `message.error(msg)` 向用户展示错误信息，不仅限于 `console.error`。原 P1 已修复 |
| G14.1 | — | ✅ 已修复 | `src/pages/cost/CostDashboard.tsx:29-38` — 改用 `Promise.allSettled` 替代 `Promise.all`，逐项检查 `status === 'fulfilled'`，dashboard 和 stat 请求互不影响。原 P2 已修复 |

### 安全详细

| ID | 等级 | 命中 | 说明 |
|----|------|------|------|
| S6.1 | — | ✅ 已修复 | `src/pages/cost/components/DimensionFilter.tsx:11-15,58-62` — 新增 `TIME_PATTERNS` 正则校验（MONTH/QUARTER/YEAR 三种格式），`validateStatus` 和 `help` 属性提供实时错误反馈。原 P1 已修复 |

### Bug 模式详细（语义映射）

| ID | 等级 | 命中 | 说明 |
|----|------|------|------|
| B001(等价) | — | ✅ 已修复 | `src/api/cost.ts:4-16` — API 函数现显式声明返回类型 `Promise<ApiResponse<T>>`，用 `as unknown as` 桥接拦截器解包。类型契约显式且一致，消除类型欺骗。原 P0 已修复 |
| B001(等价) | — | ✅ 已修复 | `src/api/cost.ts:18-23` — `exportCostReport` 现声明返回 `Promise<Blob>`，`ExportButton.tsx:14` 的 `await` 类型安全。原 P0 已修复 |
| M005(等价) | — | ✅ 已修复 | `src/pages/cost/CostDashboard.tsx:11-14,20` — 新增 `getCurrentMonth()` 函数返回当前月份 `yyyy-MM`，初始 `timeValue` 不再为 `undefined`。原 P1 已修复 |
| I012(等价) | — | ✅ 已修复 | `src/pages/cost/components/CostTable.tsx:15` — `render` 改为 `(v: number | null | undefined) => (v ?? 0).toFixed(2)`，空值保护。原 P2 已修复 |

---

## 6. Step 5 — 自定义扩展检查

| 域 | 参考 | 结果 | 等级 | 说明 |
|----|------|------|------|------|
| 自定义扩展 | `customized-checklist.md` U* | N/A | — | N/A(未启用自定义规则) |

---

## 7. 结论

- **合并建议**：✅ 可以合并
- **P0**：无（上一轮 3 个 P0 全部修复）
- **P1**：无（上一轮 5 个 P1 全部修复）
- **P2**（新增观察项，非阻塞）：
  1. `src/api/cost.ts:11,15,22` — `as unknown as` 双重断言虽消除类型欺骗，但绕过编译器类型检查。建议后续引入 Axios 实例泛型类型或自定义 `request` 封装层，从根源消除断言需求
  2. `src/pages/cost/components/DimensionFilter.tsx:63-67` — 输入校验仅提供视觉反馈（`validateStatus`/`help`），不阻止非法值随 `onChange` 传递至后端。建议在 `fetchData` 中增加 `isValid` 前置校验，或使用 antd `Form` 的 `onFinish` 替代即时 `onChange`
  3. `src/pages/cost/CostDashboard.tsx:46-48` — `DimensionFilter` 每次按键触发 `onChange` → `setQuery` → `fetchData`，无防抖。高频输入时产生冗余 API 请求。建议对 `timeValue` 输入添加 debounce（如 `lodash.debounce` 或 `useDeferredValue`）
- **一句话**：上一轮全部 P0/P1/P2 问题均已有效修复，功能完整度达标，数据加载链路异常处理完备，API 类型契约显式一致，ECharts 资源管理含 resize 监听，输入校验已就位。无阻塞性问题，可以合并。

---

## 7.1 问题片段（必填）

> **规则**：对 §3–§7 中每个 `❌/⚠️` 问题，提供一段对应代码片段（最少 3 行），带行号标注。本次为 TS/TSX 变更，片段标注 `Lxx|`。
>
> 本轮无 P0/P1 问题（`❌`/`⚠️`），仅有 3 个 P2 级观察项（`ℹ️`），附片段如下。

### P2 观察项片段

- **P2** `src/api/cost.ts:10-12` — `as unknown as` 双重断言绕过编译器类型检查。

```typescript
L10| export function getCostDashboard(params: CostStatQuery): Promise<ApiResponse<CostDashboardVO>> {
L11|   return request.get('/api/cost/dashboard', { params }) as unknown as Promise<ApiResponse<CostDashboardVO>>;
L12| }
```

---

- **P2** `src/pages/cost/components/DimensionFilter.tsx:58-67` — 输入校验仅视觉反馈，不阻止非法值传递。

```typescript
L58|       <Form.Item
L59|         label="时间值"
L60|         validateStatus={timeValue && !isValid ? 'error' : ''}
L61|         help={timeValue && !isValid ? '格式不正确：月份 yyyy-MM / 季度 yyyy-Qq / 年度 yyyy' : ''}
L62|       >
L63|         <Input
L64|           placeholder={getTimePlaceholder(timeDimension)}
L65|           value={value.timeValue}
L66|           onChange={(e) => onChange({ timeValue: e.target.value })}
L67|           style={{ width: 160 }}
```

---

- **P2** `src/pages/cost/CostDashboard.tsx:46-48` — 无防抖，每次按键触发 API 请求。

```typescript
L46|   useEffect(() => {
L47|     fetchData();
L48|   }, [fetchData]);
```

---

## 8. 修复核验清单

> **用途**：逐项核销上一轮 CR 报告中的修复任务。

### P0（全部已修复 ✅）

- [x] **P0** `src/pages/cost/CostDashboard.tsx:17-28` — 为 `fetchData` 添加 `catch` 块，捕获 API 异常后调用 `message.error` 向用户展示错误信息
  - **核验**：`CostDashboard.tsx:39` 现有 `catch { message.error('数据加载失败'); }` ✅
- [x] **P0** `src/api/request.ts:8-9` + `src/api/cost.ts:5` — 统一拦截器与 API 类型声明，消除类型欺骗
  - **核验**：`cost.ts:4-8` 定义 `ApiResponse<T>` 接口，API 函数显式声明返回 `Promise<ApiResponse<T>>`，用 `as unknown as` 桥接 ✅
- [x] **P0** `src/api/cost.ts:18-22` — 为 `exportCostReport` 声明返回类型 `Promise<Blob>`
  - **核验**：`cost.ts:18` 现声明 `export function exportCostReport(params: CostStatQuery): Promise<Blob>` ✅

### P1（全部已修复 ✅）

- [x] **P1** `src/pages/cost/components/DimensionFilter.tsx:38-43` — 为 timeValue 输入添加格式校验
  - **核验**：`DimensionFilter.tsx:11-15` 新增 `TIME_PATTERNS` 正则，`L31` 校验 `isValid`，`L60-61` `validateStatus`/`help` ✅
- [x] **P1** `src/pages/cost/components/LaborCostChart.tsx:12-29` — 添加 resize 监听
  - **核验**：`LaborCostChart.tsx:28-33` 新增 `addEventListener('resize', handleResize)` + 清理 ✅
- [x] **P1** `src/pages/cost/components/ProjectCostChart.tsx:12-28` — 添加 resize 监听
  - **核验**：`ProjectCostChart.tsx:27-32` 同上 ✅
- [x] **P1** `src/api/request.ts:10-14` — 错误拦截器增加全局用户可见错误提示
  - **核验**：`request.ts:14` 新增 `message.error(msg)` ✅
- [x] **P1** `src/pages/cost/CostDashboard.tsx:12` — 为初始 query 设置合理的 timeValue 默认值
  - **核验**：`CostDashboard.tsx:11-14` 新增 `getCurrentMonth()`，`L20` 初始 `timeValue: getCurrentMonth()` ✅

### P2（全部已修复 ✅）

- [x] **P2** `src/pages/cost/CostDashboard.tsx:53` — 拆分过长的 Statistic 行为多行 JSX
  - **核验**：`CostDashboard.tsx:68-75` 预算占比 Statistic 已拆为多行 ✅
- [x] **P2** `src/pages/cost/CostDashboard.tsx:20-23` — 使用 `Promise.allSettled` 替代 `Promise.all`
  - **核验**：`CostDashboard.tsx:29-38` 改用 `Promise.allSettled` + 逐项状态检查 ✅
- [x] **P2** `src/pages/cost/components/CostTable.tsx:15` — 为 render 添加空值保护
  - **核验**：`CostTable.tsx:15` 改为 `(v: number | null | undefined) => (v ?? 0).toFixed(2)` ✅
