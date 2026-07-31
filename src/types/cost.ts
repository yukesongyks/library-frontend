export type EmployeeRole = 'DEVELOPER' | 'TESTER' | 'PRODUCT' | 'OPS'

export interface CostQueryRequest {
  departmentId?: number
  businessLineId?: number
  projectId?: number
  employeeId?: number
  costYear?: number
  costMonth?: number
  quarter?: number
  role?: EmployeeRole
}

export interface DimensionStat {
  dimensionName: string
  amount: number
  percentage: number
}

export interface CostSummary {
  totalCost: number
  laborCost: number
  recordCount: number
  byDepartment: DimensionStat[]
  byRole: DimensionStat[]
  byMonth: DimensionStat[]
}

export interface ProjectCost {
  projectId: number
  projectName: string
  budgetAmount: number | null
  actualCost: number
  budgetUsageRate: number
  overspendAmount: number
}
