import { showToast } from '../components/Toast';
import type { Result } from '../types';

const DEFAULT_TIMEOUT = 10000; // 10s, per §5.3

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

/**
 * Unified fetch wrapper for the backend Result<T> envelope.
 * - 10s timeout via AbortController (§5.3 network timeout)
 * - nonzero Result.code -> toast message + throw ApiError
 * - network/parse failure -> toast fallback + throw
 */
export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    // Network timeout / disconnect (§5.3)
    if (err instanceof DOMException && err.name === 'AbortError') {
      showToast('网络异常，请检查后端服务', 'error');
    } else {
      showToast('网络异常，请检查后端服务', 'error');
    }
    throw new ApiError(-1, '网络异常，请检查后端服务');
  } finally {
    window.clearTimeout(timer);
  }

  // HTTP 500 -> service exception fallback (§5.3)
  if (response.status >= 500) {
    // Body may be a JSON Result.error; attempt to parse for message.
    let message = '服务异常，请稍后重试';
    try {
      const data = (await response.clone().json()) as Result<unknown>;
      if (data && typeof data.message === 'string' && data.message) {
        message = data.message;
      }
    } catch {
      // not JSON -> keep fallback
    }
    showToast(message, 'error');
    throw new ApiError(50000, message);
  }

  if (!response.ok) {
    // 4xx: attempt Result error message
    let message = '服务异常，请稍后重试';
    try {
      const data = (await response.clone().json()) as Result<unknown>;
      if (data && typeof data.message === 'string' && data.message) {
        message = data.message;
      }
    } catch {
      // keep fallback
    }
    showToast(message, 'error');
    throw new ApiError(response.status, message);
  }

  // Parse Result<T> envelope
  let result: Result<T>;
  try {
    result = (await response.json()) as Result<T>;
  } catch {
    // Parse failure (§5.3)
    showToast('服务异常，请稍后重试', 'error');
    throw new ApiError(-2, '服务异常，请稍后重试');
  }

  // Nonzero Result.code -> intercept (§5.3)
  if (!result || typeof result.code !== 'number') {
    showToast('服务异常，请稍后重试', 'error');
    throw new ApiError(-2, '服务异常，请稍后重试');
  }

  if (result.code !== 0) {
    const message = result.message || '服务异常，请稍后重试';
    showToast(message, 'error');
    throw new ApiError(result.code, message);
  }

  return result.data;
}
