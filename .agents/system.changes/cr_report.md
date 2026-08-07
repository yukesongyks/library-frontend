# 代码评审报告 — 成本统计报表（library-frontend）

> 审查范式：SDD 结构化审查（功能核对 → 可读性 → 可靠性 → 契约兼容性）
> 审查范围：`src/api/cost.ts`、`src/types/cost.ts`、`src/constants/cost.ts`、`src/utils/request.ts`、`src/utils/format.ts`、`src/stores/auth.ts`、`src/router/index.ts`、`src/router/guard.ts`、`src/views/cost/CostDashboardView.vue`、`src/views/cost/CostAnalysisView.vue`、`src/components/cost/CostSummaryCard.vue`、`src/components/cost/ImportDialog.vue`、`src/components/charts/CostTrendChart.vue`、`src/components/charts/CostDistributionChart.vue`
> 基准文档：`.agents/system.changes/design.md`（系分设计）、`cost-statistics-report-implementation-plan.md`（实施计划）、`agents/changes/.../dima.md`（需求澄清）
> 审查日期：2026-08-07

---

## 一、审查结论

| 维度 | 结论 |
|------|------|
| 整体评价 | **通过（有条件）** — 需修复 1 个 Blocker 后可合入 |
| Blocker | 1 |
| Major | 3 |
| Minor | 5 |
| 契约兼容性 | 向后兼容（新增字段/接口，无破坏性变更） |

---

## 二、Blocker 问题

### B-01 [可靠性/契约] `importCost` 手动设置 `Content-Type: multipart/form-data` 导致后端无法解析

- **文件**：`[library-frontend] src/api/cost.ts:62-65`
- **代码**：
  ```ts
  return post<ImportResultVO>('/cost/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })
  ```
- **问题**：axios（本项目为 1.x 版本）在发送 `FormData` 时会自动设置 `Content-Type` 并附加 `boundary` 参数。手动指定 `'Content-Type': 'multipart/form-data'` 会覆盖自动生成的 boundary，导致请求头变为 `Content-Type: multipart/form-data`（无 boundary），后端 `MultipartFile` 解析失败，抛出 `Missing boundary` 异常。
- **影响**：W06 Excel 导入功能完全不可用，管理员无法批量导入成本数据。
- **证据**：`node_modules/axios/package.json` 确认为 axios 1.x；`src/types/cost.ts:169` `ImportResultVO` 为后端期望响应。
- **修复建议**：移除 `headers` 配置，让 axios 自动处理：
  ```ts
  return post<ImportResultVO>('/cost/import', formData, {
    timeout: 60000
  })
  ```

---

## 三、Major 问题

### M-01 [可读性] `parseFilenameFromDisposition` 死导入

- **文件**：`[library-frontend] src/api/cost.ts:9`
- **代码**：
  ```ts
  import { triggerDownload, parseFilenameFromDisposition } from '@/utils/format'
  ```
- **问题**：`parseFilenameFromDisposition` 被导入但从未在 `cost.ts` 中使用。`exportCost` 实际使用 `buildExportFilename` 本地构造文件名，而非从 `Content-Disposition` 响应头解析。
- **影响**：TS `noUnusedLocals` 或 ESLint `no-unused-vars` 规则会报错；tree-shaking 虽能移除，但代码可读性降低。
- **修复建议**：移除未使用的导入，仅保留 `triggerDownload`。

### M-02 [可读性] `exportCost` 注释与实现不一致

- **文件**：`[library-frontend] src/api/cost.ts:71-76`
- **代码**：
  ```ts
  export async function exportCost(params: CostExportParams): Promise<void> {
    const blob = await downloadBlob('/cost/export', { ...params })
    // 从响应头提取文件名（后端 Content-Disposition: attachment; filename=cost_export.xlsx）
    const filename = buildExportFilename(params)
    triggerDownload(blob, filename)
  }
  ```
- **问题**：注释声称"从响应头提取文件名"，但实际调用 `buildExportFilename(params)` 用当前日期 + type + format 本地拼接文件名，与 `Content-Disposition` 无关。`downloadBlob` 仅返回 `Blob`，不携带响应头信息。
- **影响**：注释误导维护者，可能误以为已对齐后端文件名约定。
- **修复建议**：修改注释为 `// 本地构造导出文件名`，或改为真正从响应头解析（需 `downloadBlob` 返回完整 response）。

### M-03 [可靠性] `getHumanRowKey` 行键冲突风险

- **文件**：`[library-frontend] src/views/cost/CostAnalysisView.vue:554-556`
- **代码**：
  ```ts
  function getHumanRowKey(row: CostHumanVO): string {
    return `${row.personName}-${row.costPeriod}-${row.roleCode}`
  }
  ```
- **问题**：以 `personName` 作为行键组成部分，若同一月份同一角色存在同名人员（或 `personName` 含 `-` 字符），会产生键冲突，导致 `el-table` 渲染异常（Vue diff 复用错误行）。`CostHumanVO` 未返回 `id` 唯一标识。
- **影响**：同名人员场景下表格渲染错乱。
- **修复建议**：后端 `CostHumanVO` 应增加 `id` 字段作为主键；前端在 `id` 缺失时退化为复合键并加索引后缀。

---

## 四、Minor 问题

### m-01 [可读性] `buildHumanParams`/`buildProjectParams` 未标注返回类型

- **文件**：`[library-frontend] src/views/cost/CostAnalysisView.vue:416, 430`
- **问题**：函数返回匿名对象字面量，未显式标注返回类型。TS 能推断但 IDE 跳转/文档生成不友好。
- **修复建议**：标注返回 `CostHumanListDTO` / `CostProjectListDTO`。

### m-02 [可靠性] `handleTabChange` 中 `activeTab.value = tab` 冗余

- **文件**：`[library-frontend] src/views/cost/CostAnalysisView.vue:479-481`
- **问题**：`el-tabs` 已用 `v-model="activeTab"`，`@tab-change` 触发时 `activeTab` 已被更新。函数内再次赋值虽无害但属冗余代码。
- **修复建议**：移除 `activeTab.value = tab`，仅保留数据加载逻辑。

### m-03 [可读性] `formatPersonMonths` 与 `format.ts` 中 `formatMoney` 职责重叠

- **文件**：`[library-frontend] src/views/cost/CostAnalysisView.vue:536-541`
- **问题**：组件内定义了局部 `formatPersonMonths`，而 `utils/format.ts` 已有通用格式化工具。应统一收敛到 `format.ts`。
- **修复建议**：将 `formatPersonMonths` 移至 `utils/format.ts`，复用 `NullableNumber` 空值判断逻辑。

### m-04 [可靠性] `CostDashboardView` 缺少 `granularity` 选择器

- **文件**：`[library-frontend] src/views/cost/CostDashboardView.vue`
- **问题**：`DashboardDTO` 类型定义了可选 `granularity?: Granularity`，但 Dashboard 视图未提供粒度切换 UI，固定传 `month`。需求描述提到"月份、季度、年度"维度展示。
- **影响**：季度/年度趋势展示能力缺失，需求覆盖不完整。
- **修复建议**：在 Dashboard 筛选区增加 `granularity` 下拉选择器。

### m-05 [契约] `ExportType` 包含 `'dashboard'` 但视图未使用

- **文件**：`[library-frontend] src/types/cost.ts:34`、`src/views/cost/CostAnalysisView.vue:509-525`
- **问题**：`ExportType = 'human' | 'project' | 'dashboard'`，但 `CostAnalysisView.handleExport` 仅传 `type = activeTab.value`（值为 `'human' | 'project'`）。`'dashboard'` 类型在 AnalysisView 无法触发，Dashboard 视图也未暴露导出入口。
- **影响**：Dashboard 报表导出能力未前端落地（需确认是否在后续迭代）。
- **修复建议**：在 `CostDashboardView` 增加"导出 Dashboard 报表"按钮，调用 `exportCost({ type: 'dashboard', ... })`。

---

## 五、功能核对（系分 design.md 对照）

| 系分工作项 | 前端实现 | 结论 |
|------------|----------|------|
| W01 登录 | `LoginView.vue` + `auth.ts` + `guard.ts` | ✅ 已实现 |
| W02 Dashboard 概览 | `CostDashboardView.vue` + `getDashboard` | ✅ 已实现（缺 granularity 选择器，见 m-04） |
| W03 人力成本明细 | `CostAnalysisView.vue` Tab1 + `listHuman` | ✅ 已实现 |
| W04 项目成本明细 | `CostAnalysisView.vue` Tab2 + `listProject` | ✅ 已实现 |
| W05 多维度聚合 | `aggregate` API 已定义 | ⚠️ API 层已定义，但视图层未调用 `aggregate`（仅 Dashboard 内部使用 distribution 字段） |
| W06 Excel 导入 | `ImportDialog.vue` + `importCost` | ❌ Blocker B-01 导致功能不可用 |
| W07 报表导出 | `CostAnalysisView` 导出下拉 + `exportCost` | ✅ 已实现（AnalysisView 覆盖 human/project） |
| 组织实体下拉 | `listDeptOptions`/`listBizLineOptions`/`listProjectOptions` | ✅ 已实现并接入 `loadOptions` |

---

## 六、跨仓契约兼容性检查

| 检查点 | 结论 |
|--------|------|
| API 路径对齐 | `/cost/dashboard`、`/cost/human/list`、`/cost/project/list`、`/cost/aggregate`、`/cost/import`、`/cost/export`、`/cost/options/{dept,bizLine,project}`、`/cost/template/{type}` — 与 design.md §4.1 一致 ✅ |
| 响应结构 | `ApiResponse{code, message, data}` — `request.ts` 拦截器统一解包 `data` ✅ |
| 字段命名 | 驼峰命名一致（`deptName`、`projectName`、`yoyGrowthRate` 等） ✅ |
| 枚举值 | `HumanRoleCode`(DEV/QA/PM/OPS)、`Dimension`、`Granularity`、`CompareType`、`ExportFormat` — 与系分一致 ✅ |
| 向后兼容 | 本次为新增功能，无破坏性接口变更 ✅ |
| 后端依赖 | 需后端提供 W02-W07 接口，前端已按契约编码，待联调 |

---

## 七、可读性与规范检查

| 检查项 | 结论 |
|--------|------|
| 文件头注释 | API 层、类型层均有对齐 design.md 的注释 ✅ |
| 函数注释 | 关键函数均有 JSDoc ✅ |
| 命名规范 | 组件 PascalCase、函数 camelCase、常量 UPPER_SNAKE ✅ |
| 组件拆分 | 视图/组件/图表分层清晰 ✅ |
| 类型安全 | `NullableNumber` 统一处理 null，模板内 `?? '-'` 兜底 ✅ |
| 错误处理 | `try/catch + ElMessage.error` 统一模式 ✅ |

---

## 八、修复优先级

| 优先级 | 问题编号 | 描述 |
|--------|----------|------|
| P0（阻断合入） | B-01 | `importCost` Content-Type 修复 |
| P1（本迭代修） | M-01, M-02, M-03 | 死导入、误导注释、行键冲突 |
| P2（下迭代修） | m-01 ~ m-05 | 可读性/需求覆盖优化 |

---

## 九、blocker_count

```
1
```
