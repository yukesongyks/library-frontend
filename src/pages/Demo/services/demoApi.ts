import request from '@/utils/request';
import type {
  DemoResponse,
  HelloWorldRequest,
  HelloWorldResult,
  HashRequest,
  HashResult,
  BubbleSortRequest,
  BubbleSortResult,
  ExportRequest,
  AnalyticsQuery,
  AnalyticsSummaryData,
  AnalyticsTrendData,
} from '../types/demo';

// === 演示接口 ===
export function callHelloWorld(params: HelloWorldRequest) {
  return request.post<unknown, DemoResponse<HelloWorldResult>>('/demo/helloworld', params);
}

export function callHash(params: HashRequest) {
  return request.post<unknown, DemoResponse<HashResult>>('/demo/hash', params);
}

export function callBubbleSort(params: BubbleSortRequest) {
  return request.post<unknown, DemoResponse<BubbleSortResult>>('/demo/bubble-sort', params);
}

// === 导出接口 ===
export function exportData(params: ExportRequest): Promise<Blob> {
  return request.post('/demo/export', params, {
    responseType: 'blob',
  }) as unknown as Promise<Blob>;
}

// === 统计接口 ===
export function getAnalyticsSummary(params: AnalyticsQuery) {
  return request.get<unknown, DemoResponse<AnalyticsSummaryData>>('/demo/analytics/summary', {
    params,
  });
}

export function getAnalyticsTrend(params: AnalyticsQuery) {
  return request.get<unknown, DemoResponse<AnalyticsTrendData>>('/demo/analytics/trend', {
    params,
  });
}
