import client from './client'
import type { AnalyticsResponse, ChartType, Dimension } from './types'

// 分析接口封装（spec tracking-analytics.md 契约对齐）
// GET /api/analytics/calls?dimension=&chartType=&startTime=&endTime=
// → {"chartType","dimension","data":[{label,value}] | [{date,values:[{label,value}]}]}

export interface GetCallsParams {
  dimension: Dimension
  chartType: ChartType
  startTime?: string
  endTime?: string
}

export function getCalls(params: GetCallsParams): Promise<AnalyticsResponse> {
  return client
    .get<AnalyticsResponse>('/analytics/calls', {
      params: {
        dimension: params.dimension,
        chartType: params.chartType,
        startTime: params.startTime,
        endTime: params.endTime
      }
    })
    .then((r) => r.data)
}
