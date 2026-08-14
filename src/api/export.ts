import axios from 'axios';

const http = axios.create({ baseURL: '/api/v1' });

export async function exportCostReport(params: {
  dimension: string;
  timeDimension?: string;
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  const response = await http.post('/cost/export', null, {
    params,
    responseType: 'blob',
  });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '成本统计报表.xlsx';
  link.click();
  window.URL.revokeObjectURL(url);
}
