# 人员看板（Personnel Dashboard）设计文档

> 阶段：方案设计（loop-1）｜技能：/brainstorming
> 仓库：library-frontend（前端）、library-backend（后端）
> 状态：✅ 全部澄清完成，技术栈已确定，SDD 已细化。

---

## 1. 需求理解

原始需求：
> 开发一个人员看板，有入口记录员工的基本信息以及增删改查，支持导入以及记录成本预算--白名单、批量导入。

### 1.1 澄清结果

| 问题 | 用户决策 | 影响 |
|------|----------|------|
| Q1 系统定位 | **独立的新系统**，与图书管理系统无关 | 独立模块命名空间，不与图书实体关联 |
| Q2 成本预算--白名单 | **成本预算 + 权限白名单**，两个独立功能 | F6 成本预算 CRUD + F7 操作权限白名单，数据模型解耦 |
| Q3 导入格式 | **Excel + CSV 两者都支持** | 前端上传组件支持双格式，后端双解析器 |
| Q4 技术栈 | **方案A: React + Spring Boot** | 前端 React+AntDesign+Vite，后端 SpringBoot+MyBatis-Plus+MySQL |

### 1.2 功能域拆解

| 编号 | 功能域 | 说明 | 优先级 |
|------|--------|------|--------|
| F1 | 员工基本信息录入 | 表单入口，记录姓名、工号、部门、岗位、联系方式、入职日期等 | P0 |
| F2 | 员工增删改查（CRUD） | 新增、删除、修改、查询，支持分页与搜索 | P0 |
| F3 | 人员看板展示 | 看板/列表形式展示员工概览，支持筛选 | P0 |
| F4 | 数据导入 | 支持 Excel(.xlsx) 和 CSV 文件导入 | P1 |
| F5 | 批量导入 | 批量导入员工信息，含校验与冲突处理 | P1 |
| F6 | 成本预算记录 | 记录人员相关成本预算，独立 CRUD | P1 |
| F7 | 权限白名单 | 操作权限白名单管理，控制谁可操作成本预算等敏感功能 | P1 |

## 2. 跨仓现状

- `[library-frontend]` 全新仓库，仅 README.md，无源码、无依赖配置、无构建配置。
- `[library-backend]` 全新仓库，仅 README.md，无源码、无接口定义。
- 仓间对齐点：无既有接口契约，本次从零设计，前后端接口契约在本文档统一约定。

## 3. 技术栈（已确定）

### 3.1 前端 — library-frontend

| 项 | 选型 |
|----|------|
| 框架 | React 18 + TypeScript 5 |
| UI 库 | Ant Design 5 |
| 构建 | Vite 5 |
| 路由 | React Router 6 |
| 状态管理 | Zustand（轻量） |
| HTTP | Axios |
| 文件解析(预览) | SheetJS (xlsx) |
| 代码规范 | ESLint + Prettier |

### 3.2 后端 — library-backend

| 项 | 选型 |
|----|------|
| 语言 | Java 17 |
| 框架 | Spring Boot 3.2 |
| ORM | MyBatis-Plus 3.5 |
| 数据库 | MySQL 8.0 |
| Excel 解析 | Apache POI 5 |
| CSV 解析 | OpenCSV 5 |
| 参数校验 | Jakarta Validation (hibernate-validator) |
| API 文档 | SpringDoc OpenAPI (Swagger) |
| 构建 | Maven |

## 4. 数据模型设计（定稿）

### 4.1 Employee（员工）

```sql
CREATE TABLE employee (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  employee_no   VARCHAR(50)  NOT NULL UNIQUE COMMENT '工号',
  name          VARCHAR(100) NOT NULL COMMENT '姓名',
  department    VARCHAR(100) COMMENT '部门',
  position      VARCHAR(100) COMMENT '岗位',
  phone         VARCHAR(20)  COMMENT '联系电话',
  email         VARCHAR(100) COMMENT '邮箱',
  entry_date    DATE         COMMENT '入职日期',
  status        TINYINT      NOT NULL DEFAULT 1 COMMENT '1=在职 0=离职',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_no (employee_no),
  INDEX idx_department (department),
  INDEX idx_status (status)
);
```

### 4.2 CostBudget（成本预算）—— 独立功能

```sql
CREATE TABLE cost_budget (
  id            BIGINT        PRIMARY KEY AUTO_INCREMENT,
  employee_id   BIGINT        COMMENT '关联员工ID（可空，支持部门级预算）',
  department    VARCHAR(100)  COMMENT '预算归属部门',
  amount        DECIMAL(12,2) NOT NULL COMMENT '预算金额',
  period        VARCHAR(20)   NOT NULL COMMENT '预算周期（如 2026-Q3）',
  type          VARCHAR(50)   COMMENT '预算类型（SALARY/TRAINING/RECRUITMENT等）',
  remark        TEXT          COMMENT '备注',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_id (employee_id),
  INDEX idx_period (period),
  INDEX idx_department (department)
);
```

### 4.3 Whitelist（权限白名单）—— 独立功能

```sql
CREATE TABLE whitelist (
  id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
  user_id       VARCHAR(100) NOT NULL COMMENT '被授权用户标识',
  user_name     VARCHAR(100) COMMENT '用户名',
  scope         VARCHAR(50)  NOT NULL COMMENT '权限范围（COST_BUDGET_MANAGE/EMPLOYEE_IMPORT等）',
  enabled       TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_user_scope (user_id, scope),
  INDEX idx_scope (scope)
);
```

## 5. 接口契约（前后端对齐点）

### 5.1 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页响应：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [],
    "total": 100,
    "current": 1,
    "size": 10
  }
}
```

### 5.2 API 列表

| 方法 | 路径 | 说明 | 请求体/参数 | 仓库 |
|------|------|------|-------------|------|
| GET | /api/employees | 员工列表（分页/搜索/筛选） | ?page=1&size=10&keyword=&department=&status= | backend |
| GET | /api/employees/{id} | 员工详情 | path: id | backend |
| POST | /api/employees | 新增员工 | EmployeeDTO | backend |
| PUT | /api/employees/{id} | 修改员工 | EmployeeDTO | backend |
| DELETE | /api/employees/{id} | 删除员工 | path: id | backend |
| POST | /api/employees/import | 批量导入员工 | multipart: file, ?mode=skip\|overwrite | backend |
| GET | /api/employees/template | 下载导入模板 | - | backend |
| GET | /api/cost-budgets | 成本预算列表 | ?page=&employeeId=&department=&period= | backend |
| POST | /api/cost-budgets | 新增成本预算 | CostBudgetDTO | backend |
| PUT | /api/cost-budgets/{id} | 修改成本预算 | CostBudgetDTO | backend |
| DELETE | /api/cost-budgets/{id} | 删除成本预算 | path: id | backend |
| GET | /api/whitelist | 白名单列表 | ?page=&scope=&enabled= | backend |
| POST | /api/whitelist | 新增白名单 | WhitelistDTO | backend |
| PUT | /api/whitelist/{id} | 修改白名单 | WhitelistDTO | backend |
| DELETE | /api/whitelist/{id} | 删除白名单 | path: id | backend |

### 5.3 导入响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalCount": 100,
    "successCount": 95,
    "failCount": 5,
    "failures": [
      { "row": 3, "employeeNo": "E003", "reason": "工号已存在" },
      { "row": 7, "employeeNo": "", "reason": "姓名不能为空" }
    ]
  }
}
```

## 6. 前端页面与路由

| 路由 | 页面 | 核心组件 | 功能域 |
|------|------|----------|--------|
| `/dashboard` | 人员看板首页 | EmployeeCardList, StatCards, SearchBar | F3 |
| `/employees` | 员工列表管理 | EmployeeTable, EmployeeFormModal | F1, F2 |
| `/employees/import` | 导入入口 | FileUpload, ImportPreview, ImportResult | F4, F5 |
| `/cost-budgets` | 成本预算管理 | CostBudgetTable, CostBudgetFormModal | F6 |
| `/whitelist` | 权限白名单管理 | WhitelistTable, WhitelistFormModal | F7 |

布局：Ant Design ProLayout 侧边栏 + 顶栏，侧边栏菜单对应上述路由。

## 7. 批量导入设计

### 7.1 流程
1. 前端上传 .xlsx 或 .csv 文件（Ant Design Upload 组件）
2. 前端用 SheetJS 解析预览（校验列头、行数，展示前 10 行预览）
3. 用户确认后提交至后端 `POST /api/employees/import`
4. 后端解析（POI/OpenCSV），逐行校验：
   - 工号唯一性校验
   - 必填字段校验（姓名、工号）
   - 格式校验（日期、邮箱、手机号）
5. 返回导入结果：成功数、失败数、失败明细

### 7.2 冲突策略
- 工号已存在：默认跳过并记录失败原因；可选参数 `mode=overwrite` 覆盖更新
- 部分失败：成功行正常入库，失败行返回明细

### 7.3 导入模板列定义

| 列序 | 列名 | 必填 | 说明 |
|------|------|------|------|
| A | 工号 | ✅ | 唯一标识 |
| B | 姓名 | ✅ | |
| C | 部门 | | |
| D | 岗位 | | |
| E | 联系电话 | | |
| F | 邮箱 | | |
| G | 入职日期 | | 格式: YYYY-MM-DD |
| H | 状态 | | 在职/离职 |

## 8. 后端模块结构

```
library-backend/
├── pom.xml
└── src/main/java/com/library/personnel/
    ├── PersonnelApplication.java
    ├── config/
    │   ├── CorsConfig.java
    │   ├── MyBatisPlusConfig.java
    │   └── OpenApiConfig.java
    ├── controller/
    │   ├── EmployeeController.java
    │   ├── CostBudgetController.java
    │   ├── WhitelistController.java
    │   └── ImportController.java
    ├── service/
    │   ├── EmployeeService.java
    │   ├── CostBudgetService.java
    │   ├── WhitelistService.java
    │   └── ImportService.java
    ├── mapper/
    │   ├── EmployeeMapper.java
    │   ├── CostBudgetMapper.java
    │   └── WhitelistMapper.java
    ├── entity/
    │   ├── Employee.java
    │   ├── CostBudget.java
    │   └── Whitelist.java
    ├── dto/
    │   ├── EmployeeDTO.java
    │   ├── CostBudgetDTO.java
    │   ├── WhitelistDTO.java
    │   └── ImportResultDTO.java
    ├── parser/
    │   ├── ExcelParser.java
    │   └── CsvParser.java
    └── common/
        ├── Result.java
        ├── PageResult.java
        └── GlobalExceptionHandler.java
```

## 9. 前端模块结构

```
library-frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── router/
    │   └── index.tsx
    ├── layouts/
    │   └── MainLayout.tsx
    ├── pages/
    │   ├── Dashboard/
    │   ├── Employees/
    │   ├── Import/
    │   ├── CostBudgets/
    │   └── Whitelist/
    ├── components/
    │   ├── SearchBar/
    │   ├── EmployeeCard/
    │   └── ImportPreview/
    ├── api/
    │   ├── request.ts
    │   ├── employee.ts
    │   ├── costBudget.ts
    │   └── whitelist.ts
    ├── store/
    │   └── useEmployeeStore.ts
    ├── types/
    │   └── index.ts
    └── utils/
        └── fileParser.ts
```

## 10. 风险与约束

- 两仓库均为空，需从零搭建脚手架。
- 权限白名单鉴权机制（JWT/Session）后续可细化，当前先实现白名单 CRUD。
- 批量导入大文件（>1万行）需考虑异步处理与进度反馈，当前先实现同步导入。
- 本轮处于设计阶段，未修改任何代码文件（符合约束）。

## 11. 后续步骤

1. ✅ 核心歧义已澄清（Q1-Q4 全部完成）
2. ✅ 技术栈已确定（方案A: React + Spring Boot）
3. ✅ SDD 已细化（数据模型、接口契约、模块结构、导入流程）
4. ⏳ 搭建前后端脚手架（下一轮执行）
5. ⏳ 按 P0→P1 优先级实现：先 CRUD 再导入再成本预算/白名单
