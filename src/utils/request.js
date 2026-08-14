import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Caller-Name': 'demo-user',
    'X-Person-Type': '管理员',
    'X-Person-Level': '中级',
    'X-Person-Dept': '技术部'
  }
})

// 重试拦截器
let retryCount = 0
const MAX_RETRIES = 2

request.interceptors.response.use(
  response => {
    retryCount = 0 // 成功后重置重试计数
    const res = response.data
    if (res.code !== 200) {
      console.error('API error:', res.message)
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res.data
  },
  async error => {
    const config = error.config
    // 只在网络错误或超时时重试，且不超过最大重试次数
    if (!config || !error.message || retryCount >= MAX_RETRIES) {
      retryCount = 0
      console.error('Request error:', error)
      return Promise.reject(error)
    }
    if (error.message.includes('timeout') || error.code === 'ERR_NETWORK') {
      retryCount++
      console.warn(`请求失败，第 ${retryCount} 次重试...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return request(config)
    }
    retryCount = 0
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

export default request