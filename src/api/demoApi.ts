import client from './client'
import type {
  ApiRequest,
  ApiResponse,
  HelloData,
  HashData,
  BubbleSortData,
  StatsDimension,
  StatsResponse,
} from '../types/demo'

/** Hello World */
export async function callHello(request: ApiRequest): Promise<ApiResponse<HelloData>> {
  const { data } = await client.post<ApiResponse<HelloData>>('/hello', request)
  return data
}

/** SHA-256 Hash */
export async function callHash(request: ApiRequest): Promise<ApiResponse<HashData>> {
  const { data } = await client.post<ApiResponse<HashData>>('/hash', request)
  return data
}

/** Bubble Sort */
export async function callBubbleSort(request: ApiRequest): Promise<ApiResponse<BubbleSortData>> {
  const { data } = await client.post<ApiResponse<BubbleSortData>>('/bubble-sort', request)
  return data
}

/** 导出 Excel */
export async function exportExcel(
  request: ApiRequest & { tab: string; filters?: Record<string, string> },
): Promise<void> {
  const { userId, userType, level, department, tab, filters } = request
  const body = {
    userId,
    userType,
    level,
    department,
    tab,
    filters: filters || {},
  }
  const resp = await client.post('/export', body, { responseType: 'blob' })
  const blob = new Blob([resp.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${tab}_result.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
}

/** 获取调用统计报表 */
export async function fetchStats(params: {
  dimension: StatsDimension
  startDate: string
  endDate: string
  apiName?: string
}): Promise<ApiResponse<StatsResponse>> {
  const { data } = await client.get<ApiResponse<StatsResponse>>('/stats', { params })
  return data
}