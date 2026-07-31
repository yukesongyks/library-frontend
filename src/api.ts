const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export interface HashResult {
  algorithm: string;
  input: string;
  hash: string;
}

export interface BubbleSortResult {
  input: number[];
  sorted: number[];
  steps: number;
}

export interface MetricItem {
  label: string;
  value: number;
}

export type TabName = "helloworld" | "hash" | "bubble-sort";
export type Dimension = "userType" | "userLevel" | "department" | "apiName";
export type ChartType = "line" | "pie" | "bar";

export async function fetchHelloWorld(userId?: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (userId) headers["X-User-Id"] = userId;
  const res = await fetch(`${API_BASE}/api/hello-world`, { headers });
  const json = await res.json();
  return json.result;
}

export async function fetchHash(algorithm: string, input: string): Promise<HashResult> {
  const res = await fetch(`${API_BASE}/api/hash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ algorithm, input }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "哈希计算失败");
  }
  return res.json();
}

export async function fetchBubbleSort(numbers: number[]): Promise<BubbleSortResult> {
  const res = await fetch(`${API_BASE}/api/bubble-sort`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numbers }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "排序失败");
  }
  return res.json();
}

export async function exportTab(tab: TabName, format: "csv" | "json"): Promise<Blob> {
  const res = await fetch(
    `${API_BASE}/api/export?tab=${tab}&format=${format}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "导出失败");
  }
  return res.blob();
}

export async function fetchMetrics(
  dimension: Dimension,
  chartType: ChartType
): Promise<MetricItem[]> {
  const res = await fetch(
    `${API_BASE}/api/metrics/summary?dimension=${dimension}&chartType=${chartType}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "获取报表数据失败");
  }
  return res.json();
}
