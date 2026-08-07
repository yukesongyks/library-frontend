/**
 * 成本统计 API 层
 *
 * 对齐系分 design.md §4.1 接口设计（W02-W07）
 * 路径与后端 Controller @RequestMapping 严格一致
 */

import { get, post, downloadBlob } from '@/utils/request'
import { triggerDownload } from '@/utils/format'
import type {
  DashboardDTO,
  DashboardVO,
  CostHumanListDTO,
  CostHumanVO,
  CostProjectListDTO,
  CostProjectVO,
  CostAggregateDTO,
  AggregateItemVO,
  ImportResultVO,
  ImportType,
  CostExportParams,
  DeptOption,
  BizLineOption,
  ProjectOption
} from '@/types/cost'

// ============ W02 Dashboard 概览 ============

/** GET /api/cost/dashboard */
export function getDashboard(params: DashboardDTO): Promise<DashboardVO> {
  return get<DashboardVO>('/cost/dashboard', { ...params })
}

// ============ W03 人力成本明细 ============

/** GET /api/cost/human/list */
export function listHuman(params: CostHumanListDTO): Promise<CostHumanVO[]> {
  return get<CostHumanVO[]>('/cost/human/list', { ...params })
}

// ============ W04 项目成本明细 ============

/** GET /api/cost/project/list */
export function listProject(params: CostProjectListDTO): Promise<CostProjectVO[]> {
  return get<CostProjectVO[]>('/cost/project/list', { ...params })
}

// ============ W05 多维度聚合 ============

/** GET /api/cost/aggregate */
export function aggregate(params: CostAggregateDTO): Promise<AggregateItemVO[]> {
  return get<AggregateItemVO[]>('/cost/aggregate', { ...params })
}

// ============ W06 Excel 导入 ============

/** POST /api/cost/import (multipart/form-data) */
export function importCost(file: File, type: ImportType): Promise<ImportResultVO> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  // axios 自动设置 Content-Type: multipart/form-data; boundary=...，手动指定会丢失 boundary
  return post<ImportResultVO>('/cost/import', formData, {
    timeout: 60000
  })
}

// ============ W07 报表导出 ============

/** GET /api/cost/export (返回文件流) */
export async function exportCost(params: CostExportParams): Promise<void> {
  const blob = await downloadBlob('/cost/export', { ...params })
  // 本地构造导出文件名（按 type+日期+format 拼接）
  const filename = buildExportFilename(params)
  triggerDownload(blob, filename)
}

/** 构造导出文件名 */
function buildExportFilename(params: CostExportParams): string {
  const date = new Date().toISOString().slice(0, 10)
  return `cost_${params.type}_${date}.${params.format}`
}

// ============ 组织实体下拉选项 ============

/** GET /api/cost/options/dept — 部门下拉 */
export function listDeptOptions(): Promise<DeptOption[]> {
  return get<DeptOption[]>('/cost/options/dept')
}

/** GET /api/cost/options/bizLine — 业务线下拉 */
export function listBizLineOptions(): Promise<BizLineOption[]> {
  return get<BizLineOption[]>('/cost/options/bizLine')
}

/** GET /api/cost/options/project — 项目下拉 */
export function listProjectOptions(): Promise<ProjectOption[]> {
  return get<ProjectOption[]>('/cost/options/project')
}

/** GET /api/cost/template/{type} — 下载导入模板 */
export async function downloadTemplate(type: ImportType): Promise<void> {
  const blob = await downloadBlob(`/cost/template/${type}`)
  triggerDownload(blob, `cost_${type}_template.xlsx`)
}
