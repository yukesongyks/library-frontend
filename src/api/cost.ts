import request from './request';
import { ApiResponse, PageResponse } from '../types/api';

export interface CostEntryRequest {
  deptId: number;
  projectId?: number;
  bizLineId?: number;
  employeeId?: number;
  roleType?: string;
  costType: string;
  amount: number;
  period: string;
  remark?: string;
}

export interface CostRecord {
  id: number;
  deptId: number;
  projectId: number;
  bizLineId: number;
  employeeId: number;
  roleType: string;
  costType: string;
  amount: number;
  period: string;
  source: string;
  remark: string;
  createdAt: string;
}

export interface ImportResult {
  totalCount: number;
  successCount: number;
  failCount: number;
  failDetails: Array<{ rowNum: number; reason: string }>;
}

export const createCostEntry = (data: CostEntryRequest): Promise<ApiResponse<CostRecord>> =>
  request.post('/cost/entry', data);

export const batchCostEntry = (data: CostEntryRequest[]): Promise<ApiResponse<CostRecord[]>> =>
  request.post('/cost/batch-entry', data);

export const getCostRecords = (params: { pageNum?: number; pageSize?: number; deptId?: number; period?: string }): Promise<ApiResponse<PageResponse<CostRecord>>> =>
  request.get('/cost/records', { params });

export const downloadImportTemplate = (): Promise<Blob> =>
  request.get('/cost/import/template', { responseType: 'blob' });

export const importCostExcel = (file: File): Promise<ApiResponse<ImportResult>> => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/cost/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
