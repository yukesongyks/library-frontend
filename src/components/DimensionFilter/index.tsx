import React from 'react';
import { Select, DatePicker, Space } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface DimensionFilterProps {
  timeDimension: string;
  dateRange: [string, string] | null;
  onTimeDimensionChange: (value: string) => void;
  onDateRangeChange: (dates: [string, string] | null) => void;
}

const DimensionFilter: React.FC<DimensionFilterProps> = ({
  timeDimension, dateRange, onTimeDimensionChange, onDateRangeChange,
}) => (
  <Space wrap size="middle">
    <span>时间维度:</span>
    <Select
      value={timeDimension}
      onChange={onTimeDimensionChange}
      style={{ width: 120 }}
      options={[
        { value: 'MONTH', label: '月度' },
        { value: 'QUARTER', label: '季度' },
        { value: 'YEAR', label: '年度' },
      ]}
    />
    <span>时间范围:</span>
    <RangePicker
      picker="month"
      value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
      onChange={(dates) => {
        if (dates) {
          onDateRangeChange([
            dates[0]!.format('YYYY-MM'),
            dates[1]!.format('YYYY-MM'),
          ]);
        } else {
          onDateRangeChange(null);
        }
      }}
    />
  </Space>
);

export default DimensionFilter;
