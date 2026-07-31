import type { ApiResponse } from "@/types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const CALLER_ID = "demo-user";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Generic fetch wrapper.
 *
 * - Base URL comes from `VITE_API_BASE_URL` (default `/api`).
 * - Always injects the `X-Caller-Id` header (default `demo-user`).
 * - Parses the unified `{ code, message?, data? }` envelope.
 * - Throws an `Error` carrying the backend `message` when `code !== 0`.
 * - On network failure (fetch rejects) throws an `Error` with a friendly message;
 *   callers surface a retry button, never a white screen.
 *
 * Returns the unwrapped `data` payload (typed `T`).
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "X-Caller-Id": CALLER_ID,
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network failure / unreachable backend.
    throw new Error(
      "Network request failed. Please check your connection and try again.",
    );
  }

  if (!res.ok) {
    // Non-2xx HTTP status — treat as transport-level failure.
    throw new Error(
      `Request failed with HTTP status ${res.status}. Please try again later.`,
    );
  }

  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error("Received an invalid response from the server.");
  }

  if (payload.code !== 0) {
    throw new Error(payload.message || `Request failed (code ${payload.code}).`);
  }

  if (payload.data === undefined || payload.data === null) {
    // Envelope succeeded but carried no data — surface as an error so callers
    // can render an empty/error state instead of crashing on null unwrapping.
    throw new Error("Server returned success but no data was provided.");
  }

  return payload.data;
}

/**
 * Blob variant for file downloads. Uses the same envelope contract for errors,
 * but returns the raw `Blob` on success so callers can trigger a download.
 */
export async function requestBlob(
  path: string,
  options: Omit<RequestInit, "body"> = {},
): Promise<Blob> {
  const { headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "X-Caller-Id": CALLER_ID,
    ...(headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
    });
  } catch {
    throw new Error("Network request failed. Please check your connection and try again.");
  }

  if (!res.ok) {
    throw new Error(`Export failed with HTTP status ${res.status}.`);
  }

  return res.blob();
}
