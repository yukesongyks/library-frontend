import client from './client';
import type { BubbleSortResult } from '../types/algorithm';

export async function bubbleSort(array: number[], order?: string): Promise<BubbleSortResult> {
  return client.post('/bubblesort', { array, order });
}