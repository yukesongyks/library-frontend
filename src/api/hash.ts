import { request } from "@/api/client";
import type { HashData } from "@/types/api";

export function computeHash(input: string, algorithm = "sha256"): Promise<HashData> {
  return request<HashData>("/hash", {
    method: "POST",
    body: { input, algorithm },
  });
}
