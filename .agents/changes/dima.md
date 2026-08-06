# 人员看板 - 需求澄清文档

## 1. 需求概述

开发一个人员看板模块，支持员工基本信息的增删改查、成本预算记录、白名单管理和批量导入功能。该模块作为图书管理系统的平行新功能，与现有图书/读者管理模块独立。

## 2. 跨仓依赖与现状摘要

### 2.1 前端仓库 (library-frontend)

- **技术栈**: React 18 + TypeScript + Ant Design 5 + ECharts + Vite
- **现有结构**: `src/components/` 下为 Tab 式演示组件，`src/api/` 下为 API 调用层
- **路由**: 当前无路由库，采用单页 Tab 切换；新增人员看板需引入路由或新增 Tab
- **可复用能力**: Ant Design Table/Form/Upload 组件可直接用于 CRUD 和导入功能

### 2.2 后端仓库 (library-backend)

- **技术栈**: Java + Spring Boot + Maven
- **现有结构**: `src/main/java/com/` 下按领域分包，`openspec/` 管理 API 规范
- **API 规范**: REST API 定义于 `openspec/changes/` 下的 `design.md`，变更须保持后向兼容
- **数据库**: 需新增员工表、成本预算表、白名单表

### 2.3 仓间对齐点

| 对齐项 | 前端 | 后端 |
|--------|------|------|
| API 基础路径 | `/api/staff/*` | `StaffController` |
| 数据格式 | JSON | JSON |
| 导入文件格式 | Excel (.xlsx) / CSV | MultipartFile 解析 |
| 分页参数 | `page`, `pageSize` | Pageable |
| 错误码约定 | 统一响应体 `{code, message, data}` | 同左 |

## 3. 功能需求澄清

### 3.1 员工基本信息 CRUD

**核心字段（必填）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| employeeId | String | 工号，唯一标识 |
| name | String | 姓名 |
| department | String | 部门 |
| position | String | 职位 |
| hireDate | Date | 入职日期 |
| contactInfo | String | 联系方式（手机/邮箱） |

**可选字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| skills | String[] | 技能标签 |
| certifications | String[] | 资质证书 |
| projectExperience | String | 项目经验备注 |

**操作：**
- 列表查询：支持分页、按部门/姓名筛选
- 新增：表单录入
- 编辑：表单修改
- 删除：逻辑删除（保留历史记录）
- 详情：查看完整信息

### 3.2 成本预算记录

**含义：** 每个员工的年度/月度人力成本预算额度，用于财务规划和资源分配。

**数据模型：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| employeeId | String | 关联工号 |
| budgetYear | Integer | 预算年度 |
| budgetMonth | Integer | 预算月份（null 表示年度预算） |
| amount | BigDecimal | 预算金额 |
| currency | String | 币种，默认 CNY |
| updatedAt | DateTime | 最后更新时间 |

**操作：**
- 按员工查看预算历史
- 设置/调整预算额度
- 预算汇总统计（按部门/年度）

### 3.3 白名单管理

**用途：** 可见性控制 — 仅白名单内的员工在人员看板中显示和管理。未在白名单中的员工数据仍存在但不展示。

**数据模型：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| employeeId | String | 关联工号 |
| addedAt | DateTime | 加入时间 |
| addedBy | String | 操作人 |
| remark | String | 备注 |

**操作：**
- 添加/移除白名单
- 白名单列表查询
- 批量添加白名单

### 3.4 批量导入

**支持格式：** Excel (.xlsx) 和 CSV

**导入流程：**
1. 用户上传文件
2. 后端解析并校验数据
3. 返回校验结果（成功条数、失败条数、失败明细）
4. 用户确认后写入数据库
5. 自动将导入员工加入白名单（可配置）

**校验规则：**
- 工号唯一性检查
- 必填字段非空校验
- 日期格式校验
- 重复数据提示（更新或跳过）

**模板下载：** 提供标准导入模板下载

## 4. 接口契约草案

### 4.1 员工 CRUD

```
GET    /api/staff/employees          # 分页查询（支持筛选）
POST   /api/staff/employees          # 新增员工
GET    /api/staff/employees/{id}     # 查询详情
PUT    /api/staff/employees/{id}     # 更新员工
DELETE /api/staff/employees/{id}     # 删除员工（逻辑删除）
```

### 4.2 成本预算

```
GET    /api/staff/budgets            # 查询预算列表（按员工/年度筛选）
POST   /api/staff/budgets            # 设置预算
PUT    /api/staff/budgets/{id}       # 调整预算
GET    /api/staff/budgets/summary    # 预算汇总统计
```

### 4.3 白名单

```
GET    /api/staff/whitelist          # 白名单列表
POST   /api/staff/whitelist          # 添加白名单
DELETE /api/staff/whitelist/{id}     # 移除白名单
POST   /api/staff/whitelist/batch    # 批量添加
```

### 4.4 批量导入

```
POST   /api/staff/import             # 上传导入文件
GET    /api/staff/import/template    # 下载导入模板
GET    /api/staff/import/result/{taskId}  # 查询导入结果
```

## 5. 待确认事项

以下事项需在后续阶段与产品/业务方确认：

1. **员工信息来源**：是否需要对接 HR 系统同步数据，还是纯手工维护？
2. **成本预算精度**：是否需要区分基本工资、奖金、福利等明细，还是仅总额？
3. **白名单粒度**：是否需要按角色/权限分级（如管理员可见全部，普通用户仅见本部门）？
4. **导入冲突策略**：重复工号时默认更新、跳过还是报错？
5. **数据权限**：是否需要按部门隔离数据可见性？
6. **审计日志**：是否需要记录所有操作的审计日志？
7. **导出功能**：是否需要支持员工列表/预算数据导出？

## 6. 技术约束与风险

| 风险项 | 影响 | 缓解措施 |
|--------|------|----------|
| 大批量导入性能 | 超时/内存溢出 | 异步处理 + 进度反馈 + 分批写入 |
| 数据一致性 | 导入中途失败导致脏数据 | 事务控制 + 回滚机制 |
| 前后端字段不一致 | 联调返工 | 先定 OpenAPI 规范再开发 |
| 白名单误操作 | 员工不可见 | 操作二次确认 + 操作日志 |

## 7. 下一步计划

1. 确认待确认事项
2. 输出详细 API 设计文档（OpenAPI 3.0）
3. 输出数据库 ER 图
4. 前端页面原型设计
5. 进入开发阶段
