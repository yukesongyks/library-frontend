import React, { useState } from 'react';
import { Table, Card, Space, Progress, Tag } from 'antd';
import ExportButton from '../../components/ExportButton';
import CostChart from '../../components/CostChart';
import { useProjectCosts } from '../../hooks/useCostData';
import { formatMoney } from '../../utils/format';

const ProjectCost: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data, loading } = useProjectCosts(year);

  const columns = [
    { title: '项目名称', dataIndex: 'projectName', key: 'name' },
    { title: '部门', dataIndex: 'departmentName', key: 'dept' },
    { title: '业务线', dataIndex: 'businessLineName', key: 'bl' },
    { title: '预算', dataIndex: 'budget', key: 'budget', render: (v: number) => formatMoney(v) },
    { title: '实际消耗', dataIndex: 'actualCost', key: 'actual', render: (v: number) => formatMoney(v) },
    {
      title: '预算占比', dataIndex: 'budgetRatio', key: 'ratio',
      render: (v: number) => (
        <Progress percent={Number(v)} size="small"
          status={v > 100 ? 'exception' : v > 80 ? 'active' : 'normal'} />
      ),
    },
    {
      title: '预计超支', dataIndex: 'estimatedOverspend', key: 'overspend',
      render: (v: number) => (
        <Tag color={v > 0 ? 'red' : 'green'}>{formatMoney(v)}</Tag>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <span>统计年度: {year}</span>
        <ExportButton dimension="PROJECT" startDate={`${year}-01`} endDate={`${year}-12`} />
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <CostChart
          title="项目预算 vs 实际消耗"
          type="bar"
          xData={data.map(d => d.projectName)}
          series={[
            { name: '预算', data: data.map(d => d.budget), color: '#1890ff' },
            { name: '实际消耗', data: data.map(d => d.actualCost), color: '#f5222d' },
          ]}
          height={400}
        />
      </Card>

      <Table dataSource={data} columns={columns} rowKey="projectId" loading={loading} />
    </div>
  );
};

export default ProjectCost;
