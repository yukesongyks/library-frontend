// === 通用响应 ===
export interface DemoResponse<T> {
  code: number;
  message: string;
  data: T;
}

// === HelloWorld ===
export interface HelloWorldRequest {
  name?: string;
}

export interface HelloWorldResult {
  result: string;
  timestamp: string;
  executionTimeMs: number;
}

// === Hash ===
export interface HashRequest {
  input: string;
  algorithm?: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512';
}

export interface HashResult {
  input: string;
  algorithm: string;
  hashResult: string;
  timestamp: string;
  executionTimeMs: number;
}

// === Bubble Sort ===
export interface BubbleSortRequest {
  numbers: number[];
  order?: 'ASC' | 'DESC';
}

export interface BubbleSortResult {
  original: number[];
  sorted: number[];
  order: string;
  swapCount: number;
  timestamp: string;
  executionTimeMs: number;
}

// === Export ===
export interface ExportRequest {
  type: 'HELLOWORLD' | 'HASH' | 'BUBBLE_SORT';
  recordIds?: number[];
}

// === Analytics ===
export type AnalyticsDimension = 'PERSON_TYPE' | 'PERSON_LEVEL' | 'DEPARTMENT' | 'DATE';
export type ApiType = 'HELLOWORLD' | 'HASH' | 'BUBBLE_SORT';
export type Granularity = 'DAY' | 'WEEK' | 'MONTH';

export interface AnalyticsQuery {
  dimension?: AnalyticsDimension;
  apiType?: ApiType;
  startDate?: string;
  endDate?: string;
  granularity?: Granularity;
}

export interface SummaryItem {
  label: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummaryData {
  dimension: string;
  items: SummaryItem[];
  totalCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendSeries {
  apiType: string;
  points: TrendPoint[];
}

export interface AnalyticsTrendData {
  granularity: string;
  series: TrendSeries[];
}
