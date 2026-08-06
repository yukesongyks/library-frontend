import client from './client';
import type { ApiResponse, LoginResponse } from '../types/book';

export async function login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
  const response = await client.post('/auth/login', { username, password });
  return response.data;
}
