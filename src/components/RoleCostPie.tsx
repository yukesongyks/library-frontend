import ReactECharts from 'echarts-for-react'
import type { DimensionStat } from '../types/cost'

const ROLE_LABELS: Record<string, string> = {
  DEVELOPER: '开发',
  TESTER: '测试',
  PRODUCT: '产品',
  OPS: '运维',
}

interface Props {
  data: DimensionStat[]
  loading?: boolean
}

export default function RoleCostPie({ data, loading }: Props) {
  const option = {
    title: { text: '人力成本（按角色）', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: data.map((d) => ({
          name: ROLE_LABELS[d.dimensionName] ?? d.dimensionName,
          value: d.amount,
        })),
        label: { show: true, formatter: '{b}: {d}%' },
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: 350 }} showLoading={loading} />
}
