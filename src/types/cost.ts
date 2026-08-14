export interface CostSummaryDTO {
  period: string;
  departmentName: string;
  projectName: string;
  businessLineName: string;
  employeeName: string;
  roleType: string;
  devCost: number;
  testCost: number;
  productCost: number;
  opsCost: number;
  totalCost: number;
}

export interface ProjectCostDTO {
  projectId: number;
  projectName: string;
  departmentName: string;
  businessLineName: string;
  budget: number;
  actualCost: number;
  budgetRatio: number;
  estimatedOverspend: number;
  devCost: number;
  testCost: number;
  productCost: number;
  opsCost: number;
}

export interface DashboardDTO {
  totalCost: number;
  hrCost: number;
  projectTotalBudget: number;
  projectTotalActual: number;
  costByRole: Record<string, number>;
  costByDepartment: Record<string, number>;
  monthlyTrend: Array<{ month: string; cost: number }>;
  topOverspendProjects: ProjectCostDTO[];
}

export interface DimensionStatDTO {
  dimensionId: number;
  dimensionName: string;
  totalCost: number;
  devCost: number;
  testCost: number;
  productCost: number;
  opsCost: number;
  percentage: number;
}

export interface PageResult<T> {
  total: number;
  page: number;
  size: number;
  records: T[];
}

export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

export interface CostQueryParams {
  departmentId?: number;
  projectId?: number;
  businessLineId?: number;
  employeeId?: number;
  timeDimension?: 'MONTH' | 'QUARTER' | 'YEAR';
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export type DimensionType = 'DEPARTMENT' | 'PROJECT' | 'BUSINESS_LINE' | 'EMPLOYEE';
