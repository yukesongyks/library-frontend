import { useEffect, useRef, useState } from 'react'
import { Card, Spin, Segmented } from 'antd'
import * as echarts from 'echarts'
import { fetchStats } from '../api'
import type { CallStats } from '../types'

const DIM_LABELS: Record<string, string> = {
  userType: '人员类型',
  userLevel: '人员层级',
  department: '部门',
}

const CHART_LABELS: Record<string, string> = {
  line: '折线图',
  pie: '饼图',
  bar: '柱状图',
}

export default function CallReport() {
  const [stats, setStats] = useState<CallStats | null>(null)
  const [dim, setDim] = useState<string>('userType')
  const [chartType, setChartType] = useState<string>('bar')
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    fetchStats().then(setStats)
  }, [])

  useEffect(() => {
    if (!chartRef.current || !stats) return
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }
    const rows = stats[dim] || []
    const names = rows.map((r) => r.value)
    const counts = rows.map((r) => r.count)

    let option: echarts.EChartsOption
    if (chartType === 'pie') {
      option = {
        title: { text: `${DIM_LABELS[dim]} - 调用次数占比`, left: 'center' },
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            radius: '60%',
            data: rows.map((r) => ({ name: r.value, value: r.count })),
          },
        ],
      }
    } else {
      option = {
        title: { text: `${DIM_LABELS[dim]} - 调用次数`, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: names },
        yAxis: { type: 'value' },
        series: [
          {
            type: chartType === 'line' ? 'line' : 'bar',
            data: counts,
          },
        ],
      }
    }
    chartInstance.current.setOption(option, true)
  }, [stats, dim, chartType])

  return (
    <Card title="调用情况报表" style={{ marginTop: 24 }}>
      <Spin spinning={!stats}>
        <Segmented
          options={Object.keys(DIM_LABELS).map((k) => ({ label: DIM_LABELS[k], value: k }))}
          value={dim}
          onChange={(v) => setDim(v as string)}
          style={{ marginBottom: 16 }}
        />
        <Segmented
          options={Object.keys(CHART_LABELS).map((k) => ({ label: CHART_LABELS[k], value: k }))}
          value={chartType}
          onChange={(v) => setChartType(v as string)}
          style={{ marginBottom: 16 }}
        />
        <div ref={chartRef} style={{ width: '100%', height: 400 }} />
      </Spin>
    </Card>
  )
}
