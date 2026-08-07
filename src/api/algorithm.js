import request from './request'

/**
 * W01 HelloWorld
 */
export function helloWorld() {
  return request.get('/algorithm/hello-world')
}

/**
 * W02 哈希算法
 */
export function hash(data) {
  return request.post('/algorithm/hash', data)
}

/**
 * W03 冒泡排序
 */
export function bubbleSort(data) {
  return request.post('/algorithm/bubble-sort', data)
}

/**
 * W04 导出算法结果
 */
export function exportAlgorithmUrl(params) {
  return `/api/export/algorithm-result?${new URLSearchParams(params).toString()}`
}

/**
 * W05 查询调用统计报表
 */
export function queryCallStats(data) {
  return request.post('/report/algorithm-call-stats', data)
}
