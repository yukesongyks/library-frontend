export type Dimension =
  | 'department'
  | 'project'
  | 'business_line'
  | 'employee'
  | 'month'
  | 'quarter'
  | 'year'

export const DIMENSION_LABELS: Record<Dimension, string> = {
  department: '部门',
  project: '项目',
  business_line: '业务线',
  employee: '人员',
  month: '月份',
  quarter: '季度',
  year: '年度'
}

export const ROLES = ['DEV', 'TEST', 'PM', 'OPS'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  DEV: '开发',
  TEST: '测试',
  PM: '产品',
  OPS: '运维'
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface MonthlyTrendItem {
  month: string
  laborCost: number
  projectCost: number
  totalCost: number
}

export interface CostSummary {
  totalCost: number
  laborCost: number
  projectCost: number
  laborRatio: number
  projectRatio: number
  overBudgetCount: number
  monthlyTrend: MonthlyTrendItem[]
}

export interface CostAnalysisItem {
  name: string
  laborCost: number
  projectBudget: number
  projectActual: number
  budgetRatio: number
  overBudgetAmount: number
}

export interface AnalysisResponse {
  records: CostAnalysisItem[]
  total: number
}

export interface AnalysisQuery {
  dimension: Dimension
  year?: string
  month?: string
  quarter?: string
  role?: string
}