import { useCallback, useState } from 'react';
import { BubbleSortTab } from '../components/BubbleSortTab';
import { HashTab } from '../components/HashTab';
import { HelloWorldTab } from '../components/HelloWorldTab';
import { exportCsv } from '../api/demo';
import type { DemoTab } from '../types';

const TABS: { key: DemoTab; label: string }[] = [
  { key: 'helloworld', label: 'HelloWorld' },
  { key: 'hash', label: 'Hash' },
  { key: 'bubble-sort', label: 'BubbleSort' },
];

export function DemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>('helloworld');
  const [hasResult, setHasResult] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleTabChange = (tab: DemoTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setHasResult(false);
  };

  const handleResultChange = useCallback((loaded: boolean) => {
    setHasResult(loaded);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCsv(activeTab);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>Library Demo</h1>
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={!hasResult || exporting}
          title={hasResult ? '导出当前 Tab 为 CSV' : '当前 Tab 无可用结果'}
        >
          {exporting ? '导出中...' : '导出 CSV'}
        </button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${t.key === activeTab ? 'active' : ''}`}
            onClick={() => handleTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'helloworld' && (
          <HelloWorldTab onResultChange={handleResultChange} />
        )}
        {activeTab === 'hash' && (
          <HashTab onResultChange={handleResultChange} />
        )}
        {activeTab === 'bubble-sort' && (
          <BubbleSortTab onResultChange={handleResultChange} />
        )}
      </div>
    </div>
  );
}
