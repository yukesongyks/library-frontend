import { useState, useCallback } from 'react';
import type { HelloWorldData, HashData, BubbleSortData } from '../types/algorithm';
import HelloWorldPanel from '../components/HelloWorldPanel';
import HashPanel from '../components/HashPanel';
import BubbleSortPanel from '../components/BubbleSortPanel';
import ExportButton from '../components/ExportButton';

type TabKey = 'helloworld' | 'hash' | 'bubblesort';

interface TabResults {
  helloworld: HelloWorldData | null;
  hash: HashData | null;
  bubblesort: BubbleSortData | null;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'helloworld', label: 'HelloWorld' },
  { key: 'hash', label: '哈希算法' },
  { key: 'bubblesort', label: '冒泡排序' },
];

export default function AlgorithmDemoPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('helloworld');
  const [results, setResults] = useState<TabResults>({
    helloworld: null,
    hash: null,
    bubblesort: null,
  });

  const updateResult = useCallback((tab: TabKey, data: HelloWorldData | HashData | BubbleSortData | null) => {
    setResults(prev => ({ ...prev, [tab]: data }));
  }, []);

  const currentData = results[activeTab];

  const renderPanel = () => {
    switch (activeTab) {
      case 'helloworld':
        return (
          <HelloWorldPanel
            onResult={(data) => updateResult('helloworld', data)}
          />
        );
      case 'hash':
        return (
          <HashPanel
            onResult={(data) => updateResult('hash', data)}
          />
        );
      case 'bubblesort':
        return (
          <BubbleSortPanel
            onResult={(data) => updateResult('bubblesort', data)}
          />
        );
    }
  };

  return (
    <div>
      <h1>算法演示</h1>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #e0e0e0' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #1976d2' : '2px solid transparent',
              marginBottom: '-2px',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              color: activeTab === tab.key ? '#1976d2' : '#666',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: '200px', marginBottom: '24px' }}>
        {renderPanel()}
      </div>

      <ExportButton
        type={activeTab}
        data={currentData ? (currentData as unknown as Record<string, unknown>) : null}
        disabled={!currentData}
      />
    </div>
  );
}