import request from './request';
import type { CostStatQuery, CostDashboardVO, CostRecordDTO } from '../types/cost';

export function getCostDashboard(params: CostStatQuery) {
  return request.get<{ code: number; message: string; data: CostDashboardVO }>(
    '/api/cost/dashboard',
    { params }
  );
}

export function getCostStat(params: CostStatQuery) {
  return request.get<{ code: number; message: string; data: CostRecordDTO[] }>(
    '/api/cost/stat',
    { params }
  );
}

export function exportCostReport(params: CostStatQuery) {
  return request.get('/api/cost/export', {
    params,
    responseType: 'blob',
  });
}
