# 成本统计报表系统 — 设计文档

> **文档版本**: v1.0  
> **创建日期**: 2025-01  
> **状态**: 需求澄清完成，待进入开发阶段

---

## 1. 需求概述

开发一个成本统计报表系统，用于统计企业各项成本支出情况。系统需提供：

- **Dashboard 总览**：关键指标卡片 + 可视化图表
- **成本统计分析页面**：按多维度（部门、项目、业务线、人员、月份、季度、年度）展示和统计数据
- **人力成本统计**：按岗位类型（开发、测试、产品、运维）统计
- **项目成本统计**：项目预算、实际消耗、预算占比、预计超支金额
- **报表导出**：支持 Excel (.xlsx) 格式导出
- **数据采集**：支持手动录入、Excel 批量导入、外部 API 对接三种方式
- **权限控制**：基于 RBAC 的角色权限管理

---

## 2. 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React + Ant Design + ECharts | 企业级 UI 组件库 + 丰富的图表能力 |
| **后端** | Java (Spring Boot + MyBatis) | 企业级主流框架 |
| **架构** | 微服务拆分 | 按领域拆分为 4 个独立服务 |
| **数据库** | MySQL | 关系型数据库 |
| **网关** | Spring Cloud Gateway | 统一入口、路由、鉴权 |
| **导出** | Apache POI / EasyExcel | Excel 文件生成 |
| **认证** | JWT | 无状态 Token 认证 |

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│         Ant Design + ECharts + Dashboard             │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST
              ┌────────▼────────┐
              │  API Gateway    │  Spring Cloud Gateway
              │  + JWT 鉴权     │  路由 / 限流 / 鉴权
              └──┬───┬───┬───┬─┘
                 │   │   │   │
    ┌────────────┘   │   │   └────────────┐
    ▼                ▼   ▼                ▼
┌────────┐   ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Auth   │   │ Base     │ │ Cost     │ │ Report   │
│Service │   │ Data     │ │ Core     │ │ Service  │
│        │   │ Service  │ │ Service  │ │          │
│认证授权 │   │基础数据   │ │成本数据   │ │报表统计   │
│RBAC    │   │部门/项目  │ │录入/导入  │ │聚合/导出  │
│        │   │业务线/人员│ │API对接   │ │Dashboard │
└────────┘   └──────────┘ └──────────┘ └──────────┘
    │              │            │            │
    └──────────────┴────────────┴────────────┘
                        │
                   ┌────▼────┐
                   │  MySQL  │
                   └─────────┘
```

### 3.2 微服务拆分

| 服务名 | 职责 | 端口 | 核心能力 |
|--------|------|------|---------|
| **auth-service** | 用户认证与权限管理 | 8081 | 登录/登出、JWT 签发与校验、RBAC 角色管理、数据权限过滤 |
| **base-data-service** | 基础数据管理 | 8082 | 部门 CRUD、项目 CRUD、业务线 CRUD、人员 CRUD |
| **cost-core-service** | 成本数据采集 | 8083 | 手动录入、Excel 批量导入（模板下载 + 校验）、外部 API 数据同步 |
| **report-service** | 报表统计与导出 | 8084 | 多维度聚合查询、Dashboard 数据组装、Excel 导出 |

### 3.3 服务间通信

- **同步调用**：REST (OpenFeign) — report-service 调用 base-data-service 获取维度数据
- **异步事件**（可选）：RabbitMQ / Kafka — 外部 API 数据同步完成后通知 report-service 刷新缓存

---

## 4. 前端页面设计

### 4.1 页面规划

| 页面 | 路由 | 说明 |
|------|------|------|
| **Dashboard** | `/dashboard` | 总览卡片（总成本、本月成本、预算执行率）+ ECharts 图表（趋势折线图、成本占比饼图、部门对比柱状图） |
| **成本统计分析** | `/cost/analysis` | 多维度筛选（部门/项目/业务线/人员/时间），表格 + 图表联动展示 |
| **人力成本** | `/cost/labor` | 按岗位类型（开发/测试/产品/运维）统计人力成本，支持时间维度切换 |
| **项目成本** | `/cost/project` | 项目预算 vs 实际消耗、预算占比、预计超支金额，进度条可视化。预计超支金额 = 实际消耗 − 项目预算（当实际 > 预算时显示正值，否则为 0） |
| **数据录入** | `/cost/entry` | 表单录入成本数据，支持选择部门/项目/人员等维度 |
| **数据导入** | `/cost/import` | Excel 模板下载 + 文件上传 + 导入校验结果展示（成功/失败/跳过） |
| **报表导出** | `/cost/export` | 选择维度/时间范围后导出 Excel |
| **系统管理** | `/system` | 用户管理、角色管理、基础数据维护 |

### 4.2 Dashboard 设计

```
┌──────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 总成本    │  │ 本月成本  │  │ 预算执行率│  │ 超支预警  │    │
│  │ ¥12.5M   │  │ ¥1.2M    │  │ 78.5%    │  │ 3 个项目  │    │
│  │ ↑12.3%   │  │ ↑5.2%    │  │ ████░░   │  │ ⚠️       │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ┌────────────────────────┐  ┌────────────────────────┐     │
│  │  月度成本趋势（折线图）  │  │  成本类型占比（饼图）   │     │
│  │  ECharts Line Chart     │  │  ECharts Pie Chart     │     │
│  └────────────────────────┘  └────────────────────────┘     │
│                                                              │
│  ┌────────────────────────┐  ┌────────────────────────┐     │
│  │  部门成本对比（柱状图）  │  │  项目预算执行（进度条）  │     │
│  │  ECharts Bar Chart      │  │  Ant Design Progress   │     │
│  └────────────────────────┘  └────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 前端项目结构

```
library-frontend-main/
├── public/
├── src/
│   ├── api/                  # API 请求封装
│   │   ├── auth.ts
│   │   ├── cost.ts
│   │   ├── report.ts
│   │   └── baseData.ts
│   ├── components/           # 通用组件
│   │   ├── Charts/           # ECharts 封装
│   │   ├── ExportButton/
│   │   └── FilterBar/
│   ├── layouts/              # 布局组件
│   │   └── MainLayout.tsx
│   ├── pages/                # 页面
│   │   ├── Dashboard/
│   │   ├── CostAnalysis/
│   │   ├── LaborCost/
│   │   ├── ProjectCost/
│   │   ├── DataEntry/
│   │   ├── DataImport/
│   │   ├── ReportExport/
│   │   └── System/
│   ├── store/                # 状态管理 (Zustand/Redux)
│   ├── utils/                # 工具函数
│   ├── types/                # TypeScript 类型定义
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 5. 数据模型设计

### 5.1 ER 关系图

```
department ──1:N──▶ employee
department ──1:N──▶ project
business_line ──1:N──▶ project
department ──1:N──▶ cost_record
project ──1:N──▶ cost_record
business_line ──1:N──▶ cost_record
employee ──1:N──▶ cost_record
user ──N:1──▶ role
role ──N:M──▶ permission
```

### 5.2 核心表结构

#### department（部门表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(100) | 部门名称 |
| code | VARCHAR(50) UNIQUE | 部门编码 |
| parent_id | BIGINT | 上级部门 ID（支持树形结构） |
| status | TINYINT | 状态（1-启用 0-停用） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### project（项目表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(200) | 项目名称 |
| code | VARCHAR(50) UNIQUE | 项目编码 |
| budget | DECIMAL(15,2) | 项目预算 |
| dept_id | BIGINT FK | 所属部门 |
| biz_line_id | BIGINT FK | 所属业务线 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| status | TINYINT | 状态（1-进行中 2-已完成 0-已关闭） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### business_line（业务线表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(100) | 业务线名称 |
| code | VARCHAR(50) UNIQUE | 业务线编码 |
| description | VARCHAR(500) | 描述 |
| status | TINYINT | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### employee（人员表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(50) | 姓名 |
| emp_no | VARCHAR(50) UNIQUE | 工号 |
| dept_id | BIGINT FK | 所属部门 |
| role_type | VARCHAR(20) | 岗位类型（dev/test/product/ops） |
| salary | DECIMAL(12,2) | 薪资 |
| entry_date | DATE | 入职日期 |
| status | TINYINT | 状态（1-在职 0-离职） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### cost_record（成本记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| dept_id | BIGINT FK | 部门 |
| project_id | BIGINT FK | 项目（可为空，非项目成本） |
| biz_line_id | BIGINT FK | 业务线 |
| employee_id | BIGINT FK | 人员（可为空，非人力成本） |
| role_type | VARCHAR(20) | 岗位类型（冗余，便于统计） |
| cost_type | VARCHAR(30) | 成本类型（labor/infra/license/travel/other） |
| amount | DECIMAL(15,2) | 金额 |
| period | VARCHAR(7) | 所属期间（格式：YYYY-MM） |
| source | VARCHAR(20) | 数据来源（manual/import/api） |
| remark | VARCHAR(500) | 备注 |
| created_by | BIGINT | 创建人 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**索引设计**：
- `idx_cost_record_dept_period` (dept_id, period)
- `idx_cost_record_project_period` (project_id, period)
- `idx_cost_record_biz_line_period` (biz_line_id, period)
- `idx_cost_record_employee_period` (employee_id, period)
- `idx_cost_record_cost_type_period` (cost_type, period)

#### user（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| username | VARCHAR(50) UNIQUE | 用户名 |
| password | VARCHAR(200) | 密码（BCrypt 加密） |
| name | VARCHAR(50) | 姓名 |
| dept_id | BIGINT FK | 所属部门（用于数据权限过滤） |
| status | TINYINT | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### role（角色表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(50) | 角色名称 |
| code | VARCHAR(50) UNIQUE | 角色编码 |
| description | VARCHAR(200) | 描述 |
| data_scope | VARCHAR(20) | 数据范围（all/dept/self） |
| created_at | DATETIME | 创建时间 |

#### user_role（用户角色关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| user_id | BIGINT FK | 用户 ID |
| role_id | BIGINT FK | 角色 ID |

#### role_permission（角色权限关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| role_id | BIGINT FK | 角色 ID |
| permission_id | BIGINT FK | 权限 ID |

#### permission（权限表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(100) | 权限名称 |
| code | VARCHAR(100) UNIQUE | 权限编码（如 cost:entry, report:export） |
| type | VARCHAR(20) | 类型（menu/button/api） |
| parent_id | BIGINT | 上级权限 |

---

## 6. RBAC 权限设计

### 6.1 预设角色

| 角色 | 编码 | 数据范围 | 权限说明 |
|------|------|---------|---------|
| **系统管理员** | admin | 全部数据 | 所有操作权限 |
| **部门经理** | dept_manager | 本部门数据 | 查看/录入/导入/导出本部门数据 |
| **普通查看者** | viewer | 本人数据 | 仅查看和导出本人相关数据 |

### 6.2 权限编码规范

| 模块 | 权限编码 | 说明 |
|------|---------|------|
| Dashboard | `dashboard:view` | 查看 Dashboard |
| 成本分析 | `cost:analysis:view` | 查看成本分析 |
| 人力成本 | `cost:labor:view` | 查看人力成本 |
| 项目成本 | `cost:project:view` | 查看项目成本 |
| 数据录入 | `cost:entry:create` | 录入成本数据 |
| 数据导入 | `cost:import:create` | 导入成本数据 |
| 报表导出 | `report:export` | 导出报表 |
| 基础数据 | `base:manage` | 管理基础数据 |
| 用户管理 | `system:user:manage` | 管理用户 |
| 角色管理 | `system:role:manage` | 管理角色 |

### 6.3 数据权限过滤

- **all**：不做数据过滤，可查看所有数据
- **dept**：SQL 自动追加 `WHERE dept_id IN (当前用户部门及下级部门)`
- **self**：SQL 自动追加 `WHERE employee_id = 当前用户关联的员工 ID`

---

## 7. API 接口设计

### 7.1 Auth Service (8081)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，返回 JWT Token |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/users` | 用户列表 |
| POST | `/api/auth/users` | 创建用户 |
| PUT | `/api/auth/users/{id}` | 更新用户 |
| GET | `/api/auth/roles` | 角色列表 |
| POST | `/api/auth/roles` | 创建角色 |
| PUT | `/api/auth/roles/{id}` | 更新角色 |

### 7.2 Base Data Service (8082)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/base/departments` | 部门列表（支持树形） |
| POST | `/api/base/departments` | 创建部门 |
| PUT | `/api/base/departments/{id}` | 更新部门 |
| DELETE | `/api/base/departments/{id}` | 删除部门 |
| GET | `/api/base/projects` | 项目列表 |
| POST | `/api/base/projects` | 创建项目 |
| PUT | `/api/base/projects/{id}` | 更新项目 |
| GET | `/api/base/business-lines` | 业务线列表 |
| POST | `/api/base/business-lines` | 创建业务线 |
| GET | `/api/base/employees` | 人员列表 |
| POST | `/api/base/employees` | 创建人员 |
| PUT | `/api/base/employees/{id}` | 更新人员 |

### 7.3 Cost Core Service (8083)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/cost/entry` | 单条成本数据录入 |
| POST | `/api/cost/batch-entry` | 批量成本数据录入 |
| GET | `/api/cost/import/template` | 下载导入模板 |
| POST | `/api/cost/import` | Excel 批量导入（multipart/form-data） |
| GET | `/api/cost/import/result/{taskId}` | 查询导入任务结果 |
| POST | `/api/cost/sync` | 触发外部 API 数据同步 |
| GET | `/api/cost/sync/status/{taskId}` | 查询同步任务状态 |
| GET | `/api/cost/records` | 成本记录列表（分页） |
| PUT | `/api/cost/records/{id}` | 更新成本记录 |
| DELETE | `/api/cost/records/{id}` | 删除成本记录 |

### 7.4 Report Service (8084)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/report/dashboard` | Dashboard 汇总数据 |
| GET | `/api/report/analysis` | 多维度统计分析 |
| GET | `/api/report/labor` | 人力成本统计 |
| GET | `/api/report/project` | 项目成本统计 |
| GET | `/api/report/trend` | 成本趋势数据 |
| POST | `/api/report/export` | 导出 Excel |
| GET | `/api/report/export/status/{taskId}` | 查询导出任务状态 |

### 7.5 通用查询参数（Report 接口）

| 参数 | 类型 | 说明 |
|------|------|------|
| deptId | Long | 部门 ID |
| projectId | Long | 项目 ID |
| bizLineId | Long | 业务线 ID |
| employeeId | Long | 人员 ID |
| roleType | String | 岗位类型（dev/test/product/ops） |
| periodStart | String | 起始期间（YYYY-MM） |
| periodEnd | String | 结束期间（YYYY-MM） |
| costType | String | 成本类型 |
| timeGranularity | String | 时间粒度（month/quarter/year），默认 month |
| groupBy | String | 分组维度（dept/project/bizLine/employee/roleType），支持多选逗号分隔 |

### 7.6 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": 1700000000000
}
```

分页响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [ ... ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 20
  }
}
```

---

## 8. 数据采集方案

### 8.0 成本计算与分摊规则

| 指标 | 计算公式 | 说明 |
|------|---------|------|
| **预算占比** | 实际消耗 / 项目预算 × 100% | 超过 100% 时标红预警 |
| **预计超支金额** | MAX(实际消耗 − 项目预算, 0) | 仅当实际 > 预算时显示正值 |
| **预算执行率** | 全部项目实际消耗 / 全部项目预算 × 100% | Dashboard 汇总指标 |
| **人力成本** | 按 cost_record 中 cost_type=labor 的记录汇总 | 按 role_type 分组统计 |
| **成本分摊** | 人员成本按 cost_record 中的 project_id 归属 | 一人多项目时，需按项目分别录入成本记录 |

> **季度/年度聚合**：基于 cost_record.period（YYYY-MM）字段计算。季度 = period 月份所属季度（Q1: 01-03, Q2: 04-06, Q3: 07-09, Q4: 10-12）；年度 = period 年份。前端通过 timeGranularity 参数控制聚合粒度。

### 8.1 手动录入

- 前端表单页面，选择部门/项目/业务线/人员/成本类型/期间，输入金额
- 后端校验必填字段、金额范围、期间合法性
- 支持批量录入（表格模式）

### 8.2 Excel 批量导入

1. 用户下载导入模板（含表头说明和示例数据）
2. 用户上传 Excel 文件
3. 后端异步解析：逐行校验（字段非空、外键存在性、金额合法性）
4. 返回导入结果：成功条数、失败条数、失败明细（行号 + 原因）
5. 支持部分导入（校验通过的行入库，失败的跳过并记录）

### 8.3 外部 API 对接

- 配置外部数据源（URL、认证方式、字段映射）
- 支持定时同步（Cron 表达式）和手动触发
- 同步任务异步执行，支持查询进度和结果
- 数据去重策略：基于 (dept_id, project_id, employee_id, period, cost_type) 唯一约束

---

## 9. 报表导出方案

### 9.1 导出流程

1. 用户选择筛选条件（维度、时间范围）
2. 前端调用导出接口，后端生成异步任务
3. 后端使用 EasyExcel 生成 .xlsx 文件
4. 文件上传至临时存储，返回下载链接
5. 前端轮询任务状态，完成后触发下载

### 9.2 导出内容

- **Sheet 1 - 汇总**：总成本、各维度小计
- **Sheet 2 - 明细**：按筛选条件过滤的成本记录明细
- **Sheet 3 - 项目成本**：项目预算/消耗/超支对比表
- **Sheet 4 - 人力成本**：按岗位类型的人力成本明细

---

## 10. 后端项目结构

```
library-backend-main/
├── pom.xml                          # 父 POM
├── gateway/                         # API Gateway
│   └── src/main/java/
│       └── com/library/gateway/
│           ├── GatewayApplication.java
│           ├── config/
│           │   └── RouteConfig.java
│           └── filter/
│               └── JwtAuthFilter.java
├── auth-service/                    # 认证授权服务
│   └── src/main/java/
│       └── com/library/auth/
│           ├── AuthApplication.java
│           ├── controller/
│           ├── service/
│           ├── mapper/
│           ├── entity/
│           └── config/
├── base-data-service/               # 基础数据服务
│   └── src/main/java/
│       └── com/library/basedata/
│           ├── BaseDataApplication.java
│           ├── controller/
│           ├── service/
│           ├── mapper/
│           └── entity/
├── cost-core-service/               # 成本数据服务
│   └── src/main/java/
│       └── com/library/cost/
│           ├── CostCoreApplication.java
│           ├── controller/
│           ├── service/
│           │   ├── CostEntryService.java
│           │   ├── CostImportService.java
│           │   └── CostSyncService.java
│           ├── mapper/
│           ├── entity/
│           └── dto/
├── report-service/                  # 报表统计服务
│   └── src/main/java/
│       └── com/library/report/
│           ├── ReportApplication.java
│           ├── controller/
│           ├── service/
│           │   ├── DashboardService.java
│           │   ├── AnalysisService.java
│           │   └── ExportService.java
│           ├── mapper/
│           └── dto/
└── common/                          # 公共模块
    └── src/main/java/
        └── com/library/common/
            ├── response/
            │   └── Result.java
            ├── exception/
            │   └── GlobalExceptionHandler.java
            ├── config/
            │   └── MyBatisConfig.java
            └── util/
                └── JwtUtil.java
```

---

## 11. 非功能性需求

| 维度 | 要求 |
|------|------|
| **性能** | Dashboard 接口 < 500ms；列表查询 < 300ms；导出 < 10s（万级数据） |
| **安全** | JWT 认证 + RBAC 鉴权；SQL 注入防护；XSS 防护；敏感数据加密 |
| **可用性** | 服务健康检查；优雅降级；统一错误码 |
| **可维护性** | 统一日志格式；接口文档（Swagger）；配置外部化 |

---

## 12. 开发里程碑（建议）

| 阶段 | 内容 | 预估周期 |
|------|------|---------|
| **P0 - 基础搭建** | 项目脚手架、Gateway、Auth 服务、数据库建表 | 1 周 |
| **P1 - 基础数据** | 部门/项目/业务线/人员 CRUD | 1 周 |
| **P2 - 成本采集** | 手动录入 + Excel 导入 | 1.5 周 |
| **P3 - 报表统计** | Dashboard + 多维度分析 + 人力/项目成本 | 2 周 |
| **P4 - 导出 + 权限** | Excel 导出 + RBAC 权限完善 | 1 周 |
| **P5 - 联调测试** | 前后端联调、性能优化、Bug 修复 | 1 周 |
