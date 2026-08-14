import React from 'react';
import ReactECharts from 'echarts-for-react';
import { costTypeLabel } from '../../utils/format';

interface PieChartProps {
  title: string;
  data: Array<{ costType: string; amount: number }>;
}

const PieChart: React.FC<PieChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '65%'],
      data: data.map(d => ({ name: costTypeLabel[d.costType] || d.costType, value: d.amount })),
      label: { formatter: '{b}\n{d}%' },
    }],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default PieChart;
