export type WhitelistType = 'IMPORT' | 'APPROVAL'

export interface WhitelistEntry {
  id: number
  type: WhitelistType
  employeeId: string
  name: string
  note: string
  addedAt: string
}

export interface WhitelistRequest {
  type: WhitelistType
  employeeId: string
  name: string
  note?: string
}

export interface BatchWhitelistRequest {
  type: WhitelistType
  entries: { employeeId: string; name: string; note?: string }[]
}

export const WHITELIST_TYPE_OPTIONS: { label: string; value: WhitelistType }[] = [
  { label: '导入白名单', value: 'IMPORT' },
  { label: '审批白名单', value: 'APPROVAL' },
]