import httpClient from './client'
import type { ApiResponse } from '@/types/api'
import type { ImportResult } from '@/types/import'

export const importApi = {
  upload(file: File): Promise<ApiResponse<ImportResult>> {
    const formData = new FormData()
    formData.append('file', file)
    return httpClient
      .post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data)
  },

  downloadTemplate(): Promise<Blob> {
    return httpClient
      .get('/employees/import/template', { responseType: 'blob' })
      .then((res) => res.data)
  },
}