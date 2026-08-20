// === 统一响应 ===
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// === HelloWorld ===
export interface HelloWorldRequest {
  name?: string;
}

export interface HelloWorldData {
  result: string;
  timestamp: string;
}

// === Hash ===
export interface HashRequest {
  input: string;
  algorithm?: 'MD5' | 'SHA-1' | 'SHA-256';
}

export interface HashData {
  input: string;
  algorithm: string;
  hashValue: string;
  timestamp: string;
}

// === BubbleSort ===
export interface BubbleSortRequest {
  numbers: number[];
  order?: 'ASC' | 'DESC';
}

export interface BubbleSortData {
  original: number[];
  sorted: number[];
  order: string;
  steps: number[][];
  timestamp: string;
}

// === Export ===
export interface ExportRequest {
  type: 'helloworld' | 'hash' | 'bubble-sort';
  recordIds?: number[];
}

// === Analytics ===
export interface AnalyticsParams {
  dimension: 'personnelType' | 'personnelLevel' | 'department';
  apiType?: 'helloworld' | 'hash' | 'bubble-sort' | 'all';
  startDate?: string;
  endDate?: string;
  chartType?: 'line' | 'pie' | 'bar';
}

export interface GroupItem {
  name: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesItem {
  date: string;
  groups: Record<string, number>;
}

export interface AnalyticsData {
  dimension: string;
  apiType: string;
  totalCalls: number;
  todayCalls: number;
  activeUsers: number;
  avgDurationMs: number;
  groups: GroupItem[];
  timeSeries: TimeSeriesItem[];
}

// === User Context (请求头注入) ===
export interface UserContext {
  userId: string;
  userName: string;
  userType: string;
  userLevel: string;
  userDept: string;
}
