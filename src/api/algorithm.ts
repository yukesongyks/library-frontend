import axios from 'axios';
import type { ApiResponse, HelloWorldData, HashData, BubbleSortData } from '../types/algorithm';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export async function fetchHelloWorld(): Promise<ApiResponse<HelloWorldData>> {
  const { data } = await api.get<ApiResponse<HelloWorldData>>('/helloworld');
  return data;
}

export async function fetchHash(input: string, algorithm?: string): Promise<ApiResponse<HashData>> {
  const { data } = await api.post<ApiResponse<HashData>>('/hash', { input, algorithm });
  return data;
}

export async function fetchBubbleSort(array: number[]): Promise<ApiResponse<BubbleSortData>> {
  const { data } = await api.post<ApiResponse<BubbleSortData>>('/bubblesort', { array });
  return data;
}

export async function exportResult(
  type: string,
  data: unknown,
  format?: string
): Promise<Blob> {
  const response = await api.post('/export', { type, data, format }, { responseType: 'blob' });
  return response.data;
}