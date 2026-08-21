### Task 10: 跨仓联调、验收清单与运行文档

**Files:**
- Modify: `library-backend/README.md`（补充运行与接口说明）
- Modify: `library-frontend/README.md`（补充运行与页面说明）

**Interfaces:**
- 验证基准：本计划「Global Constraints」与「跨仓接口契约」全部条目。

- [ ] **Step 1: 启动后端并做接口冒烟（curl 验收）**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
mvn -q spring-boot:run   # 后台运行，确认端口 8080 启动成功、无日志异常
```

```bash
curl -s 'http://localhost:8080/api/cost/summary?year=2025'
# 期望 code=0 且 data.totalCost=2004000.00、overBudgetCount=1

curl -s 'http://localhost:8080/api/cost/analysis?dimension=project&year=2025'
# 期望 records 含 数据中台：budgetRatio=120.0、overBudgetAmount=80000.00

curl -sI 'http://localhost:8080/api/cost/export?dimension=department&year=2025&format=csv'
# 期望 200 且 Content-Type: text/csv;charset=UTF-8、Content-Disposition: attachment
```

- [ ] **Step 2: 启动前端并做页面验收（浏览器手测清单）**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
npm run dev   # http://localhost:5173
```

浏览器验收清单（逐项勾选）：
- [ ] `http://localhost:5173/` Dashboard 展示：总成本 ¥2,004,000.00、人力成本 ¥414,000.00（占比 20.66%）、项目成本 ¥1,590,000.00（占比 79.34%）、超支项目数 1；月度成本趋势柱状图 6 个月。
- [ ] 切到 `/cost-analysis`：默认「部门」维度展示 研发部/产品部 两行，研发部占比 71.67%。
- [ ] 维度切换为「项目」：出现 核心交易系统/数据中台/客户门户/运维支撑平台；数据中台 预算占比 120.00%、预计超支金额 ¥80,000.00。
- [ ] 维度「季度」：展示 2025-Q1、2025-Q2；岗位角色选「开发」：人力成本降为 ¥120,000.00（仅张三，employee 维度）。
- [ ] 点击「导出 Excel」下载 xlsx；点击「导出 CSV」下载 csv，均可用 WPS/Excel 打开，表头为 名称/人力成本/项目预算/实际消耗/预算占比/预计超支金额。

> 降级协议：若 `mvn spring-boot:run`（Step 1）连续 2 次失败或单次超过 120s，停止联调，转入静态审查：核对本计划全部 10 个任务的代码与契约一致（字段名、类型、维度/角色枚举、URL、Content-Type），以 `[降级说明]` 记录原因；前端 `npm run dev` 同理。

- [ ] **Step 3: 更新 `library-backend/README.md`**

```markdown
# library-backend
图书管理系统后端 —— 成本统计报表服务

## 运行
- 启动: `mvn spring-boot:run`（默认端口 8080；H2 内存库自动建表并载入种子数据）
- 测试: `mvn test`

## 接口（前缀 /api，响应体 {code,message,data}）
- GET /api/cost/summary                   成本总览（年）
- GET /api/cost/analysis                  多维度统计分析（department/project/business_line/employee/month/quarter/year）
- GET /api/cost/export                    报表导出（format=xlsx|csv）
```

- [ ] **Step 4: 更新 `library-frontend/README.md`**

```markdown
# library-frontend
图书管理系统前端 —— 成本统计报表

## 运行
- 依赖: `npm install`
- 开发: `npm run dev`（端口 5173，/api 代理到 http://localhost:8080）
- 测试: `npm test`
- 构建: `npm run build`

## 页面
- `/`             成本总览 Dashboard（指标卡 + 月度趋势）
- `/cost-analysis` 成本统计分析（部门/项目/业务线/人员/月份/季度/年度 + 角色筛选，Excel/CSV 导出）
```

- [ ] **Step 5: 双端全量回归**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main && npm test && npm run build
```
Expected: 后端全部测试通过（contextLoads + SeedData 2 + Service 4 + API 5 + Export 2 ≈ 13 项）；前端全部测试通过且构建成功。

- [ ] **Step 6: Commit（双仓）**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add README.md
git commit -m "docs: 补充成本统计服务运行与接口说明

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add README.md
git commit -m "docs: 补充成本统计前端运行与页面说明

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

---

## Self-Review（自审）

**1. Spec 覆盖核对（对照需求描述逐项）：**

| 需求点 | 落点 |
|---|---|
| 前端新建成本统计分析页面 | Task 9 `CostAnalysis`（/cost-analysis） |
| 前端 Dashboard | Task 8 `Dashboard`（/） |
| 维度：部门/项目/业务线/人员/月份/季度/年度 | Task 3 `DIMENSIONS` + 前端 `DIMENSION_LABELS`；Task 9 维度下拉 |
| 人力成本（开发/测试/产品/运维） | Task 2 `employee.role` + Task 3 角色过滤；Task 7 `ROLE_LABELS` |
| 项目成本：项目预算/实际消耗/预算占比/预计超支金额 | Task 3 `CostAnalysisItem` 四指标 + 契约表 |
| 报表导出 | Task 5 后端 xlsx/csv + Task 9 前端导出链接 |

**2. Placeholder 扫描：** 每个 Step 均含完整代码与精确命令；无 TBD/TODO/「类似 Task N」类描述；跨任务引用的函数、类型、字段名全部在本计划中定义。

**3. 类型/命名一致性核对：**
- 维度枚举值 7 项在 后端 `CostServiceImpl.DIMENSIONS`、前端 `types.ts` 完全一致。
- 角色枚举 `DEV/TEST/PM/OPS` 在 后端 `ROLES`、前端 `ROLES`/`ROLE_LABELS` 一致。
- DTO JSON 字段（`totalCost/laborCost/projectCost/laborRatio/projectRatio/overBudgetCount/monthlyTrend`、`name/laborCost/projectBudget/projectActual/budgetRatio/overBudgetAmount`）在 后端 record、前端 interface、测试断言三处一致。
- `AnalysisQuery` 参数名（dimension/year/month/quarter/role）在 后端 `@ModelAttribute` 绑定、前端 `buildExportUrl`、`fetchAnalysis` 一致。
- 种子数据基准值（2004000.00 / 414000.00 / 1590000.00 / 120.00% / 80000.00）在后端集成测试（Task 4/5）、前端测试（Task 8/9）、联调验收（Task 10）三处一致。
- 排序规则统一：分析结果按 laborCost 降序、名称升序（后端 Comparator；前端测试依赖的第一行断言与之一致）。

**缺口说明（诚实声明）：** 需求未提供真实数据源与既有代码，因此数据以种子数据闭环验证；真实数据接入时仅需替换 `CostReportMapper` 查询与数据源配置，接口契约不变。导出仅覆盖分析维度视图，未包含 Dashboard 汇总导出（需求未要求）。

---

## Execution Handoff（执行交接）

计划已完整保存。执行阶段采用 **Subagent-Driven（推荐）**：每个任务派发独立实现 Agent，任务间由主 Agent 按各任务「Interface + 测试期望」做两阶段审查（代码审查 + 运行测试），发现不一致立即回退该任务。执行 Agent 无需再等待确认，按 Task 1 → Task 10 顺序推进；任何一任务触发降级协议（同模块构建连续 2 次失败 / 跨仓环境问题 / 单次构建 >120s / 单仓构建命令已执行 1 次）时，停止构建并以 `[降级说明]` 开头输出原因，转为跨仓契约静态审查。

> 验证总耗时上限 5 分钟；若触发全局时间约束，输出 `## ⚠️ 时间约束降级报告` 后终止。
