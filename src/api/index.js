/**
 * API 请求封装。
 *
 * 与后端接口契约对齐：
 * - GET /api/demo/helloworld
 * - GET /api/demo/hash?input=xxx
 * - GET /api/demo/bubble-sort?input=xxx
 * - GET /api/demo/export?type=xxx&input=xxx
 * - GET /api/track/statistics?dimension=xxx&chartType=xxx
 */

const BASE_URL = '/api'

/**
 * 模拟用户身份请求头（实际项目从登录态获取）。
 */
const USER_HEADERS = {
  'X-User-Id': 'U001',
  'X-User-Name': '张三',
  'X-User-Type': '管理员',
  'X-User-Level': 'L3',
  'X-User-Department': '技术部',
}

/**
 * 发起 GET 请求。
 *
 * @param {string} path 请求路径
 * @param {object} params 查询参数
 * @returns {Promise<object>} 响应数据
 */
async function get(path, params = {}) {
  const url = new URL(path, window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value)
    }
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { ...USER_HEADERS },
  })

  const data = await response.json()
  if (data.code !== 200) {
    throw new Error(data.errorMessage || data.message || '请求失败')
  }
  return data.data
}

/**
 * 调用 HelloWorld 接口。
 */
export function fetchHelloWorld() {
  return get(`${BASE_URL}/demo/helloworld`)
}

/**
 * 调用哈希算法接口。
 *
 * @param {string} input 原始字符串
 */
export function fetchHash(input) {
  return get(`${BASE_URL}/demo/hash`, { input })
}

/**
 * 调用冒泡排序接口。
 *
 * @param {string} input 逗号分隔的数字串
 */
export function fetchBubbleSort(input) {
  return get(`${BASE_URL}/demo/bubble-sort`, { input })
}

/**
 * 导出指定类型结果（文件下载）。
 *
 * @param {string} type 导出类型
 * @param {string} input 输入参数
 */
export function exportResult(type, input) {
  const params = new URLSearchParams({ type })
  if (input) {
    params.set('input', input)
  }

  const url = `${BASE_URL}/demo/export?${params.toString()}`
  const link = document.createElement('a')

  // 使用 fetch 获取文件并触发下载
  fetch(url, { headers: { ...USER_HEADERS } })
    .then((res) => {
      const disposition = res.headers.get('Content-Disposition') || ''
      const fileNameMatch = disposition.match(/filename=([^;]+)/)
      const fileName = fileNameMatch
        ? decodeURIComponent(fileNameMatch[1])
        : `export_${type}.csv`
      return res.blob().then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob)
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      })
    })
    .catch((err) => {
      console.error('导出失败:', err)
      alert('导出失败，请重试')
    })
}

/**
 * 查询埋点统计数据。
 *
 * @param {string} dimension 统计维度
 * @param {string} chartType 图表类型
 */
export function fetchTrackStatistics(dimension, chartType) {
  return get(`${BASE_URL}/track/statistics`, { dimension, chartType })
}
