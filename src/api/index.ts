import axios from 'axios'
import type { AlgoResult, CallStats } from '../types'

const client = axios.create({ baseURL: '/api' })
client.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = 'U001'
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
