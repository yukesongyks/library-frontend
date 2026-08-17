import { useState } from 'react';
import { exportResult } from '../api/algorithm';

interface Props {
  type: string;
  data: Record<string, unknown> | null;
  disabled: boolean;
}

type ExportFormat = 'json' | 'csv';

export default function ExportButton({ type, data, disabled }: Props) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('json');

  const handleExport = async () => {
    if (!data || disabled) return;
    setExporting(true);
    try {
      const blob = await exportResult(type, data, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${type}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#666' }}>格式:</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          disabled={disabled || exporting}
          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>
      </div>
      <button
        onClick={handleExport}
        disabled={disabled || exporting}
        style={{
          padding: '10px 24px',
          background: disabled ? '#ccc' : '#388e3c',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: disabled || exporting ? 'not-allowed' : 'pointer',
        }}
      >
        {exporting ? '导出中...' : disabled ? '请先执行操作' : '导出结果'}
      </button>
    </div>
  );
}