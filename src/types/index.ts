export interface AlgoResult {
  apiName: string
  input: number[] | string | null
  output: string | number[]
  durationMs: number
}

/**
 * M6: 统一格式化输出——数组用 join(', ')，其他用 String。
 */
export function formatOutput(output: string | number[] | null | undefined): string {
  if (output == null) return ''
  if (Array.isArray(output)) return output.join(', ')
  return String(output)
}

export interface CallStatRow {
  dimension: 'userType' | 'userLevel' | 'department'
  value: string
  count: number
}

export type CallStats = Record<string, CallStatRow[]>
