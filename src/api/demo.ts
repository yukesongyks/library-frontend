import { request } from './request';
import { showToast } from '../components/Toast';
import type { BubbleSortData, DemoTab, HashData, HelloWorldData, Result } from '../types';

const BASE = '/api/demo';

// GET /api/demo/helloworld -> Result<{ message: "Hello, World!" }>
export function fetchHelloWorld(): Promise<HelloWorldData> {
  return request<HelloWorldData>(`${BASE}/helloworld`, { method: 'GET' });
}

// POST /api/demo/hash body { text: string } -> Result<HashData>
export function fetchHash(text: string): Promise<HashData> {
  return request<HashData>(`${BASE}/hash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

// POST /api/demo/bubble-sort body { numbers: number[] } -> Result<BubbleSortData>
export function fetchBubbleSort(numbers: number[]): Promise<BubbleSortData> {
  return request<BubbleSortData>(`${BASE}/bubble-sort`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numbers }),
  });
}

/**
 * Export the current tab as a CSV download.
 * Uses fetch streaming (NOT window.location.href).
 *
 * Behavior per §5.3 export fallback:
 * - On fetch failure / network error -> toast "网络异常，请检查后端服务"
 * - If Content-Type is text/csv -> blob -> trigger download via URL.createObjectURL
 * - If Content-Type is application/json -> parse as Result error -> toast message
 *   (covers illegal tab 40001 and HTTP 500 system errors returned as JSON)
 * - On HTTP 500 with JSON body -> parse Result error -> toast
 */
export async function exportCsv(tab: DemoTab): Promise<boolean> {
  const url = `${BASE}/export?tab=${encodeURIComponent(tab)}&format=csv`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    showToast('网络异常，请检查后端服务', 'error');
    return false;
  }

  const contentType = response.headers.get('Content-Type') ?? '';

  // JSON error body: covers 40001 (illegal tab) and 50000 (IOException HTTP 500)
  if (contentType.includes('application/json')) {
    let message = '服务异常，请稍后重试';
    try {
      const data = (await response.json()) as Result<unknown>;
      if (data && typeof data.message === 'string' && data.message) {
        message = data.message;
      }
    } catch {
      // keep fallback
    }
    showToast(message, 'error');
    return false;
  }

  // Unexpected non-CSV, non-JSON body
  if (!contentType.includes('text/csv') && !response.ok) {
    const message = '服务异常，请稍后重试';
    showToast(message, 'error');
    return false;
  }

  // CSV stream -> trigger download
  try {
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(
      new Blob([blob], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${tab}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    return true;
  } catch {
    showToast('导出失败，请稍后重试', 'error');
    return false;
  }
}
