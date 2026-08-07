/**
 * 格式化工具
 */

import dayjs from 'dayjs'
import type { NullableNumber } from '@/types/cost'

/** 金额格式化（千分位 + 2 位小数），null/undefined 返回 "-" */
export function formatMoney(val: NullableNumber | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return '-'
  }
  return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 百分比格式化（保留 2 位小数 + %），null 返回 "-" */
export function formatPercent(val: NullableNumber | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return '-'
  }
  return `${val.toFixed(2)}%`
}

/** 增长率格式化（正数加 +），null 返回 "-" */
export function formatGrowthRate(val: NullableNumber | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return '-'
  }
  const prefix = val > 0 ? '+' : ''
  return `${prefix}${val.toFixed(2)}%`
}

/** 月份格式校验 YYYY-MM */
export function isValidMonth(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month)
}

/** 获取当前月份 YYYY-MM */
export function currentMonth(): string {
  return dayjs().format('YYYY-MM')
}

/** 获取 N 个月前的月份 YYYY-MM */
export function monthsAgo(n: number): string {
  return dayjs().subtract(n, 'month').format('YYYY-MM')
}

/** 获取当前年份 */
export function currentYear(): string {
  return dayjs().format('YYYY')
}

/** 月份转季度（对齐后端 PeriodUtil.toQuarter: Q1=01-03月） */
export function monthToQuarter(month: string): string {
  if (!isValidMonth(month)) return ''
  const m = parseInt(month.split('-')[1], 10)
  const quarter = Math.ceil(m / 3)
  const year = month.split('-')[0]
  return `${year}-Q${quarter}`
}

/** 月份转年度 */
export function monthToYear(month: string): string {
  if (!isValidMonth(month)) return ''
  return month.split('-')[0]
}

/** 触发浏览器下载 Blob */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/** 根据 Content-Disposition 提取文件名 */
export function parseFilenameFromDisposition(disposition: string | undefined): string {
  if (!disposition) return 'export'
  const match = /filename\*?=(?:UTF-8'')?([^;]+)/i.exec(disposition)
  if (match) {
    try {
      return decodeURIComponent(match[1].replace(/['"]/g, ''))
    } catch {
      return match[1].replace(/['"]/g, '')
    }
  }
  return 'export'
}
