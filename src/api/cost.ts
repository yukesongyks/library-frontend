import axios from 'axios';
import type { Result, PageResult, CostSummaryDTO, DashboardDTO, DimensionStatDTO, ProjectCostDTO, CostQueryParams, DimensionType } from '../types/cost';

const http = axios.create({ baseURL: '/api/v1' });

export async function fetchCostSummary(params: CostQueryParams): Promise<Result<PageResult<CostSummaryDTO>>> {
  const { data } = await http.get<Result<PageResult<CostSummaryDTO>>>('/cost/summary', { params });
  return data;
}

export async function fetchDashboard(year: number): Promise<Result<DashboardDTO>> {
  const { data } = await http.get<Result<DashboardDTO>>('/cost/dashboard', { params: { year } });
  return data;
}

export async function fetchDimensionStats(
  dimension: DimensionType,
  timeDimension: string = 'MONTH',
  startDate?: string,
  endDate?: string
): Promise<Result<DimensionStatDTO[]>> {
  const { data } = await http.get<Result<DimensionStatDTO[]>>('/cost/dimension', {
    params: { dimension, timeDimension, startDate, endDate },
  });
  return data;
}

export async function fetchProjectCost(projectId: number, year: number): Promise<Result<ProjectCostDTO>> {
  const { data } = await http.get<Result<ProjectCostDTO>>('/cost/project', { params: { projectId, year } });
  return data;
}

export async function fetchAllProjectCosts(year: number): Promise<Result<ProjectCostDTO[]>> {
  const { data } = await http.get<Result<ProjectCostDTO[]>>('/cost/project/list', { params: { year } });
  return data;
}
