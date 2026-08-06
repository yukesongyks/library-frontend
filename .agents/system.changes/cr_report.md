# 代码评审报告 - 人员看板前端模块

> **评审阶段**: test / 代码评审  
> **评审范围**: library-frontend 人员看板功能全量前端代码  
> **评审方法**: SDD范式四步审查（功能核对→可读性→可靠性→自定义扩展）适配前端技术栈  
> **评审日期**: 2026-08-06  

---

## 一、执行队列

| # | 文件路径 | 行数 | 审查重点 |
|---|---------|------|---------|
| 1 | src/types/staff.ts | 112 | 类型定义完整性、接口契约对齐 |
| 2 | src/api/staffApi.ts | 112 | API封装一致性、错误处理 |
| 3 | src/components/staff/StaffBoard.tsx | 20 | 入口组件、Tab路由 |
| 4 | src/components/staff/EmployeeList.tsx | 136 | CRUD列表、分页、搜索 |
| 5 | src/components/staff/EmployeeFormModal.tsx | 80 | 表单校验、数据类型转换 |
| 6 | src/components/staff/BudgetPanel.tsx | 122 | 预算CRUD、汇总展示 |
| 7 | src/components/staff/WhitelistPanel.tsx | 118 | 白名单管理、批量操作 |
| 8 | src/components/staff/ImportPanel.tsx | 106 | 文件上传、导入结果轮询 |
| 9 | src/App.tsx | 19 | 入口集成 |

---

## 二、功能核对

### 需求覆盖矩阵

| 需求点 | 实现文件 | 状态 | 备注 |
|--------|---------|------|------|
| 员工基本信息录入 | EmployeeFormModal.tsx | ✅ | 含工号/姓名/部门/职位/入职日期/联系方式/技能/资质/项目经验 |
| 员工增删改查 | EmployeeList.tsx + staffApi.ts | ✅ | 分页查询、新增、编辑、删除均已实现 |
| 成本预算记录 | BudgetPanel.tsx | ✅ | 支持年度/月度预算设置、汇总统计 |
| 白名单管理 | WhitelistPanel.tsx | ✅ | 单条添加、批量添加、移除 |
| 批量导入 | ImportPanel.tsx | ✅ | 文件上传、模板下载、导入结果展示 |
| Tab页签入口 | StaffBoard.tsx | ✅ | employees/budget/whitelist/import 四个Tab |

**功能核对结论**: 需求全覆盖，无遗漏功能点。

---

## 三、可读性检查

| 文件 | 评分 | 说明 |
|------|------|------|
| staff.ts | A | 类型分组清晰，注释分隔合理，命名语义明确 |
| staffApi.ts | A- | 函数命名规范，分区注释清晰；uploadImportFile 风格略异 |
| StaffBoard.tsx | A | 简洁的Tab容器组件，职责单一 |
| EmployeeList.tsx | A | 列定义集中、逻辑分层合理 |
| EmployeeFormModal.tsx | A | 表单结构清晰，props接口简洁 |
| BudgetPanel.tsx | A- | 整体良好，summary渲染逻辑可抽取 |
| WhitelistPanel.tsx | A | 结构与EmployeeList一致性好 |
| ImportPanel.tsx | A- | 轮询逻辑内聚，状态机清晰 |
| App.tsx | A | 极简集成，无冗余 |

**可读性结论**: 整体代码可读性良好，命名规范、结构清晰、注释适度。

---

## 四、可靠性检查

### 🔴 Blocker（阻断级）

**无**

### 🟠 Major（重要）

#### M-01: DatePicker 值类型不匹配
- **文件**: `[library-frontend] src/components/staff/EmployeeFormModal.tsx` L62-63
- **问题**: `DatePicker` 组件返回 dayjs 对象，但 `EmployeeFormData.hireDate` 定义为 `string`。表单 `validateFields()` 提交的 values 中 hireDate 为 dayjs 实例，未经 `.format('YYYY-MM-DD')` 转换即传给 API，后端将收到非预期类型。
- **影响**: 新增/编辑员工时后端可能拒绝请求或存入错误格式。
- **建议**: 在 `handleOk` 中对 values.hireDate 做格式化转换，或使用 `getValueFromEvent` / `normalize` 在 Form.Item 层处理。

#### M-02: uploadImportFile 绕过全局 request 封装
- **文件**: `[library-frontend] src/api/staffApi.ts` L88-103
- **问题**: 该函数直接使用原生 `fetch` 而非项目封装的 `request`，导致：(1) 不会自动注入 Authorization token；(2) 不走全局响应拦截器的统一错误处理；(3) 手动解析 `json.code !== 0` 与其他API调用模式不一致。
- **影响**: 若后端要求鉴权，导入功能将 401 失败；错误提示不统一。
- **建议**: 改用 `request` 封装，或在 `request` 中增加 FormData 支持。若因 multipart/form-data 特殊处理需要保留 fetch，至少手动注入 token 并复用错误处理逻辑。

#### M-03: BudgetPanel 筛选输入缺少防抖
- **文件**: `[library-frontend] src/components/staff/BudgetPanel.tsx` L78
- **问题**: `onChange` 直接 `setFilterEmployeeId`，每次按键触发 `fetchData`（通过 useEffect + useCallback 依赖链），产生 N 次无效请求。
- **影响**: 用户体验差、后端压力增大、可能出现请求乱序导致数据闪烁。
- **建议**: 使用 `useDebounceFn` 或 `lodash.debounce` 包装，延迟 300-500ms 触发查询。

### 🟡 Minor（一般）

#### m-01: skills render 可能返回 undefined
- **文件**: `[library-frontend] src/components/staff/EmployeeList.tsx` L80
- **问题**: `skills?.map(...)` 当 skills 为 undefined/null 时表达式结果为 undefined，antd Table render 期望 ReactNode。
- **建议**: 改为 `(skills || []).map(...)` 或 `skills?.map(...) ?? null`。

#### m-02: employeeId 筛选条件 truthy 判断不严谨
- **文件**: `[library-frontend] src/api/staffApi.ts` L49
- **问题**: `if (query.employeeId)` 对空字符串 "" 为 falsy 可以过滤，但对仅含空格的字符串不会过滤。
- **建议**: 改为 `if (query.employeeId?.trim())`。

#### m-03: BudgetSummary 硬编码截断无提示
- **文件**: `[library-frontend] src/components/staff/BudgetPanel.tsx` L66
- **问题**: `summary.slice(0, 4)` 超过4条时静默丢弃，用户无法感知数据不完整。
- **建议**: 增加 "查看更多" 链接或改为响应式 Col span 自适应。

#### m-04: ApiResponse 导入路径隐式耦合
- **文件**: `[library-frontend] src/types/staff.ts` L1
- **问题**: `import { ApiResponse } from "./api"` 假设同级存在 api 模块且导出 ApiResponse，若目录重构易断裂。
- **建议**: 考虑将 ApiResponse 放入独立 types/common.ts 或在 staff.ts 中直接定义。

---

## 五、自定义扩展检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 权限控制 | ⚠️ 缺失 | 当前未实现按钮级权限控制（code.md 已标注为已知限制） |
| 国际化 | ⚠️ 缺失 | 所有文案硬编码中文，未接入 i18n |
| 单元测试 | ⚠️ 缺失 | 无对应测试文件 |
| 错误边界 | ✅ | 各组件 try-catch + message.error 兜底 |
| 内存泄漏防护 | ⚠️ 部分 | ImportPanel 轮询有 cleanup；其他组件 useEffect 无 abort controller |
| XSS 防护 | ✅ | antd 组件默认转义，无 dangerouslySetInnerHTML |

---

## 六、跨仓对齐点检查

| 前端接口调用 | 后端预期路径 | 参数类型匹配 | 状态 |
|-------------|-------------|-------------|------|
| GET /staff/employees?page&pageSize&department&name | 系分设计 §3.1 | ✅ Query params 对齐 | PASS |
| POST /staff/employees (EmployeeFormData) | 系分设计 §3.1 | ✅ Body JSON 对齐 | PASS |
| PUT /staff/employees/:id | 系分设计 §3.1 | ✅ Path param + Body | PASS |
| DELETE /staff/employees/:id | 系分设计 §3.1 | ✅ | PASS |
| GET /staff/budgets?employeeId&budgetYear | 系分设计 §3.2 | ✅ | PASS |
| POST /staff/budgets | 系分设计 §3.2 | ✅ | PASS |
| GET /staff/budgets/summary?year | 系分设计 §3.2 | ✅ | PASS |
| GET /staff/whitelist | 系分设计 §3.3 | ✅ | PASS |
| POST /staff/whitelist/batch | 系分设计 §3.3 | ✅ | PASS |
| POST /staff/import (multipart) | 系分设计 §3.4 | ⚠️ 见 M-02 | WARN |
| GET /staff/import/result/:taskId | 系分设计 §3.4 | ✅ | PASS |

**跨仓对齐结论**: 接口路径与参数类型整体对齐，仅 import 上传因绕过 request 封装存在鉴权风险（M-02）。

---

## 七、评审统计

| 级别 | 数量 |
|------|------|
| 🔴 Blocker | **0** |
| 🟠 Major | 3 |
| 🟡 Minor | 4 |
| 💡 Suggestion | 0 |

**评审结论**: ✅ **通过（附条件）**  
无阻断级问题，3个 Major 建议在合入前修复（尤其是 M-01 数据类型转换和 M-02 鉴权绕过），4个 Minor 可作为后续优化项。

---

*报告生成工具: dtazziboot-java-code-review (SDD范式适配前端)*  
*评审人: AI Code Reviewer*
