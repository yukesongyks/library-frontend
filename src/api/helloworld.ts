import { request } from "@/api/client";
import type { HelloWorldData } from "@/types/api";

export function getHelloWorld(): Promise<HelloWorldData> {
  return request<HelloWorldData>("/helloworld");
}
