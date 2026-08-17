import { useEffect, useState } from 'react';
import { fetchHelloWorld } from '../api/algorithm';
import type { HelloWorldData } from '../types/algorithm';

interface Props {
  onResult: (data: HelloWorldData | null) => void;
}

export default function HelloWorldPanel({ onResult }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HelloWorldData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchHelloWorld()
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

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#d32f2f' }}>
        <p>错误: {error}</p>
        <button onClick={load} style={{ marginTop: '8px', padding: '6px 16px' }}>重试</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h3>问候语</h3>
      <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{data.greeting}</p>
      <h3>服务器时间</h3>
      <p style={{ color: '#666' }}>{data.timestamp}</p>
    </div>
  );
}