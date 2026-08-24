/**
 * 触发浏览器下载 Blob 文件
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 根据导出格式生成文件名
 */
export function getExportFilename(format: 'excel' | 'csv'): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  const ext = format === 'excel' ? 'xlsx' : 'csv';
  return `dtcoder-export-${timestamp}.${ext}`;
}
