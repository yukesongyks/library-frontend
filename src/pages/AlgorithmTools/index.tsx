import { useState } from 'react';
import { Tabs, Typography } from 'antd';
import HelloWorldTab from './HelloWorldTab';
import HashTab from './HashTab';
import BubbleSortTab from './BubbleSortTab';
import MetricsDashboard from './MetricsDashboard';

const { Title } = Typography;

const tabItems = [
  { key: 'helloworld', label: 'HelloWorld', children: <HelloWorldTab /> },
  { key: 'hash', label: '哈希算法', children: <HashTab /> },
  { key: 'bubblesort', label: '冒泡排序', children: <BubbleSortTab /> },
];

export default function AlgorithmToolsPage() {
  const [activeTab, setActiveTab] = useState('helloworld');

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3}>算法工具与调用分析</Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      <MetricsDashboard />
    </div>
  );
}