export interface HelloWorldResult {
  message: string;
  timestamp: number;
}

export interface HashResult {
  hash: string;
  algorithm: string;
  input: string;
}

export interface BubbleSortResult {
  sorted: number[];
  steps: number;
  original: number[];
}

export interface BreakdownItem {
  label: string;
  count: number;
  percentage: number;
}

export interface TrendItem {
  date: string;
  count: number;
}

export interface MetricsData {
  dimension: string;
  total: number;
  breakdown: BreakdownItem[];
  trend: TrendItem[];
}

export interface ExportParams {
  type: 'helloworld' | 'hash' | 'bubblesort';
  data: HelloWorldResult | HashResult | BubbleSortResult | Record<string, unknown>;
  format?: 'csv' | 'xlsx';
}