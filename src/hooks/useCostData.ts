import { useState, useEffect, useCallback } from 'react';
import { fetchCostSummary, fetchDashboard, fetchDimensionStats, fetchAllProjectCosts } from '../api/cost';
import type { CostQueryParams, CostSummaryDTO, DashboardDTO, DimensionStatDTO, ProjectCostDTO, DimensionType, PageResult } from '../types/cost';

export function useCostSummary(initialParams?: CostQueryParams) {
  const [data, setData] = useState<PageResult<CostSummaryDTO> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (params: CostQueryParams) => {
    setLoading(true);
    try {
      const res = await fetchCostSummary(params);
      if (res.code === 200) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (initialParams) load(initialParams); }, []);

  return { data, loading, load };
}

export function useDashboard(year: number) {
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDashboard(year);
      if (res.code === 200) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}

export function useDimensionStats(dimension: DimensionType, timeDimension: string, startDate?: string, endDate?: string) {
  const [data, setData] = useState<DimensionStatDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDimensionStats(dimension, timeDimension, startDate, endDate);
      if (res.code === 200) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [dimension, timeDimension, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}

export function useProjectCosts(year: number) {
  const [data, setData] = useState<ProjectCostDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllProjectCosts(year);
      if (res.code === 200) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}
