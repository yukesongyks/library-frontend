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

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      console.error('API error:', res.message)
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res.data
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

export default request