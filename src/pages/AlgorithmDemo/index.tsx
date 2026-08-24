import React, { useState } from 'react';
import { Typography } from 'antd';
import { TypeTabs } from '../../components';
import type { AlgorithmTabKey } from '../../types';
import HelloworldTab from './HelloworldTab';
import HashTab from './HashTab';
import BubbleSortTab from './BubbleSortTab';
import ExportPanel from './ExportPanel';
import InvocationStats from './InvocationStats';

const { Title } = Typography;

const TAB_ITEMS = [
  { key: 'helloworld' as const, label: 'Helloworld', children: <HelloworldTab /> },
  { key: 'hash' as const, label: '哈希算法', children: <HashTab /> },
  { key: 'bubbleSort' as const, label: '冒泡排序', children: <BubbleSortTab /> },
];

/**
 * 算法演示页面
 * 路由：/algorithm-demo
 */
function AlgorithmDemo() {
  const [activeTab, setActiveTab] = useState<AlgorithmTabKey>('helloworld');

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>算法演示</Title>
      <TypeTabs
        items={TAB_ITEMS}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      <ExportPanel />
      <InvocationStats />
    </div>
  );
}

export default AlgorithmDemo;
