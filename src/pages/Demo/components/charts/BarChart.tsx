import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { SummaryItem } from '../../types/demo';

interface BarChartProps {
  items: SummaryItem[];
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ items, title = '调用次数对比' }) => {
  const option = {
    tooltip: { trigger: 'axis' as const },
    title: { text: title, left: 'center' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: items.map((item) => item.label),
      axisLabel: { rotate: items.length > 5 ? 30 : 0 },
    },
    yAxis: { type: 'value' as const, name: '调用次数' },
    series: [
      {
        type: 'bar',
        data: items.map((item) => item.count),
        itemStyle: {
          color: '#1890ff',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default BarChart;
