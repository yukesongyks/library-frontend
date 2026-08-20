# 成本统计报表 — 需求澄清与设计方案（draft）

## 1. 文档信息

- 任务节点：需求澄清（loop-1）
- 技能：brainstorming
- 状态：澄清进行中（clarifying）——开放问题已通过提问门控提交用户，待答复后定稿
- 更新时间：2026-08-20T09:31:56Z

## 2. 需求概述

### 2.1 业务目标
开发**成本统计报表**系统，统计企业各项成本支出情况，为企业成本管控提供数据支撑。

### 2.2 核心交付（来自需求描述）
| 编号 | 交付物 | 说明 |
|---|---|---|
| F1 | 成本统计分析页面 | 前端新建页面，按多维度展示/统计数据 |
| F2 | Dashboard（仪表盘） | 成本总览、关键指标卡片与图表 |
| F3 | 报表导出 | 支持将统计结果导出为文件 |

### 2.3 统计维度
部门、项目、业务线、人员、月份、季度、年度。

### 2.4 统计指标
- **人力成本**：按角色分类统计，角色含 开发 / 测试 / 产品 / 运维。
- **项目成本**：项目预算、实际消耗、预算占比（实际消耗/项目预算）、预计超支金额（实际消耗 − 项目预算，超支为正）。

## 3. 跨仓依赖与现状摘要

| 仓库 | 现状 | 与本需求的关系 |
|---|---|---|
| library-frontend | 空骨架（仅 README.md，无 package.json/源码） | 新建 Dashboard（`/`）与成本统计分析页（`/cost-analysis`）、导出交互 |
| library-backend | 空骨架（仅 README.md，无 pom.xml/源码） | 提供 `/api/cost/*` 统计与导出接口、数据模型与种子数据 |

- 输入物：`library-frontend/.agents/system.changes/plan.md`（实施计划，已含接口契约与口径决策草案）。
- 数据流（目标）：后端数据模型/种子数据 → Service 聚合 → `/api/cost/*` JSON 契约 → 前端 axios 消费 → 页面/图表/导出。

### 仓间对齐点（初拟，待定稿）
- API 基础路径统一 `/api` 前缀；统一响应体 `{ code, message, data }`。
- 分页协议 `page(0-based)/size → { records, total, current, size }`。
- 维度枚举：`department/project/business_line/employee/month/quarter/year`；角色枚举：`DEV/TEST/PM/OPS`。
- 日期格式 `YYYY-MM-DD`（年度 `YYYY`、季度 `YYYY-Qn`、月份 `YYYY-MM`）；金额 `DECIMAL(12,2)`、前端 2 位小数。
- 导出接口参数与统计分析接口参数一致。
- CORS 允许前端开发端口。

## 4. 方案对比（初拟）

### 方案 A：标准前后端分离全栈（⭐ 推荐）
| 层 | 技术选型 |
|---|---|
| 前端 | React + TypeScript + Vite + Ant Design（沿用系列历史任务约定） |
| 图表 | ECharts / Ant Design Charts |
| 后端 | Java 17 + Spring Boot 3 + MyBatis-Plus + MySQL（演示可 H2） |
| 导出 | Apache POI（Excel）/ CSV |
| 优点 | 技术成熟、与历史分支技术栈一致、可扩展 |
| 缺点 | 前后端联调成本；空仓需完整脚手架 |

### 方案 B：轻量全栈（Node.js + React/Vue + SQLite）
| 优点 | 起步快、无需独立数据库服务 |
| 缺点 | 与系列既有技术栈不一致，企业级场景吞吐与健壮性弱 |

### 方案 C：报表直出静态方案（纯前端模拟数据 + CSV 导出）
| 优点 | 实现最快 |
| 缺点 | 无真实数据闭环，不满足“统计企业成本”的落地需求 |

**推荐**：方案 A（与历史任务确立的 React + Spring Boot 技术栈保持一致）。

## 5. 数据模型（初拟，待确认数据来源后定稿）

- `department` 部门（id, name, code, parent_id）
- `business_line` 业务线（id, name, code）
- `project` 项目（id, name, code, business_line_id, budget_amount, status）
- `employee` 人员（id, name, employee_no, department_id, role, cost_center）
- `labor_cost` 人力成本（id, employee_id, project_id?, month, amount, cost_type 开发/测试/产品/运维）
- `project_cost` 项目成本（id, project_id, month, budget_amount, actual_amount）

> 若数据来源为外部系统汇总口径，模型可能简化为“统计结果表 + 维表”；详见 §7 问题 1。

## 6. 接口契约（初拟）

- `GET /api/cost/summary`：Dashboard 总览（总成本、人力/项目成本占比、超支预警数量、月度趋势）。
- `GET /api/cost/analysis?dimension=...&role=...&year=...&month=...&quarter=...`：多维度统计。
- `GET /api/cost/export?<与 analysis 相同参数>&format=xlsx|csv`：报表导出。
- 统一响应体 `{ code, message, data }`；分页 `page/size → { records, total, current, size }`。

## 7. 开放问题（已提交用户澄清，待答复）

1. **数据来源**：人力成本与项目成本数据从何处来？（外部系统接口 / 人工录入 / 演示用模拟数据）
2. **导出格式**：报表导出支持哪些格式？（Excel / CSV / PDF）
3. **页面形态**：Dashboard 与统计分析页是独立路由页面，还是同路由内视图切换？
4. **统计口径**：人力成本按角色汇总即可，还是需要角色×项目交叉统计？
5. **技术栈确认**：是否沿用方案 A（React + Spring Boot + MySQL）？

> 缺失条件已列明（数据来源、格式、口径等），未编造假设。用户答复后本文件更新为定稿设计并补充仓间对齐点与实施计划（下一节点）。