import axios, { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  HelloWorldRequest,
  HelloWorldData,
  HashRequest,
  HashData,
  BubbleSortRequest,
  BubbleSortData,
  AnalyticsParams,
  AnalyticsData,
  UserContext,
} from '../types/demo';

// Default user context (demo mode)
let currentUserContext: UserContext = {
  userId: 'U001',
  userName: '张三',
  userType: '正式',
  userLevel: 'P6',
  userDept: '技术部',
};

export function setUserContext(ctx: UserContext) {
  currentUserContext = ctx;
}

export function getUserContext(): UserContext {
  return currentUserContext;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/demo',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject user headers
apiClient.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = currentUserContext.userId;
  config.headers['X-User-Name'] = currentUserContext.userName;
  config.headers['X-User-Type'] = currentUserContext.userType;
  config.headers['X-User-Level'] = currentUserContext.userLevel;
  config.headers['X-User-Dept'] = currentUserContext.userDept;
  return config;
});

// === API Functions ===

export async function callHelloWorld(params: HelloWorldRequest): Promise<ApiResponse<HelloWorldData>> {
  const { data } = await apiClient.post<ApiResponse<HelloWorldData>>('/helloworld', params);
  return data;
}

export async function callHash(params: HashRequest): Promise<ApiResponse<HashData>> {
  const { data } = await apiClient.post<ApiResponse<HashData>>('/hash', params);
  return data;
}

export async function callBubbleSort(params: BubbleSortRequest): Promise<ApiResponse<BubbleSortData>> {
  const { data } = await apiClient.post<ApiResponse<BubbleSortData>>('/bubble-sort', params);
  return data;
}

export async function exportData(type: 'helloworld' | 'hash' | 'bubble-sort', recordIds?: number[]): Promise<void> {
  const response = await apiClient.post('/export', { type, recordIds }, { responseType: 'blob' });
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}_export.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function fetchAnalytics(params: AnalyticsParams): Promise<ApiResponse<AnalyticsData>> {
  const { data } = await apiClient.get<ApiResponse<AnalyticsData>>('/analytics', { params });
  return data;
}
