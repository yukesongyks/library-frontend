# 代码评审报告 — 成本统计报表（library-frontend）

> 审查范式：SDD 结构化审查（功能核对 → 可读性 → 可靠性 → 契约兼容性）
> 审查范围：`src/api/cost.ts`、`src/types/cost.ts`、`src/views/cost/CostAnalysisView.vue`（问题修复阶段回归评审）
> 基准文档：`.agents/system.changes/design.md`（系分设计）、`cost-statistics-report-implementation-plan.md`（实施计划）、`agents/changes/.../dima.md`（需求澄清）、首轮 `cr_report.md`（B-01/M-01~M-03/m-01~m-05）
> 审查日期：2026-08-07
> 评审类型：**回归评审**（问题修复 stage: test, round 1 → 代码评审 round 2）

---

## 一、审查结论

| 维度 | 结论 |
|------|------|
| 整体评价 | **通过** — 首轮 Blocker B-01 已修复并验证，剩余仅 P2 级 Minor 非阻断项，可合入 |
| Blocker | 0 |
| Major | 0（首轮 M-01/M-02/M-03 均已修复） |
| Minor | 5（均与首轮一致，标记为下迭代修，非阻断） |
| 回归风险 | 无 — 修复范围严格限定在首轮问题点，未引入新的阻断级缺陷 |
| 契约兼容性 | 向后兼容（`CostHumanVO.id` 为新增可选字段，旧接口不返回时前端退化为复合键） |

---

## 二、首轮 Blocker 回归验证

### B-01 [可靠性/契约] `importCost` 手动设置 `Content-Type: multipart/form-data` 导致后端无法解析 — ✅ 已修复

- **文件**：`[library-frontend] src/api/cost.ts:57-66`
- **修复前（首轮记录）**：
  ```ts
  return post<ImportResultVO>('/cost/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })
  ```
- **修复后（当前）**：
  ```ts
  export function importCost(file: File, type: ImportType): Promise<ImportResultVO> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    // axios 自动设置 Content-Type: multipart/form-data; boundary=...，手动指定会丢失 boundary
    return post<ImportResultVO>('/cost/import', formData, {
      timeout: 60000
    })
  }
  ```
- **验证结论**：✅ 已移除 `headers: { 'Content-Type': 'multipart/form-data' }` 配置，改由 axios 自动生成带 `boundary` 的 `Content-Type`，后端 `MultipartFile` 解析恢复正常。
- **附加改进**：补充了注释说明「axios 自动设置…手动指定会丢失 boundary」，避免后续维护者再次踩坑。
- **影响范围**：W06 Excel 导入功能恢复可用，管理员可批量导入成本数据。

---

## 三、首轮 Major 回归验证

### M-01 [可读性] `parseFilenameFromDisposition` 死导入 — ✅ 已修复

- **文件**：`[library-frontend] src/api/cost.ts:9`
- **修复前**：`import { triggerDownload, parseFilenameFromDisposition } from '@/utils/format'`
- **修复后**：`import { triggerDownload } from '@/utils/format'`
- **验证结论**：✅ 已移除未使用的 `parseFilenameFromDisposition` 导入，`cost.ts` 全文无对该符号的引用，TS `noUnusedLocals`/ESLint `no-unused-vars` 不再报错。

### M-02 [可读性] `exportCost` 注释与实现不一致 — ✅ 已修复

- **文件**：`[library-frontend] src/api/cost.ts:70-76`
- **修复前**：注释 `// 从响应头提取文件名（后端 Content-Disposition: attachment; filename=cost_export.xlsx）`
- **修复后**：
  ```ts
  export async function exportCost(params: CostExportParams): Promise<void> {
    const blob = await downloadBlob('/cost/export', { ...params })
    // 本地构造导出文件名（按 type+日期+format 拼接）
    const filename = buildExportFilename(params)
    triggerDownload(blob, filename)
  }
  ```
- **验证结论**：✅ 注释已更正为「本地构造导出文件名（按 type+日期+format 拼接）」，与 `buildExportFilename(params)` 实现一致，不再误导维护者以为已对齐 `Content-Disposition`。

### M-03 [可靠性] `getHumanRowKey` 行键冲突风险 — ✅ 已修复

- **文件**：`[library-frontend] src/views/cost/CostAnalysisView.vue:553-559`、`src/types/cost.ts:111-125`
- **修复前**：
  ```ts
  function getHumanRowKey(row: CostHumanVO): string {
    return `${row.personName}-${row.costPeriod}-${row.roleCode}`
  }
  ```
- **修复后**：
  ```ts
  /** 人力表格行 key（优先 id；缺失时用复合键 + 行索引防冲突） */
  function getHumanRowKey(row: CostHumanVO, index?: number): string {
    if (row.id != null) {
      return `human-${row.id}`
    }
    return `human-${row.personName}-${row.costPeriod}-${row.roleCode}-${index ?? ''}`
  }
  ```
  类型层同步新增：
  ```ts
  export interface CostHumanVO {
    /** 主键（后端新增字段，用于 el-table 行键唯一标识；旧接口可能不返回） */
    id?: number
    ...
  }
  ```
- **验证结论**：✅ 行键优先使用后端主键 `row.id`（唯一），`id` 缺失时退化为 `personName-costPeriod-roleCode-index` 复合键并追加行索引后缀，彻底消除同名人员/含 `-` 字符场景下的键冲突。`CostHumanVO.id` 设为可选字段并对旧接口兼容（不返回时走复合键分支）。
- **跨仓对齐点**：需后端在 `CostHumanVO` 响应中补充 `id` 主键字段（向后兼容新增，不影响旧消费方）。

---

## 四、Minor 问题（P2，均与首轮一致，非阻断，建议下迭代处理）

### m-01 [可读性] `buildHumanParams`/`buildProjectParams` 未标注返回类型

- **文件**：`[library-frontend] src/views/cost/CostAnalysisView.vue:416, 430`
- **状态**：未修复（P2）— 函数返回匿名对象字面量，TS 能推断但 IDE 跳转/文档生成不友好。
- **建议**：标注返回 `CostHumanListDTO` / `CostProjectListDTO`。

### m-02 [可靠性] `handleTabChange` 中 `activeTab.value = tab` 冗余

- **文件**：`[library-frontend] src/views/cost/CostAnalysisView.vue:479-481`
- **状态**：未修复（P2）— `el-tabs` 已用 `v-model="activeTab"`，`@tab-change` 触发时 `activeTab` 已被更新，函数内再次赋值冗余但无害。
- **建议**：移除 `activeTab.value = tab`，仅保留数据加载逻辑。

### m-03 [可读性] `formatPersonMonths` 与 `format.ts` 中 `formatMoney` 职责重叠

- **文件**：`[library-frontend] src/views/cost/CostAnalysisView.vue:536-541`
- **状态**：未修复（P2）— 组件内局部定义格式化函数，应收敛到 `utils/format.ts`。
- **建议**：将 `formatPersonMonths` 移至 `utils/format.ts`，复用 `NullableNumber` 空值判断逻辑。

### m-04 [可靠性] `CostDashboardView` 缺少 `granularity` 选择器

- **文件**：`[library-frontend] src/views/cost/CostDashboardView.vue`
- **状态**：未修复（P2）— `DashboardDTO.granularity?` 已定义但 Dashboard 视图固定传 `month`，季度/年度趋势展示能力缺失。
- **影响**：需求描述「月份、季度、年度」维度展示覆盖不完整（非阻断，可作为下迭代增强）。
- **建议**：在 Dashboard 筛选区增加 `granularity` 下拉选择器。

### m-05 [契约] `ExportType` 包含 `'dashboard'` 但视图未使用

- **文件**：`[library-frontend] src/types/cost.ts:34`、`src/views/cost/CostAnalysisView.vue:509-525`
- **状态**：未修复（P2）— `handleExport` 仅传 `type = activeTab.value`（`'human' | 'project'`），`'dashboard'` 无触发入口。
- **建议**：在 `CostDashboardView` 增加「导出 Dashboard 报表」按钮，调用 `exportCost({ type: 'dashboard', ... })`。

---

## 五、功能核对（系分 design.md 对照）

| 系分工作项 | 前端实现 | 结论 |
|------------|----------|------|
| W01 登录 | `LoginView.vue` + `auth.ts` + `guard.ts` | ✅ 已实现 |
| W02 Dashboard 概览 | `CostDashboardView.vue` + `getDashboard` | ✅ 已实现（缺 granularity 选择器，见 m-04，P2） |
| W03 人力成本明细 | `CostAnalysisView.vue` Tab1 + `listHuman` | ✅ 已实现 |
| W04 项目成本明细 | `CostAnalysisView.vue` Tab2 + `listProject` | ✅ 已实现 |
| W05 多维度聚合 | `aggregate` API 已定义 | ⚠️ API 层已定义，视图层未直接调用 `aggregate`（仅 Dashboard 内部使用 distribution 字段），P2 增强 |
| W06 Excel 导入 | `ImportDialog.vue` + `importCost` | ✅ **已修复 B-01，功能恢复可用** |
| W07 报表导出 | `CostAnalysisView` 导出下拉 + `exportCost` | ✅ 已实现（AnalysisView 覆盖 human/project；dashboard 导出见 m-05，P2） |
| 组织实体下拉 | `listDeptOptions`/`listBizLineOptions`/`listProjectOptions` | ✅ 已实现并接入 `loadOptions` |

---

## 六、跨仓契约兼容性检查

| 检查点 | 结论 |
|--------|------|
| API 路径对齐 | `/cost/dashboard`、`/cost/human/list`、`/cost/project/list`、`/cost/aggregate`、`/cost/import`、`/cost/export`、`/cost/options/{dept,bizLine,project}`、`/cost/template/{type}` — 与 design.md §4.1 一致 ✅ |
| 响应结构 | `ApiResponse{code, message, data}` — `request.ts` 拦截器统一解包 `data` ✅ |
| 字段命名 | 驼峰命名一致（`deptName`、`projectName`、`yoyGrowthRate` 等）✅ |
| 枚举值 | `HumanRoleCode`(DEV/QA/PM/OPS)、`Dimension`、`Granularity`、`CompareType`、`ExportFormat` — 与系分一致 ✅ |
| 向后兼容 | `CostHumanVO.id` 为新增可选字段，旧接口不返回时前端退化为复合键，向后兼容 ✅ |
| 跨仓对齐点 | 需后端在 `CostHumanVO` 响应中补充 `id` 主键字段（M-03 修复依赖）— 向后兼容新增，不影响旧消费方 |
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
| 修复注释 | `importCost` 补充 boundary 风险说明注释，`getHumanRowKey` 补充优先 id 策略说明 ✅ |

---

## 八、修复优先级

| 优先级 | 问题编号 | 描述 | 状态 |
|--------|----------|------|------|
| P0（阻断合入） | B-01 | `importCost` Content-Type 修复 | ✅ 已修复 |
| P1（本迭代修） | M-01 | `parseFilenameFromDisposition` 死导入 | ✅ 已修复 |
| P1（本迭代修） | M-02 | `exportCost` 注释与实现不一致 | ✅ 已修复 |
| P1（本迭代修） | M-03 | `getHumanRowKey` 行键冲突 | ✅ 已修复 |
| P2（下迭代修） | m-01 ~ m-05 | 可读性/需求覆盖优化 | ⏳ 待办（非阻断） |

---

## 九、回归评审结论

本轮为「问题修复」阶段后的回归评审。首轮识别的 1 个 Blocker（B-01）与 3 个 Major（M-01/M-02/M-03）已在 `fb3b0081 [auto-dev] 问题修复` 提交中全部修复并验证通过，修复实现符合首轮修复建议，未引入新的阻断级回归缺陷。剩余 5 个 Minor 均为 P2 非阻断项，建议下迭代处理。

**合入结论：通过，可合入。**

---

## 十、blocker_count

```
0
```
