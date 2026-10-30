import React, { useState, useEffect, useCallback } from 'react'
import { Card, Select, DatePicker, Button, Space, Radio, Spin, Empty, Typography } from 'antd'
import ReactECharts from 'echarts-for-react'
import { fetchStats } from '../api/demoApi'
import type { StatsDimension, ChartType, StatsItem } from '../types/demo'

const { Text } = Typography
const { RangePicker } = DatePicker

const DIMENSION_OPTIONS: { label: string; value: StatsDimension }[] = [
  { label: '人员类型', value: 'userType' },
  { label: '人员层级', value: 'level' },
  { label: '人员部门', value: 'department' },
]

const CHART_OPTIONS: { label: string; value: ChartType }[] = [
  { label: '柱状图', value: 'BAR' },
  { label: '折线图', value: 'LINE' },
  { label: '饼图', value: 'PIE' },
]

interface Props {
  apiNameFilter?: string
}

const StatsChart: React.FC<Props> = ({ apiNameFilter }) => {
  const [dimension, setDimension] = useState<StatsDimension>('userType')
  const [chartType, setChartType] = useState<ChartType>('BAR')
  const [dates, setDates] = useState<[string, string] | null>(null)
  const [data, setData] = useState<StatsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { dimension: StatsDimension; startDate: string; endDate: string; apiName?: string } = {
        dimension,
        startDate: dates?.[0] || '2026-01-01',
        endDate: dates?.[1] || '2026-12-31',
      }
      if (apiNameFilter) params.apiName = apiNameFilter
      const resp = await fetchStats(params)
      if (resp.code === 200) {
        setData(resp.data.items || [])
      } else {
        setError(resp.message)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [dimension, dates, apiNameFilter])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const getChartOption = () => {
    const labels = data.map((d) => d.label)
    const values = data.map((d) => d.count)

    if (chartType === 'PIE') {
      return {
        tooltip: { trigger: 'item' as const },
        series: [
          {
            type: 'pie' as const,
            radius: ['40%', '70%'],
            data: data.map((d) => ({ name: d.label, value: d.count })),
            label: { show: true, formatter: '{b}: {c}' },
          },
        ],
      }
    }

    return {
      tooltip: { trigger: 'axis' as const },
      xAxis: { type: 'category' as const, data: labels },
      yAxis: { type: 'value' as const },
      series: [
        {
          type: chartType === 'LINE' ? 'line' : 'bar',
          data: values,
          smooth: chartType === 'LINE',
          itemStyle: { color: '#1677ff' },
        },
      ],
    }
  }

  return (
    <Card title="调用统计报表" style={{ marginTop: 16 }}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Text strong>维度：</Text>
        <Select options={DIMENSION_OPTIONS} value={dimension} onChange={setDimension} style={{ width: 140 }} />
        <Text strong>图表：</Text>
        <Radio.Group
          options={CHART_OPTIONS}
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          optionType="button"
        />
        <Text strong>日期：</Text>
        <RangePicker
          onChange={(_, dateStrings) => setDates(dateStrings as [string, string])}
          style={{ width: 260 }}
        />
        <Button onClick={loadStats} loading={loading}>
          刷新
        </Button>
      </Space>
      {loading ? (
        <Spin style={{ display: 'block', textAlign: 'center', padding: 48 }} />
      ) : error ? (
        <Text type="danger">{error}</Text>
      ) : data.length === 0 ? (
        <Empty description="暂无数据" />
      ) : (
        <ReactECharts option={getChartOption()} style={{ height: 350 }} />
      )}
    </Card>
  )
}

export default StatsChart