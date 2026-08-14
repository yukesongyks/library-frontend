import React from 'react';
import ReactECharts from 'echarts-for-react';

interface BarChartProps {
  title: string;
  data: Array<{ deptName: string; amount: number }>;
}

const BarChart: React.FC<BarChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>金额: ¥{c}' },
    xAxis: { type: 'category', data: data.map(d => d.deptName), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{ type: 'bar', data: data.map(d => d.amount), itemStyle: { borderRadius: [4, 4, 0, 0] } }],
    grid: { left: 60, right: 20, top: 40, bottom: 50 },
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default BarChart;
