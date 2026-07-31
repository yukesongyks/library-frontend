import { useState } from "react";
import { fetchHash, exportTab, HashResult } from "../api";

const ALGORITHMS = ["SHA-256", "SHA-512", "MD5"];

export default function HashTab() {
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<HashResult | null>(null);
  const [error, setError] = useState("");

  const handleExecute = async () => {
    try {
      setError("");
      const res = await fetchHash(algorithm, input);
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  };

  const handleExport = async () => {
    try {
      setError("");
      const blob = await exportTab("hash", "csv");
      downloadBlob(blob, "hash.csv");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="tab-content">
      <div className="export-row">
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
          {ALGORITHMS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          placeholder="输入文本"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={handleExecute}>执行</button>
        <button className="secondary" onClick={handleExport}>导出 CSV</button>
      </div>
      {result && (
        <div className="result-box">
          algorithm: {result.algorithm}
          <br />
          input: {result.input}
          <br />
          hash: {result.hash}
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
