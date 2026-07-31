// Unified backend response envelope.
// Result<T> = { code: number, message: string, data: T }
// Error codes: 0 success | 40001 param validation | 40002 business rule | 50000 system internal.
export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

// GET /api/demo/helloworld -> Result<{ message: "Hello, World!" }>
export interface HelloWorldData {
  message: string;
}

// POST /api/demo/hash body { text: string }
// -> Result<{ original: string, algorithm: "SHA-256", digest: string }>
export interface HashData {
  original: string;
  algorithm: string;
  digest: string;
}

// POST /api/demo/bubble-sort body { numbers: number[] }
// -> Result<{ input: number[], sorted: number[], swaps: number }>
export interface BubbleSortData {
  input: number[];
  sorted: number[];
  swaps: number;
}

// Tabs supported by the export endpoint.
export type DemoTab = 'helloworld' | 'hash' | 'bubble-sort';
