import { useState, useEffect, useCallback } from 'react'
import type { CostSummary, CostQueryRequest, DimensionStat, ProjectCost } from '../types/cost'
import * as costApi from '../api/costApi'

export function useCostSummary() {
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (params: CostQueryRequest) => {
    setLoading(true)
    setError(null)
    try {
      const data = await costApi.getCostSummary(params)
      setSummary(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  return { summary, loading, error, fetch }
}

export function useMonthlyTrend() {
  const [trend, setTrend] = useState<DimensionStat[]>([])
  const [loading, setLoading] = useState(false)
  const fetch = useCallback(async (year?: number) => {
    setLoading(true)
    try {
      setTrend(await costApi.getMonthlyTrend(year))
    } finally {
      setLoading(false)
    }
  }, [])
  return { trend, loading, fetch }
}

export function useProjectCost() {
  const [projects, setProjects] = useState<ProjectCost[]>([])
  const [loading, setLoading] = useState(false)
  const fetch = useCallback(async (year?: number) => {
    setLoading(true)
    try {
      setProjects(await costApi.getProjectCost(year))
    } finally {
      setLoading(false)
    }
  }, [])
  return { projects, loading, fetch }
}

export function useCostByRole() {
  const [roles, setRoles] = useState<DimensionStat[]>([])
  const fetch = useCallback(async () => {
    setRoles(await costApi.getCostByRole())
  }, [])
  useEffect(() => {
    fetch()
  }, [fetch])
  return { roles, fetch }
}
