# 人员看板（Personnel Dashboard）设计文档

> **文档类型**: dima.md (Design / Implementation / Architecture)
> **任务ID**: DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-220ea5c8-3a2b-4449-b000-b8276311c330
> **阶段**: loop-1 / 需求澄清
> **使用技能**: brainstorming
> **日期**: 2026-08-12

---

## 1. 需求概述

开发一个人员看板模块，核心能力包括：

1. **员工基本信息管理** — 入口记录员工基本信息，支持增删改查（CRUD）。
2. **成本预算管理** — 按月 + 按年双粒度记录员工成本预算金额，支持汇总查看。
3. **成本预算白名单** — 控制哪些员工可纳入成本预算管理（人员范围白名单）。
4. **批量导入** — 支持 Excel(.xlsx) 与 CSV 两种格式批量导入员工信息与成本预算。
5. **综合视图** — 以列表为主，支持切换看板视图与仪表盘视图。

---

## 2. 已澄清需求决策

| # | 澄清项 | 结论 |
|---|--------|------|
| 1 | 看板呈现形态 | 综合（列表为主 + 看板/仪表盘视图切换） |
| 2 | 「成本预算--白名单」语义 | 可录入成本预算的员工范围白名单（控制哪些员工纳入成本预算管理） |
| 3 | 前端技术栈 | React 19 + TypeScript + Vite + Ant Design |
| 4 | 后端技术栈 | Spring Boot 3 + MyBatis-Plus + MySQL |
| 5 | 成本预算记录维度 | 按月 + 按年双粒度 |
| 6 | 批量导入文件格式 | Excel(.xlsx) + CSV 均支持 |
| 7 | 前端架构方案 | 方案 C: 主从布局（左侧导航 + 主内容区视图切换） |

---

## 3. 架构方案（方案 C: 主从布局 — 已选定）

### 3.1 布局结构

```
┌─────────────────────────────────────────────────────┐
│  顶部栏（Logo / 用户信息 / 通知）                      │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  侧边导航  │  主内容区                                  │
│          │                                          │
│ · 人员管理│  ┌────────────────────────────────────┐  │
│ · 成本预算│  │ 视图切换器: [列表] [看板] [仪表盘]    │  │
│ · 白名单  │  ├────────────────────────────────────┤  │
│ · 导入中心│  │                                    │  │
│          │  │  当前视图内容                        │  │
│          │  │                                    │  │
│          │  └────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────┘
```

### 3.2 模块划分

| 模块 | 路由 | 说明 |
|------|------|------|
| 人员管理 | `/personnel` | 员工基本信息 CRUD，支持列表/看板/仪表盘三视图切换 |
| 成本预算 | `/budget` | 按月/按年双粒度成本预算管理，支持列表/仪表盘视图 |
| 白名单管理 | `/whitelist` | 成本预算员工范围白名单的增删改查 |
| 导入中心 | `/import` | 批量导入员工信息与成本预算（Excel/CSV） |

### 3.3 选型理由

- 主从布局符合企业级管理后台惯例，左侧导航清晰划分功能域。
- 主内容区视图切换器满足「综合（列表+视图切换）」需求。
- 模块解耦，后续扩展新功能域只需新增导航项与路由。
- 相比单页面多视图（方案 A），降低单页复杂度；相比多页面路由（方案 B），减少跨模块跳转。

---

## 4. 技术栈

### 4.1 前端（library-frontend）

| 类别 | 选型 | 版本 |
|------|------|------|
| 框架 | React | 19 |
| 语言 | TypeScript | 5.x |
| 构建 | Vite | 6.x |
| UI 组件库 | Ant Design | 5.x |
| 路由 | React Router | 7.x |
| HTTP 客户端 | Axios | 1.x |
| 状态管理 | Zustand | 5.x |
| Excel 解析 | SheetJS (xlsx) | 0.18.x |
| CSV 解析 | PapaParse | 5.x |
| 图表 | ECharts (echarts-for-react) | 5.x |

### 4.2 后端（library-backend）

| 类别 | 选型 | 版本 |
|------|------|------|
| 框架 | Spring Boot | 3.x |
| 语言 | Java | 17+ |
| ORM | MyBatis-Plus | 3.5.x |
| 数据库 | MySQL | 8.x |
| Excel 处理 | Apache POI / EasyExcel | 5.x / 3.x |
| CSV 处理 | Apache Commons CSV | 1.x |
| 参数校验 | Jakarta Validation | 3.x |
| API 文档 | SpringDoc OpenAPI | 2.x |

---

## 5. 前端设计（library-frontend）

### 5.1 目录结构

```
library-frontend/
├── public/
├── src/
│   ├── api/                    # API 请求层
│   │   ├── request.ts          # Axios 实例与拦截器
│   │   ├── personnel.ts        # 人员管理接口
│   │   ├── budget.ts           # 成本预算接口
│   │   ├── whitelist.ts        # 白名单接口
│   │   └── import.ts           # 导入接口
│   ├── components/             # 通用组件
│   │   ├── Layout/             # 主从布局（Sider + Header + Content）
│   │   ├── ViewSwitcher/       # 视图切换器（列表/看板/仪表盘）
│   │   ├── ImportDialog/        # 批量导入弹窗
│   │   └── ConfirmDialog/      # 确认弹窗
│   ├── pages/
│   │   ├── personnel/          # 人员管理
│   │   │   ├── index.tsx       # 列表视图
│   │   │   ├── KanbanView.tsx  # 看板视图
│   │   │   ├── DashboardView.tsx # 仪表盘视图
│   │   │   └── components/     # 表单、详情抽屉等
│   │   ├── budget/             # 成本预算
│   │   │   ├── index.tsx       # 列表视图
│   │   │   └── DashboardView.tsx # 仪表盘视图
│   │   ├── whitelist/          # 白名单管理
│   │   │   └── index.tsx
│   │   └── import/             # 导入中心
│   │       └── index.tsx
│   ├── store/                  # Zustand 状态
│   │   ├── personnelStore.ts
│   │   ├── budgetStore.ts
│   │   └── whitelistStore.ts
│   ├── types/                  # TypeScript 类型定义
│   │   ├── personnel.ts
│   │   ├── budget.ts
│   │   └── whitelist.ts
│   ├── utils/                  # 工具函数
│   │   ├── excel.ts            # Excel 解析
│   │   └── csv.ts              # CSV 解析
│   ├── router/                 # 路由配置
│   │   └── index.tsx
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 5.2 页面与路由

```typescript
// router/index.tsx
const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'personnel', element: <PersonnelPage /> },
      { path: 'budget', element: <BudgetPage /> },
      { path: 'whitelist', element: <WhitelistPage /> },
      { path: 'import', element: <ImportPage /> },
    ],
  },
];
```

### 5.3 视图切换器组件

```typescript
// ViewSwitcher — 通用视图切换
type ViewMode = 'list' | 'kanban' | 'dashboard';

interface ViewSwitcherProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  availableModes: ViewMode[]; // 各模块可用视图不同
}
```

- 人员管理：`['list', 'kanban', 'dashboard']`
- 成本预算：`['list', 'dashboard']`
- 白名单：`['list']`
- 导入中心：`['list']`

### 5.4 人员管理三视图

| 视图 | 说明 |
|------|------|
| 列表视图 | Ant Design Table，支持搜索/筛选/排序/分页，行操作（编辑/删除/加入白名单） |
| 看板视图 | 按部门/状态分组列展示员工卡片，支持拖拽 |
| 仪表盘视图 | ECharts 图表：人员总数、部门分布饼图、白名单覆盖率、成本预算趋势 |

---

## 6. 后端设计（library-backend）

### 6.1 目录结构

```
library-backend/
├── src/main/java/com/library/
│   ├── LibraryApplication.java
│   ├── config/                 # 配置
│   │   ├── WebMvcConfig.java   # CORS 等
│   │   ├── MybatisPlusConfig.java
│   │   └── SwaggerConfig.java
│   ├── controller/            # 控制层
│   │   ├── PersonnelController.java
│   │   ├── BudgetController.java
│   │   ├── WhitelistController.java
│   │   └── ImportController.java
│   ├── service/               # 服务层
│   │   ├── PersonnelService.java
│   │   ├── BudgetService.java
│   │   ├── WhitelistService.java
│   │   ├── ImportService.java
│   │   └── impl/
│   ├── mapper/                # MyBatis-Plus Mapper
│   │   ├── PersonnelMapper.java
│   │   ├── BudgetMapper.java
│   │   └── WhitelistMapper.java
│   ├── entity/                # 实体
│   │   ├── Personnel.java
│   │   ├── CostBudget.java
│   │   └── BudgetWhitelist.java
│   ├── dto/                   # 数据传输对象
│   │   ├── PersonnelDTO.java
│   │   ├── BudgetDTO.java
│   │   ├── WhitelistDTO.java
│   │   └── ImportResultDTO.java
│   ├── vo/                    # 视图对象
│   │   ├── PersonnelVO.java
│   │   ├── BudgetVO.java
│   │   └── DashboardVO.java
│   ├── enums/                 # 枚举
│   │   ├── BudgetGranularity.java  # MONTHLY / YEARLY
│   │   └── ImportFormat.java       # XLSX / CSV
│   ├── handler/               # 全局处理
│   │   ├── GlobalExceptionHandler.java
│   │   └── ApiResponse.java   # 统一响应体
│   └── util/                  # 工具
│       ├── ExcelParser.java
│       └── CsvParser.java
├── src/main/resources/
│   ├── application.yml
│   ├── mapper/                # XML 映射
│   └── templates/            # 导入模板
│       ├── personnel_template.xlsx
│       └── budget_template.xlsx
└── pom.xml
```

### 6.2 统一响应体

```java
// ApiResponse.java
public class ApiResponse<T> {
    private int code;       // 0=成功, 非0=失败
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) { ... }
    public static <T> ApiResponse<T> error(int code, String message) { ... }
}
```

---

## 7. 数据模型

### 7.1 employee（员工信息表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT, PK, AUTO_INCREMENT | 主键 |
| employee_no | VARCHAR(50), UNIQUE | 工号 |
| name | VARCHAR(100) | 姓名 |
| gender | TINYINT | 性别 (0=未知, 1=男, 2=女) |
| department | VARCHAR(100) | 部门 |
| position | VARCHAR(100) | 职位 |
| phone | VARCHAR(20) | 手机号 |
| email | VARCHAR(100) | 邮箱 |
| entry_date | DATE | 入职日期 |
| status | TINYINT | 状态 (0=离职, 1=在职) |
| remark | VARCHAR(500) | 备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| deleted | TINYINT, DEFAULT 0 | 逻辑删除标记 |

```sql
CREATE TABLE employee (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_no VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    gender      TINYINT      DEFAULT 0,
    department  VARCHAR(100),
    position    VARCHAR(100),
    phone       VARCHAR(20),
    email       VARCHAR(100),
    entry_date  DATE,
    status      TINYINT      DEFAULT 1,
    remark      VARCHAR(500),
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted     TINYINT      DEFAULT 0,
    INDEX idx_department (department),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7.2 cost_budget（成本预算表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT, PK, AUTO_INCREMENT | 主键 |
| employee_id | BIGINT, FK → employee.id | 员工ID |
| granularity | TINYINT | 粒度 (1=月度, 2=年度) |
| period_year | INT | 年份 (如 2026) |
| period_month | TINYINT | 月份 (1-12，年度粒度时为 NULL) |
| amount | DECIMAL(12,2) | 预算金额 |
| currency | VARCHAR(10), DEFAULT 'CNY' | 币种 |
| remark | VARCHAR(500) | 备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

```sql
CREATE TABLE cost_budget (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id  BIGINT       NOT NULL,
    granularity  TINYINT      NOT NULL COMMENT '1=月度, 2=年度',
    period_year  INT          NOT NULL,
    period_month TINYINT      NULL COMMENT '月度粒度时填1-12, 年度粒度为NULL',
    amount       DECIMAL(12,2) NOT NULL,
    currency     VARCHAR(10)  DEFAULT 'CNY',
    remark       VARCHAR(500),
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_budget (employee_id, granularity, period_year, period_month),
    INDEX idx_employee (employee_id),
    INDEX idx_period (period_year, period_month),
    CONSTRAINT fk_budget_employee FOREIGN KEY (employee_id) REFERENCES employee(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7.3 budget_whitelist（成本预算白名单表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT, PK, AUTO_INCREMENT | 主键 |
| employee_id | BIGINT, FK → employee.id, UNIQUE | 员工ID |
| enabled | TINYINT, DEFAULT 1 | 是否启用 (0=禁用, 1=启用) |
| effective_from | DATE | 生效起始日期 |
| effective_to | DATE | 生效截止日期（NULL=长期） |
| remark | VARCHAR(500) | 备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

```sql
CREATE TABLE budget_whitelist (
    id             BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id    BIGINT       NOT NULL UNIQUE,
    enabled        TINYINT     DEFAULT 1,
    effective_from DATE,
    effective_to   DATE,
    remark         VARCHAR(500),
    created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee (employee_id),
    INDEX idx_enabled (enabled),
    CONSTRAINT fk_whitelist_employee FOREIGN KEY (employee_id) REFERENCES employee(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 8. 接口契约

### 8.1 人员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/personnel` | 分页查询员工列表（支持搜索/筛选/排序） |
| GET | `/api/personnel/{id}` | 查询单个员工详情 |
| POST | `/api/personnel` | 新增员工 |
| PUT | `/api/personnel/{id}` | 更新员工信息 |
| DELETE | `/api/personnel/{id}` | 删除员工（逻辑删除） |
| GET | `/api/personnel/dashboard` | 仪表盘统计数据 |

**分页查询参数**: `page`, `size`, `keyword`(姓名/工号), `department`, `status`, `sortBy`, `sortOrder`

### 8.2 成本预算

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/budget` | 分页查询成本预算（支持粒度/年份/月份筛选） |
| POST | `/api/budget` | 新增/更新成本预算记录 |
| PUT | `/api/budget/{id}` | 更新单条成本预算 |
| DELETE | `/api/budget/{id}` | 删除成本预算 |
| GET | `/api/budget/summary` | 汇总统计（按年/按月汇总，支持部门维度） |

**查询参数**: `page`, `size`, `granularity`(MONTHLY/YEARLY), `year`, `month`, `department`, `employeeId`

### 8.3 白名单管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/whitelist` | 分页查询白名单列表 |
| POST | `/api/whitelist` | 将员工加入白名单 |
| PUT | `/api/whitelist/{id}` | 更新白名单配置（启用/禁用/有效期） |
| DELETE | `/api/whitelist/{id}` | 从白名单移除员工 |
| GET | `/api/whitelist/check/{employeeId}` | 检查员工是否在白名单中 |

### 8.4 批量导入

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/import/personnel` | 批量导入员工信息（multipart/form-data） |
| POST | `/api/import/budget` | 批量导入成本预算（multipart/form-data） |
| GET | `/api/import/template/{type}` | 下载导入模板（type=personnel/budget） |

**导入请求参数**: `file`(上传文件), `format`(XLSX/CSV)

**导入响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "totalCount": 100,
    "successCount": 95,
    "failureCount": 5,
    "errors": [
      { "row": 3, "field": "employee_no", "message": "工号已存在" }
    ]
  }
}
```

---

## 9. 批量导入设计

### 9.1 流程

```
用户选择文件 → 前端解析预览（校验格式/必填项） → 确认上传
  → 后端接收 multipart 文件 → 解析（POI/Commons CSV）
  → 逐行校验 → 批量入库 → 返回成功/失败明细
```

### 9.2 前端解析（预览校验）

- **Excel**: 使用 SheetJS (xlsx) 解析，展示前 N 行预览。
- **CSV**: 使用 PapaParse 解析，自动检测分隔符。

### 9.3 后端解析

- **Excel**: Apache POI / EasyExcel 读取 `.xlsx`。
- **CSV**: Apache Commons CSV 读取。
- 逐行校验：必填字段、格式（手机号/邮箱/日期）、工号唯一性。
- 校验失败的行收集到 errors 列表，成功的行批量插入。

### 9.4 模板下载

- 后端提供 `.xlsx` 模板下载接口，模板含表头与示例行及填写说明。

---

## 10. 白名单机制

### 10.1 业务规则

- 只有在 `budget_whitelist` 表中且 `enabled=1` 且在有效期内的员工，才能录入成本预算。
- 新增成本预算时，后端校验员工是否在白名单中，不在则拒绝并返回提示。
- 白名单支持设置生效起止日期，到期自动失效。

### 10.2 前端交互

- 人员管理列表中，每行可操作「加入白名单」/「移出白名单」。
- 白名单管理页面独立展示白名单列表，支持启用/禁用切换与有效期设置。
- 成本预算录入时，员工选择器仅展示白名单内员工。

---

## 11. 仓间对齐点

| 对齐点 | 前端（library-frontend） | 后端（library-backend） | 对齐内容 |
|--------|--------------------------|--------------------------|----------|
| API 基础路径 | `VITE_API_BASE_URL=/api` | `server.servlet.context-path=/api` | 统一 `/api` 前缀 |
| 统一响应体 | `ApiResponse<T>` TS 类型 | `ApiResponse<T>` Java 类 | `{ code, message, data }` |
| 分页协议 | `page`(0-based), `size` | `Page<T>` (MyBatis-Plus) | 请求 `page`/`size`，响应 `records`/`total`/`current`/`size` |
| 枚举值 | `BudgetGranularity.MONTHLY/YEARLY` | `BudgetGranularity` enum | 字符串枚举对齐 |
| 导入格式 | `ImportFormat.XLSX/CSV` | `ImportFormat` enum | 字符串枚举对齐 |
| CORS | 开发环境 Vite proxy | `WebMvcConfig` CORS 配置 | 允许 `localhost:5173` |
| 日期格式 | `YYYY-MM-DD` | `@JsonFormat(pattern="yyyy-MM-dd")` | 统一日期格式 |
| 金额精度 | `number` (JS) | `DECIMAL(12,2)` | 前端展示保留 2 位小数 |

---

## 12. 仪表盘数据设计

### 12.1 人员管理仪表盘

| 指标 | 数据来源 | 图表类型 |
|------|----------|----------|
| 员工总数/在职数 | employee 表 count | 数字卡片 |
| 部门分布 | GROUP BY department | 饼图 |
| 白名单覆盖率 | whitelist / employee 比例 | 进度条 |
| 入职趋势 | GROUP BY entry_date 按月 | 折线图 |

### 12.2 成本预算仪表盘

| 指标 | 数据来源 | 图表类型 |
|------|----------|----------|
| 年度预算总额 | SUM(amount) WHERE granularity=YEARLY | 数字卡片 |
| 月度预算趋势 | SUM(amount) GROUP BY month | 柱状图 |
| 部门预算分布 | JOIN employee GROUP BY department | 饼图 |
| 预算 vs 实际 | （预留扩展） | 对比柱状图 |

---

## 13. 风险与待确认项

| # | 风险/待确认 | 影响 | 缓解措施 |
|---|-------------|------|----------|
| 1 | 两个仓库均为空仓，需从零搭建工程脚手架 | 前后端均需初始化项目结构 | 先完成项目脚手架搭建再开发功能模块 |
| 2 | 看板视图拖拽排序是否需要持久化 | 影响看板视图实现复杂度 | 本期暂不持久化拖拽顺序，仅展示分组 |
| 3 | 成本预算是否需要审批流程 | 影响数据模型与接口设计 | 本期不含审批流程，预留扩展字段 |
| 4 | 导入文件大小限制 | 影响导入性能与稳定性 | 限制单文件 10MB，超大批量分批处理 |
| 5 | 权限/角色体系 | 影响接口鉴权设计 | 本期暂不做 RBAC，预留接口鉴权扩展点 |

---

## 14. 实施计划（后续步骤）

| 步骤 | 仓库 | 内容 |
|------|------|------|
| 1 | library-frontend | Vite + React 19 + TS 脚手架初始化，安装 Ant Design 等依赖 |
| 2 | library-backend | Spring Boot 3 + MyBatis-Plus 脚手架初始化，配置 MySQL 连接 |
| 3 | library-backend | 建表 SQL（employee / cost_budget / budget_whitelist） |
| 4 | library-backend | 人员管理 CRUD 接口实现 |
| 5 | library-frontend | 主从布局 + 路由 + 人员管理列表视图 |
| 6 | library-backend | 成本预算 + 白名单接口实现 |
| 7 | library-frontend | 成本预算 + 白名单页面 + 视图切换器 |
| 8 | library-backend | 批量导入接口（Excel/CSV 解析 + 模板下载） |
| 9 | library-frontend | 导入中心页面 + 前端文件解析预览 |
| 10 | 双仓 | 仪表盘视图 + ECharts 图表对接 |
| 11 | 双仓 | 联调测试 + 对齐点验证 |

---

*本文档由 brainstorming 技能产出，经需求澄清后落盘。后续实施阶段以此文档为设计基线。*
