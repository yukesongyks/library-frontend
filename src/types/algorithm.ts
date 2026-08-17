export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface HelloWorldData {
  greeting: string;
  timestamp: string;
}

export interface HashRequest {
  input: string;
  algorithm?: string;
}

export interface HashData {
  input: string;
  algorithm: string;
  hash: string;
}

export interface BubbleSortRequest {
  array: number[];
}

export interface SortStep {
  round: number;
  after: number[];
  swapped: boolean;
}

export interface BubbleSortData {
  input: number[];
  sorted: number[];
  steps: SortStep[];
  comparisons: number;
  swaps: number;
}

export interface ExportRequest {
  type: string;
  data: Record<string, unknown>;
  format?: string;
}