import React, { useState } from 'react';
import { Table, Card, Space } from 'antd';
import DimensionFilter from '../../components/DimensionFilter';
import ExportButton from '../../components/ExportButton';
import CostChart from '../../components/CostChart';
import { useDimensionStats } from '../../hooks/useCostData';
import { formatMoney, formatPercent } from '../../utils/format';

const BusinessLineCost: React.FC = () => {
  const [timeDimension, setTimeDimension] = useState('MONTH');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const { data, loading } = useDimensionStats('BUSINESS_LINE', timeDimension, dateRange?.[0], dateRange?.[1]);

  const columns = [
    { title: '业务线', dataIndex: 'dimensionName', key: 'name' },
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
        <ExportButton dimension="BUSINESS_LINE" timeDimension={timeDimension}
          startDate={dateRange?.[0]} endDate={dateRange?.[1]} />
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <CostChart
          title="业务线成本分布"
          type="pie"
          xData={data.map(d => d.dimensionName)}
          series={[{ name: '成本', data: data.map(d => d.totalCost) }]}
        />
      </Card>

      <Table dataSource={data} columns={columns} rowKey="dimensionId" loading={loading} pagination={false} />
    </div>
  );
};

export default BusinessLineCost;
