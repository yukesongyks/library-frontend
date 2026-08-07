/**
 * 成本统计报表 - 常量定义
 *
 * 对齐系分 design.md §5.2.1.4 枚举与常量
 * 仓间对齐点：前端常量与后端枚举值一一对应
 */

import type {
  HumanRoleCode,
  Dimension,
  Granularity,
  CompareType,
  ExportFormat,
  ExportType,
  ImportType,
  SysRoleCode
} from '@/types/cost'

/** 系统角色 */
export const SYS_ROLE: { value: SysRoleCode; label: string }[] = [
  { value: 'ADMIN', label: '管理员' },
  { value: 'USER', label: '普通用户' }
]

/** 人力角色枚举（DEV/QA/PM/OPS） */
export const HUMAN_ROLE_OPTIONS: { value: HumanRoleCode; label: string }[] = [
  { value: 'DEV', label: '开发' },
  { value: 'QA', label: '测试' },
  { value: 'PM', label: '产品' },
  { value: 'OPS', label: '运维' }
]

/** 人力角色映射（value -> label） */
export const HUMAN_ROLE_MAP: Record<HumanRoleCode, string> = {
  DEV: '开发',
  QA: '测试',
  PM: '产品',
  OPS: '运维'
}

/** 聚合维度枚举 */
export const DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: 'dept', label: '部门' },
  { value: 'project', label: '项目' },
  { value: 'bizLine', label: '业务线' },
  { value: 'person', label: '人员' },
  { value: 'month', label: '月份' },
  { value: 'quarter', label: '季度' },
  { value: 'year', label: '年度' }
]

/** 聚合维度映射（value -> label） */
export const DIMENSION_MAP: Record<Dimension, string> = {
  dept: '部门',
  project: '项目',
  bizLine: '业务线',
  person: '人员',
  month: '月份',
  quarter: '季度',
  year: '年度'
}

/** 趋势粒度枚举 */
export const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'month', label: '按月' },
  { value: 'quarter', label: '按季' },
  { value: 'year', label: '按年' }
]

/** 对比类型枚举 */
export const COMPARE_TYPE_OPTIONS: { value: CompareType; label: string }[] = [
  { value: 'none', label: '无对比' },
  { value: 'yoy', label: '同比（YoY）' },
  { value: 'mom', label: '环比（MoM）' }
]

/** 导出格式枚举 */
export const EXPORT_FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'xlsx', label: 'Excel' },
  { value: 'csv', label: 'CSV' }
]

/** 导出类型枚举 */
export const EXPORT_TYPE_OPTIONS: { value: ExportType; label: string }[] = [
  { value: 'human', label: '人力成本明细' },
  { value: 'project', label: '项目成本明细' },
  { value: 'dashboard', label: 'Dashboard 概览' }
]

/** 导入类型枚举 */
export const IMPORT_TYPE_OPTIONS: { value: ImportType; label: string }[] = [
  { value: 'human', label: '人力成本导入' },
  { value: 'project', label: '项目成本导入' }
]

/** 月份格式正则（YYYY-MM） */
export const MONTH_REGEX = /^\d{4}-\d{2}$/

/** 文件大小上限 10MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/** API 基础路径 */
export const API_BASE = '/api'

/** Token 在 localStorage 中的 key */
export const TOKEN_KEY = 'cost_token'

/** 用户信息在 localStorage 中的 key */
export const USER_INFO_KEY = 'cost_user_info'

/** 成功响应 code */
export const SUCCESS_CODE = 0
