import axios from 'axios';
import type {
  ApiResponse,
  HelloworldData,
  HashRequest,
  HashData,
  BubbleSortRequest,
  BubbleSortData,
  ExportRequest,
  StatsQuery,
  InvocationStat,
} from '../types';

const http = axios.create({
  baseURL: '/api/dtcoder',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Helloworld 演示接口
 * GET /api/dtcoder/helloworld
 */
export async function fetchHelloworld(): Promise<ApiResponse<HelloworldData>> {
  const { data } = await http.get<ApiResponse<HelloworldData>>('/helloworld');
  return data;
}

/**
 * 哈希算法接口
 * POST /api/dtcoder/hash
 */
export async function computeHash(
  params: HashRequest,
): Promise<ApiResponse<HashData>> {
  const { data } = await http.post<ApiResponse<HashData>>('/hash', params);
  return data;
}

/**
 * 冒泡排序接口
 * POST /api/dtcoder/bubble-sort
 */
export async function computeBubbleSort(
  params: BubbleSortRequest,
): Promise<ApiResponse<BubbleSortData>> {
  const { data } = await http.post<ApiResponse<BubbleSortData>>(
    '/bubble-sort',
    params,
  );
  return data;
}

/**
 * 导出接口 - blob 下载
 * POST /api/dtcoder/export
 */
export async function exportData(params: ExportRequest): Promise<Blob> {
  const { data } = await http.post('/export', params, {
    responseType: 'blob',
  });
  return data as Blob;
}

/**
 * 调用统计查询接口
 * GET /api/dtcoder/invocation-stats
 */
export async function fetchInvocationStats(
  params: StatsQuery,
): Promise<ApiResponse<InvocationStat[]>> {
  const { data } = await http.get<ApiResponse<InvocationStat[]>>(
    '/invocation-stats',
    { params },
  );
  return data;
}
