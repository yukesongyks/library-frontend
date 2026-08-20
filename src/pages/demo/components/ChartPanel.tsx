import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { AnalyticsData } from '../../../types/demo';

interface ChartPanelProps {
  chartType: 'line' | 'pie' | 'bar';
  data: AnalyticsData;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ chartType, data }) => {
  const option = useMemo(() => {
    if (chartType === 'pie') {
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
          {
            name: '调用次数',
            type: 'pie',
            radius: '60%',
            data: data.groups.map((g) => ({ name: g.name, value: g.count })),
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
            },
          },
        ],
      };
    }

    if (chartType === 'bar') {
      return {
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: data.groups.map((g) => g.name),
        },
        yAxis: { type: 'value', name: '调用次数' },
        series: [
          {
            name: '调用次数',
            type: 'bar',
            data: data.groups.map((g) => g.count),
            itemStyle: { color: '#1890ff' },
          },
        ],
      };
    }

    // line chart
    const allGroupNames = new Set<string>();
    data.timeSeries.forEach((ts) => {
      Object.keys(ts.groups).forEach((k) => allGroupNames.add(k));
    });
    const groupNames = Array.from(allGroupNames);
    const dates = data.timeSeries.map((ts) => ts.date);

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: groupNames },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: '调用次数' },
      series: groupNames.map((name) => ({
        name,
        type: 'line',
        data: data.timeSeries.map((ts) => ts.groups[name] || 0),
        smooth: true,
      })),
    };
  }, [chartType, data]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default ChartPanel;
