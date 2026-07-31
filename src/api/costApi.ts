import client from './client'
import type { CostQueryRequest, CostSummary, DimensionStat, ProjectCost } from '../types/cost'

export async function getCostSummary(params: CostQueryRequest): Promise<CostSummary> {
  const { data } = await client.get<CostSummary>('/cost/summary', { params })
  return data
}

export async function getMonthlyTrend(year?: number): Promise<DimensionStat[]> {
  const { data } = await client.get<DimensionStat[]>('/cost/trend', { params: { year } })
  return data
}

export async function getCostByRole(): Promise<DimensionStat[]> {
  const { data } = await client.get<DimensionStat[]>('/cost/role')
  return data
}

export async function getProjectCost(budgetYear?: number): Promise<ProjectCost[]> {
  const { data } = await client.get<ProjectCost[]>('/cost/project', { params: { budgetYear } })
  return data
}

export async function getCostByDimension(dimension: string, year?: number): Promise<DimensionStat[]> {
  const { data } = await client.get<DimensionStat[]>('/cost/dimension', { params: { dimension, year } })
  return data
}

export function exportSummaryUrl(params: CostQueryRequest): string {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query.append(k, String(v))
  })
  return `${base}/cost/export/summary?${query.toString()}`
}

export function exportProjectCostUrl(budgetYear?: number): string {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  return budgetYear
    ? `${base}/cost/export/project?budgetYear=${budgetYear}`
    : `${base}/cost/export/project`
}
