import React from 'react';
import { Card, Statistic } from 'antd';
import { formatMoney } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, suffix, color }) => (
  <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
    <Statistic
      title={title}
      value={value}
      precision={2}
      prefix={prefix || '¥'}
      suffix={suffix}
      valueStyle={{ color: color || '#1890ff' }}
    />
  </Card>
);

export default StatCard;
