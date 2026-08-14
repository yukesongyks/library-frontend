import client from './client';
import type { MetricsData } from '../types/algorithm';

export interface MetricsQueryParams {
  dimension?: string;
  startDate?: string;
  endDate?: string;
  apiPath?: string;
}

export async function getMetrics(params: MetricsQueryParams): Promise<MetricsData> {
  return client.get('/metrics', { params });
}