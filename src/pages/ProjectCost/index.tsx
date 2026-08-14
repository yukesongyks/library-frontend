import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Tag } from 'antd';
import { getProjectCost } from '../../api/report';
import { formatMoney } from '../../utils/format';

const ProjectCost: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProjectCost()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '预算', dataIndex: 'budget', key: 'budget', render: (v: number) => formatMoney(v) },
    { title: '实际消耗', dataIndex: 'actual', key: 'actual', render: (v: number) => formatMoney(v) },
    {
      title: '预算占比', dataIndex: 'rate', key: 'rate',
      render: (v: number) => (
        <Progress percent={Math.min(v, 100)} status={v > 100 ? 'exception' : 'active'} size="small" style={{ width: 150 }} />
      ),
    },
    {
      title: '预计超支', key: 'overBudget',
      render: (_: any, record: any) => {
        const over = Math.max(record.actual - record.budget, 0);
        return over > 0
          ? <Tag color="red">{formatMoney(over)}</Tag>
          : <Tag color="green">未超支</Tag>;
      },
    },
  ];

  return (
    <Card title="项目成本统计">
      <Table dataSource={data} columns={columns} rowKey="projectName" loading={loading} pagination={false} />
    </Card>
  );
};

export default ProjectCost;
