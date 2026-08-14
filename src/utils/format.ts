export function formatMoney(value: number | undefined | null): string {
  if (value == null) return '¥0.00';
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return '0%';
  return `${value.toFixed(2)}%`;
}

export function getYearMonthRange(year: number): { start: string; end: string } {
  return { start: `${year}-01`, end: `${year}-12` };
}
