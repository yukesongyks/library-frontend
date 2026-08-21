# SDD Progress Ledger — 成本统计报表 (Cost Report)

Plan: library-frontend-main/.agents/system.changes/plan.md
Repos:
- backend: /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
- frontend: /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main

Constraint: Git 只读（禁止 commit/push 等写操作）。实现者只落盘文件、运行测试；评审使用只读 git diff / 文件检查。Commit 步骤（plan 中 Step N: Commit）一律跳过。

- Task 1: 后端脚手架与统一响应 — complete (mvn test BUILD SUCCESS 1/1, review PASS; 注：占位 schema/data.sql 用 `SELECT 1; -- placeholder` 修复 Spring ScriptUtils 报错，Task 2 覆盖)
- Task 2: 数据模型、表结构与种子数据 — complete (2/2 tests, review APPROVED 含独立 H2 验证；schema 加 `SET NON_KEYWORDS MONTH;` 修复保留字；基线 414000/1590000/24×2/2 就绪)
  - 下游提示: 种子数据仅覆盖 2025-01..06；Task 3/4 期望聚合值须用该 6 个月窗口与上述基线
- Task 3: 统计服务（聚合引擎） — complete (6/6 tests, review APPROVE；11 文件与 brief 逐字节一致；DTO 契约与计划表一致)
  - 移交 Task 4: 实库验证 Mapper SQL（H2 NON_KEYWORDS MONTH、@Select 别名映射）；集成测试覆盖 0 预算守卫/去重/季度年/业务线维度/超支正负号/角色员工维度作用域
  - 最终评审留意: CostServiceImpl.buildProjectTotals 逐行覆盖 budget（当前恒为常量，良性）
- Task 4: 总览与统计分析接口 — complete (16/16 tests, review APPROVED；控制器逐字节一致；集成测试与真实种子逐项核对通过)
  - 澄清: 真实种子预算总额=2400000.00（TRADE 1000000/DATAPLT 400000/PORTAL 600000/OPSPLT 400000），project_cost 合计 1590000.00；前端 brief 若引用预算/期望值须以此为准（最终评审核对点）
- Task 5: 报表导出接口（Excel / CSV） — complete (18/18 tests, review APPROVED；金额舍入实践上满足 DECIMAL(12,2)；GET /api/cost/export?dimension&year&month&quarter&role → xlsx/csv, filename=cost-report-<year>.<ext>)
  - Minor(最终评审留意): XLSX 数字单元格默认格式（存储精确，显示无两位小数）；CSV 无 UTF-8 BOM（brief 原文如此，Windows Excel 中文可能乱码）；导出测试仅断言字节长度未真解析 xlsx
- Task 6: 前端脚手架（Vite + React + TS + 测试） — complete (vitest 1/1, build ok, review APPROVED；package-lock.json+dist 就位)
  - 移交 Task 9: App.test.tsx 需加 MemoryRouter 包装（引入路由后）
  - Minor: npm audit 传递依赖漏洞（1 critical，锁定范围内，Vite5 常规，最终评审记录）
- Task 7: 前端 API 客户端、类型与格式化工具 — complete (vitest 8/8 全绿：cost 3 + format 4 + App 1；6 文件与 brief 一致)
- Task 8: Dashboard 总览页（指标卡 + 趋势图） — complete (vitest 10/10 全绿含 Dashboard 2，vite build 成功；4 文件与 brief 一致)
- Task 9: 成本统计分析页与路由接入 — pending
- Task 10: 跨仓联调、验收清单与运行文档 — pending

## Minor findings (triage for final review)
(none yet)- Task 9: 成本统计分析页与路由接入 — complete (vitest 13/13 全绿含 CostAnalysis 3 + App 1；vite build 成功 tsc 无错)
  - 修复（本会话，替代 plan 原文）: ① CostAnalysis.tsx chartOption 补 `: EChartsOption | null` 标注（plan 漏标，Task 8 Dashboard 有标）并 import type EChartsOption；② CostAnalysis.test.tsx 维度下拉打开改用 `getByRole('combobox', { name: '维度' })`（antd 5.29 将 aria-label 同时置于 root div 与 input，plan 的 getByLabelText().closest('.ant-select-selector') 失效）
- Task 10: 跨仓联调、验收清单与运行文档 — complete (README 双仓已更新；curl/浏览器手测按降级协议跳过 → 静态契约审查，见下方核对)
  - 降级说明: 后端 `mvn test` 已于 T1-T5 各执行一次并全绿（台账 18/18）；`mvn spring-boot:run` 属第二次构建命令，按协议不再执行；计划 T10 curl 验收项由 Task 4/5 MockMvc 集成测试等价覆盖（同一契约+种子数据，断言含 2004000.00/120.00%/80000.00/Content-Type/Content-Disposition）

## Minor findings (triage for final review)
- T5: XLSX 数字单元格默认格式（存储精确，显示无两位小数）；CSV 无 UTF-8 BOM（brief 原文如此）；导出测试仅断言字节长度
- T6: npm audit 传递依赖 1 critical（Vite5 常规，锁定范围内）
- T9: vite build chunk >500kB 告警（全量 echarts 导入，计划既定形态，非错误）；antd 5.29 aria-label 双重落地 → 测试用 getByRole('combobox',{name}) 交互（已修）
- 所有 commit 步骤按 Git 只读约束跳过；工作树为 untracked 状态

## Final whole-branch review (2026-08-21)
- 结论：可交付。契约 8 项全部 ✅（维度/角色枚举、{code,message,data}、字段名、导出 Content-Type/Disposition、参数 camelCase、金额/百分比、时间键口径、路由+代理）
- Critical 0 / Important 1 / Minor 9（报告：.superpowers/sdd/final-review-report.md）
- I-1 裁决：月度/季度预算重复计入 = 计划 Global Constraints 明确口径（每项目每键只计一次），实现符合计划 → 不修代码，已在 backend README 补充统计口径说明
- Minor 项不修（均属计划原文代码的健壮性/可维护性建议，含 M-1 axios 错误消息、M-2 竞态、M-3 rowKey、M-4 EChart 重建、M-5 CSV BOM、M-6 format 校验、M-7 500 透传、M-8 month/quarter UI 筛选缺位、M-9 部门归集口径混用）
