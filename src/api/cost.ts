import request from './request';
import type { CostStatQuery, CostDashboardVO, CostRecordDTO } from '../types/cost';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function getCostDashboard(params: CostStatQuery): Promise<ApiResponse<CostDashboardVO>> {
  return request.get('/api/cost/dashboard', { params }) as unknown as Promise<ApiResponse<CostDashboardVO>>;
}

export function getCostStat(params: CostStatQuery): Promise<ApiResponse<CostRecordDTO[]>> {
  return request.get('/api/cost/stat', { params }) as unknown as Promise<ApiResponse<CostRecordDTO[]>>;
}

export function exportCostReport(params: CostStatQuery): Promise<Blob> {
  return request.get('/api/cost/export', {
    params,
    responseType: 'blob',
  }) as unknown as Promise<Blob>;
}
