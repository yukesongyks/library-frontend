import { defineStore } from 'pinia'
import { ref } from 'vue'
import { budgetApi } from '@/api/budgetApi'
import type { Budget, BudgetRequest, BudgetSummary } from '@/types/budget'

export const useBudgetStore = defineStore('budget', () => {
  const budgets = ref<Budget[]>([])
  const summary = ref<BudgetSummary | null>(null)
  const selectedYear = ref(new Date().getFullYear())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBudgets(employeeId: string, year?: number) {
    loading.value = true
    error.value = null
    try {
      const res = await budgetApi.list(employeeId, year ?? selectedYear.value)
      budgets.value = res.data
    } catch (e: any) {
      error.value = e.message || '获取预算列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary(employeeId: string, year: number) {
    loading.value = true
    error.value = null
    try {
      const res = await budgetApi.getSummary(employeeId, year)
      summary.value = res.data
    } catch (e: any) {
      error.value = e.message || '获取预算汇总失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createBudget(employeeId: string, data: BudgetRequest) {
    error.value = null
    try {
      const res = await budgetApi.create(employeeId, data)
      return res.data
    } catch (e: any) {
      error.value = e.message || '创建预算失败'
      throw e
    }
  }

  async function updateBudget(employeeId: string, budgetId: number, data: Partial<BudgetRequest>) {
    error.value = null
    try {
      const res = await budgetApi.update(employeeId, budgetId, data)
      return res.data
    } catch (e: any) {
      error.value = e.message || '更新预算失败'
      throw e
    }
  }

  function setYear(year: number) {
    selectedYear.value = year
  }

  return {
    budgets,
    summary,
    selectedYear,
    loading,
    error,
    fetchBudgets,
    fetchSummary,
    createBudget,
    updateBudget,
    setYear,
  }
})