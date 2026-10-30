/** 人员类型枚举 */
export type UserType = 'EMPLOYEE' | 'CONTRACTOR' | 'INTERN'

/** 通用 API 请求体（与后端 ApiRequest 对齐） */
export interface ApiRequest {
  userId: string
  userType: UserType
  level?: string
  department?: string
  algorithm?: string
  input?: string
  array?: number[]
}

/** 后端统一响应包装 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** Hello 响应 */
export interface HelloData {
  message: string
}

/** Hash 响应 */
export interface HashData {
  input: string
  hash: string
}

/** BubbleSort 响应 */
export interface BubbleSortData {
  original: number[]
  sorted: number[]
}

/** 导出请求 */
export interface ExportRequest {
  tab: 'hello' | 'hash' | 'bubble-sort'
  filters: Record<string, string>
}

/** 报表维度 */
export type StatsDimension = 'userType' | 'level' | 'department'

/** 图表类型 */
export type ChartType = 'LINE' | 'PIE' | 'BAR'

/** 报表单项 */
export interface StatsItem {
  label: string
  count: number
}

/** 报表响应 */
export interface StatsResponse {
  dimension: string
  items: StatsItem[]
}