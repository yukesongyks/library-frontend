import httpClient from './client'
import type { ApiResponse, PaginatedData, PageParams } from '@/types/api'
import type { Employee, EmployeeRequest } from '@/types/employee'

export const employeeApi = {
  list(params?: PageParams): Promise<ApiResponse<PaginatedData<Employee>>> {
    return httpClient.get('/employees', { params }).then((res) => res.data)
  },

  getById(id: string): Promise<ApiResponse<Employee>> {
    return httpClient.get(`/employees/${id}`).then((res) => res.data)
  },

  create(data: EmployeeRequest): Promise<ApiResponse<Employee>> {
    return httpClient.post('/employees', data).then((res) => res.data)
  },

  update(id: string, data: Partial<EmployeeRequest>): Promise<ApiResponse<Employee>> {
    return httpClient.put(`/employees/${id}`, data).then((res) => res.data)
  },

  delete(id: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`/employees/${id}`).then((res) => res.data)
  },
}