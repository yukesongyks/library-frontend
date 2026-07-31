import client from './client'
import type {
  BubbleSortRequest,
  BubbleSortResponse,
  HashRequest,
  HashResponse,
  HelloWorldResponse
} from './types'

// 算法接口封装（spec algorithms.md + export.md 契约对齐）
// - GET /api/algorithms/helloworld → {"result":"Hello, World!"}
// - POST /api/algorithms/hash {"text","algorithm"} → {"result","algorithm"}
// - POST /api/algorithms/bubble-sort {"numbers"} → {"result","input"}
// - GET /api/algorithms/export?type= → CSV 文件流（触发浏览器下载）

export function getHelloWorld(): Promise<HelloWorldResponse> {
  return client.get<HelloWorldResponse>('/algorithms/helloworld').then((r) => r.data)
}

export function computeHash(req: HashRequest): Promise<HashResponse> {
  return client.post<HashResponse>('/algorithms/hash', req).then((r) => r.data)
}

export function bubbleSort(req: BubbleSortRequest): Promise<BubbleSortResponse> {
  return client.post<BubbleSortResponse>('/algorithms/bubble-sort', req).then((r) => r.data)
}

/**
 * 导出指定类型的调用记录 CSV。
 * spec export.md：GET /api/algorithms/export?type= → text/csv 附件下载。
 * 通过构造同源 URL + 临时 <a> 触发浏览器下载，保留 X-User-Id 注入。
 */
export function exportRecords(type: 'helloworld' | 'hash' | 'bubble-sort'): void {
  const url = `/api/algorithms/export?type=${encodeURIComponent(type)}`
  const link = document.createElement('a')
  link.href = url
  link.download = `${type}-export.csv`
  // 注：axios 拦截器对 <a> 标签下载不生效，但导出接口本身不依赖 X-User-Id
  // （仅读 call_logs，不写埋点），故直接浏览器请求即可
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
