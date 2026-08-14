export interface Budget {
  budgetId: number
  employeeId: string
  year: number
  quarter: number | null
  month: number | null
  budgetAmount: number
  usedAmount: number
  remainingAmount: number
  note: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface BudgetRequest {
  year: number
  quarter?: number | null
  month?: number | null
  budgetAmount: number
  usedAmount?: number
  note?: string
}

export interface BudgetSummary {
  year: number
  totalBudget: number
  totalUsed: number
  totalRemaining: number
  quarters: BudgetQuarterSummary[]
  months: BudgetMonthSummary[]
}

export interface BudgetQuarterSummary {
  quarter: number
  budgetAmount: number
  usedAmount: number
  remainingAmount: number
}

export interface BudgetMonthSummary {
  month: number
  budgetAmount: number
  usedAmount: number
  remainingAmount: number
}

export const QUARTER_LABELS: Record<number, string> = {
  1: '第一季度',
  2: '第二季度',
  3: '第三季度',
  4: '第四季度',
}

export const MONTH_LABELS: Record<number, string> = {
  1: '一月', 2: '二月', 3: '三月', 4: '四月',
  5: '五月', 6: '六月', 7: '七月', 8: '八月',
  9: '九月', 10: '十月', 11: '十一月', 12: '十二月',
}