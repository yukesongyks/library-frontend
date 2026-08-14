import { useState } from 'react';
import { Input, Button, Space, message } from 'antd';
import { getHelloWorld } from '../../api/helloworld';
import { exportData } from '../../api/export';
import { downloadBlob } from '../../utils/download';
import ResultDisplay from '../../components/ResultDisplay';
import type { HelloWorldResult } from '../../types/algorithm';

export default function HelloWorldTab() {
  const [name, setName] = useState('');
  const [result, setResult] = useState<HelloWorldResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const data = await getHelloWorld(name || undefined);
      setResult(data);
    } catch (err: any) {
      message.error(err?.message || '执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!result || exporting) return;
    setExporting(true);
    try {
      const blob = await exportData({
        type: 'helloworld',
        data: result,
        format,
      });
      downloadBlob(blob, `helloworld_result.${format}`);
      message.success('导出成功');
    } catch (err: any) {
      message.error(err?.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="输入名称（默认 World）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          style={{ maxWidth: 400 }}
        />
        <Space>
          <Button type="primary" onClick={handleExecute} loading={loading}>
            执行
          </Button>
          <Button onClick={() => handleExport('csv')} disabled={!result} loading={exporting}>
            导出 CSV
          </Button>
          <Button onClick={() => handleExport('xlsx')} disabled={!result} loading={exporting}>
            导出 Excel
          </Button>
        </Space>
      </Space>
      <ResultDisplay data={result} />
    </div>
  );
}