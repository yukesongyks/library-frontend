import { http, unwrap } from './client'
import type { AnalysisQuery, AnalysisResponse, CostSummary } from './types'

export function fetchSummary(year: string): Promise<CostSummary> {
  return unwrap<CostSummary>(http.get('/cost/summary', { params: { year } }))
}

export function fetchAnalysis(query: AnalysisQuery): Promise<AnalysisResponse> {
  return unwrap<AnalysisResponse>(http.get('/cost/analysis', { params: query }))
}

export function buildExportUrl(
  query: AnalysisQuery,
  format: 'xlsx' | 'csv' = 'xlsx'
): string {
  const params = new URLSearchParams()
  params.set('dimension', query.dimension)
  if (query.year) params.set('year', query.year)
  if (query.month) params.set('month', query.month)
  if (query.quarter) params.set('quarter', query.quarter)
  if (query.role) params.set('role', query.role)
  params.set('format', format)
  return `/api/cost/export?${params.toString()}`
}