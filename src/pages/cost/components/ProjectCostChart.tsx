import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { ProjectCostVO } from '../../../types/cost';

interface Props {
  data: ProjectCostVO[];
}

export default function ProjectCostChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      title: { text: '项目成本对比' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['预算', '实际消耗', '预计超支'] },
      xAxis: { type: 'category', data: data.map((d) => d.projectName) },
      yAxis: { type: 'value', name: '金额(元)' },
      series: [
        { name: '预算', type: 'bar', data: data.map((d) => d.budget) },
        { name: '实际消耗', type: 'bar', data: data.map((d) => d.actualCost) },
        { name: '预计超支', type: 'bar', data: data.map((d) => d.estimatedOverspend) },
      ],
    });
    return () => chart.dispose();
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: 400 }} />;
}
