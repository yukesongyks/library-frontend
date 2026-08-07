import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 统一错误兜底（异常兜底方案 6.2.1）
api.interceptors.response.use(
  response => response.data,
  error => {
    let msg = '服务暂时不可用，请稍后重试'
    if (error.response && error.response.data && error.response.data.msg) {
      msg = error.response.data.msg
    }
    return Promise.reject(new Error(msg))
  }
)

// W01 helloworld
export function helloWorld() {
  return api.post('/demo/helloworld')
}

// W02 哈希算法
export function hash(text, algorithm) {
  return api.post('/demo/hash', { text, algorithm })
}

// W03 冒泡排序
export function bubbleSort(numbers) {
  return api.post('/demo/bubble-sort', { numbers })
}

// W05 调用统计查询
export function getStatistics(dimension, bizType, startDate, endDate) {
  const params = { dimension }
  if (bizType) params.bizType = bizType
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return api.get('/demo/statistics', { params })
}

// W04 导出（异常兜底方案 6.2.3）
export async function exportResult(bizType, params = {}) {
  try {
    const query = new URLSearchParams({ bizType, ...params }).toString()
    const resp = await fetch(`/api/demo/export?${query}`)
    if (!resp.ok) throw new Error('导出失败')
    const blob = await resp.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `demo_${bizType}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    throw new Error('导出失败，请稍后重试')
  }
}
