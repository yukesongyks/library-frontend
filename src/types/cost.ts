export type CostDimension = 'DEPT' | 'PROJECT' | 'BUSINESS_LINE' | 'PERSON';
export type TimeDimension = 'MONTH' | 'QUARTER' | 'YEAR';
export type LaborRole = 'DEV' | 'QA' | 'PM' | 'OPS';

export interface CostStatQuery {
  dimension?: CostDimension;
  timeDimension?: TimeDimension;
  timeValue?: string;
  deptId?: number;
  projectId?: number;
  businessLineId?: number;
  personId?: number;
  page?: number;
  size?: number;
}

export interface LaborCostVO {
  dimensionLabel: string;
  dev: number;
  qa: number;
  pm: number;
  ops: number;
  total: number;
}

export interface ProjectCostVO {
  projectId: number;
  projectName: string;
  budget: number;
  actualCost: number;
  budgetRatio: number;
  estimatedOverspend: number;
}

export interface CostSummary {
  totalLaborCost: number;
  totalProjectBudget: number;
  totalActualCost: number;
  overallBudgetRatio: number;
  totalEstimatedOverspend: number;
}

export interface CostDashboardVO {
  laborCosts: LaborCostVO[];
  projectCosts: ProjectCostVO[];
  summary: CostSummary;
}

export interface CostRecordDTO {
  id: number;
  deptId: number;
  deptName: string;
  projectId: number;
  projectName: string;
  businessLineId: number;
  businessLineName: string;
  personId: number;
  personName: string;
  laborRole: LaborRole;
  amount: number;
  costDate: string;
}
