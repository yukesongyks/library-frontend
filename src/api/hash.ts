import client from './client';
import type { HashResult } from '../types/algorithm';

export async function computeHash(input: string, algorithm?: string): Promise<HashResult> {
  return client.post('/hash', { input, algorithm });
}