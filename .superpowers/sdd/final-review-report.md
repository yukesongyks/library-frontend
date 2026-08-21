# 成本统计报表 — 全分支最终一致性审查报告（静态审查）

- 审查方式：纯静态读码核对，未运行任何构建/测试命令，未做任何 git 写操作
- 范围：library-backend-main 与 library-frontend-main 两仓库待审文件
- 测试背景（来自已知背景，非本次运行结果）：后端 surefire 18 tests 0 失败；前端 vitest 13 tests 全绿 + tsc/vite build 通过；T9 两处修复已确认在代码中（见 4.1 / 4.2）

---

## 1. 契约逐条核对结论

### 契约 1：维度枚举 7 项一致；角色枚举 DEV/TEST/PM/OPS — ✅
- 后端 `DIMENSIONS = Set.of("department","project","business_line","employee","month","quarter","year")` — CostServiceImpl.java:36-37
- 后端 `ROLES = Set.of("DEV","TEST","PM","OPS")` — CostServiceImpl.java:38；非白名单角色抛 400 — CostServiceImpl.java:103-105
- 前端 `type Dimension` 7 项联合类型 — src/api/types.ts:1-8；`ROLES = ['DEV','TEST','PM','OPS']` — types.ts:20-21
- 前后端枚举完全一致 ✅

### 契约 2：统一响应体 {code,message,data}，code=0 成功；统一前缀 /api — ✅
- 后端 `ApiResponse<T>(int code, String message, T data)`，`ok()` code=0 — common/ApiResponse.java:3-7；异常也走统一体 `fail(code,message)` — ApiResponse.java:9-11、GlobalExceptionHandler.java:11-21
- 控制器前缀 `/api/cost` — controller/CostController.java:22
- 前端 `ApiResponse<T>` 类型 code/message/data — src/api/types.ts:30-34；axios baseURL `/api` — src/api/client.ts:4-7；响应拦截器对 code!==0 拒绝 — client.ts:9-18；`unwrap` 取 `resp.data.data` — client.ts:20-23
- 导出接口为二进制下载（契约 4 单独定义了其响应头），不属于 JSON 信封场景，不视为违约 ✅

### 契约 3：分析结果项字段 + 总览字段 — ✅（字段名逐字一致）
- `CostAnalysisItem(String name, BigDecimal laborCost, BigDecimal projectBudget, BigDecimal projectActual, double budgetRatio, BigDecimal overBudgetAmount)` — dto/CostAnalysisItem.java:5-7；前端同名接口 — types.ts:53-60
- `CostSummaryDTO(BigDecimal totalCost, BigDecimal laborCost, BigDecimal projectCost, double laborRatio, double projectRatio, int overBudgetCount, List<MonthlyTrendItem> monthlyTrend)` — dto/CostSummaryDTO.java:6-9；前端同名 — types.ts:43-51
- `MonthlyTrendItem(String month, BigDecimal laborCost, BigDecimal projectCost, BigDecimal totalCost)` — dto/MonthlyTrendItem.java:6-7；前端同名 — types.ts:36-41
- `AnalysisResponse(List<CostAnalysisItem> records, long total)` — dto/AnalysisResponse.java:5；前端 records/total — types.ts:62-65 ✅

### 契约 4：导出 GET /api/cost/export?dimension&year&month&quarter&role&format=xlsx|csv；Content-Type；Content-Disposition — ✅
- `@GetMapping("/export")`，AnalysisQuery 绑定 dimension/year/month/quarter/role + `@RequestParam(defaultValue="xlsx") format` — CostController.java:43-45
- csv → `text/csv;charset=UTF-8`（CostController.java:52-54）；xlsx → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`（CostController.java:56-57）— 与契约字面一致
- `Content-Disposition: attachment; filename="cost-report-<year>.<ext>"` — CostController.java:59-60
- 前端 `buildExportUrl` 生成 `/api/cost/export?...&format=` 完整参数 — src/api/cost.ts:12-24；页面 `<a download>` 导出 — pages/CostAnalysis.tsx:118-127 ✅
- 导出前经 `queryItems` 完整校验（dimension/年份/period/role）— CostServiceImpl.java:96-105 ✅

### 契约 5：分析查询参数名 dimension/year/month/quarter/role（camelCase 前后端一致）— ✅
- 后端 `AnalysisQuery` 字段 dimension/year/month/quarter/role — dto/AnalysisQuery.java:11-15
- 前端 `AnalysisQuery` 类型同名且可选 — types.ts:67-73；请求 `params: query` 直接序列化同名参数 — src/api/cost.ts:8-10；导出 URL 参数同名 — cost.ts:16-21 ✅

### 契约 6：金额 number、2 位小数展示；百分比 number；budgetRatio=实际÷预算×100、预算 0 记 0；overBudgetAmount=实际−预算 — ✅
- BigDecimal/double 经 Jackson 序列化为 JSON number；`ratio()` = part×100/whole，2 位 HALF_UP，whole==0 → 0.0 — CostServiceImpl.java:271-276；`overBudgetAmount = projectActual.subtract(projectBudget)` — CostServiceImpl.java:163；`budgetRatio = ratio(projectActual, projectBudget)` — CostServiceImpl.java:162
- 前端 `formatMoney` 用 `Intl.NumberFormat('zh-CN', {style:'currency', currency:'CNY', min/max 2 位})` — src/utils/format.ts:5-10；`formatPercent` toFixed(2)+'%' — format.ts:13-18；表格各金额/占比列均格式化 — pages/CostAnalysis.tsx:35-67、Dashboard.tsx:71-88 ✅

### 契约 7：统计口径：quarter 键 YYYY-Qn、month YYYY-MM、year YYYY；角色筛选同时作用于人力与项目成本归属（employee 维度）— ✅
- `timeKey`：quarter → `year + "-" + quarterOf(month)`（如 2025-Q1）、month → 原样 `2025-01`、year → `year` — CostServiceImpl.java:210-217；`quarterOf` 计算 Q1-Q4 — CostServiceImpl.java:278-281；季度/月份行标签即该 key — CostServiceImpl.java:156
- 角色筛选：人力行按 role 过滤 — CostServiceImpl.java:107-109；employee 维度下项目成本仅归集到"通过角色筛选后的人力行所关联员工"（`projectEmployeeIds` 由过滤后的 laborRows 构建 — CostServiceImpl.java:124-127；entityDimKeys 的 employee 分支 — CostServiceImpl.java:237）— 即角色同时作用于人力与项目成本归属 ✅
- 期间过滤 month/quarter 同时作用于人力与项目成本行 — CostServiceImpl.java:107-113、matchesPeriod:199-204 ✅

### 契约 8：前端路由 / = Dashboard、/cost-analysis = CostAnalysis；vite proxy /api → http://localhost:8080 — ✅
- `src/App.tsx:20-23` Routes：`/` → Dashboard、`/cost-analysis` → CostAnalysis；菜单 selectedKeys 按 pathname — App.tsx:6-8,17
- `vite.config.ts:7-12` server.port 5173，`'/api': 'http://localhost:8080'` — 与契约一致 ✅

---

## 2. 发现的问题（按严重度分级）

### Critical（0）
无。

### Important（1）
- **I-1 月度/季度维度下"项目预算"按活跃期间重复计入年度预算，跨维度加总口径不一致**
  - 位置：CostServiceImpl.java:136-146（`budgetKey = key + "#" + row.projectId()` 仅防止同一 key 内重复；key 为月/季度时每个有耗用的月/季度都会各加一次完整年度预算），预算来源为 project.budget_amount（年预算，CostReportMapper.java:25-35 JOIN project）
  - 影响：month 维度下 6 个月均有耗用的项目，其项目预算总计入 6×年度预算；quarter 维度为 N×；year 维度为 1×。同一项目在不同维度下预算加总不一致；月度行的 budgetRatio 语义实为"当月实际 ÷ 年度预算"，行内展示自洽但行间加总失真（示例：项目 1 预算 1,000,000、每月实际 100,000 → 每月行显示预算 1,000,000、占比 10%）
  - 判定：合同（第 6/7 条）未定义月/季度预算口径，数据模型也只有年度预算，故**不构成契约违约**；但属报表口径风险，建议明确口径（如按 12 个月分摊，或表头/文档标注"预算为年度预算"）后交付

### Minor（9）
- **M-1** 前端 axios 错误分支只 `Promise.reject(error)`，未取后端 body.message；400 校验失败时（如非法 dimension）用户看到 "Request failed with status code 400" 而非后端中文消息 — src/api/client.ts:17（对比成功分支 client.ts:12-13 有取 message；后端 GlobalExceptionHandler.java:11-15 已返回中文 message）
- **M-2** CostAnalysis 无请求竞态保护（Dashboard 有 `cancelled` 标志 — pages/Dashboard.tsx:16-33；CostAnalysis.load 无 — pages/CostAnalysis.tsx:21-33），快速切换筛选时先发请求后返回可能覆盖新结果
- **M-3** Table `rowKey={(r) => r.name}` — pages/CostAnalysis.tsx:133；schema 仅 code 唯一（schema.sql:14,26,37），同名项目/员工会导致 React key 冲突
- **M-4** EChart 依赖 `[option]`，每次渲染 option 引用变化即 dispose 重建实例，且无 window resize 处理 — components/EChart.tsx:16-23
- **M-5** CSV 输出无 UTF-8 BOM，Excel 直接打开中文表头可能乱码（Content-Type 已按契约 `text/csv;charset=UTF-8`，无违约）— exporter/CostExporter.java:46-57
- **M-6** 导出 format 未校验，任意非 csv 值静默降级为 xlsx（CostController.java:47,56）；year 为空时文件名用 "all" 而数据实际取当前年（CostController.java:48 vs CostServiceImpl.java:179-188），文件名与实际数据年份可能不一致
- **M-7** GlobalExceptionHandler 500 分支透出异常 message 给客户端（`服务器内部错误: ` + ex.getMessage()）— GlobalExceptionHandler.java:17-21，轻微信息泄露
- **M-8** 页面未暴露 month/quarter 筛选控件（后端与前端类型已支持，仅 UI 缺）— pages/CostAnalysis.tsx:89-114；不影响前后端一致性，属功能裁剪
- **M-9** 部门维度归集口径混用：人力成本按员工所属部门（laborDimKey 用 row.departmentId，来自 employee 表 join — CostServiceImpl.java:221、CostReportMapper.java:16），项目成本按项目所属部门（entityDimKeys 用 project.getDepartmentId() — CostServiceImpl.java:234）；员工部门与项目部门不同时，同一部门行的两类成本来源口径不一致（seed 数据恰好对齐，无现网影响）

---

## 3. 已知背景修复验证（附证据）
- T9-1：CostAnalysis chartOption 已标注 `EChartsOption | null` — pages/CostAnalysis.tsx:69（Dashboard 同样标注 — Dashboard.tsx:35）
- T9-2：测试 combobox role 查询（不在待审清单内，背景说明，未复核测试文件）

---

## 4. 最终结论

**可交付。** 契约 8 项全部 ✅ 满足，无 Critical 阻断项；唯一 Important（I-1）为月度/季度预算口径的确认建议而非契约违约，建议在交付说明中明确口径或按 I-1 建议处理；其余为 Minor 级健壮性/可维护性改进（M-1~M-9），不阻塞交付。

问题统计：Critical 0 / Important 1 / Minor 9，合计 10。