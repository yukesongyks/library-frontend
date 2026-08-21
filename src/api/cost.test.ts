import { describe, expect, it, vi } from 'vitest'
import { buildExportUrl, fetchAnalysis, fetchSummary } from './cost'
import { http } from './client'

vi.mock('./client', async () => {
  const get = vi.fn()
  return {
    http: { get },
    unwrap: async <T,>(p: Promise<{ data: { data: T } }>): Promise<T> => (await p).data.data
  }
})

describe('fetchSummary', () => {
  it('调用 /cost/summary 并解包 data', async () => {
    const get = http.get as ReturnType<typeof vi.fn>
    get.mockResolvedValue({ data: { code: 0, message: 'ok', data: { totalCost: 2004000 } } })
    const result = await fetchSummary('2025')
    expect(get).toHaveBeenCalledWith('/cost/summary', { params: { year: '2025' } })
    expect(result.totalCost).toBe(2004000)
  })
})

describe('fetchAnalysis', () => {
  it('透传维度查询参数', async () => {
    const get = http.get as ReturnType<typeof vi.fn>
    get.mockResolvedValue({ data: { code: 0, message: 'ok', data: { records: [], total: 0 } } })
    await fetchAnalysis({ dimension: 'department', year: '2025' })
    expect(get).toHaveBeenCalledWith('/cost/analysis', { params: { dimension: 'department', year: '2025' } })
  })
})

describe('buildExportUrl', () => {
  it('生成带查询参数与格式的导出地址', () => {
    const url = buildExportUrl({ dimension: 'department', year: '2025', role: 'DEV' }, 'xlsx')
    expect(url).toBe('/api/cost/export?dimension=department&year=2025&role=DEV&format=xlsx')
  })
})