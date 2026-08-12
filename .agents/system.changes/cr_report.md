# Code Review Report

> **Change** `cost-report` · **分支/Commit** `AI/task-DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-d2045cdb-c7f5-43ab-` / `078f5d72` · **日期** `2026-08-12` · **审查者** AI
>
> **AI**：等级 **P0 / P1 / P2**；G/S 以 checklist 行内定义为准；Bug 模式以 `bug-pattern-checklist.md` 表头为准（Blocker→P0、Major→P1、Info→P2）。**已**运行 `scan-all-rules.sh` 并将要点并入 §5，**再**写 LLM 结论。问题须含 `path:line` 或清单 ID。**每个 ❌/⚠️ 问题在 §7 后附代码片段**（见 §7.1）。
>
> **适配说明**：本次变更为 TypeScript/React 前端代码（`.ts`/`.tsx`），不含 `.java` 文件。技能 Java 守卫本应终止，但任务硬性约束要求产出报告，故将 SDD 审查范式（功能核对→可读性→可靠性→自定义扩展）适配至 TS/React 代码执行。Bug 模式清单（B/M/I）以 Java 语义为基准，仅对语义等价的前端模式（如空指针等价、异常吞没、资源泄漏等）做映射审查。

---

## 1. 审查范围

| 项 | 值 |
|----|-----|
| `.java` 文件数 | 0（纯前端 TS/TSX 变更） |
| 变更文件数 | 21（含配置） |
| 变更行数 | `+约600 / -0`（新增） |

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
| 3 | 5 | 3 |

---

## 3. Step 2 — 功能（REQ）

### REQ-1: 多维度统计（部门/项目/业务线/人员）

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 统计维度筛选器提供 DEPT/PROJECT/BUSINESS_LINE/PERSON 四选项 | ✅ | `cost-report.md` L84: "聚合维度：DEPT / PROJECT / BUSINESS_LINE / PERSON，默认 DEPT" | `src/pages/cost/components/DimensionFilter.tsx:15-24` | Select 组件含四个 Option，默认值 `DEPT` 在 CostDashboard:12 设置 |
| 维度切换后触发数据刷新 | ✅ | `cost-report.md` Task 9: "维度筛选器切换部门/项目/业务线/人员，图表与表格数据正确刷新" | `src/pages/cost/CostDashboard.tsx:17-33` | `fetchData` 通过 `useCallback` 依赖 `query`，`useEffect` 依赖 `fetchData` 实现刷新 |

### REQ-2: 时间维度统计（月份/季度/年度）

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 时间维度筛选器提供 MONTH/QUARTER/YEAR 三选项 | ✅ | `cost-report.md` L85: "时间维度：MONTH / QUARTER / YEAR，默认 MONTH" | `src/pages/cost/components/DimensionFilter.tsx:27-35` | Select 组件含三个 Option |
| 时间值输入支持 `yyyy-MM` / `yyyy-Qq` / `yyyy` 格式 | ⚠️ | `cost-report.md` L25: "month 格式 `yyyy-MM`，quarter 格式 `yyyy-Qq`，year 格式 `yyyy`" | `src/pages/cost/components/DimensionFilter.tsx:38-43` | 仅用 Input 文本框，无格式校验/验证。用户可输入任意字符串，后端可能查询失败。**P1**：缺少输入校验 |

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
| 预算占比在 Dashboard 汇总卡片展示 | ✅ | `cost-report.md` L116: `"overallBudgetRatio": 0.64` | `src/pages/cost/CostDashboard.tsx:53` | `overallBudgetRatio * 100` + `suffix="%"` 展示百分比 |

### REQ-5: 报表导出

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 导出按钮触发 Excel 下载 | ✅ | `cost-report.md` L133: `Content-Disposition: attachment; filename="cost-report.xlsx"` | `src/pages/cost/components/ExportButton.tsx:12-19` | 调用 `exportCostReport` + `downloadBlob` |
| 导出 API 使用 blob responseType | ✅ | `cost-report.md` Task 8: `responseType: 'blob'` | `src/api/cost.ts:18-22` | `responseType: 'blob'` 已设置 |
| 导出失败时用户可见反馈 | ✅ | — | `src/pages/cost/components/ExportButton.tsx:17-18` | `catch` 块调用 `message.error('导出失败')` |

### REQ-6: Dashboard 页面

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| Dashboard 组合筛选器+图表+表格 | ✅ | `cost-report.md` L40: "成本统计 Dashboard 主页面，组合筛选器 + 图表 + 表格" | `src/pages/cost/CostDashboard.tsx:35-68` | 包含 DimensionFilter + Statistic + LaborCostChart + ProjectCostChart + CostTable |
| 汇总卡片展示五项指标 | ✅ | `cost-report.md` L112-118 | `src/pages/cost/CostDashboard.tsx:42-57` | 五个 Statistic 组件展示 totalLaborCost/totalProjectBudget/totalActualCost/overallBudgetRatio/totalEstimatedOverspend |

### REQ-7: 路由与菜单集成

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| `/cost/dashboard` 路由可访问 | ✅ | `cost-report.md` L46: "新增 `/cost/dashboard` 路由" | `src/App.tsx:10` | `<Route path="cost/dashboard" element={<CostDashboard />} />` |
| 侧边栏含「成本统计」菜单项 | ✅ | `cost-report.md` L47: "侧边栏新增「成本统计」菜单项" | `src/layouts/MainLayout.tsx:7-13` | menuItems 含 key `/cost/dashboard` + label '成本统计' |

### REQ-8: 统一响应体

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| API 返回 `{ code, message, data }` | ⚠️ | `cost-report.md` L24: "所有接口返回统一响应体 `{ code: number; message: string; data: T }`" | `src/api/cost.ts:5,12` | 类型声明含 `{ code: number; message: string; data: T }`，但 `request.ts:9` 拦截器 `response.data` 直接返回 data 层，导致 `getCostDashboard` 返回的是内层 data 而非完整响应体。**P0**：拦截器与 API 类型声明不一致，`dashRes.data` 实际访问的是 `data.data` 而非 `data` |

---

## 4. Step 3 — 可读性检查

> 适配说明：原清单以 Java 风格为基准，此处对等映射至 TS/React 风格规范。

| 结果 | 说明（违规写 Ax.x 与 `path:行`） |
|------|--------------------------------|
| ⚠️ | `A3.4` `src/pages/cost/CostDashboard.tsx:53` — 行宽超标（scan-all-rules.sh 预扫命中），`<Card><Statistic title="预算占比" value={dashboard.summary.overallBudgetRatio * 100} precision={2} suffix="%" /></Card>` 单行过长 |
| ✅ | A1 源文件格式：所有 `.ts`/`.tsx` 文件 UTF-8 编码、LF 换行，符合 |
| ✅ | A2 命名规范：组件 PascalCase（`CostDashboard`、`DimensionFilter`），函数 camelCase（`getCostDashboard`、`downloadBlob`），路由 kebab-case（`/cost/dashboard`），符合 `cost-report.md` L20 约束 |
| ✅ | A4 OOP 规约：TS 接口命名清晰（`CostStatQuery`、`CostDashboardVO`），符合 |
| ✅ | A5 集合处理：`data.map((d) => d.dev)` 等使用箭头函数，无不当集合操作 |
| ✅ | A6 并发处理：前端无多线程，N/A |
| ✅ | A7 控制语句：条件渲染 `{dashboard && (...)}` 简洁，符合 |

---

## 5. Step 4 — 可靠性检查

| 域 | 参考 | 结果 | 等级 | 说明（列命中 ID 或「已扫无命中」） |
|----|------|------|------|-------------------------------------|
| 可靠性 | `reliability-checklist.md` G1–G17 | ❌ | P0–P2 | 见下方详细 |
| 安全 | `security-checklist.md` S1–S10 | ⚠️ | P1 | 见下方详细 |
| Bug 模式 | `bug-pattern-checklist.md` B/M/I（120） | ❌ | P0–P2 | 预扫：`scan-all-rules.sh`（1 finding: A3.4）；语义映射审查见下方 |

### 可靠性详细

| ID | 等级 | 命中 | 说明 |
|----|------|------|------|
| G2.2 | P0 | ❌ | `src/pages/cost/CostDashboard.tsx:17-28` — `fetchData` 的 `try...finally` 无 `catch` 块，API 请求失败时异常向上抛出，用户无错误反馈（仅 Spin 停止）。**P0**：核心数据加载链路无异常处理，违反 G2.2（异常必须捕获并处理，不能向上抛出或忽略） |
| G5.3 | P1 | ⚠️ | `src/pages/cost/components/LaborCostChart.tsx:14` / `ProjectCostChart.tsx:14` — `echarts.init(ref.current)` 创建图表实例，`useEffect` 清理函数调用 `chart.dispose()`，但未处理 `resize` 事件。窗口大小变化时图表不会自适应。**P1**：资源管理缺少 resize 监听 |
| G16.2 | P1 | ⚠️ | `src/api/request.ts:10-14` — 错误拦截器仅 `console.error`，未向用户展示错误信息（无 `message.error` 或全局错误处理）。**P1**：排障可观测性不足，用户不可见请求失败 |
| G14.1 | P2 | ⚠️ | `src/pages/cost/CostDashboard.tsx:20-23` — `Promise.all` 并行请求 dashboard + stat，任一失败则全部失败。可考虑 `Promise.allSettled` 容错。**P2**：可靠性建议 |

### 安全详细

| ID | 等级 | 命中 | 说明 |
|----|------|------|------|
| S6.1 | P1 | ⚠️ | `src/pages/cost/components/DimensionFilter.tsx:38-43` — `timeValue` 输入无前端校验，用户可输入任意字符串（含特殊字符），直接作为 query param 传递。虽然后端应做校验，但前端缺少第一道防线。**P1**：输入校验缺失 |

### Bug 模式详细（语义映射）

| ID | 等级 | 命中 | 说明 |
|----|------|------|------|
| B001(等价) | P0 | ❌ | `src/api/request.ts:8-9` — 响应拦截器 `(response) => response.data` 直接返回 `response.data`，但 `src/api/cost.ts:5` 声明返回类型为 `{ code: number; message: string; data: CostDashboardVO }`。实际 `getCostDashboard` 返回的是 `response.data`（即 `{ code, message, data }`），而 `CostDashboard.tsx:24` 使用 `dashRes.data` 访问的是 `response.data.data`（即 `CostDashboardVO`）。**类型声明与运行时行为不一致**：`cost.ts` 的泛型 `<{ code; message; data }>` 让调用方误以为返回完整响应体，但拦截器已解包。**P0**：类型欺骗，虽运行时恰好能工作，但类型不安全，重构时极易引入 bug |
| M005(等价) | P1 | ⚠️ | `src/pages/cost/CostDashboard.tsx:12` — `useState<CostStatQuery>({ dimension: 'DEPT', timeDimension: 'MONTH' })` 初始状态无 `timeValue`，首次请求 `timeValue` 为 `undefined`，后端可能返回全量数据或报错。**P1**：边界条件未处理 |
| I012(等价) | P2 | ⚠️ | `src/pages/cost/components/CostTable.tsx:9-17` — `columns` 数组定义在组件外部（module scope），`render: (v: number) => v.toFixed(2)` 未处理 `v` 为 `null`/`undefined` 的情况。若后端返回 `amount: null`，将抛出 `TypeError: Cannot read properties of null`。**P2**：空值边界 |

---

## 6. Step 5 — 自定义扩展检查

| 域 | 参考 | 结果 | 等级 | 说明 |
|----|------|------|------|------|
| 自定义扩展 | `customized-checklist.md` U* | N/A | — | N/A(未启用自定义规则) |

---

## 7. 结论

- **合并建议**：修复后合并
- **P0**：
  1. `src/pages/cost/CostDashboard.tsx:17-28` — `fetchData` 无 `catch` 块，API 失败时用户无错误反馈（G2.2）
  2. `src/api/request.ts:8-9` + `src/api/cost.ts:5` — 拦截器 `response.data` 解包与 API 类型声明 `<{ code; message; data }>` 不一致，类型欺骗（B001 等价）
  3. `src/api/cost.ts:18-22` — `exportCostReport` 返回类型未声明，`ExportButton.tsx:14` 直接 `await` 赋值给 `blob`，但拦截器返回 `response.data`（即 Blob 本身），类型不安全（B001 等价延伸）
- **P1/P2**：
  1. `DimensionFilter.tsx:38-43` — timeValue 无输入校验（S6.1, P1）
  2. `LaborCostChart.tsx:14` / `ProjectCostChart.tsx:14` — ECharts 无 resize 监听（G5.3, P1）
  3. `request.ts:10-14` — 错误拦截器仅 console.error，用户不可见（G16.2, P1）
  4. `CostDashboard.tsx:12` — 初始 timeValue 为 undefined，边界未处理（M005, P1）
  5. `CostDashboard.tsx:53` — 行宽超标（A3.4, P2）
  6. `CostDashboard.tsx:20-23` — Promise.all 不容错（G14.1, P2）
  7. `CostTable.tsx:15` — amount 为 null 时 toFixed 抛异常（I012, P2）
- **一句话**：功能完整度达标，但数据加载链路缺异常处理且 API 类型声明与拦截器行为不一致，存在类型安全隐患，需修复 P0 后方可合并。

---

## 7.1 问题片段（必填）

> **规则**：对 §3–§7 中每个 `❌/⚠️` 问题，提供一段对应代码片段（最少 3 行），带行号标注。本次为 TS/TSX 变更，片段标注 `Lxx|`。

### P0 问题片段

- **P0** `G2.2` `src/pages/cost/CostDashboard.tsx:17-28` — `fetchData` 的 `try...finally` 无 `catch` 块，API 请求失败时异常向上抛出，用户无错误反馈。
  片段范围：`src/pages/cost/CostDashboard.tsx:17-29`

```typescript
L17|  const fetchData = useCallback(async () => {
L18|    setLoading(true);
L19|    try {
L20|      const [dashRes, statRes] = await Promise.all([
L21|        getCostDashboard(query),
L22|        getCostStat(query),
L23|      ]);
L24|      setDashboard(dashRes.data);
L25|      setRecords(statRes.data);
L26|    } finally {
L27|      setLoading(false);
L28|    }
L29|  }, [query]);
```

---

- **P0** `B001(等价)` `src/api/request.ts:8-15` + `src/api/cost.ts:4-8` — 拦截器 `response.data` 解包，但 API 函数泛型声明 `<{ code; message; data }>` 让调用方误以为返回完整响应体。类型欺骗。
  片段范围：`src/api/request.ts:8-15`

```typescript
L8|  request.interceptors.response.use(
L9|    (response) => response.data,
L10|  (error) => {
L11|    const msg = error?.response?.data?.message || error.message || '请求失败';
L12|    console.error('[request error]', msg);
L13|    return Promise.reject(error);
L14|  }
L15|);
```

  片段范围：`src/api/cost.ts:4-8`

```typescript
L4| export function getCostDashboard(params: CostStatQuery) {
L5|   return request.get<{ code: number; message: string; data: CostDashboardVO }>(
L6|     '/api/cost/dashboard',
L7|     { params }
L8|   );
```

---

- **P0** `B001(等价)` `src/api/cost.ts:18-22` — `exportCostReport` 返回类型未声明泛型，`ExportButton.tsx:14` 直接 `await` 赋值给 `blob`，类型不安全。
  片段范围：`src/api/cost.ts:18-22`

```typescript
L18| export function exportCostReport(params: CostStatQuery) {
L19|   return request.get('/api/cost/export', {
L20|     params,
L21|     responseType: 'blob',
L22|   });
L23| }
```

### P1 问题片段

- **P1** `S6.1` `src/pages/cost/components/DimensionFilter.tsx:37-43` — timeValue 输入无前端校验。
  片段范围：`src/pages/cost/components/DimensionFilter.tsx:37-43`

```typescript
L37|      <Form.Item label="时间值">
L38|        <Input
L39|          placeholder="如 2026-08 / 2026-Q3 / 2026"
L40|          value={value.timeValue}
L41|          onChange={(e) => onChange({ timeValue: e.target.value })}
L42|          style={{ width: 160 }}
L43|        />
```

---

- **P1** `G5.3` `src/pages/cost/components/LaborCostChart.tsx:12-29` — ECharts 无 resize 监听。
  片段范围：`src/pages/cost/components/LaborCostChart.tsx:12-29`

```typescript
L12|  useEffect(() => {
L13|    if (!ref.current) return;
L14|    const chart = echarts.init(ref.current);
L15|    chart.setOption({
L16|      title: { text: '人力成本分布' },
L17|      tooltip: { trigger: 'axis' },
L18|      legend: { data: ['开发', '测试', '产品', '运维'] },
L19|      xAxis: { type: 'category', data: data.map((d) => d.dimensionLabel) },
L20|      yAxis: { type: 'value', name: '金额(元)' },
L21|      series: [
L22|        { name: '开发', type: 'bar', stack: 'total', data: data.map((d) => d.dev) },
L23|        { name: '测试', type: 'bar', stack: 'total', data: data.map((d) => d.qa) },
L24|        { name: '产品', type: 'bar', stack: 'total', data: data.map((d) => d.pm) },
L25|        { name: '运维', type: 'bar', stack: 'total', data: data.map((d) => d.ops) },
L26|      ],
L27|    });
L28|    return () => chart.dispose();
L29|  }, [data]);
```

---

- **P1** `G16.2` `src/api/request.ts:10-14` — 错误拦截器仅 console.error，用户不可见。
  片段范围：`src/api/request.ts:10-14`

```typescript
L10|  (error) => {
L11|    const msg = error?.response?.data?.message || error.message || '请求失败';
L12|    console.error('[request error]', msg);
L13|    return Promise.reject(error);
L14|  }
```

---

- **P1** `M005(等价)` `src/pages/cost/CostDashboard.tsx:12` — 初始 timeValue 为 undefined。
  片段范围：`src/pages/cost/CostDashboard.tsx:12`

```typescript
L12|  const [query, setQuery] = useState<CostStatQuery>({ dimension: 'DEPT', timeDimension: 'MONTH' });
```

### P2 问题片段

- **P2** `A3.4` `src/pages/cost/CostDashboard.tsx:53` — 行宽超标（scan-all-rules.sh 预扫命中）。
  片段范围：`src/pages/cost/CostDashboard.tsx:52-54`

```typescript
L52|            <Col span={5}>
L53|              <Card><Statistic title="预算占比" value={dashboard.summary.overallBudgetRatio * 100} precision={2} suffix="%" /></Card>
L54|            </Col>
```

---

- **P2** `G14.1` `src/pages/cost/CostDashboard.tsx:20-23` — Promise.all 不容错。
  片段范围：`src/pages/cost/CostDashboard.tsx:20-23`

```typescript
L20|      const [dashRes, statRes] = await Promise.all([
L21|        getCostDashboard(query),
L22|        getCostStat(query),
L23|      ]);
```

---

- **P2** `I012(等价)` `src/pages/cost/components/CostTable.tsx:15` — amount 为 null 时 toFixed 抛异常。
  片段范围：`src/pages/cost/components/CostTable.tsx:9-17`

```typescript
L9| const columns = [
L10|   { title: '部门', dataIndex: 'deptName' },
L11|   { title: '项目', dataIndex: 'projectName' },
L12|   { title: '业务线', dataIndex: 'businessLineName' },
L13|   { title: '人员', dataIndex: 'personName' },
L14|   { title: '角色', dataIndex: 'laborRole' },
L15|   { title: '金额(元)', dataIndex: 'amount', render: (v: number) => v.toFixed(2) },
L16|   { title: '日期', dataIndex: 'costDate' },
L17| ];
```

---

## 8. 修复任务列表

> **用途**：供后续改代码时逐项执行与核销。

### P0

- [ ] **P0** `src/pages/cost/CostDashboard.tsx:17-28` — 为 `fetchData` 添加 `catch` 块，捕获 API 异常后调用 `message.error` 向用户展示错误信息
- [ ] **P0** `src/api/request.ts:8-9` + `src/api/cost.ts:5` — 统一拦截器与 API 类型声明：要么移除拦截器的 `response.data` 解包让 API 函数返回完整 `AxiosResponse`，要么修改 API 函数泛型为直接返回 `data` 层类型（如 `request.get<CostDashboardVO>`），消除类型欺骗
- [ ] **P0** `src/api/cost.ts:18-22` — 为 `exportCostReport` 声明返回类型 `Promise<Blob>`，确保 `ExportButton.tsx:14` 的 `await` 类型安全

### P1

- [ ] **P1** `src/pages/cost/components/DimensionFilter.tsx:38-43` — 为 timeValue 输入添加格式校验（正则或 DatePicker/组件化），根据 timeDimension 验证 `yyyy-MM` / `yyyy-Qq` / `yyyy` 格式
- [ ] **P1** `src/pages/cost/components/LaborCostChart.tsx:12-29` — 在 `useEffect` 中添加 `window.addEventListener('resize', handler)` 并在清理函数中移除，handler 调用 `chart.resize()`
- [ ] **P1** `src/pages/cost/components/ProjectCostChart.tsx:12-28` — 同上，添加 resize 监听
- [ ] **P1** `src/api/request.ts:10-14` — 在错误拦截器中增加全局用户可见的错误提示（如 `message.error(msg)` 或通知上层组件），不仅限于 console.error
- [ ] **P1** `src/pages/cost/CostDashboard.tsx:12` — 为初始 query 设置合理的 `timeValue` 默认值（如当前月份 `yyyy-MM`），或在 fetchData 中处理 timeValue 为空的分支

### P2（可选）

- [ ] **P2** `src/pages/cost/CostDashboard.tsx:53` — 拆分过长的 Statistic 行为多行 JSX
- [ ] **P2** `src/pages/cost/CostDashboard.tsx:20-23` — 考虑使用 `Promise.allSettled` 替代 `Promise.all`，使 dashboard 和 stat 请求互不影响
- [ ] **P2** `src/pages/cost/components/CostTable.tsx:15` — 为 `render: (v: number) => v.toFixed(2)` 添加空值保护，如 `render: (v: number | null) => (v ?? 0).toFixed(2)`
