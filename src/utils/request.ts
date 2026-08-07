/**
 * Axios 请求实例
 *
 * 对齐 design.md §6.4.3 鉴权流程与 §8.5 权限异常处理
 * - 请求拦截器：注入 Authorization: Bearer {token}
 * - 响应拦截器：401 重定向登录、code!=0 弹出错误提示
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { TOKEN_KEY, USER_INFO_KEY, SUCCESS_CODE } from '@/constants/cost'
import type { ApiResponse } from '@/types/cost'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

/** 请求拦截器：注入 JWT */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

/** 响应拦截器：统一处理业务码与 HTTP 错误 */
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    // 导出接口返回 Blob（非 JSON），直接放行
    if (response.config.responseType === 'blob') {
      return response
    }
    if (res.code === SUCCESS_CODE) {
      // 返回原始 AxiosResponse，由 get/post 提取 .data.data
      return response
    }
    // 业务异常：HTTP 200 + code != 0
    ElMessage.error(res.message || '请求失败')
    // 4001 = 未登录/登录过期
    if (res.code === 4001) {
      redirectToLogin()
    }
    // 4003 = 无权限
    if (res.code === 4003) {
      ElMessage.warning('无权限执行此操作')
    }
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error: any) => {
    const status = error?.response?.status
    if (status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      redirectToLogin()
    } else if (status === 403) {
      ElMessage.error('无权限访问')
    } else if (status === 500) {
      ElMessage.error('服务器内部错误，请稍后重试')
    } else {
      ElMessage.error(error?.message || '网络异常')
    }
    return Promise.reject(error)
  }
)

/** 重定向到登录页并清理本地态 */
function redirectToLogin(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
  // 避免在登录页本身循环跳转
  const current = window.location.pathname
  if (current !== '/login') {
    window.location.href = '/login'
  }
}

/** 通用 GET 请求（返回 ApiResponse.data） */
export async function get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await service.get<ApiResponse<T>>(url, { params })
  return response.data.data
}

/** 通用 POST 请求（返回 ApiResponse.data） */
export async function post<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
  const response = await service.post<ApiResponse<T>>(url, data, config)
  return response.data.data
}

/** Blob 下载请求（返回 Blob） */
export async function downloadBlob(url: string, params?: Record<string, unknown>): Promise<Blob> {
  const response = await service.get(url, { params, responseType: 'blob' })
  return response.data as Blob
}

export default service
