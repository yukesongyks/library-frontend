// 前后端契约类型定义（与 library-backend specs 对齐）

/** HelloWorld 响应：{"result": "Hello, World!"} */
export interface HelloWorldResponse {
  result: string
}

/** Hash 请求体：{"text":"abc","algorithm":"SHA-256"} */
export interface HashRequest {
  text: string
  algorithm: string
}

/** Hash 响应：{"result":"<hex>","algorithm":"SHA-256"} */
export interface HashResponse {
  result: string
  algorithm: string
}

/** BubbleSort 请求体：{"numbers":[5,3,8,1,9]} */
export interface BubbleSortRequest {
  numbers: number[]
}

/** BubbleSort 响应：{"result":[1,3,5,8,9],"input":[5,3,8,1,9]} */
export interface BubbleSortResponse {
  result: number[]
  input: number[]
}

/** 分析接口 bar/pie 数据点：{"label":"开发","value":42} */
export interface DimensionPoint {
  label: string
  value: number
}

/** 分析接口 line 数据点：{"date":"2026-07-01","values":[{label,value}]} */
export interface TrendPoint {
  date: string
  values: DimensionPoint[]
}

/** chartType 维度：line | pie | bar */
export type ChartType = 'line' | 'pie' | 'bar'

/** 分析维度：personnelType | personnelLevel | department */
export type Dimension = 'personnelType' | 'personnelLevel' | 'department'

/** 分析接口响应：{"chartType","dimension","data"} */
export interface AnalyticsResponse {
  chartType: ChartType
  dimension: Dimension
  data: DimensionPoint[] | TrendPoint[]
}

/** 后端统一错误响应：{"error":"..."} */
export interface ErrorResponse {
  error: string
}
