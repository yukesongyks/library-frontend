import { useCallback, useState } from 'react';
import { fetchBubbleSort } from '../api/demo';
import type { BubbleSortData } from '../types';

interface BubbleSortTabProps {
  onResultChange: (hasResult: boolean) => void;
}

export function BubbleSortTab({ onResultChange }: BubbleSortTabProps) {
  const [raw, setRaw] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [data, setData] = useState<BubbleSortData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Parse comma-separated input into a number[].
   * Each token must be a valid integer; otherwise block the request (§5.3).
   * Returns null if invalid; sets inline validationError.
   */
  const parseNumbers = (input: string): number[] | null => {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      setValidationError('请输入逗号分隔的整数，如 5,2,9,1,5,6');
      return null;
    }
    const tokens = trimmed.split(/[,，\s]+/).filter((t) => t.length > 0);
    const numbers: number[] = [];
    for (const token of tokens) {
      // Accept optional leading sign + digits only (integer validation).
      if (!/^[+-]?\d+$/.test(token)) {
        setValidationError(`非法数字格式："${token}"，仅支持整数`);
        return null;
      }
      const n = Number(token);
      if (!Number.isFinite(n)) {
        setValidationError(`非法数字格式："${token}"`);
        return null;
      }
      numbers.push(n);
    }
    if (numbers.length === 0) {
      setValidationError('请输入至少一个整数');
      return null;
    }
    setValidationError(null);
    return numbers;
  };

  const submit = useCallback(async () => {
    // Input pre-validation (§5.3): block request on illegal format.
    const numbers = parseNumbers(raw);
    if (numbers === null) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBubbleSort(numbers);
      setData(result);
      onResultChange(true);
    } catch {
      setError('排序失败，请稍后重试');
      onResultChange(false);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, onResultChange]);

  const canSubmit = raw.trim().length > 0 && !loading;

  return (
    <div className="tab-panel">
      <h2>BubbleSort</h2>
      <p>调用 POST /api/demo/bubble-sort，对输入整数数组进行冒泡排序。</p>
      <div className="form-row">
        <input
          type="text"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="请输入逗号分隔的整数，如 5,2,9,1,5,6"
          disabled={loading}
        />
        <button onClick={submit} disabled={!canSubmit}>
          {loading ? '排序中...' : '排序'}
        </button>
      </div>
      {validationError && (
        <div className="inline-error">{validationError}</div>
      )}
      <div className="result-area">
        {error ? (
          <div className="error-placeholder">{error}</div>
        ) : data ? (
          <div className="result-detail">
            <p>
              <strong>输入：</strong>
              <span>[{data.input.join(', ')}]</span>
            </p>
            <p>
              <strong>排序后：</strong>
              <span>[{data.sorted.join(', ')}]</span>
            </p>
            <p>
              <strong>交换次数：</strong>
              <span>{data.swaps}</span>
            </p>
          </div>
        ) : (
          <div className="placeholder">尚无数据</div>
        )}
      </div>
    </div>
  );
}
