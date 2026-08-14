import { blobClient } from './client';
import type { ExportParams } from '../types/algorithm';

export async function exportData(params: ExportParams): Promise<Blob> {
  const resp = await blobClient.post('/export', params, {
    responseType: 'blob',
  });
  return resp.data;
}