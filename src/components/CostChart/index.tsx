import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface CostChartProps {
  title: string;
  type: 'bar' | 'pie' | 'line';
  xData?: string[];
  series: Array<{ name: string; data: number[]; color?: string }>;
  height?: number;
}

const defaultColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

const CostChart: React.FC<CostChartProps> = ({ title, type, xData, series, height = 350 }) => {
  const option: EChartsOption = type === 'pie'
    ? {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: series[0]?.data.map((val, i) => ({
            name: xData?.[i] || `项${i + 1}`,
            value: val,
          })) || [],
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
        }],
      }
    : {
        title: { text: title, left: 'center' },
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, data: series.map(s => s.name) },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', data: xData || [] },
        yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
        series: series.map((s, i) => ({
          name: s.name,
          type: type as 'bar' | 'line',
          data: s.data,
          itemStyle: { color: s.color || defaultColors[i % defaultColors.length] },
        })),
      };

  return <ReactECharts option={option} style={{ height }} />;
};

export default CostChart;
