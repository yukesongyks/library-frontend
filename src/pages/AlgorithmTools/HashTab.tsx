import { useState } from 'react';
import { Input, Select, Button, Space, message } from 'antd';
import { computeHash } from '../../api/hash';
import { exportData } from '../../api/export';
import { downloadBlob } from '../../utils/download';
import ResultDisplay from '../../components/ResultDisplay';
import type { HashResult } from '../../types/algorithm';

const ALGORITHMS = [
  { value: 'MD5', label: 'MD5' },
  { value: 'SHA-1', label: 'SHA-1' },
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-512', label: 'SHA-512' },
];

export default function HashTab() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA-256');
  const [result, setResult] = useState<HashResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!input.trim()) {
      message.warning('请输入待哈希字符串');
      return;
    }
    setLoading(true);
    try {
      const data = await computeHash(input, algorithm);
      setResult(data);
    } catch (err: any) {
      message.error(err?.message || '执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!result) return;
    try {
      const blob = await exportData({
        type: 'hash',
        data: result,
        format,
      });
      downloadBlob(blob, `hash_result.${format}`);
      message.success('导出成功');
    } catch (err: any) {
      message.error(err?.message || '导出失败');
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.TextArea
          placeholder="输入待哈希字符串"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          style={{ maxWidth: 600 }}
        />
        <Select
          value={algorithm}
          onChange={setAlgorithm}
          options={ALGORITHMS}
          style={{ width: 200 }}
        />
        <Space>
          <Button type="primary" onClick={handleExecute} loading={loading}>
            执行
          </Button>
          <Button onClick={() => handleExport('csv')} disabled={!result}>
            导出 CSV
          </Button>
          <Button onClick={() => handleExport('xlsx')} disabled={!result}>
            导出 Excel
          </Button>
        </Space>
      </Space>
      <ResultDisplay data={result} />
    </div>
  );
}