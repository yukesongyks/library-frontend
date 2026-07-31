import { useCallback, useState } from 'react';
import { fetchHash } from '../api/demo';
import type { HashData } from '../types';

interface HashTabProps {
  onResultChange: (hasResult: boolean) => void;
}

export function HashTab({ onResultChange }: HashTabProps) {
  const [text, setText] = useState('');
  const [data, setData] = useState<HashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input pre-validation (§5.3): empty text -> button disabled.
  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !loading;

  const submit = useCallback(async () => {
    // Double-check validation before request (block request if invalid).
    if (trimmed.length === 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchHash(trimmed);
      setData(result);
      onResultChange(true);
    } catch {
      // toast already shown by request layer
      setError('计算失败，请稍后重试');
      onResultChange(false);
    } finally {
      setLoading(false);
    }
  }, [trimmed, onResultChange]);

  return (
    <div className="tab-panel">
      <h2>Hash (SHA-256)</h2>
      <p>调用 POST /api/demo/hash，对输入文本计算 SHA-256 摘要。</p>
      <div className="form-row">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请输入文本"
          disabled={loading}
        />
        <button onClick={submit} disabled={!canSubmit}>
          {loading ? '计算中...' : '计算'}
        </button>
      </div>
      <div className="result-area">
        {error ? (
          <div className="error-placeholder">{error}</div>
        ) : data ? (
          <div className="result-detail">
            <p>
              <strong>原文：</strong>
              <span>{data.original}</span>
            </p>
            <p>
              <strong>算法：</strong>
              <span>{data.algorithm}</span>
            </p>
            <p>
              <strong>摘要：</strong>
              <code className="digest">{data.digest}</code>
            </p>
          </div>
        ) : (
          <div className="placeholder">尚无数据</div>
        )}
      </div>
    </div>
  );
}
