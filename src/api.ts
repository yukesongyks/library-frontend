export type AlgorithmTab = 'HELLO_WORLD' | 'HASH' | 'BUBBLE_SORT'

export type Report = {
  summary: {
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    uniqueUsers: number
  }
  timeseries: { label: string; count: number }[]
  byUserType: { key: string; label: string; count: number }[]
  byUserLevel: { key: string; label: string; count: number }[]
  byDepartment: { key: string; label: string; count: number }[]
}

const identityHeaders = {
  'X-User-Id': 'demo-user',
  'X-User-Type': 'INTERNAL',
  'X-User-Level': 'L2',
  'X-Department-Id': 'demo',
  'X-Department-Name': 'Demo Department',
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...identityHeaders, ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    throw new Error(error.message ?? '请求失败')
  }
  return response.json() as Promise<T>
}

export function runHelloWorld(name: string) {
  return request<{ requestId: string; message: string; executedAt: string }>('/api/algorithms/hello-world', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function runHash(text: string) {
  return request<{ requestId: string; algorithm: string; hash: string; executedAt: string }>('/api/algorithms/hash', {
    method: 'POST',
    body: JSON.stringify({ text, algorithm: 'SHA-256' }),
  })
}

export function runBubbleSort(numbers: number[], direction: 'ASC' | 'DESC') {
  return request<{ requestId: string; original: number[]; sorted: number[]; direction: string; durationMs: number; executedAt: string }>(
    '/api/algorithms/bubble-sort', { method: 'POST', body: JSON.stringify({ numbers, direction }) },
  )
}

export function getReport() {
  return request<Report>('/api/analytics/report')
}

export async function downloadExport(scope: 'algorithm' | 'analytics', algorithmType?: AlgorithmTab) {
  const query = new URLSearchParams({ scope })
  if (algorithmType) query.set('algorithmType', algorithmType)
  const response = await fetch(`/api/analytics/export?${query.toString()}`, { headers: identityHeaders })
  if (!response.ok) throw new Error('导出失败')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = scope === 'algorithm' ? 'algorithm-results.csv' : 'analytics-report.csv'
  link.click()
  URL.revokeObjectURL(url)
}
