import React, { useState } from 'react';
import { Table, Card, Space } from 'antd';
import DimensionFilter from '../../components/DimensionFilter';
import ExportButton from '../../components/ExportButton';
import CostChart from '../../components/CostChart';
import { useDimensionStats } from '../../hooks/useCostData';
import { formatMoney, formatPercent } from '../../utils/format';

const DepartmentCost: React.FC = () => {
  const [timeDimension, setTimeDimension] = useState('MONTH');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const { data, loading } = useDimensionStats('DEPARTMENT', timeDimension, dateRange?.[0], dateRange?.[1]);

  const columns = [
    { title: '部门', dataIndex: 'dimensionName', key: 'name' },
    { title: '开发成本', dataIndex: 'devCost', key: 'dev', render: (v: number) => formatMoney(v) },
    { title: '测试成本', dataIndex: 'testCost', key: 'test', render: (v: number) => formatMoney(v) },
    { title: '产品成本', dataIndex: 'productCost', key: 'product', render: (v: number) => formatMoney(v) },
    { title: '运维成本', dataIndex: 'opsCost', key: 'ops', render: (v: number) => formatMoney(v) },
    { title: '总成本', dataIndex: 'totalCost', key: 'total', render: (v: number) => formatMoney(v) },
    { title: '占比', dataIndex: 'percentage', key: 'pct', render: (v: number) => formatPercent(v) },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <DimensionFilter
          timeDimension={timeDimension}
          dateRange={dateRange}
          onTimeDimensionChange={setTimeDimension}
          onDateRangeChange={setDateRange}
        />
        <ExportButton dimension="DEPARTMENT" timeDimension={timeDimension}
          startDate={dateRange?.[0]} endDate={dateRange?.[1]} />
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <CostChart
          title="部门成本分布"
          type="bar"
          xData={data.map(d => d.dimensionName)}
          series={[
            { name: '开发', data: data.map(d => d.devCost), color: '#1890ff' },
            { name: '测试', data: data.map(d => d.testCost), color: '#52c41a' },
            { name: '产品', data: data.map(d => d.productCost), color: '#faad14' },
            { name: '运维', data: data.map(d => d.opsCost), color: '#f5222d' },
          ]}
        />
      </Card>

      <Table dataSource={data} columns={columns} rowKey="dimensionId" loading={loading} pagination={false} />
    </div>
  );
};

export default DepartmentCost;
