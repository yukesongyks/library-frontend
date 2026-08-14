import request from './request';
import { ApiResponse, PageResponse } from '../types/api';

export interface Department {
  id: number; name: string; code: string; parentId: number; status: number;
}
export interface Project {
  id: number; name: string; code: string; budget: number; deptId: number; bizLineId: number; status: number;
}
export interface BusinessLine {
  id: number; name: string; code: string; description: string; status: number;
}
export interface Employee {
  id: number; name: string; empNo: string; deptId: number; roleType: string; salary: number; status: number;
}

export const getDepartments = (): Promise<ApiResponse<Department[]>> =>
  request.get('/base/departments');
export const getProjects = (params?: { pageNum?: number; pageSize?: number }): Promise<ApiResponse<PageResponse<Project>>> =>
  request.get('/base/projects', { params: { pageNum: 1, pageSize: 1000, ...params } });
export const getBusinessLines = (): Promise<ApiResponse<BusinessLine[]>> =>
  request.get('/base/business-lines');
export const getEmployees = (params?: { deptId?: number; roleType?: string }): Promise<ApiResponse<Employee[]>> =>
  request.get('/base/employees', { params });
