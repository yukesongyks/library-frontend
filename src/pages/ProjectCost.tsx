import { useEffect, useState } from 'react'
import { Card, Table, Button, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import ProjectBudgetBar from '../components/ProjectBudgetBar'
import { useProjectCost } from '../hooks/useCostData'
import { exportProjectCostUrl } from '../api/costApi'
import type { ProjectCost } from '../types/cost'

export default function ProjectCostPage() {
  const { projects, loading, fetch } = useProjectCost()
  const [year] = useState(new Date().getFullYear())

  useEffect(() => {
    fetch(year)
  }, [year, fetch])

  const columns: ColumnsType<ProjectCost> = [
    { title: '项目ID', dataIndex: 'projectId', key: 'projectId' },
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    {
      title: '预算金额 (¥)',
      dataIndex: 'budgetAmount',
      key: 'budgetAmount',
      render: (v: number | null) => (v ?? 0).toFixed(2),
    },
    {
      title: '实际消耗 (¥)',
      dataIndex: 'actualCost',
      key: 'actualCost',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '预算占比 (%)',
      dataIndex: 'budgetUsageRate',
      key: 'budgetUsageRate',
      render: (v: number) => (
        <Tag color={v > 100 ? 'red' : v > 80 ? 'orange' : 'green'}>{v.toFixed(2)}%</Tag>
      ),
    },
    {
      title: '预计超支 (¥)',
      dataIndex: 'overspendAmount',
      key: 'overspendAmount',
      render: (v: number) => (v > 0 ? <Tag color="red">{v.toFixed(2)}</Tag> : '—'),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <h2>
        项目成本明细
        <Button
          icon={<DownloadOutlined />}
          type="primary"
          style={{ marginLeft: 16 }}
          onClick={() => window.open(exportProjectCostUrl(year), '_blank')}
        >
          导出Excel
        </Button>
      </h2>
      <Card style={{ marginBottom: 16 }}>
        <ProjectBudgetBar data={projects} loading={loading} />
      </Card>
      <Card>
        <Table columns={columns} dataSource={projects} rowKey="projectId" loading={loading} />
      </Card>
    </div>
  )
}
