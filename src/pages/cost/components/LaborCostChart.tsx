import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { LaborCostVO } from '../../../types/cost';

interface Props {
  data: LaborCostVO[];
}

export default function LaborCostChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      title: { text: '人力成本分布' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['开发', '测试', '产品', '运维'] },
      xAxis: { type: 'category', data: data.map((d) => d.dimensionLabel) },
      yAxis: { type: 'value', name: '金额(元)' },
      series: [
        { name: '开发', type: 'bar', stack: 'total', data: data.map((d) => d.dev) },
        { name: '测试', type: 'bar', stack: 'total', data: data.map((d) => d.qa) },
        { name: '产品', type: 'bar', stack: 'total', data: data.map((d) => d.pm) },
        { name: '运维', type: 'bar', stack: 'total', data: data.map((d) => d.ops) },
      ],
    });
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: 400 }} />;
}
