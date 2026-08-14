import React, { useState } from 'react';
import { Row, Col, Card, Table, Select, Space, Spin } from 'antd';
import StatCard from '../../components/StatCard';
import CostChart from '../../components/CostChart';
import { useDashboard } from '../../hooks/useCostData';
import { formatMoney } from '../../utils/format';

const Dashboard: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data, loading } = useDashboard(year);

  if (loading || !data) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const roleChartData = Object.entries(data.costByRole || {});
  const deptChartData = Object.entries(data.costByDepartment || {});

  const projectColumns = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '预算', dataIndex: 'budget', key: 'budget', render: (v: number) => formatMoney(v) },
    { title: '实际消耗', dataIndex: 'actualCost', key: 'actualCost', render: (v: number) => formatMoney(v) },
    { title: '预算占比', dataIndex: 'budgetRatio', key: 'budgetRatio', render: (v: number) => `${v}%` },
    { title: '预计超支', dataIndex: 'estimatedOverspend', key: 'estimatedOverspend',
      render: (v: number) => <span style={{ color: v > 0 ? '#f5222d' : '#52c41a' }}>{formatMoney(v)}</span> },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <span>统计年度:</span>
        <Select value={year} onChange={setYear} style={{ width: 120 }}
          options={[2024, 2025, 2026, 2027].map(y => ({ value: y, label: `${y}年` }))} />
      </Space>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <StatCard title="年度总成本" value={data.totalCost || 0} color="#1890ff" />
        </Col>
        <Col span={6}>
          <StatCard title="人力成本" value={data.hrCost || 0} color="#52c41a" />
        </Col>
        <Col span={6}>
          <StatCard title="项目总预算" value={data.projectTotalBudget || 0} color="#faad14" />
        </Col>
        <Col span={6}>
          <StatCard title="项目实际消耗" value={data.projectTotalActual || 0} color="#f5222d" />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="按角色分类成本">
            <CostChart
              title="人力成本分布"
              type="pie"
              xData={roleChartData.map(([k]) => k)}
              series={[{ name: '成本', data: roleChartData.map(([, v]) => v) }]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="按部门分类成本">
            <CostChart
              title="部门成本对比"
              type="bar"
              xData={deptChartData.map(([k]) => k)}
              series={[{ name: '成本', data: deptChartData.map(([, v]) => v) }]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="月度成本趋势">
            <CostChart
              title="月度趋势"
              type="line"
              xData={(data.monthlyTrend || []).map(m => m.month)}
              series={[{ name: '月度成本', data: (data.monthlyTrend || []).map(m => m.cost), color: '#1890ff' }]}
            />
          </Card>
        </Col>
      </Row>

      {/* 超支TOP项目 */}
      <Card title="预计超支TOP项目" style={{ marginTop: 24 }}>
        <Table
          dataSource={data.topOverspendProjects || []}
          columns={projectColumns}
          rowKey="projectId"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
