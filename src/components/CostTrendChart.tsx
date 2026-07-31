import ReactECharts from 'echarts-for-react'
import type { DimensionStat } from '../types/cost'

interface Props {
  data: DimensionStat[]
  loading?: boolean
}

export default function CostTrendChart({ data, loading }: Props) {
  const option = {
    title: { text: '月度成本趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map((d) => d.dimensionName) },
    yAxis: { type: 'value', name: '金额 (¥)' },
    series: [
      {
        name: '成本',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.amount),
        areaStyle: { opacity: 0.3 },
      },
    ],
    grid: { left: '8%', right: '5%', bottom: '10%' },
  }
  return <ReactECharts option={option} style={{ height: 350 }} showLoading={loading} />
}
