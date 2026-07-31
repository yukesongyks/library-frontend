import { useEffect, useState } from 'react'
import { Row, Col, Card } from 'antd'
import StatCard from '../components/StatCard'
import CostTrendChart from '../components/CostTrendChart'
import RoleCostPie from '../components/RoleCostPie'
import ProjectBudgetBar from '../components/ProjectBudgetBar'
import {
  useCostSummary,
  useMonthlyTrend,
  useProjectCost,
  useCostByRole,
} from '../hooks/useCostData'

export default function Dashboard() {
  const { summary, loading, fetch: fetchSummary } = useCostSummary()
  const { trend, fetch: fetchTrend } = useMonthlyTrend()
  const { projects, fetch: fetchProjects } = useProjectCost()
  const { roles } = useCostByRole()
  const [year] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchSummary({ costYear: year })
    fetchTrend(year)
    fetchProjects(year)
  }, [year, fetchSummary, fetchTrend, fetchProjects])

  return (
    <div style={{ padding: 24 }}>
      <h2>成本分析 Dashboard</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <StatCard title="总成本" value={summary?.totalCost ?? 0} prefix="¥" loading={loading} />
        </Col>
        <Col span={6}>
          <StatCard title="人力成本" value={summary?.laborCost ?? 0} prefix="¥" loading={loading} />
        </Col>
        <Col span={6}>
          <StatCard
            title="记录数"
            value={summary?.recordCount ?? 0}
            precision={0}
            loading={loading}
          />
        </Col>
        <Col span={6}>
          <StatCard title="统计年度" value={year} precision={0} loading={loading} />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <CostTrendChart data={trend} loading={loading} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <RoleCostPie data={roles} loading={loading} />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            <ProjectBudgetBar data={projects} loading={loading} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
