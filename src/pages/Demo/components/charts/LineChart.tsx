import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { TrendSeries } from '../../types/demo';

interface LineChartProps {
  series: TrendSeries[];
}

const API_LABELS: Record<string, string> = {
  HELLOWORLD: 'HelloWorld',
  HASH: '哈希算法',
  BUBBLE_SORT: '冒泡排序',
};

const LineChart: React.FC<LineChartProps> = ({ series }) => {
  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: {
      data: series.map((s) => API_LABELS[s.apiType] || s.apiType),
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: series[0]?.points.map((p) => p.date) || [],
    },
    yAxis: { type: 'value' as const, name: '调用次数' },
    series: series.map((s) => ({
      name: API_LABELS[s.apiType] || s.apiType,
      type: 'line',
      smooth: true,
      data: s.points.map((p) => p.count),
    })),
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default LineChart;
