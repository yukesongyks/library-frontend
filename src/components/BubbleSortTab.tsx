import { useState } from "react";
import { fetchBubbleSort, exportTab, BubbleSortResult } from "../api";

export default function BubbleSortTab() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<BubbleSortResult | null>(null);
  const [error, setError] = useState("");

  const handleExecute = async () => {
    try {
      setError("");
      const parts = input
        .split(/[,\s]+/)
        .filter((s) => s.length > 0)
        .map((s) => parseInt(s, 10));
      if (parts.some((n) => isNaN(n))) {
        throw new Error("请输入逗号分隔的整数");
      }
      const res = await fetchBubbleSort(parts);
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  };

  const handleExport = async () => {
    try {
      setError("");
      const blob = await exportTab("bubble-sort", "csv");
      downloadBlob(blob, "bubble-sort.csv");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="tab-content">
      <div className="export-row">
        <input
          placeholder="输入整数，逗号分隔，如 3,1,2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleExecute}>执行</button>
        <button className="secondary" onClick={handleExport}>导出 CSV</button>
      </div>
      {result && (
        <div className="result-box">
          input: [{result.input.join(", ")}]
          <br />
          sorted: [{result.sorted.join(", ")}]
          <br />
          steps: {result.steps}
        </div>
      )}
      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
