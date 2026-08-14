import httpClient from './client'
import type { ApiResponse } from '@/types/api'
import type { WhitelistEntry, WhitelistRequest, BatchWhitelistRequest } from '@/types/whitelist'

export const whitelistApi = {
  list(type?: string): Promise<ApiResponse<WhitelistEntry[]>> {
    return httpClient.get('/whitelist', { params: { type } }).then((res) => res.data)
  },

  add(data: WhitelistRequest): Promise<ApiResponse<WhitelistEntry>> {
    return httpClient.post('/whitelist', data).then((res) => res.data)
  },

  batchAdd(data: BatchWhitelistRequest): Promise<ApiResponse<WhitelistEntry[]>> {
    return httpClient.post('/whitelist/batch', data).then((res) => res.data)
  },

  remove(id: number): Promise<ApiResponse<void>> {
    return httpClient.delete(`/whitelist/${id}`).then((res) => res.data)
  },

  check(employeeId: string, type: string): Promise<ApiResponse<boolean>> {
    return httpClient
      .get('/whitelist/check', { params: { employeeId, type } })
      .then((res) => res.data)
  },
}