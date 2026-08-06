# 人员看板前端编码实现报告

## 实施概要

本次任务完成了人员看板模块的前端编码实现，包括员工 CRUD、成本预算管理、白名单管理和批量导入功能。

## 变更文件清单

### 新增文件

| 文件路径 | 职责 |
|----------|------|
| `src/types/staff.ts` | 员工、预算、白名单、导入相关的 TypeScript 类型定义 |
| `src/api/staffApi.ts` | 人员看板所有 API 调用封装（适配现有 `request<T>` 函数） |
| `src/components/staff/StaffBoard.tsx` | 人员看板主容器，管理子 Tab 切换 |
| `src/components/staff/EmployeeList.tsx` | 员工列表页：分页表格 + 筛选 + 新增/编辑/删除 |
| `src/components/staff/EmployeeFormModal.tsx` | 员工新增/编辑表单弹窗 |
| `src/components/staff/BudgetPanel.tsx` | 成本预算管理：按员工查看/设置预算 + 汇总统计 |
| `src/components/staff/WhitelistPanel.tsx` | 白名单管理：列表 + 添加/移除 + 批量添加 |
| `src/components/staff/ImportPanel.tsx` | 批量导入：文件上传 + 校验结果展示 + 模板下载 |

### 修改文件

| 文件路径 | 变更内容 |
|----------|----------|
| `src/App.tsx` | 引入 StaffBoard 组件并添加到页面布局 |

## 技术适配说明

### API 层适配

实施计划中假设 `client.ts` 导出 `apiFetch/apiPost/apiPut/apiDelete`，但实际项目使用统一的 `request<T>(path, options)` 函数。已做如下适配：

- GET 请求：`request<T>(path)`
- POST 请求：`request<T>(path, { method: "POST", body: data })`
- PUT 请求：`request<T>(path, { method: "PUT", body: data })`
- DELETE 请求：`request<T>(path, { method: "DELETE" })`
- 文件上传：直接使用原生 `fetch` + `FormData`（因 `request` 不支持 multipart）

### API 基础路径

- `client.ts` 中的 `BASE_URL` 默认为 `/api`
- `staffApi.ts` 中的路径使用 `/staff/*`，最终拼接为 `/api/staff/*`

## 验证结果

```bash
$ npx tsc --noEmit
# 无错误输出，类型检查通过
```

## 跨仓对齐点

### 后端接口契约

前端已按以下接口契约实现，需确保后端提供对应 API：

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/staff/employees?page=&pageSize=&department=&name=` | 分页查询员工 |
| GET | `/api/staff/employees/:id` | 获取单个员工详情 |
| POST | `/api/staff/employees` | 新增员工 |
| PUT | `/api/staff/employees/:id` | 更新员工 |
| DELETE | `/api/staff/employees/:id` | 删除员工（逻辑删除） |
| GET | `/api/staff/budgets?employeeId=&budgetYear=` | 查询预算列表 |
| POST | `/api/staff/budgets` | 新增预算 |
| PUT | `/api/staff/budgets/:id` | 更新预算 |
| GET | `/api/staff/budgets/summary?year=` | 预算汇总统计 |
| GET | `/api/staff/whitelist` | 获取白名单列表 |
| POST | `/api/staff/whitelist` | 添加白名单 |
| DELETE | `/api/staff/whitelist/:id` | 移除白名单 |
| POST | `/api/staff/whitelist/batch` | 批量添加白名单 |
| POST | `/api/staff/import` | 上传导入文件（multipart/form-data） |
| GET | `/api/staff/import/result/:taskId` | 查询导入结果 |
| GET | `/api/staff/import/template` | 下载导入模板 |

### 统一响应体格式

```typescript
{
  code: number;      // 0 表示成功
  message?: string;  // 错误信息
  data?: T;          // 业务数据
}
```

## 剩余风险

1. **日期处理**：EmployeeFormModal 中使用 DatePicker，提交时需确认 dayjs 对象是否正确序列化为 ISO 8601 字符串
2. **导入轮询**：ImportPanel 中对 VALIDATING 状态的轮询未做取消处理，组件卸载时可能产生内存泄漏
3. **权限控制**：当前未实现按钮级权限控制，需根据用户角色隐藏/禁用操作按钮
