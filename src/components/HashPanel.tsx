import { useState } from 'react';
import { fetchHash } from '../api/algorithm';
import type { HashData } from '../types/algorithm';

interface Props {
  onResult: (data: HashData | null) => void;
}

export default function HashPanel({ onResult }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HashData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompute = () => {
    if (!input.trim()) {
      setError('请输入字符串');
      return;
    }
    setLoading(true);
    setError(null);
    fetchHash(input.trim())
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
    if (e.key === 'Enter') handleCompute();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入待哈希的字符串"
          disabled={loading}
          style={{ flex: 1, padding: '8px 12px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          onClick={handleCompute}
          disabled={loading}
          style={{ padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? '计算中...' : '计算'}
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
            <strong>原始输入:</strong> <code>{data.input}</code>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>算法:</strong> <code>{data.algorithm}</code>
          </div>
          <div>
            <strong>哈希值:</strong>
            <div style={{ wordBreak: 'break-all', marginTop: '4px', padding: '8px', background: '#e8e8e8', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' }}>
              {data.hash}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}