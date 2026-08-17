import { useState } from 'react';
import { fetchBubbleSort } from '../api/algorithm';
import type { BubbleSortData } from '../types/algorithm';

interface Props {
  onResult: (data: BubbleSortData | null) => void;
}

export default function BubbleSortPanel({ onResult }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BubbleSortData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseArray = (raw: string): number[] | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const arr = trimmed.split(',').map(s => {
        const n = Number(s.trim());
        if (isNaN(n) || !Number.isInteger(n)) throw new Error('非整数');
        return n;
      });
      if (arr.length === 0) return null;
      if (arr.length > 100) {
        setError('数组长度不能超过 100');
        return null;
      }
      return arr;
    } catch {
      setError('请输入有效的整数数组，用逗号分隔（如 5,3,8,1,2）');
      return null;
    }
  };

  const handleSort = () => {
    const arr = parseArray(input);
    if (!arr) {
      if (!error) setError('请输入有效的整数数组');
      onResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchBubbleSort(arr)
      .then(res => {
        if (res.code === 0) {
          setData(res.data);
          onResult(res.data);
        } else {
          setError(res.message);
          onResult(null);
        }
      })
      .catch(err => {
        setError(err?.response?.data?.message || err.message || '网络错误');
        onResult(null);
      })
      .finally(() => setLoading(false));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSort();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          placeholder="输入整数数组，逗号分隔（如 5,3,8,1,2）"
          disabled={loading}
          style={{ flex: 1, padding: '8px 12px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          onClick={handleSort}
          disabled={loading}
          style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? '排序中...' : '排序'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', color: '#d32f2f', background: '#ffebee', borderRadius: '4px', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>原始数组:</strong> [{data.input.join(', ')}]
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>排序结果:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>[{data.sorted.join(', ')}]</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>统计:</strong> 比较 {data.comparisons} 次，交换 {data.swaps} 次
          </div>
          <div>
            <strong>排序步骤:</strong>
            <div style={{ marginTop: '8px' }}>
              {data.steps.map((step, i) => (
                <div key={i} style={{
                  padding: '6px 10px',
                  marginBottom: '4px',
                  background: step.swapped ? '#e3f2fd' : '#fafafa',
                  borderRadius: '4px',
                  border: `1px solid ${step.swapped ? '#90caf9' : '#e0e0e0'}`,
                }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>第 {step.round} 轮:</span>
                  <code>[{step.after.join(', ')}]</code>
                  {step.swapped ? null : <span style={{ marginLeft: '8px', color: '#999' }}>(无交换)</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}