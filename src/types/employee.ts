export interface Employee {
  employeeId: string
  name: string
  department: string
  position: string
  phone: string
  email: string
  hireDate: string
  status: EmployeeStatus
  createdAt?: string
  updatedAt?: string
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED'

export interface EmployeeRequest {
  name: string
  department: string
  position: string
  phone?: string
  email?: string
  hireDate: string
  status?: EmployeeStatus
}

export const EMPLOYEE_STATUS_OPTIONS: { label: string; value: EmployeeStatus }[] = [
  { label: '在职', value: 'ACTIVE' },
  { label: '停职', value: 'INACTIVE' },
  { label: '离职', value: 'TERMINATED' },
]