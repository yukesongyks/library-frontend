/**
 * 成本统计报表 - 类型定义
 *
 * 对齐系分 design.md §4 接口设计（W01-W07）
 * 后端响应结构 ApiResponse{code, message, data}
 */

/** 统一响应结构（与后端 ApiResponse 对齐） */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 角色枚举（系统登录角色） */
export type SysRoleCode = 'ADMIN' | 'USER'

/** 人力角色枚举（DEV/QA/PM/OPS） */
export type HumanRoleCode = 'DEV' | 'QA' | 'PM' | 'OPS'

/** 聚合维度枚举 */
export type Dimension = 'dept' | 'project' | 'bizLine' | 'person' | 'month' | 'quarter' | 'year'

/** 趋势粒度枚举 */
export type Granularity = 'month' | 'quarter' | 'year'

/** 对比类型枚举 */
export type CompareType = 'none' | 'yoy' | 'mom'

/** 导出格式枚举 */
export type ExportFormat = 'xlsx' | 'csv'

/** 导出类型枚举 */
export type ExportType = 'human' | 'project' | 'dashboard'

/** 导入类型枚举 */
export type ImportType = 'human' | 'project'

/** 可空数值（BigDecimal 在 TS 侧以 number 表示，null 表示后端除零/无数据） */
export type NullableNumber = number | null

// ============ W01 登录 ============

/** W01 登录入参 */
export interface LoginDTO {
  username: string
  password: string
}

/** W01 登录出参 */
export interface LoginVO {
  token: string
  roleCode: SysRoleCode
  userId: number
  username: string
}

// ============ W02 Dashboard ============

/** W02 Dashboard 入参 */
export interface DashboardDTO {
  startMonth: string
  endMonth: string
  granularity?: Granularity
}

/** 趋势图数据点 */
export interface TrendPointVO {
  period: string
  humanCost: number
  projectCost: number
  totalCost: number
  yoyGrowthRate: NullableNumber
  momGrowthRate: NullableNumber
}

/** 聚合项（维度分布） */
export interface AggregateItemVO {
  label: string
  amount: number
  ratio: number
}

/** W02 Dashboard 出参 */
export interface DashboardVO {
  totalHumanCost: number
  totalProjectCost: number
  totalBudget: number
  totalOverrun: number
  yoyGrowthRate: NullableNumber
  momGrowthRate: NullableNumber
  trend: TrendPointVO[]
  distribution: AggregateItemVO[]
}

// ============ W03 人力成本明细 ============

/** W03 人力成本明细入参 */
export interface CostHumanListDTO {
  deptId?: number
  projectId?: number
  bizLineId?: number
  personName?: string
  roleCode?: HumanRoleCode
  startMonth?: string
  endMonth?: string
  compareType?: CompareType
}

/** W03 人力成本明细出参 */
export interface CostHumanVO {
  /** 主键（后端新增字段，用于 el-table 行键唯一标识；旧接口可能不返回） */
  id?: number
  deptName: string | null
  projectName: string | null
  bizLineName: string | null
  personName: string
  costPeriod: string
  roleCode: HumanRoleCode
  costAmount: number
  personMonths: NullableNumber
  avgCostPerPerson: NullableNumber
  yoyGrowthRate: NullableNumber
  momGrowthRate: NullableNumber
}

// ============ W04 项目成本明细 ============

/** W04 项目成本明细入参 */
export interface CostProjectListDTO {
  deptId?: number
  projectId?: number
  bizLineId?: number
  startMonth?: string
  endMonth?: string
  onlyOverrun?: boolean
}

/** W04 项目成本明细出参 */
export interface CostProjectVO {
  projectName: string
  deptName: string | null
  bizLineName: string | null
  costPeriod: string
  budget: NullableNumber
  actualCost: NullableNumber
  progressPercent: NullableNumber
  budgetRatio: NullableNumber
  estimatedFinalCost: NullableNumber
  estimatedOverrun: NullableNumber
  isOverrun: boolean
  yoyGrowthRate: NullableNumber
  momGrowthRate: NullableNumber
}

// ============ W05 多维度聚合 ============

/** W05 多维度聚合入参 */
export interface CostAggregateDTO {
  dimension: Dimension
  deptId?: number
  projectId?: number
  bizLineId?: number
  startMonth?: string
  endMonth?: string
}

// ============ W06 导入 ============

/** W06 导入结果出参 */
export interface ImportResultVO {
  success: number
  failed: number
  overwritten: number
  errors: string[]
  message: string
}

// ============ 组织实体（下拉选项） ============

/** 部门选项 */
export interface DeptOption {
  id: number
  deptName: string
  deptCode: string
}

/** 业务线选项 */
export interface BizLineOption {
  id: number
  bizLineName: string
  bizLineCode: string
}

/** 项目选项 */
export interface ProjectOption {
  id: number
  projectName: string
  projectCode: string | null
}

// ============ 导出参数（复用 W03/W04/W05 筛选） ============

/** 导出请求参数 */
export interface CostExportParams {
  type: ExportType
  format: ExportFormat
  deptId?: number
  projectId?: number
  bizLineId?: number
  personName?: string
  roleCode?: HumanRoleCode
  startMonth?: string
  endMonth?: string
  compareType?: CompareType
  onlyOverrun?: boolean
  dimension?: Dimension
  granularity?: Granularity
}
