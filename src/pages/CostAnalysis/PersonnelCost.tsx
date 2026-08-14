import React, { useState } from 'react';
import { Table, Card, Space, Tag } from 'antd';
import DimensionFilter from '../../components/DimensionFilter';
import ExportButton from '../../components/ExportButton';
import { useDimensionStats } from '../../hooks/useCostData';
import { formatMoney } from '../../utils/format';

const roleColorMap: Record<string, string> = {
  DEV: 'blue', TEST: 'green', PRODUCT: 'orange', OPS: 'red',
};
const roleLabelMap: Record<string, string> = {
  DEV: '开发', TEST: '测试', PRODUCT: '产品', OPS: '运维',
};

const PersonnelCost: React.FC = () => {
  const [timeDimension, setTimeDimension] = useState('MONTH');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const { data, loading } = useDimensionStats('EMPLOYEE', timeDimension, dateRange?.[0], dateRange?.[1]);

  const columns = [
    { title: '人员', dataIndex: 'dimensionName', key: 'name' },
    { title: '开发成本', dataIndex: 'devCost', key: 'dev', render: (v: number) => formatMoney(v) },
    { title: '测试成本', dataIndex: 'testCost', key: 'test', render: (v: number) => formatMoney(v) },
    { title: '产品成本', dataIndex: 'productCost', key: 'product', render: (v: number) => formatMoney(v) },
    { title: '运维成本', dataIndex: 'opsCost', key: 'ops', render: (v: number) => formatMoney(v) },
    { title: '总成本', dataIndex: 'totalCost', key: 'total', render: (v: number) => formatMoney(v) },
    { title: '占比', dataIndex: 'percentage', key: 'pct', render: (v: number) => `${v.toFixed(2)}%` },
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
        <ExportButton dimension="EMPLOYEE" timeDimension={timeDimension}
          startDate={dateRange?.[0]} endDate={dateRange?.[1]} />
      </Space>

      <Table dataSource={data} columns={columns} rowKey="dimensionId" loading={loading} />
    </div>
  );
};

export default PersonnelCost;
