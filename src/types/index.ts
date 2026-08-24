/**
 * 统一 API 响应结构
 * 遵循前后端规约：errorCode + errorMessage + data
 */
export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

/** Helloworld 接口返回 */
export type HelloworldData = {
  result: string;
};

/** 哈希算法请求 */
export type HashRequest = {
  input: string;
};

/** 哈希算法响应 */
export type HashData = {
  result: string;
};

/** 冒泡排序请求 */
export type BubbleSortRequest = {
  array: number[];
};

/** 冒泡排序响应 */
export type BubbleSortData = {
  sorted: number[];
};

/** 导出请求 */
export type ExportRequest = {
  format: 'excel' | 'csv';
};

/** 调用统计维度 */
export type StatsDimension = 'personType' | 'level' | 'department';

/** 调用统计查询参数 */
export type StatsQuery = {
  dimension: StatsDimension;
  startDate: string;
  endDate: string;
};

/** 单条统计数据 */
export type InvocationStat = {
  label: string;
  count: number;
  date?: string;
};

/** 导出格式选项 */
export type ExportFormat = 'excel' | 'csv';

/** Tab 标识 */
export type AlgorithmTabKey = 'helloworld' | 'hash' | 'bubbleSort';
