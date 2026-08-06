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
