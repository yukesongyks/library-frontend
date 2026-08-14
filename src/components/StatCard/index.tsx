import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  growthRate?: number;
  precision?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, suffix, growthRate, precision = 2 }) => (
  <Card>
    <Statistic
      title={title}
      value={value}
      prefix={prefix}
      suffix={suffix}
      precision={precision}
    />
    {growthRate !== undefined && (
      <Typography.Text type={growthRate >= 0 ? 'danger' : 'success'} style={{ fontSize: 12 }}>
        {growthRate >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {` ${Math.abs(growthRate).toFixed(1)}%`}
      </Typography.Text>
    )}
  </Card>
);

export default StatCard;
