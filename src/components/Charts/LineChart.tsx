import React from 'react';
import ReactECharts from 'echarts-for-react';

interface LineChartProps {
  title: string;
  data: Array<{ period: string; amount: number }>;
}

const LineChart: React.FC<LineChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>金额: ¥{c}' },
    xAxis: { type: 'category', data: data.map(d => d.period) },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{ type: 'line', data: data.map(d => d.amount), smooth: true, areaStyle: { opacity: 0.15 } }],
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default LineChart;
