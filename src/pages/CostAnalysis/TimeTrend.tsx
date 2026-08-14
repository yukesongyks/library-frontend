import React, { useState } from 'react';
import { Card, Space, Select } from 'antd';
import DimensionFilter from '../../components/DimensionFilter';
import ExportButton from '../../components/ExportButton';
import CostChart from '../../components/CostChart';
import { useDimensionStats } from '../../hooks/useCostData';
import { formatMoney } from '../../utils/format';

const TimeTrend: React.FC = () => {
  const [timeDimension, setTimeDimension] = useState('MONTH');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [dimension, setDimension] = useState<'DEPARTMENT' | 'PROJECT' | 'BUSINESS_LINE'>('DEPARTMENT');

  const { data, loading } = useDimensionStats(dimension, timeDimension, dateRange?.[0], dateRange?.[1]);

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Space wrap>
          <DimensionFilter
            timeDimension={timeDimension}
            dateRange={dateRange}
            onTimeDimensionChange={setTimeDimension}
            onDateRangeChange={setDateRange}
          />
          <span>聚合维度:</span>
          <Select value={dimension} onChange={setDimension} style={{ width: 140 }}
            options={[
              { value: 'DEPARTMENT', label: '按部门' },
              { value: 'PROJECT', label: '按项目' },
              { value: 'BUSINESS_LINE', label: '按业务线' },
            ]} />
        </Space>
        <ExportButton dimension={dimension} timeDimension={timeDimension}
          startDate={dateRange?.[0]} endDate={dateRange?.[1]} />
      </Space>

      <Card>
        <CostChart
          title="成本时间趋势"
          type="line"
          xData={data.map(d => d.dimensionName)}
          series={[
            { name: '开发', data: data.map(d => d.devCost), color: '#1890ff' },
            { name: '测试', data: data.map(d => d.testCost), color: '#52c41a' },
            { name: '产品', data: data.map(d => d.productCost), color: '#faad14' },
            { name: '运维', data: data.map(d => d.opsCost), color: '#f5222d' },
          ]}
          height={450}
        />
      </Card>
    </div>
  );
};

export default TimeTrend;
