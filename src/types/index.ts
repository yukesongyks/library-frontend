export interface AlgoResult {
  apiName: string
  input: number[] | string | null
  output: string | number[]
  durationMs: number
}

export interface CallStatRow {
  dimension: 'userType' | 'userLevel' | 'department'
  value: string
  count: number
}

export type CallStats = Record<string, CallStatRow[]>
