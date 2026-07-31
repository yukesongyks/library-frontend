import { useState } from 'react'
import { Card, Table, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import DimensionFilter from '../components/DimensionFilter'
import CostTrendChart from '../components/CostTrendChart'
import RoleCostPie from '../components/RoleCostPie'
import { useCostSummary, useCostByRole } from '../hooks/useCostData'
import { exportSummaryUrl } from '../api/costApi'
import type { CostQueryRequest, DimensionStat } from '../types/cost'

export default function CostAnalysis() {
  const { summary, loading, fetch } = useCostSummary()
  const { roles } = useCostByRole()
  const [trendData, setTrendData] = useState<DimensionStat[]>([])

  const handleSearch = (params: CostQueryRequest) => {
    fetch(params)
    if (summary?.byMonth) setTrendData(summary.byMonth)
  }

  const handleExport = (params: CostQueryRequest) => {
    window.open(exportSummaryUrl(params), '_blank')
  }

  const columns: ColumnsType<DimensionStat> = [
    { title: '维度', dataIndex: 'dimensionName', key: 'dimensionName' },
    { title: '金额 (¥)', dataIndex: 'amount', key: 'amount', render: (v: number) => v.toFixed(2) },
    {
      title: '占比 (%)',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (v: number) => v.toFixed(2),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <h2>成本统计分析</h2>
      <Card style={{ marginBottom: 16 }}>
        <DimensionFilter onSearch={handleSearch} onExport={handleExport} />
      </Card>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="部门维度">
            <Table
              columns={columns}
              dataSource={summary?.byDepartment ?? []}
              rowKey="dimensionName"
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="月度维度">
            <Table
              columns={columns}
              dataSource={summary?.byMonth ?? []}
              rowKey="dimensionName"
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card>
            <CostTrendChart data={trendData} loading={loading} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <RoleCostPie data={roles} loading={loading} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
