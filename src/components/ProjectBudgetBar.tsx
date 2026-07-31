import ReactECharts from 'echarts-for-react'
import type { ProjectCost } from '../types/cost'

interface Props {
  data: ProjectCost[]
  loading?: boolean
}

export default function ProjectBudgetBar({ data, loading }: Props) {
  const option = {
    title: { text: '项目预算 vs 实际消耗', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: data.map((d) => d.projectName) },
    yAxis: { type: 'value', name: '金额 (¥)' },
    series: [
      { name: '预算', type: 'bar', data: data.map((d) => d.budgetAmount ?? 0) },
      { name: '实际消耗', type: 'bar', data: data.map((d) => d.actualCost) },
    ],
    grid: { left: '10%', right: '5%', bottom: '15%' },
  }
  return <ReactECharts option={option} style={{ height: 350 }} showLoading={loading} />
}
