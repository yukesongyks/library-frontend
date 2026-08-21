import { useCallback, useEffect, useState } from 'react'
import { Button, Select, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { EChartsOption } from 'echarts'
import { buildExportUrl, fetchAnalysis } from '../api/cost'
import { DIMENSION_LABELS, ROLES, ROLE_LABELS } from '../api/types'
import type { AnalysisQuery, CostAnalysisItem, Dimension } from '../api/types'
import EChart from '../components/EChart'
import { formatMoney, formatPercent } from '../utils/format'

export default function CostAnalysis() {
  const [dimension, setDimension] = useState<Dimension>('department')
  const [year, setYear] = useState('2025')
  const [role, setRole] = useState<string | undefined>(undefined)
  const [rows, setRows] = useState<CostAnalysisItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const query: AnalysisQuery = { dimension, year, role }

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchAnalysis(query)
      .then((resp) => setRows(resp.records))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension, year, role])

  useEffect(() => {
    load()
  }, [load])

  const columns: ColumnsType<CostAnalysisItem> = [
    { title: DIMENSION_LABELS[dimension], dataIndex: 'name', key: 'name' },
    {
      title: '人力成本',
      dataIndex: 'laborCost',
      key: 'laborCost',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '项目预算',
      dataIndex: 'projectBudget',
      key: 'projectBudget',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '实际消耗',
      dataIndex: 'projectActual',
      key: 'projectActual',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '预算占比',
      dataIndex: 'budgetRatio',
      key: 'budgetRatio',
      render: (v: number) => formatPercent(v)
    },
    {
      title: '预计超支金额',
      dataIndex: 'overBudgetAmount',
      key: 'overBudgetAmount',
      render: (v: number) => formatMoney(v)
    }
  ]

  const chartOption: EChartsOption | null =
    rows.length > 0
      ? {
          tooltip: { trigger: 'axis' },
          legend: { data: ['人力成本', '实际消耗'] },
          xAxis: { type: 'category', data: rows.slice(0, 10).map((r) => r.name) },
          yAxis: { type: 'value' },
          series: [
            { name: '人力成本', type: 'bar', data: rows.slice(0, 10).map((r) => r.laborCost) },
            { name: '实际消耗', type: 'bar', data: rows.slice(0, 10).map((r) => r.projectActual) }
          ]
        }
      : null

  return (
    <div data-testid="cost-analysis">
      <Space style={{ marginBottom: 16 }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          成本统计分析
        </Typography.Title>
        <Select
          aria-label="维度"
          value={dimension}
          onChange={(v: Dimension) => setDimension(v)}
          options={Object.entries(DIMENSION_LABELS).map(([value, label]) => ({ value, label }))}
          style={{ width: 120 }}
        />
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
        <Select
          aria-label="岗位角色"
          value={role}
          onChange={setRole}
          allowClear
          placeholder="全部角色"
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          style={{ width: 140 }}
        />
        <Button type="primary" onClick={load}>
          查询
        </Button>
        <Button>
          <a href={buildExportUrl(query, 'xlsx')} download>
            导出 Excel
          </a>
        </Button>
        <Button>
          <a href={buildExportUrl(query, 'csv')} download>
            导出 CSV
          </a>
        </Button>
      </Space>
      {loading ? <Spin data-testid="analysis-loading" /> : null}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {chartOption ? <EChart option={chartOption} testId="analysis-chart" /> : null}
      <Table
        rowKey={(r) => r.name}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        style={{ marginTop: 16 }}
      />
    </div>
  )
}