import axios from 'axios'

// spec tracking-analytics.md：调用人标识通过 X-User-Id header 传入，埋点切面据此关联 User 维度。
// 开发演示场景接受伪造风险（proposal.md 非目标：不实现用户认证）。
// 默认用户 id=1（DataInitializer 预置的 alice：开发/P6/技术部），便于演示埋点维度。
const DEFAULT_USER_ID = '1'

const client = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：为所有请求注入 X-User-Id header，支撑后端埋点关联人员维度
client.interceptors.request.use((config) => {
  if (!config.headers['X-User-Id']) {
    config.headers['X-User-Id'] = DEFAULT_USER_ID
  }
  return config
})

export default client
