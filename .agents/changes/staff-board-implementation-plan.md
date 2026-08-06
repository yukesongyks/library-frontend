# 人员看板前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 library-frontend 中实现人员看板模块，支持员工 CRUD、成本预算记录、白名单管理和批量导入功能。

**Architecture:** 采用 Tab 式页面结构（与现有 DemoTabs 模式一致），新增 StaffBoard 主组件作为人员看板入口，下设四个子 Tab：员工列表、成本预算、白名单管理、批量导入。API 层新增 staffApi.ts 封装所有 `/api/staff/*` 接口调用，类型定义扩展至 src/types/staff.ts。

**Tech Stack:** React 18 + TypeScript + Ant Design 5 (Table, Form, Upload, Modal, message) + Vite

---

## Global Constraints

- API 基础路径: `/api/staff/*`
- 统一响应体: `{ code: number; message?: string; data?: T }`（code === 0 表示成功）
- 分页参数: `page` (1-based), `pageSize` (默认 10)
- 导入文件格式: Excel (.xlsx) / CSV
- 日期格式: ISO 8601 (`YYYY-MM-DD`)
- 金额精度: BigDecimal，前端展示保留两位小数
- 币种默认: CNY
- 逻辑删除: DELETE 操作仅标记 deleted=true，不物理删除
- 组件命名: PascalCase，文件名与组件名一致
- API 函数命名: camelCase，动词前缀 (get/create/update/delete/import)

---

## File Structure

| 操作 | 文件路径 | 职责 |
|------|----------|------|
| Create | `src/types/staff.ts` | 员工、预算、白名单、导入相关的 TypeScript 类型定义 |
| Create | `src/api/staffApi.ts` | 人员看板所有 API 调用封装 |
| Create | `src/components/staff/StaffBoard.tsx` | 人员看板主容器，管理子 Tab 切换 |
| Create | `src/components/staff/EmployeeList.tsx` | 员工列表页：分页表格 + 筛选 + 新增/编辑/删除/详情 |
| Create | `src/components/staff/EmployeeFormModal.tsx` | 员工新增/编辑表单弹窗 |
| Create | `src/components/staff/BudgetPanel.tsx` | 成本预算管理：按员工查看/设置预算 + 汇总统计 |
| Create | `src/components/staff/WhitelistPanel.tsx` | 白名单管理：列表 + 添加/移除 + 批量添加 |
| Create | `src/components/staff/ImportPanel.tsx` | 批量导入：文件上传 + 校验结果展示 + 模板下载 |
| Modify | `src/App.tsx:13` | 在 DemoTabs 后引入 StaffBoard 组件 |

---

## Task 1: 定义人员看板 TypeScript 类型

**Files:**
- Create: `src/types/staff.ts`

**Interfaces:**
- Consumes: `src/types/api.ts` 中的 `ApiResponse<T>`
- Produces: `Employee`, `EmployeeQuery`, `Budget`, `BudgetSummary`, `WhitelistItem`, `ImportResult`, `ImportValidationDetail` 等类型供后续所有任务使用

**Steps:**

- [ ] 创建 `src/types/staff.ts`，写入以下完整内容：

```typescript
import { ApiResponse } from "./api";

// ==================== Employee ====================

export interface Employee {
  id: number;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  hireDate: string; // ISO 8601 YYYY-MM-DD
  contactInfo: string;
  skills?: string[];
  certifications?: string[];
  projectExperience?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeQuery {
  page?: number;
  pageSize?: number;
  department?: string;
  name?: string;
}

export interface EmployeePageData {
  records: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EmployeeFormData {
  employeeId: string;
  name: string;
  department: string;
  position: string;
  hireDate: string;
  contactInfo: string;
  skills?: string[];
  certifications?: string[];
  projectExperience?: string;
}

// ==================== Budget ====================

export interface Budget {
  id: number;
  employeeId: string;
  budgetYear: number;
  budgetMonth: number | null; // null = annual budget
  amount: number;
  currency: string;
  updatedAt: string;
}

export interface BudgetQuery {
  employeeId?: string;
  budgetYear?: number;
}

export interface BudgetFormData {
  employeeId: string;
  budgetYear: number;
  budgetMonth: number | null;
  amount: number;
  currency?: string;
}

export interface BudgetSummaryItem {
  department: string;
  year: number;
  totalAmount: number;
  employeeCount: number;
}

// ==================== Whitelist ====================

export interface WhitelistItem {
  id: number;
  employeeId: string;
  addedAt: string;
  addedBy: string;
  remark?: string;
}

export interface WhitelistBatchAddData {
  employeeIds: string[];
  remark?: string;
}

// ==================== Import ====================

export interface ImportValidationDetail {
  rowNumber: number;
  employeeId: string;
  fieldName: string;
  errorMessage: string;
}

export interface ImportResult {
  taskId: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  failures: ImportValidationDetail[];
  status: "VALIDATING" | "COMPLETED" | "FAILED";
}

// ==================== Re-export ApiResponse for convenience ====================
export type { ApiResponse };
```

- [ ] 运行 `npx tsc --noEmit` 确认无类型错误
- [ ] Commit: `feat(staff): add TypeScript type definitions for staff module`

---

## Task 2: 封装人员看板 API 调用层

**Files:**
- Create: `src/api/staffApi.ts`

**Interfaces:**
- Consumes: `src/api/client.ts` 中的 `apiFetch`, `apiPost`, `apiPut`, `apiDelete`; `src/types/staff.ts` 中所有类型
- Produces: 所有人员看板 API 函数供 UI 组件调用

**Steps:**

- [ ] 先读取 `src/api/client.ts` 确认导出的函数签名（apiFetch/apiPost/apiPut/apiDelete 的参数和返回值）
- [ ] 创建 `src/api/staffApi.ts`，基于 client.ts 的实际导出编写以下内容（若 client.ts 导出名称不同则适配）：

```typescript
import { apiFetch, apiPost, apiPut, apiDelete } from "./client";
import type {
  Employee,
  EmployeePageData,
  EmployeeQuery,
  EmployeeFormData,
  Budget,
  BudgetQuery,
  BudgetFormData,
  BudgetSummaryItem,
  WhitelistItem,
  WhitelistBatchAddData,
  ImportResult,
} from "../types/staff";

const BASE = "/api/staff";

// ==================== Employee CRUD ====================

export async function getEmployees(query: EmployeeQuery): Promise<EmployeePageData> {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  if (query.department) params.set("department", query.department);
  if (query.name) params.set("name", query.name);
  return apiFetch(`${BASE}/employees?${params.toString()}`);
}

export async function getEmployee(id: number): Promise<Employee> {
  return apiFetch(`${BASE}/employees/${id}`);
}

export async function createEmployee(data: EmployeeFormData): Promise<Employee> {
  return apiPost(`${BASE}/employees`, data);
}

export async function updateEmployee(id: number, data: EmployeeFormData): Promise<Employee> {
  return apiPut(`${BASE}/employees/${id}`, data);
}

export async function deleteEmployee(id: number): Promise<void> {
  return apiDelete(`${BASE}/employees/${id}`);
}

// ==================== Budget ====================

export async function getBudgets(query: BudgetQuery): Promise<Budget[]> {
  const params = new URLSearchParams();
  if (query.employeeId) params.set("employeeId", query.employeeId);
  if (query.budgetYear != null) params.set("budgetYear", String(query.budgetYear));
  return apiFetch(`${BASE}/budgets?${params.toString()}`);
}

export async function createBudget(data: BudgetFormData): Promise<Budget> {
  return apiPost(`${BASE}/budgets`, data);
}

export async function updateBudget(id: number, data: BudgetFormData): Promise<Budget> {
  return apiPut(`${BASE}/budgets/${id}`, data);
}

export async function getBudgetSummary(year?: number): Promise<BudgetSummaryItem[]> {
  const params = new URLSearchParams();
  if (year != null) params.set("year", String(year));
  return apiFetch(`${BASE}/budgets/summary?${params.toString()}`);
}

// ==================== Whitelist ====================

export async function getWhitelist(): Promise<WhitelistItem[]> {
  return apiFetch(`${BASE}/whitelist`);
}

export async function addToWhitelist(employeeId: string, remark?: string): Promise<WhitelistItem> {
  return apiPost(`${BASE}/whitelist`, { employeeId, remark });
}

export async function removeFromWhitelist(id: number): Promise<void> {
  return apiDelete(`${BASE}/whitelist/${id}`);
}

export async function batchAddToWhitelist(data: WhitelistBatchAddData): Promise<WhitelistItem[]> {
  return apiPost(`${BASE}/whitelist/batch`, data);
}

// ==================== Import ====================

export async function uploadImportFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/import`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Import upload failed: ${res.status}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message || "Import failed");
  return json.data;
}

export async function getImportResult(taskId: string): Promise<ImportResult> {
  return apiFetch(`${BASE}/import/result/${taskId}`);
}

export function getImportTemplateUrl(): string {
  return `${BASE}/import/template`;
}
```

- [ ] 运行 `npx tsc --noEmit` 确认无类型错误
- [ ] Commit: `feat(staff): add API layer for staff module`

---

## Task 3: 实现员工列表与表单弹窗

**Files:**
- Create: `src/components/staff/EmployeeList.tsx`
- Create: `src/components/staff/EmployeeFormModal.tsx`

**Interfaces:**
- Consumes: `src/api/staffApi.ts` 中的 `getEmployees`, `createEmployee`, `updateEmployee`, `deleteEmployee`, `getEmployee`; `src/types/staff.ts` 中的 `Employee`, `EmployeeFormData`, `EmployeeQuery`
- Produces: `<EmployeeList />` 组件供 StaffBoard 使用

**Steps:**

- [ ] 创建 `src/components/staff/EmployeeFormModal.tsx`：

```tsx
import { Modal, Form, Input, DatePicker, Select, message } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";
import type { Employee, EmployeeFormData } from "../../types/staff";

interface Props {
  open: boolean;
  editingEmployee: Employee | null;
  onCancel: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
}

export default function EmployeeFormModal({ open, editingEmployee, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<EmployeeFormData>();

  useEffect(() => {
    if (open) {
      if (editingEmployee) {
        form.setFieldsValue({
          ...editingEmployee,
          hireDate: editingEmployee.hireDate,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingEmployee, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      message.success(editingEmployee ? "更新成功" : "新增成功");
      onCancel();
    } catch (err: any) {
      if (err?.errorFields) return; // validation error
      message.error(err?.message || "操作失败");
    }
  };

  return (
    <Modal
      title={editingEmployee ? "编辑员工" : "新增员工"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      width={640}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="employeeId" label="工号" rules={[{ required: true, message: "请输入工号" }]}>
          <Input disabled={!!editingEmployee} placeholder="请输入工号" />
        </Form.Item>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: "请输入姓名" }]}>
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item name="department" label="部门" rules={[{ required: true, message: "请输入部门" }]}>
          <Input placeholder="请输入部门" />
        </Form.Item>
        <Form.Item name="position" label="职位" rules={[{ required: true, message: "请输入职位" }]}>
          <Input placeholder="请输入职位" />
        </Form.Item>
        <Form.Item name="hireDate" label="入职日期" rules={[{ required: true, message: "请选择入职日期" }]}>
          <DatePicker style={{ width: "100%" }} placeholder="请选择日期" />
        </Form.Item>
        <Form.Item name="contactInfo" label="联系方式" rules={[{ required: true, message: "请输入联系方式" }]}>
          <Input placeholder="手机号或邮箱" />
        </Form.Item>
        <Form.Item name="skills" label="技能标签">
          <Select mode="tags" placeholder="输入后回车添加" />
        </Form.Item>
        <Form.Item name="certifications" label="资质证书">
          <Select mode="tags" placeholder="输入后回车添加" />
        </Form.Item>
        <Form.Item name="projectExperience" label="项目经验备注">
          <Input.TextArea rows={3} placeholder="选填" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] 创建 `src/components/staff/EmployeeList.tsx`：

```tsx
import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Popconfirm, message, Tag } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../../api/staffApi";
import type { Employee, EmployeeFormData, EmployeeQuery } from "../../types/staff";
import EmployeeFormModal from "./EmployeeFormModal";

export default function EmployeeList() {
  const [data, setData] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<EmployeeQuery>({ page: 1, pageSize: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEmployees(query);
      setData(result.records);
      setTotal(result.total);
    } catch (err: any) {
      message.error(err?.message || "获取员工列表失败");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleEdit = (record: Employee) => {
    setEditingEmployee(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEmployee(id);
      message.success("删除成功");
      fetchData();
    } catch (err: any) {
      message.error(err?.message || "删除失败");
    }
  };

  const handleSubmit = async (formData: EmployeeFormData) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, formData);
    } else {
      await createEmployee(formData);
    }
    fetchData();
  };

  const columns: ColumnsType<Employee> = [
    { title: "工号", dataIndex: "employeeId", key: "employeeId", width: 100 },
    { title: "姓名", dataIndex: "name", key: "name", width: 100 },
    { title: "部门", dataIndex: "department", key: "department", width: 120 },
    { title: "职位", dataIndex: "position", key: "position", width: 120 },
    { title: "入职日期", dataIndex: "hireDate", key: "hireDate", width: 120 },
    { title: "联系方式", dataIndex: "contactInfo", key: "contactInfo", width: 150 },
    {
      title: "技能标签",
      dataIndex: "skills",
      key: "skills",
      render: (skills: string[]) => skills?.map((s) => <Tag key={s}>{s}</Tag>),
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索姓名"
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 200 }}
          onChange={(e) => setQuery((q) => ({ ...q, name: e.target.value || undefined, page: 1 }))}
        />
        <Input
          placeholder="搜索部门"
          allowClear
          style={{ width: 200 }}
          onChange={(e) => setQuery((q) => ({ ...q, department: e.target.value || undefined, page: 1 }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增员工</Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total,
          showSizeChanger: true,
          onChange: (page, pageSize) => setQuery((q) => ({ ...q, page, pageSize })),
        }}
      />
      <EmployeeFormModal
        open={modalOpen}
        editingEmployee={editingEmployee}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
```

- [ ] 运行 `npx tsc --noEmit` 确认无类型错误
- [ ] Commit: `feat(staff): implement employee list and form modal`

---

## Task 4: 实现成本预算管理面板

**Files:**
- Create: `src/components/staff/BudgetPanel.tsx`

**Interfaces:**
- Consumes: `src/api/staffApi.ts` 中的 `getBudgets`, `createBudget`, `updateBudget`, `getBudgetSummary`; `src/types/staff.ts` 中的 `Budget`, `BudgetFormData`, `BudgetSummaryItem`
- Produces: `<BudgetPanel />` 组件供 StaffBoard 使用

**Steps:**

- [ ] 创建 `src/components/staff/BudgetPanel.tsx`：

```tsx
import { useState, useEffect, useCallback } from "react";
import { Table, Button, Form, Input, InputNumber, Select, Modal, Card, Row, Col, Statistic, message, Space } from "antd";
import { getBudgets, createBudget, updateBudget, getBudgetSummary } from "../../api/staffApi";
import type { Budget, BudgetFormData, BudgetSummaryItem } from "../../types/staff";

export default function BudgetPanel() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form] = Form.useForm<BudgetFormData>();
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetData, summaryData] = await Promise.all([
        getBudgets(filterEmployeeId ? { employeeId: filterEmployeeId } : {}),
        getBudgetSummary(),
      ]);
      setBudgets(budgetData);
      setSummary(summaryData);
    } catch (err: any) {
      message.error(err?.message || "获取预算数据失败");
    } finally {
      setLoading(false);
    }
  }, [filterEmployeeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingBudget) {
        await updateBudget(editingBudget.id, values);
      } else {
        await createBudget(values);
      }
      message.success("保存成功");
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "保存失败");
    }
  };

  const openCreate = () => {
    setEditingBudget(null);
    form.resetFields();
    form.setFieldsValue({ currency: "CNY", budgetMonth: null });
    setModalOpen(true);
  };

  const openEdit = (record: Budget) => {
    setEditingBudget(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {summary.slice(0, 4).map((item) => (
          <Col span={6} key={`${item.department}-${item.year}`}>
            <Card size="small">
              <Statistic title={`${item.department} (${item.year})`} value={item.totalAmount} precision={2} suffix="CNY" />
              <div style={{ fontSize: 12, color: "#999" }}>{item.employeeCount} 人</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="按工号筛选" allowClear style={{ width: 200 }}
          onChange={(e) => setFilterEmployeeId(e.target.value)} />
        <Button type="primary" onClick={openCreate}>设置预算</Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={budgets}
        pagination={false}
        columns={[
          { title: "工号", dataIndex: "employeeId", width: 100 },
          { title: "年度", dataIndex: "budgetYear", width: 80 },
          { title: "月份", dataIndex: "budgetMonth", width: 80, render: (v: number | null) => v ?? "全年" },
          { title: "金额", dataIndex: "amount", width: 120, render: (v: number) => v.toFixed(2) },
          { title: "币种", dataIndex: "currency", width: 60 },
          { title: "更新时间", dataIndex: "updatedAt", width: 180 },
          {
            title: "操作", width: 80,
            render: (_, record) => <Button type="link" size="small" onClick={() => openEdit(record)}>调整</Button>,
          },
        ]}
      />

      <Modal title={editingBudget ? "调整预算" : "设置预算"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="employeeId" label="工号" rules={[{ required: true }]}>
            <Input disabled={!!editingBudget} />
          </Form.Item>
          <Form.Item name="budgetYear" label="预算年度" rules={[{ required: true }]}>
            <InputNumber min={2020} max={2030} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="budgetMonth" label="预算月份（留空为年度预算）">
            <InputNumber min={1} max={12} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="currency" label="币种">
            <Select options={[{ value: "CNY", label: "CNY" }, { value: "USD", label: "USD" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
```

- [ ] 运行 `npx tsc --noEmit` 确认无类型错误
- [ ] Commit: `feat(staff): implement budget management panel`

---

## Task 5: 实现白名单管理面板

**Files:**
- Create: `src/components/staff/WhitelistPanel.tsx`

**Interfaces:**
- Consumes: `src/api/staffApi.ts` 中的 `getWhitelist`, `addToWhitelist`, `removeFromWhitelist`, `batchAddToWhitelist`; `src/types/staff.ts` 中的 `WhitelistItem`
- Produces: `<WhitelistPanel />` 组件供 StaffBoard 使用

**Steps:**

- [ ] 创建 `src/components/staff/WhitelistPanel.tsx`：

```tsx
import { useState, useEffect, useCallback } from "react";
import { Table, Button, Input, Modal, Form, Popconfirm, Space, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getWhitelist, addToWhitelist, removeFromWhitelist, batchAddToWhitelist } from "../../api/staffApi";
import type { WhitelistItem } from "../../types/staff";

export default function WhitelistPanel() {
  const [data, setData] = useState<WhitelistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getWhitelist());
    } catch (err: any) {
      message.error(err?.message || "获取白名单失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    try {
      const { employeeId, remark } = await addForm.validateFields();
      await addToWhitelist(employeeId, remark);
      message.success("添加成功");
      setAddModalOpen(false);
      addForm.resetFields();
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "添加失败");
    }
  };

  const handleBatchAdd = async () => {
    try {
      const { employeeIds, remark } = await batchForm.validateFields();
      const ids = employeeIds.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean);
      await batchAddToWhitelist({ employeeIds: ids, remark });
      message.success(`批量添加 ${ids.length} 条成功`);
      setBatchModalOpen(false);
      batchForm.resetFields();
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "批量添加失败");
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeFromWhitelist(id);
      message.success("已移除");
      fetchData();
    } catch (err: any) {
      message.error(err?.message || "移除失败");
    }
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>添加白名单</Button>
        <Button onClick={() => setBatchModalOpen(true)}>批量添加</Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: "工号", dataIndex: "employeeId", width: 120 },
          { title: "添加时间", dataIndex: "addedAt", width: 180 },
          { title: "操作人", dataIndex: "addedBy", width: 120 },
          { title: "备注", dataIndex: "remark" },
          {
            title: "操作", width: 80,
            render: (_, record) => (
              <Popconfirm title="确认移除？" onConfirm={() => handleRemove(record.id)}>
                <Button type="link" size="small" danger>移除</Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal title="添加白名单" open={addModalOpen} onOk={handleAdd} onCancel={() => setAddModalOpen(false)} destroyOnClose>
        <Form form={addForm} layout="vertical">
          <Form.Item name="employeeId" label="工号" rules={[{ required: true, message: "请输入工号" }]}>
            <Input placeholder="请输入工号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="批量添加白名单" open={batchModalOpen} onOk={handleBatchAdd} onCancel={() => setBatchModalOpen(false)} destroyOnClose>
        <Form form={batchForm} layout="vertical">
          <Form.Item name="employeeIds" label="工号列表" rules={[{ required: true, message: "请输入工号" }]}
            extra="每行一个工号，或用逗号分隔">
            <Input.TextArea rows={6} placeholder={"EMP001\nEMP002\nEMP003"} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
```

- [ ] 运行 `npx tsc --noEmit` 确认无类型错误
- [ ] Commit: `feat(staff): implement whitelist management panel`

---

## Task 6: 实现批量导入面板

**Files:**
- Create: `src/components/staff/ImportPanel.tsx`

**Interfaces:**
- Consumes: `src/api/staffApi.ts` 中的 `uploadImportFile`, `getImportResult`, `getImportTemplateUrl`; `src/types/staff.ts` 中的 `ImportResult`, `ImportValidationDetail`
- Produces: `<ImportPanel />` 组件供 StaffBoard 使用

**Steps:**

- [ ] 创建 `src/components/staff/ImportPanel.tsx`：

```tsx
import { useState } from "react";
import { Upload, Button, Table, Alert, Space, Typography, message } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { uploadImportFile, getImportResult, getImportTemplateUrl } from "../../api/staffApi";
import type { ImportResult } from "../../types/staff";

const { Text } = Typography;

export default function ImportPanel() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setResult(null);
    try {
      const importResult = await uploadImportFile(file);
      // If async processing, poll for result
      if (importResult.status === "VALIDATING") {
        let pollResult = importResult;
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          pollResult = await getImportResult(importResult.taskId);
          if (pollResult.status !== "VALIDATING") break;
        }
        setResult(pollResult);
      } else {
        setResult(importResult);
      }
      message.success("导入完成");
    } catch (err: any) {
      message.error(err?.message || "导入失败");
    } finally {
      setUploading(false);
    }
    return false; // prevent default upload
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Space>
        <Upload
          accept=".xlsx,.csv"
          showUploadList={false}
          beforeUpload={(file) => { handleUpload(file as unknown as File); return false; }}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>上传导入文件</Button>
        </Upload>
        <Button icon={<DownloadOutlined />} href={getImportTemplateUrl()} target="_blank">
          下载导入模板
        </Button>
      </Space>

      {result && (
        <>
          <Alert
            type={result.failureCount > 0 ? "warning" : "success"}
            message={`导入完成：成功 ${result.successCount} 条，失败 ${result.failureCount} 条，共 ${result.totalCount} 条`}
            showIcon
          />
          {result.failures.length > 0 && (
            <>
              <Text strong>失败明细：</Text>
              <Table
                rowKey={(r) => `${r.rowNumber}-${r.fieldName}`}
                size="small"
                pagination={false}
                dataSource={result.failures}
                columns={[
                  { title: "行号", dataIndex: "rowNumber", width: 60 },
                  { title: "工号", dataIndex: "employeeId", width: 100 },
                  { title: "字段", dataIndex: "fieldName", width: 100 },
                  { title: "错误信息", dataIndex: "errorMessage" },
                ]}
              />
            </>
          )}
        </>
      )}
    </Space>
  );
}
```

- [ ] 运行 `npx tsc --noEmit` 确认无类型错误
- [ ] Commit: `feat(staff): implement batch import panel`

---

## Task 7: 组装人员看板主容器并集成到 App

**Files:**
- Create: `src/components/staff/StaffBoard.tsx`
- Modify: `src/App.tsx:13`

**Interfaces:**
- Consumes: `EmployeeList`, `BudgetPanel`, `WhitelistPanel`, `ImportPanel` 四个子组件
- Produces: `<StaffBoard />` 作为人员看板入口嵌入 App

**Steps:**

- [ ] 创建 `src/components/staff/StaffBoard.tsx`：

```tsx
import { Tabs } from "antd";
import EmployeeList from "./EmployeeList";
import BudgetPanel from "./BudgetPanel";
import WhitelistPanel from "./WhitelistPanel";
import ImportPanel from "./ImportPanel";

const items = [
  { key: "employees", label: "员工列表", children: <EmployeeList /> },
  { key: "budgets", label: "成本预算", children: <BudgetPanel /> },
  { key: "whitelist", label: "白名单管理", children: <WhitelistPanel /> },
  { key: "import", label: "批量导入", children: <ImportPanel /> },
];

export default function StaffBoard() {
  return <Tabs items={items} />;
}
```

- [ ] 修改 `src/App.tsx`，在 `DemoTabs` 之后、`MetricsReport` 之前插入 StaffBoard：

将第 13 行 `<DemoTabs />` 替换为：
```tsx
      <DemoTabs />
      <StaffBoard />
```

并在文件顶部添加 import：
```tsx
import StaffBoard from "@/components/staff/StaffBoard";
```

- [ ] 运行 `npx tsc --noEmit` 确认无类型错误
- [ ] 运行 `npm run build` 确认构建通过
- [ ] Commit: `feat(staff): integrate staff board into app`

---

## Self-Review Checklist

1. **Spec coverage:**
   - ✅ 员工 CRUD（Task 3）
   - ✅ 成本预算记录（Task 4）
   - ✅ 白名单管理（Task 5）
   - ✅ 批量导入 + 模板下载（Task 6）
   - ✅ 分页查询 + 筛选（Task 3）
   - ✅ 逻辑删除（Task 3，调用 DELETE API）
   - ✅ 导入校验结果展示（Task 6）

2. **Placeholder scan:** 无 TBD/TODO/implement later；所有步骤含完整代码

3. **Interface consistency:** 所有 Task 的 API 函数签名与 Task 2 定义一致；类型引用与 Task 1 定义一致

4. **Cross-repo alignment:** API 路径、请求/响应格式与 dima.md 第 4 节接口契约完全对齐

---

## Execution Handoff

Plan complete and saved to `.agents/changes/staff-board-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)**
- I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution**
- Execute tasks in this session using executing-plans, batch execution with checkpoints
