import { useEffect, useRef, useState } from 'react'
import { Card, Spin, Segmented, Button, Select, Space, message } from 'antd'
import * as echarts from 'echarts'
import { fetchStats, getUserId, setUserId } from '../api'
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

// M5: 提供用户切换选项，让报表维度有多样性
const USER_OPTIONS = [
  { label: '张三 (U001/学生)', value: 'U001' },
  { label: '李四 (U002/教师)', value: 'U002' },
  { label: '王五 (U003/管理员)', value: 'U003' },
  { label: '赵六 (U004/学生)', value: 'U004' },
  { label: '钱七 (U005/教师)', value: 'U005' },
]

export default function CallReport() {
  const [stats, setStats] = useState<CallStats | null>(null)
  const [dim, setDim] = useState<string>('userType')
  const [chartType, setChartType] = useState<string>('bar')
  const [loading, setLoading] = useState(false)
  // P3-9: 用 useState 管理 userId，符合 React 响应式模式
  const [userId, setUserIdState] = useState<string>(getUserId())
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // m2: 加载报表带错误处理
  const loadStats = () => {
    setLoading(true)
    fetchStats()
      .then(setStats)
      .catch(() => message.error('报表加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStats()
  }, [])

  // M4: 组件卸载时销毁 ECharts 实例，防止内存泄漏
  // P3-10: 监听 window resize，图表自适应窗口大小
  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
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
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          options={USER_OPTIONS}
          value={userId}
          onChange={(v) => { setUserId(v); setUserIdState(v); loadStats() }}
          style={{ width: 220 }}
        />
        <Button onClick={loadStats} loading={loading}>刷新</Button>
      </Space>
      <Spin spinning={loading && !stats}>
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
