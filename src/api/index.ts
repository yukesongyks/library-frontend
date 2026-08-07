import axios from 'axios'
import type { AlgoResult, CallStats } from '../types'

// M5: 不再硬编码 U001，支持从 localStorage 读取用户切换，默认 U001 便于演示
const USER_KEY = 'library-user-id'
export function getUserId(): string {
  return localStorage.getItem(USER_KEY) || 'U001'
}
export function setUserId(id: string) {
  localStorage.setItem(USER_KEY, id)
}

const client = axios.create({ baseURL: '/api' })
client.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = getUserId()
  return config
})

export async function callHello(): Promise<AlgoResult> {
  const { data } = await client.get('/algo/helloworld')
  return data
}

export async function callHash(input: string): Promise<AlgoResult> {
  const { data } = await client.get('/algo/hash', { params: { input } })
  return data
}

export async function callBubble(input: string): Promise<AlgoResult> {
  const { data } = await client.get('/algo/bubblesort', { params: { input } })
  return data
}

export async function fetchStats(): Promise<CallStats> {
  const { data } = await client.get('/stats')
  return data
}

export function exportUrl(apiName: string): string {
  return `/api/export/${apiName}`
}
