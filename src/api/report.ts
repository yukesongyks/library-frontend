import request from './request';
import { ApiResponse } from '../types/api';

export interface DashboardData {
  totalCost: number;
  monthCost: number;
  monthCostGrowthRate: number;
  budgetExecutionRate: number;
  overBudgetProjectCount: number;
  trendData: Array<{ period: string; amount: number }>;
  typeDistribution: Array<{ costType: string; amount: number }>;
  deptComparison: Array<{ deptName: string; amount: number }>;
  projectBudget: Array<{ projectName: string; budget: number; actual: number; rate: number }>;
}

export interface AnalysisParams {
  deptId?: number;
  projectId?: number;
  bizLineId?: number;
  employeeId?: number;
  roleType?: string;
  periodStart?: string;
  periodEnd?: string;
  costType?: string;
  timeGranularity?: string;
  groupBy?: string;
}

export const getDashboard = (): Promise<ApiResponse<DashboardData>> =>
  request.get('/report/dashboard');

export const getAnalysis = (params: AnalysisParams): Promise<ApiResponse<any[]>> =>
  request.get('/report/analysis', { params });

export const getLaborCost = (params: { periodStart: string; periodEnd: string; timeGranularity?: string }): Promise<ApiResponse<any[]>> =>
  request.get('/report/labor', { params });

export const getProjectCost = (): Promise<ApiResponse<any[]>> =>
  request.get('/report/project');

export const getTrend = (params: { periodStart: string; periodEnd: string; timeGranularity?: string }): Promise<ApiResponse<any[]>> =>
  request.get('/report/trend', { params });

export const exportReport = (params: AnalysisParams): Promise<Blob> =>
  request.post('/report/export', params, { responseType: 'blob' });
