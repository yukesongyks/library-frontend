export interface AnalysisItem {
  groupName: string;
  groupId: string | number;
  amount: number;
  recordCount: number;
}

export interface LaborCostItem {
  roleType: string;
  amount: number;
  headCount: number;
}

export interface ProjectCostItem {
  projectName: string;
  budget: number;
  actual: number;
  rate: number;
}

export interface TrendItem {
  period: string;
  amount: number;
}
