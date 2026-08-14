import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col } from 'antd';
import FilterBar from '../../components/FilterBar';
import PieChart from '../../components/Charts/PieChart';
import { getLaborCost } from '../../api/report';
import { formatMoney, roleTypeLabel } from '../../utils/format';
import dayjs from 'dayjs';

const LaborCost: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = (params: any) => {
    setLoading(true);
    const periodStart = params.periodStart || dayjs().startOf('year').format('YYYY-MM');
    const periodEnd = params.periodEnd || dayjs().format('YYYY-MM');
    getLaborCost({ periodStart, periodEnd, timeGranularity: params.timeGranularity })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData({}); }, []);

  const columns = [
    { title: '岗位类型', dataIndex: 'roleType', key: 'roleType', render: (v: string) => roleTypeLabel[v] || v },
    { title: '人力成本', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v), sorter: (a: any, b: any) => a.amount - b.amount },
    { title: '人数', dataIndex: 'headCount', key: 'headCount' },
  ];

  const pieData = data.map(d => ({ costType: d.roleType, amount: d.amount }));

  return (
    <div>
      <FilterBar onSearch={fetchData} showRoleType showTimeGranularity />
      <Row gutter={16}>
        <Col span={14}>
          <Card title="人力成本统计">
            <Table dataSource={data} columns={columns} rowKey="roleType" loading={loading} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card><PieChart title="岗位成本占比" data={pieData} /></Card>
        </Col>
      </Row>
    </div>
  );
};

export default LaborCost;
