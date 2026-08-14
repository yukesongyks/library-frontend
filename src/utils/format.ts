export const formatMoney = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const roleTypeLabel: Record<string, string> = {
  dev: '开发', test: '测试', product: '产品', ops: '运维',
};

export const costTypeLabel: Record<string, string> = {
  labor: '人力成本', infra: '基础设施', license: '许可证', travel: '差旅', other: '其他',
};
