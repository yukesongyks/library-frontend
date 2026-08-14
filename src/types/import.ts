export interface ImportResult {
  successCount: number
  failureCount: number
  failures: ImportFailure[]
}

export interface ImportFailure {
  row: number
  error: string
}

export interface ImportPreview {
  totalRows: number
  validRows: number
  invalidRows: number
  preview: Record<string, any>[]
}