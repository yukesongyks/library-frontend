import React from 'react';
import { Card, Statistic } from 'antd';

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  precision?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, suffix, precision }) => {
  return (
    <Card>
      <Statistic title={title} value={value} suffix={suffix} precision={precision} />
    </Card>
  );
};

export default StatsCard;
