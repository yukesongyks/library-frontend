import { request } from "@/api/client";
import type { Dimension, MetricsData } from "@/types/api";

export function getMetrics(dimension: Dimension, range?: string): Promise<MetricsData> {
  const params = new URLSearchParams({ dimension });
  if (range) {
    params.set("range", range);
  }
  return request<MetricsData>(`/metrics/calls?${params.toString()}`);
}
