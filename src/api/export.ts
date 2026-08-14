import client from './client';
import type { ExportParams } from '../types/algorithm';

export async function exportData(params: ExportParams): Promise<Blob> {
  const resp = await client.post('/export', params, {
    responseType: 'blob',
  });
  return resp;
}