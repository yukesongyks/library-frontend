// Unified backend response envelope.
// code === 0 means success; otherwise `message` carries the backend error text.
export interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
}

export interface HelloWorldData {
  message: string;
}

export interface HashData {
  input: string;
  algorithm: string;
  hash: string;
}

export interface BubbleSortData {
  sorted: number[];
}

export interface MetricsTrendPoint {
  date: string;
  count: number;
}

export interface MetricsDistributionPoint {
  name: string;
  count: number;
}

export interface MetricsData {
  trend: MetricsTrendPoint[];
  distribution: MetricsDistributionPoint[];
}

// Tab identifiers — must match backend exactly.
export type TabKey = "helloworld" | "hash" | "bubble-sort";

// Dimension enum — must match backend exactly.
export type Dimension = "type" | "level" | "dept";
