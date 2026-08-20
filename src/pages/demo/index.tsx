import React from 'react';
import { Tabs, Typography, Card } from 'antd';
import {
  CodeOutlined,
  LockOutlined,
  SortAscendingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import HelloWorldTab from './HelloWorldTab';
import HashTab from './HashTab';
import BubbleSortTab from './BubbleSortTab';
import AnalyticsTab from './AnalyticsTab';

const { Title } = Typography;

const DemoPage: React.FC = () => {
  const items = [
    {
      key: 'helloworld',
      label: (
        <span>
          <CodeOutlined /> HelloWorld
        </span>
      ),
      children: <HelloWorldTab />,
    },
    {
      key: 'hash',
      label: (
        <span>
          <LockOutlined /> 哈希算法
        </span>
      ),
      children: <HashTab />,
    },
    {
      key: 'bubble-sort',
      label: (
        <span>
          <SortAscendingOutlined /> 冒泡排序
        </span>
      ),
      children: <BubbleSortTab />,
    },
    {
      key: 'analytics',
      label: (
        <span>
          <BarChartOutlined /> 调用统计
        </span>
      ),
      children: <AnalyticsTab />,
    },
  ];

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 24 }}>功能演示</Title>
      <Tabs defaultActiveKey="helloworld" items={items} size="large" />
    </Card>
  );
};

export default DemoPage;
