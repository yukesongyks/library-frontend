import client from './client';
import type { HelloWorldResult } from '../types/algorithm';

export async function getHelloWorld(name?: string): Promise<HelloWorldResult> {
  return client.get('/helloworld', { params: { name } });
}