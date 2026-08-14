# 人员看板 — 设计方案

## 1. 需求概述

### 1.1 业务场景
项目人力管理——管理参与项目的员工（含外包/驻场人员），跟踪部门/团队维度的人力成本预算。

### 1.2 核心功能
| 功能模块 | 说明 |
|---------|------|
| **人员看板 (Dashboard)** | 人员总览统计、预算使用进度、项目人员分布、即将到期提醒 |
| **员工信息管理** | 员工基本信息的增删改查（CRUD） |
| **批量导入** | 支持 Excel (.xlsx) 和 CSV 格式批量导入员工数据 |
| **成本预算管理** | 按部门/团队设定总额预算，分配到各人员，跟踪使用进度 |
| **白名单管理** | 项目准入白名单，控制哪些人有资格被分配到具体项目 |

### 1.3 员工数据模型
| 分类 | 字段 |
|------|------|
| **基础信息** | 姓名、工号、手机号、邮箱、部门、职位 |
| **项目关联** | 所属项目、项目角色、入场时间、离场时间 |
| **成本信息** | 日费率/月薪、成本中心、预算金额 |
| **供应商信息** | 所属供应商、合同编号、合同期限 |

---

## 2. 方案对比

### 方案 A：标准全栈架构（⭐ 推荐）

| 层 | 技术选型 |
|----|---------|
| 前端 | React 18 + Ant Design Pro 6 + UmiJS |
| 后端 | Java 17 + Spring Boot 3 + MyBatis-Plus |
| 数据库 | MySQL 8 |
| 文件处理 | Apache POI (Excel) + OpenCSV (CSV) |
| 图表 | ECharts / Ant Design Charts |

**优点：**
- 技术成熟、生态丰富，社区支持好
- Ant Design Pro 内置 Dashboard 模板和权限体系，开箱即用
- MyBatis-Plus 简化 CRUD 和分页查询
- 适合中等规模项目，团队上手快

**缺点：**
- 前后端分离需要接口联调
- Java 后端启动和部署相对较重

---

### 方案 B：轻量级全栈架构

| 层 | 技术选型 |
|----|---------|
| 前端 | React 18 + Ant Design 5 + Vite |
| 后端 | Node.js + NestJS + Prisma ORM |
| 数据库 | PostgreSQL |
| 文件处理 | xlsx (Excel) + csv-parser (CSV) |

**优点：**
- 全 JavaScript/TypeScript 栈，开发效率高
- Vite 构建速度快，开发体验好
- NestJS 提供模块化架构，代码组织清晰

**缺点：**
- Node.js 后端在复杂业务逻辑和大数据量场景下性能不如 Java
- 企业级项目中 Java 生态更受认可

---

### 方案 C：微服务架构

| 层 | 技术选型 |
|----|---------|
| 前端 | React 18 + Ant Design Pro 6 |
| 后端 | Spring Cloud + 多个微服务（人员服务、项目服务、预算服务） |
| 数据库 | MySQL 8（每服务独立库） |
| 网关 | Spring Cloud Gateway |

**优点：**
- 可扩展性强，适合大规模系统
- 服务独立部署，故障隔离好

**缺点：**
- 对于当前需求规模属于过度设计
- 运维复杂度高，开发周期长
- 引入分布式事务、服务治理等额外复杂度

---

## 3. 推荐方案：方案 A — 标准全栈架构

### 3.1 推荐理由
- 项目人力管理属于中等复杂度业务，方案 A 的技术栈成熟稳定
- Ant Design Pro 内置的 ProTable、ProForm 等组件非常适合 CRUD + 看板场景
- Java Spring Boot 在企业级人力/预算管理中广泛使用，可靠性高

### 3.2 系统架构

```
┌─────────────────────────────────────────────┐
│              Frontend (React)                │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Dashboard │ │员工管理   │ │白名单/预算   │  │
│  │看板页面  │ │CRUD+导入  │ │管理页面      │  │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       └────────────┼──────────────┘          │
│                    │ REST API                │
└────────────────────┼────────────────────────┘
                     │
┌────────────────────┼────────────────────────┐
│              Backend (Spring Boot)           │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Employee  │ │Project   │ │Budget        │  │
│  │Service   │ │Service   │ │Service       │  │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       └────────────┼──────────────┘          │
│                    │                         │
│  ┌─────────────────┼──────────────────────┐  │
│  │         MyBatis-Plus + MySQL            │  │
│  └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### 3.3 核心数据模型（初步）

```
employee (员工表)
├── id, name, employee_no, phone, email
├── department, position, status
├── supplier_id (FK → supplier)
├── daily_rate, monthly_salary, cost_center
├── contract_no, contract_start, contract_end
└── created_at, updated_at

project (项目表)
├── id, name, code, status
├── start_date, end_date
└── created_at, updated_at

project_employee (项目-人员关联表)
├── id, project_id (FK), employee_id (FK)
├── role, entry_date, exit_date
└── created_at, updated_at

whitelist (白名单表)
├── id, project_id (FK), employee_id (FK)
├── status, approved_by, approved_at
└── created_at, updated_at

budget (预算表)
├── id, department, fiscal_year
├── total_amount, used_amount
└── created_at, updated_at

supplier (供应商表)
├── id, name, contact, phone
└── created_at, updated_at
```

### 3.4 核心 API 设计（初步）

| 模块 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 员工 | `/api/employees` | GET/POST/PUT/DELETE | CRUD |
| 员工 | `/api/employees/import` | POST | 批量导入(Excel/CSV) |
| 员工 | `/api/employees/export` | GET | 导出模板 |
| 项目 | `/api/projects` | GET/POST/PUT/DELETE | CRUD |
| 白名单 | `/api/whitelist` | GET/POST/DELETE | 白名单管理 |
| 预算 | `/api/budgets` | GET/POST/PUT | 预算管理 |
| 看板 | `/api/dashboard/overview` | GET | 人员总览统计 |
| 看板 | `/api/dashboard/budget-progress` | GET | 预算使用进度 |
| 看板 | `/api/dashboard/project-distribution` | GET | 项目人员分布 |
| 看板 | `/api/dashboard/expiring-alerts` | GET | 即将到期提醒 |

### 3.5 前端页面结构（初步）

```
/                          → 重定向到 /dashboard
/dashboard                 → 人员看板首页
  ├── 人员总览统计卡片
  ├── 预算使用进度图表
  ├── 项目人员分布图
  └── 即将到期提醒列表
/employees                 → 员工列表（ProTable + CRUD）
/employees/import          → 批量导入页面
/projects                  → 项目管理
/whitelist                 → 白名单管理
/budgets                   → 预算管理
/suppliers                 → 供应商管理
```

---

## 4. 跨仓分工

| 仓库 | 职责 |
|------|------|
| **library-frontend** | React + Ant Design Pro 前端应用，包含看板、CRUD、导入等所有页面 |
| **library-backend** | Spring Boot 后端服务，包含 REST API、数据库操作、文件处理 |

### 仓间对齐点
- REST API 接口契约（URL、请求/响应格式）
- 文件上传接口规范（multipart/form-data）
- 统一错误码和响应包装格式
- 分页参数约定（pageNum/pageSize vs current/size）

---

## 5. 已确认决策

| 决策项 | 确认结果 |
|--------|---------|
| 技术方案 | ✅ 方案 A：标准全栈架构（React + Ant Design Pro + Spring Boot + MySQL） |
| 权限管理 | ✅ 需要 RBAC（角色权限管理） |
| 预算周期 | ✅ 按项目周期（跟随项目起止时间） |
| 部署方式 | ✅ Docker 容器化（docker-compose） |

### 5.1 RBAC 角色设计（初步）

| 角色 | 权限说明 |
|------|---------|
| **系统管理员** | 全部权限，包括用户管理、系统配置 |
| **项目经理** | 项目人员分配、白名单管理、预算查看 |
| **部门主管** | 本部门人员管理、预算设置与查看 |
| **普通用户** | 查看人员信息、看板数据 |

### 5.2 预算模型调整（按项目周期）

```
budget (预算表)
├── id, project_id (FK → project)
├── department, total_amount
├── used_amount, remaining_amount
├── start_date (跟随项目开始时间)
├── end_date (跟随项目结束时间)
└── created_at, updated_at
```

预算与项目绑定，项目创建时设定预算，项目周期内跟踪使用情况。

### 5.3 Docker 部署架构

```yaml
# docker-compose.yml 结构预览
services:
  frontend:
    image: library-frontend:latest
    ports: ["80:80"]
    depends_on: [backend]
  
  backend:
    image: library-backend:latest
    ports: ["8080:8080"]
    depends_on: [mysql]
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/library
  
  mysql:
    image: mysql:8.0
    ports: ["3306:3306"]
    volumes: ["mysql-data:/var/lib/mysql"]
```

---

## 6. 后续待确认（可选）

- [ ] 是否需要操作日志/审计功能
- [ ] 数据备份策略
- [ ] 是否需要消息通知（邮件/钉钉等）
