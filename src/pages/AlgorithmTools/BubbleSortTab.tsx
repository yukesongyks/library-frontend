import { useState } from 'react';
import { Input, Select, Button, Space, message } from 'antd';
import { bubbleSort } from '../../api/bubblesort';
import { exportData } from '../../api/export';
import { downloadBlob } from '../../utils/download';
import ResultDisplay from '../../components/ResultDisplay';
import type { BubbleSortResult } from '../../types/algorithm';

const ORDERS = [
  { value: 'asc', label: '升序 (asc)' },
  { value: 'desc', label: '降序 (desc)' },
];

export default function BubbleSortTab() {
  const [arrayStr, setArrayStr] = useState('');
  const [order, setOrder] = useState('asc');
  const [result, setResult] = useState<BubbleSortResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const parseArray = (): number[] => {
    return arrayStr
      .split(/[,，\s]+/)
      .filter(Boolean)
      .map(Number);
  };

  const handleExecute = async () => {
    const arr = parseArray();
    if (arr.length < 2) {
      message.warning('请至少输入2个数字，以逗号分隔');
      return;
    }
    if (arr.length > 1000) {
      message.warning('数组长度不能超过1000');
      return;
    }
    if (arr.some(isNaN)) {
      message.warning('请确保输入均为有效数字');
      return;
    }
    setLoading(true);
    try {
      const data = await bubbleSort(arr, order);
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
        type: 'bubblesort',
        data: {
          sorted: result.sorted,
          steps: result.steps,
          original: result.original,
        },
        format,
      });
      downloadBlob(blob, `bubblesort_result.${format}`);
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
          placeholder="输入数字，以逗号分隔（如 5,3,8,1,2）"
          value={arrayStr}
          onChange={(e) => setArrayStr(e.target.value)}
          style={{ maxWidth: 500 }}
        />
        <Select
          value={order}
          onChange={setOrder}
          options={ORDERS}
          style={{ width: 200 }}
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