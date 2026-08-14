import request from './request';
import { ApiResponse } from '../types/api';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  username: string;
  name: string;
  roles: string[];
}

export const loginApi = (params: LoginParams): Promise<ApiResponse<LoginResult>> =>
  request.post('/auth/login', params);

export const logoutApi = (): Promise<ApiResponse<null>> =>
  request.post('/auth/logout');
