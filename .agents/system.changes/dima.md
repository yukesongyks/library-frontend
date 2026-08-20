# 成本统计报表 — 需求澄清与设计方案（draft）

## 1. 文档信息

- 任务节点：需求澄清（loop-1）
- 技能：brainstorming
- 状态：澄清进行中（clarifying）——待用户确认开放问题后定稿

## 2. 需求概述

### 2.1 业务目标
开发**成本统计报表**系统，用于统计企业各项成本支出情况，为企业成本管控提供数据支撑。

### 2.2 核心交付（来自需求描述）
| 编号 | 交付物 | 说明 |
|---|---|---|
| F1 | 成本统计分析页面 | 前端新建页面，按多种维度展示/统计数据 |
| F2 | Dashboard（仪表盘） | 成本总览、关键指标卡片与图表 |
| F3 | 报表导出 | 支持将统计结果导出为文件 |

### 2.3 统计维度
部门、项目、业务线、人员、月份、季度、年度。

### 2.4 统计指标
- **人力成本**：按角色分类统计，角色含 开发 / 测试 / 产品 / 运维。
- **项目成本**：项目预算、实际消耗、预算占比（实际消耗/项目预算）、预计超支金额（实际消耗 − 项目预算，超支为正）。

## 3. 现状与约束

- 两仓均为空骨架（`main` 仅初始提交，前端无 package.json、后端无 pom.xml），无既有数据模型、接口或前端路由可复用。
- 无显式输入数据源；成本数据（人力成本、项目预算、实际消耗）的来源、口径、样例数据均未提供 —— 见 §7 开放问题。

## 4. 方案对比（初拟）

### 方案 A：标准前后端分离全栈（⭐ 推荐）
| 层 | 技术选型 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Ant Design（沿用本系列历史任务约定）|
| 图表 | ECharts / Ant Design Charts（Dashboard 图表、趋势图、占比图）|
| 后端 | Java 17 + Spring Boot 3 + MyBatis-Plus + MySQL |
| 导出 | Apache POI（Excel）/ 前端 CSV |
| 优点 | 技术成熟、与历史分支技术栈一致、可扩展 |
| 缺点 | 前后端联调成本；空仓需完整脚手架 |

### 方案 B：轻量全栈（Node.js + React/Vue + SQLite）
| 优点 | 起步快、无需独立数据库服务 |
| 缺点 | 与系列既有技术栈不一致，企业级场景吞吐与健壮性弱 |

### 方案 C：报表直出静态方案（纯前端模拟数据 + CSV 导出）
| 优点 | 实现最快 |
| 缺点 | 无真实数据闭环，不满足"统计企业成本"的落地需求 |

**推荐**：方案 A（与历史任务 `220ea5c8` 确立的 React + Spring Boot 技术栈保持一致）。

## 5. 数据模型（初拟，待确认数据来源后定稿）

- `department` 部门（id, name, code, parent_id）
- `project` 项目（id, name, code, business_line_id, budget_amount, status）
- `business_line` 业务线（id, name, code）
- `employee` 人员（id, name, employee_no, department_id, role, cost_center）
- `labor_cost` 人力成本（id, employee_id, project_id?, month, amount, cost_type（开发/测试/产品/运维））
- `project_cost` 项目成本（id, project_id, month, budget_amount, actual_amount）

> 以上为草稿。若数据来源为外部系统导出/汇总口径，模型可能简化为"统计结果表 + 维表"。

## 6. 接口契约（初拟）

- 基础路径统一 `/api` 前缀；统一响应体 `{ code, message, data }`。
- `GET /api/cost/summary`：Dashboard 总览（总成本、人力/项目成本占比、超支预警数量）。
- `GET /api/cost/analysis?dimension=department|project|business_line|employee|month|quarter|year&role=...&dateRange=...`：多维度统计。
- `GET /api/cost/export?<与 analysis 相同参数>`：报表导出（Excel/CSV，格式待确认）。
- 分页协议 `page(0-based)/size → { records, total, current, size }`。
- 日期格式 `YYYY-MM-DD`；金额精度 `DECIMAL(12,2)` / 前端保留 2 位小数。

## 7. 开放问题（本轮需用户澄清）

1. **数据来源**：人力成本与项目成本数据从何处来？（外部系统接口 / 人工录入 / 演示用模拟数据）
2. **导出格式**：报表导出支持哪些格式？（Excel / CSV / PDF）
3. **页面形态**：Dashboard 与统计分析页是同一路由内视图切换，还是独立路由页面？
4. **统计口径**：人力成本按角色（开发/测试/产品/运维）汇总即可，还是需要角色×项目交叉统计？
5. **技术栈确认**：是否沿用方案 A（React + Spring Boot + MySQL）？

> 用户答复后，本文件将更新为定稿设计并补充跨仓对齐点与实施计划（下一节点）。缺失条件已列明，未编造数据来源假设。