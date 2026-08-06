import { request, requestFormData } from "./client";
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

const BASE = "/staff";

// ==================== Employee CRUD ====================

export async function getEmployees(query: EmployeeQuery): Promise<EmployeePageData> {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  if (query.department) params.set("department", query.department);
  if (query.name) params.set("name", query.name);
  return request<EmployeePageData>(`${BASE}/employees?${params.toString()}`);
}

export async function getEmployee(id: number): Promise<Employee> {
  return request<Employee>(`${BASE}/employees/${id}`);
}

export async function createEmployee(data: EmployeeFormData): Promise<Employee> {
  return request<Employee>(`${BASE}/employees`, { method: "POST", body: data });
}

export async function updateEmployee(id: number, data: EmployeeFormData): Promise<Employee> {
  return request<Employee>(`${BASE}/employees/${id}`, { method: "PUT", body: data });
}

export async function deleteEmployee(id: number): Promise<void> {
  return request<void>(`${BASE}/employees/${id}`, { method: "DELETE" });
}

// ==================== Budget ====================

export async function getBudgets(query: BudgetQuery): Promise<Budget[]> {
  const params = new URLSearchParams();
  if (query.employeeId?.trim()) params.set("employeeId", query.employeeId.trim());
  if (query.budgetYear != null) params.set("budgetYear", String(query.budgetYear));
  return request<Budget[]>(`${BASE}/budgets?${params.toString()}`);
}

export async function createBudget(data: BudgetFormData): Promise<Budget> {
  return request<Budget>(`${BASE}/budgets`, { method: "POST", body: data });
}

export async function updateBudget(id: number, data: BudgetFormData): Promise<Budget> {
  return request<Budget>(`${BASE}/budgets/${id}`, { method: "PUT", body: data });
}

export async function getBudgetSummary(year?: number): Promise<BudgetSummaryItem[]> {
  const params = new URLSearchParams();
  if (year != null) params.set("year", String(year));
  return request<BudgetSummaryItem[]>(`${BASE}/budgets/summary?${params.toString()}`);
}

// ==================== Whitelist ====================

export async function getWhitelist(): Promise<WhitelistItem[]> {
  return request<WhitelistItem[]>(`${BASE}/whitelist`);
}

export async function addToWhitelist(employeeId: string, remark?: string): Promise<WhitelistItem> {
  return request<WhitelistItem>(`${BASE}/whitelist`, { method: "POST", body: { employeeId, remark } });
}

export async function removeFromWhitelist(id: number): Promise<void> {
  return request<void>(`${BASE}/whitelist/${id}`, { method: "DELETE" });
}

export async function batchAddToWhitelist(data: WhitelistBatchAddData): Promise<WhitelistItem[]> {
  return request<WhitelistItem[]>(`${BASE}/whitelist/batch`, { method: "POST", body: data });
}

// ==================== Import ====================

export async function uploadImportFile(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  return requestFormData<ImportResult>(`${BASE}/import`, formData);
}

export async function getImportResult(taskId: string): Promise<ImportResult> {
  return request<ImportResult>(`${BASE}/import/result/${taskId}`);
}

export function getImportTemplateUrl(): string {
  return `/api${BASE}/import/template`;
}
