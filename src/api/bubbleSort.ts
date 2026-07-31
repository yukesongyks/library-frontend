import { request } from "@/api/client";
import type { BubbleSortData } from "@/types/api";

export function sortArray(array: number[]): Promise<BubbleSortData> {
  return request<BubbleSortData>("/bubble-sort", {
    method: "POST",
    body: { array },
  });
}
