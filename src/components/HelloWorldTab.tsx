import { useCallback, useEffect, useState } from 'react';
import { fetchHelloWorld } from '../api/demo';
import type { HelloWorldData } from '../types';

interface HelloWorldTabProps {
  onResultChange: (hasResult: boolean) => void;
}

export function HelloWorldTab({ onResultChange }: HelloWorldTabProps) {
  const [data, setData] = useState<HelloWorldData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchHelloWorld();
      setData(result);
      onResultChange(true);
    } catch {
      // toast already shown by request layer
      setError('加载失败，请稍后重试');
      onResultChange(false);
    } finally {
      setLoading(false);
    }
  }, [onResultChange]);

  // Fetch on first mount.
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="tab-panel">
      <h2>HelloWorld</h2>
      <p>调用 GET /api/demo/helloworld，展示后端返回的固定字符串。</p>
      <button onClick={load} disabled={loading}>
        {loading ? '加载中...' : '刷新'}
      </button>
      <div className="result-area">
        {error ? (
          <div className="error-placeholder">{error}</div>
        ) : data ? (
          <pre>{data.message}</pre>
        ) : (
          <div className="placeholder">尚无数据</div>
        )}
      </div>
    </div>
  );
}
