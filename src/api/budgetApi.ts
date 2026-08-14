import httpClient from './client'
import type { ApiResponse } from '@/types/api'
import type { Budget, BudgetRequest, BudgetSummary } from '@/types/budget'

export const budgetApi = {
  list(employeeId: string, year?: number): Promise<ApiResponse<Budget[]>> {
    return httpClient
      .get(`/employees/${employeeId}/budgets`, { params: { year } })
      .then((res) => res.data)
  },

  getSummary(employeeId: string, year: number): Promise<ApiResponse<BudgetSummary>> {
    return httpClient
      .get(`/employees/${employeeId}/budgets/summary`, { params: { year } })
      .then((res) => res.data)
  },

  create(employeeId: string, data: BudgetRequest): Promise<ApiResponse<Budget>> {
    return httpClient.post(`/employees/${employeeId}/budgets`, data).then((res) => res.data)
  },

  update(
    employeeId: string,
    budgetId: number,
    data: Partial<BudgetRequest>
  ): Promise<ApiResponse<Budget>> {
    return httpClient
      .put(`/employees/${employeeId}/budgets/${budgetId}`, data)
      .then((res) => res.data)
  },
}