import axios from 'axios'
import type { ApiResponse } from './types'

export const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

http.interceptors.response.use(
  (resp) => {
    const body = resp.data as ApiResponse<unknown> | undefined
    if (body && typeof body.code === 'number' && body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return resp
  },
  (error) => Promise.reject(error)
)

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const resp = await promise
  return resp.data.data
}