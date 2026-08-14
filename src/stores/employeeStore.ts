import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { employeeApi } from '@/api/employeeApi'
import type { Employee, EmployeeRequest, EmployeeStatus } from '@/types/employee'
import type { PageParams } from '@/types/api'

export const useEmployeeStore = defineStore('employee', () => {
  const employees = ref<Employee[]>([])
  const currentEmployee = ref<Employee | null>(null)
  const totalElements = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(0)
  const pageSize = ref(20)
  const searchQuery = ref('')
  const statusFilter = ref<EmployeeStatus | ''>('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pageParams = computed<PageParams>(() => ({
    page: currentPage.value,
    size: pageSize.value,
    search: searchQuery.value || undefined,
    status: statusFilter.value || undefined,
  }))

  async function fetchEmployees() {
    loading.value = true
    error.value = null
    try {
      const res = await employeeApi.list(pageParams.value)
      employees.value = res.data.content
      totalElements.value = res.data.totalElements
      totalPages.value = res.data.totalPages
      currentPage.value = res.data.number
    } catch (e: any) {
      error.value = e.message || '获取员工列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployeeById(id: string) {
    loading.value = true
    error.value = null
    try {
      const res = await employeeApi.getById(id)
      currentEmployee.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e.message || '获取员工详情失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createEmployee(data: EmployeeRequest) {
    error.value = null
    try {
      const res = await employeeApi.create(data)
      return res.data
    } catch (e: any) {
      error.value = e.message || '创建员工失败'
      throw e
    }
  }

  async function updateEmployee(id: string, data: Partial<EmployeeRequest>) {
    error.value = null
    try {
      const res = await employeeApi.update(id, data)
      return res.data
    } catch (e: any) {
      error.value = e.message || '更新员工失败'
      throw e
    }
  }

  async function deleteEmployee(id: string) {
    error.value = null
    try {
      await employeeApi.delete(id)
      await fetchEmployees()
    } catch (e: any) {
      error.value = e.message || '删除员工失败'
      throw e
    }
  }

  function setPage(page: number) {
    currentPage.value = page
  }

  function setSearch(query: string) {
    searchQuery.value = query
    currentPage.value = 0
  }

  function setStatusFilter(status: EmployeeStatus | '') {
    statusFilter.value = status
    currentPage.value = 0
  }

  return {
    employees,
    currentEmployee,
    totalElements,
    totalPages,
    currentPage,
    pageSize,
    searchQuery,
    statusFilter,
    loading,
    error,
    pageParams,
    fetchEmployees,
    fetchEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    setPage,
    setSearch,
    setStatusFilter,
  }
})