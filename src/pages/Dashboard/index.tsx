import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Typography, Spin, Statistic } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import StatCard from '../../components/StatCard';
import LineChart from '../../components/Charts/LineChart';
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import { getDashboard, DashboardData } from '../../api/report';
import { formatMoney, formatPercent } from '../../utils/format';

const { Text } = Typography;

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <StatCard title="总成本" value={data.totalCost} prefix="¥" precision={2} growthRate={data.monthCostGrowthRate} />
        </Col>
        <Col span={6}>
          <StatCard title="本月成本" value={data.monthCost} prefix="¥" precision={2} />
        </Col>
        <Col span={6}>
          <StatCard title="预算执行率" value={data.budgetExecutionRate} suffix="%" precision={1} />
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="超支预警" value={data.overBudgetProjectCount} suffix="个项目" prefix={<WarningOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card><LineChart title="月度成本趋势" data={data.trendData} /></Card>
        </Col>
        <Col span={12}>
          <Card><PieChart title="成本类型占比" data={data.typeDistribution} /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card><BarChart title="部门成本对比" data={data.deptComparison} /></Card>
        </Col>
        <Col span={12}>
          <Card title="项目预算执行">
            {data.projectBudget.map((p, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{p.projectName}</Text>
                  <Text type="secondary">{formatPercent(p.rate)}</Text>
                </div>
                <Progress percent={Math.min(p.rate, 100)} status={p.rate > 100 ? 'exception' : 'active'} showInfo={false} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <Text type="secondary">预算: {formatMoney(p.budget)}</Text>
                  <Text type="secondary">实际: {formatMoney(p.actual)}</Text>
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
