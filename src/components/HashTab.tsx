import { useState } from "react";
import { Alert, Button, Card, Descriptions, Form, Input, Select } from "antd";
import { computeHash } from "@/api/hash";
import type { HashData } from "@/types/api";

const { TextArea } = Input;

const ALGORITHM_OPTIONS = [
  { value: "sha256", label: "sha256" },
  { value: "md5", label: "md5" },
];

/**
 * Hash computation tab.
 * - Form with a text area for input and a select for algorithm.
 * - On success displays { input, algorithm, hash } in Descriptions.
 * - On `code !== 0` shows the backend message (surfaced as an error by client).
 * - On network error shows an error Alert with a retry button.
 */
export default function HashTab() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState("sha256");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HashData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompute = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await computeHash(input, algorithm);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    void handleCompute();
  };

  return (
    <Card title="Hash">
      <Form layout="vertical">
        <Form.Item label="Input">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash"
            autoSize={{ minRows: 3 }}
          />
        </Form.Item>
        <Form.Item label="Algorithm">
          <Select
            value={algorithm}
            onChange={(v) => setAlgorithm(v)}
            options={ALGORITHM_OPTIONS}
            style={{ maxWidth: 200 }}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" loading={loading} onClick={handleCompute}>
            Compute Hash
          </Button>
        </Form.Item>
      </Form>

      {error && (
        <Alert
          type="error"
          message="Hash computation failed"
          description={error}
          showIcon
          action={<Button onClick={handleRetry}>Retry</Button>}
        />
      )}

      {result && !error && (
        <Descriptions title="Result" bordered column={1}>
          <Descriptions.Item label="Input">{result.input}</Descriptions.Item>
          <Descriptions.Item label="Algorithm">
            {result.algorithm}
          </Descriptions.Item>
          <Descriptions.Item label="Hash">{result.hash}</Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  );
}
