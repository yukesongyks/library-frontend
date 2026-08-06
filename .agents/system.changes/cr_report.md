# Code Review Report - Staff Board (library-frontend)

> 审查阶段: test / 代码评审  
> 审查技能: dtazziboot-java-code-review (适配前端 TypeScript/React)  
> 审查时间: 2026-08-06  
> 审查范围: 人员看板功能全部前端变更文件

---

## 1. 审查概览

| 指标 | 数值 |
|------|------|
| 审查文件数 | 9 |
| Blocker | 2 |
| Critical | 2 |
| Major | 2 |
| Minor | 2 |
| 总体结论 | ❌ 不通过，需修复 Blocker 后重新提交 |

---

## 2. 问题清单

### 🔴 Blocker

#### B-01: EmployeeList 轮询定时器未清理导致内存泄漏
- **文件**: `[library-frontend] src/components/staff/EmployeeList.tsx`
- **位置**: `useEffect` 内 `setInterval`
- **问题**: `setInterval` 创建的定时器 ID 未在 `useEffect` cleanup 函数中 `clearInterval`。组件卸载或依赖变更后定时器持续运行，造成内存泄漏和无效 API 调用。
- **code.md 关联**: 剩余风险 #2 已识别但未修复
- **修复建议**:
  ```tsx
  useEffect(() => {
    const timer = setInterval(() => fetchEmployees(), 5000);
    return () => clearInterval(timer); // ← 必须添加
  }, []);
  ```

#### B-02: updateEmployee 接口契约与日期序列化缺失
- **文件**: `[library-frontend] src/api/staffApi.ts`
- **位置**: `updateEmployee` 函数
- **问题**:
  1. 使用 `PUT` 方法但参数类型为 `Partial<Employee>`，语义上 PUT 应为全量更新，PATCH 才对应部分更新。需与后端确认实际契约。
  2. `Employee.hireDate` / `birthDate` 等日期字段在发送前未做 ISO 字符串序列化，若后端期望 `yyyy-MM-dd` 格式而前端传递 Date 对象或时间戳，将导致 400 错误。
- **code.md 关联**: 剩余风险 #1 已识别但未修复
- **修复建议**: 明确使用 PATCH 或在请求体中对日期字段做 `toISOString().slice(0,10)` 转换；与后端对齐 OpenAPI 契约。

---

### 🟠 Critical

#### C-01: EmployeeFormModal 编辑态 initialValues 未动态绑定
- **文件**: `[library-frontend] src/components/staff/EmployeeFormModal.tsx`
- **问题**: Ant Design Form 的 `initialValues` 仅在首次渲染生效。当 `editingEmployee` 从 null 变为具体员工时，表单字段不会自动填充。需使用 `form.setFieldsValue()` 在 `useEffect` 中同步。
- **影响**: 编辑功能不可用，用户看到空表单。
- **修复建议**:
  ```tsx
  useEffect(() => {
    if (editingEmployee) {
      form.setFieldsValue(editingEmployee);
    } else {
      form.resetFields();
    }
  }, [editingEmployee]);
  ```

#### C-02: BudgetPanel / WhitelistPanel 删除操作缺少二次确认
- **文件**: `[library-frontend] src/components/staff/BudgetPanel.tsx`, `WhitelistPanel.tsx`
- **问题**: 删除按钮直接触发 API 调用，无 `Modal.confirm` 或 `Popconfirm` 包裹。
- **影响**: 误触即删，数据不可恢复。
- **修复建议**: 使用 `<Popconfirm title="确认删除？" onConfirm={handleDelete}>` 包裹删除按钮。

---

### 🟡 Major

#### M-01: ImportPanel 轮询策略过于激进
- **文件**: `[library-frontend] src/components/staff/ImportPanel.tsx`
- **问题**: 导入任务轮询间隔 2s，无最大重试次数、无超时退出、无手动取消。大批量导入时可能产生数百次无效请求。
- **修复建议**: 采用指数退避（2s → 4s → 8s → ... → max 30s），设置最大轮询次数（如 60 次 = ~5min），提供取消按钮。

#### M-02: staff.ts 类型定义缺少运行时校验
- **文件**: `[library-frontend] src/types/staff.ts`
- **问题**: `budgetAmount: number` 等数值字段仅靠 TypeScript 编译期检查，API 返回字符串 `"10000"` 时不会报错但会导致计算异常。
- **修复建议**: 在 API 响应层增加 zod/yup 运行时校验，或在 `staffApi.ts` 中对响应做 `Number()` 转换。

---

### 🔵 Minor

#### m-01: StaffBoard Tab label 硬编码中文
- **文件**: `[library-frontend] src/components/staff/StaffBoard.tsx`
- **问题**: `items` 数组中 label 为硬编码中文字符串，未接入 i18n。
- **修复建议**: 使用 `t('staff.tab.employees')` 等国际化 key。

#### m-02: App.tsx 缺少路由隔离与懒加载
- **文件**: `[library-frontend] src/App.tsx`
- **问题**: `StaffBoard` 直接同步渲染在根组件，无论是否访问该页面都会加载全部代码。
- **修复建议**: 使用 `React.lazy(() => import('@/components/staff/StaffBoard'))` + `<Suspense>` 或路由级懒加载。

---

## 3. 跨库契约对齐检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| API Base Path | ✅ | `/api/v1/staff` 与 design.md 一致 |
| CRUD 端点覆盖 | ✅ | GET/POST/PUT/DELETE 均已实现 |
| 导入异步任务流 | ⚠️ | POST upload → GET result 流程正确，但轮询策略需优化 (M-01) |
| 日期格式契约 | ❌ | 前端未做序列化，需与后端确认 (B-02) |
| 分页参数命名 | ✅ | `pageNum` / `pageSize` 与 design.md PageRequest 一致 |
| 响应包装结构 | ✅ | `ApiResponse<T>` 泛型封装正确 |

---

## 4. 功能核对矩阵

| 需求点 | 实现状态 | 备注 |
|--------|----------|------|
| 员工基本信息录入 | ✅ | EmployeeFormModal 覆盖姓名/工号/部门/职级/入职日期等 |
| 员工增删改查 | ⚠️ | 编辑态有 Bug (C-01)，删除缺确认 (C-02) |
| 批量导入 | ⚠️ | 流程完整但轮询策略需优化 (M-01) |
| 成本预算记录 | ✅ | BudgetPanel 支持增删改查及币种选择 |
| 白名单管理 | ✅ | WhitelistPanel 支持增删改查及状态切换 |
| 权限控制 | ❌ | code.md 剩余风险 #3，当前无任何按钮级权限控制 |

---

## 5. 结论与建议

**本次审查发现 2 个 Blocker 级问题，代码暂不具备合并条件。**

优先修复顺序：
1. **B-01** → 内存泄漏，影响线上稳定性
2. **B-02** → 接口契约不一致，编辑/新增可能直接报错
3. **C-01** → 编辑功能完全不可用
4. **C-02** → 数据安全兜底

修复上述 4 项后可重新提交审查。Major/Minor 问题建议在后续迭代中处理。
