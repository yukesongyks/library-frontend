import { useEffect, useState } from 'react'
import { Card, Col, Row, Select, Space, Spin, Typography } from 'antd'
import type { EChartsOption } from 'echarts'
import { fetchSummary } from '../api/cost'
import type { CostSummary } from '../api/types'
import EChart from '../components/EChart'
import StatCard from '../components/StatCard'
import { formatMoney, formatPercent } from '../utils/format'

export default function Dashboard() {
  const [year, setYear] = useState('2025')
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchSummary(year)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [year])

  const trendOption: EChartsOption | null = summary
    ? {
        tooltip: { trigger: 'axis' },
        legend: { data: ['人力成本', '项目成本'] },
        xAxis: { type: 'category', data: summary.monthlyTrend.map((m) => m.month) },
        yAxis: { type: 'value' },
        series: [
          { name: '人力成本', type: 'bar', data: summary.monthlyTrend.map((m) => m.laborCost) },
          { name: '项目成本', type: 'bar', data: summary.monthlyTrend.map((m) => m.projectCost) }
        ]
      }
    : null

  return (
    <div data-testid="dashboard">
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          成本总览 Dashboard
        </Typography.Title>
        <Select
          aria-label="年份"
          value={year}
          onChange={setYear}
          options={[
            { value: '2024', label: '2024年' },
            { value: '2025', label: '2025年' }
          ]}
          style={{ width: 120 }}
        />
      </Space>
      {loading ? <Spin data-testid="dashboard-loading" /> : null}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {summary ? (
        <>
          <Row gutter={16}>
            <Col span={6}>
              <StatCard title="总成本" value={formatMoney(summary.totalCost)} />
            </Col>
            <Col span={6}>
              <StatCard
                title="人力成本"
                value={formatMoney(summary.laborCost)}
                extra={`占比 ${formatPercent(summary.laborRatio)}`}
              />
            </Col>
            <Col span={6}>
              <StatCard
                title="项目成本"
                value={formatMoney(summary.projectCost)}
                extra={`占比 ${formatPercent(summary.projectRatio)}`}
              />
            </Col>
            <Col span={6}>
              <StatCard title="超支项目数" value={String(summary.overBudgetCount)} />
            </Col>
          </Row>
          <Card title="月度成本趋势" style={{ marginTop: 16 }}>
            {trendOption ? <EChart option={trendOption} testId="cost-trend-chart" /> : null}
          </Card>
        </>
      ) : null}
    </div>
  )
}