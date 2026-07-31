import { useApiResult } from "@/hooks/useApiResult";
import { getMetrics } from "@/api/metrics";
import type { Dimension, MetricsData } from "@/types/api";

/**
 * Metrics data hook. Re-fetches whenever the selected dimension changes.
 */
export function useMetrics(dimension: Dimension) {
  const fetcher = () => getMetrics(dimension);
  return useApiResult<MetricsData>(fetcher, [dimension]);
}
