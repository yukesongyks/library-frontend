import { useCallback, useEffect, useRef, useState } from "react";

export interface UseApiResult<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  retry: () => void;
}

/**
 * Generic async-data hook.
 *
 * - Runs the fetcher on mount and whenever `retry` is called.
 * - On failure: keeps the last successful `data`, sets `error`, and exposes
 *   `retry` so the UI can render an error state plus a retry button (no white
 *   screen).
 * - `loading` is true only while a request is in flight and no data has been
 *   received yet for the current attempt.
 */
export function useApiResult<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [attempt, setAttempt] = useState<number>(0);

  // Stringify deps to compare by value in the effect dependency list. This lets
  // callers pass fresh closure fetchers without retriggering on every render,
  // while still re-fetching when a real dependency (e.g. a dimension) changes.
  const depsKey = JSON.stringify(deps);

  // Keep the latest fetcher in a ref so changing the function identity between
  // renders (e.g. inline closures) does not re-trigger the effect.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [attempt, depsKey]);

  return { loading, error, data, retry };
}
