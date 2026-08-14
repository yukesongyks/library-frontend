import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col } from 'antd';
import FilterBar from '../../components/FilterBar';
import BarChart from '../../components/Charts/BarChart';
import { getAnalysis, AnalysisParams } from '../../api/report';
import { formatMoney } from '../../utils/format';

const CostAnalysis: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = (params: AnalysisParams) => {
    setLoading(true);
    getAnalysis({ groupBy: 'dept', ...params })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData({}); }, []);

  const columns = [
    { title: '分组', dataIndex: 'groupName', key: 'groupName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v), sorter: (a: any, b: any) => a.amount - b.amount },
    { title: '记录数', dataIndex: 'recordCount', key: 'recordCount' },
  ];

  const chartData = data.map(d => ({ deptName: d.groupName, amount: d.amount }));

  return (
    <div>
      <FilterBar onSearch={fetchData} showCostType showGroupBy showTimeGranularity />
      <Row gutter={16}>
        <Col span={14}>
          <Card title="统计结果">
            <Table dataSource={data} columns={columns} rowKey="groupId" loading={loading} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card><BarChart title="成本分布" data={chartData} /></Card>
        </Col>
      </Row>
    </div>
  );
};

export default CostAnalysis;
