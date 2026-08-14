export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

export interface ApiError {
  code: number
  message: string
  details?: Record<string, string[]>
}

export interface PaginatedData<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface PageParams {
  page?: number
  size?: number
  search?: string
  status?: string
}