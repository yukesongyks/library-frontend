import React from 'react';
import { Tabs, Typography } from 'antd';
import {
  CodeOutlined,
  LockOutlined,
  SortAscendingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import HelloWorldTab from './components/HelloWorldTab';
import HashTab from './components/HashTab';
import BubbleSortTab from './components/BubbleSortTab';
import AnalyticsTab from './components/AnalyticsTab';

const { Title } = Typography;

const DemoPage: React.FC = () => {
  const tabItems = [
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
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>功能演示</Title>
      <Tabs defaultActiveKey="helloworld" items={tabItems} size="large" />
    </div>
  );
};

export default DemoPage;
