import { describe, expect, it } from 'vitest'
import { formatMoney, formatPercent } from './format'

describe('formatMoney', () => {
  it('格式化金额为人民币两位小数', () => {
    expect(formatMoney(2004000)).toBe('¥2,004,000.00')
    expect(formatMoney(80000)).toBe('¥80,000.00')
  })

  it('空值与 NaN 显示占位符', () => {
    expect(formatMoney(null)).toBe('-')
    expect(formatMoney(undefined)).toBe('-')
    expect(formatMoney(Number.NaN)).toBe('-')
  })
})

describe('formatPercent', () => {
  it('保留两位小数的百分比', () => {
    expect(formatPercent(66.25)).toBe('66.25%')
    expect(formatPercent(10)).toBe('10.00%')
  })

  it('空值显示占位符', () => {
    expect(formatPercent(undefined)).toBe('-')
  })
})