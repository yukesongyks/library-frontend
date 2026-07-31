import { useState } from "react";
import { fetchHelloWorld, exportTab } from "../api";

export default function HelloWorldTab() {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const handleExecute = async () => {
    try {
      setError("");
      const text = await fetchHelloWorld(userId || undefined);
      setResult(text);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleExport = async () => {
    try {
      setError("");
      const blob = await exportTab("helloworld", "csv");
      downloadBlob(blob, "helloworld.csv");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="tab-content">
      <div className="export-row">
        <input
          placeholder="X-User-Id (可选)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={handleExecute}>执行</button>
        <button className="secondary" onClick={handleExport}>导出 CSV</button>
      </div>
      {result && <div className="result-box">{result}</div>}
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
