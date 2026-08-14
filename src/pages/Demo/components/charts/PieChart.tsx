import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { SummaryItem } from '../../types/demo';

interface PieChartProps {
  items: SummaryItem[];
  title?: string;
}

const PieChart: React.FC<PieChartProps> = ({ items, title = '调用分布' }) => {
  const option = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} ({d}%)',
    },
    legend: { orient: 'vertical' as const, left: 'left' },
    title: { text: title, left: 'center' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: items.map((item) => ({
          name: item.label,
          value: item.count,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default PieChart;
