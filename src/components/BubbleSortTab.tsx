import { useState } from "react";
import { Alert, Button, Card, Form, Input } from "antd";
import { sortArray } from "@/api/bubbleSort";

/**
 * Bubble-sort tab.
 * - Form with a single Input for a comma-separated list of numbers.
 * - Parses the input, posts it to the backend, and displays the sorted array.
 * - On error shows an Alert with a retry button (same pattern as HashTab).
 */
export default function BubbleSortTab() {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [sorted, setSorted] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseNumbers = (text: string): number[] => {
    return text
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const n = Number(part);
        if (!Number.isFinite(n)) {
          throw new Error(`Invalid number: "${part}"`);
        }
        return n;
      });
  };

  const handleSort = async () => {
    setLoading(true);
    setError(null);
    try {
      const array = parseNumbers(raw);
      const data = await sortArray(array);
      setSorted(data.sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSorted(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    void handleSort();
  };

  return (
    <Card title="Bubble Sort">
      <Form layout="vertical">
        <Form.Item label="Numbers (comma-separated)">
          <Input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="e.g. 5, 3, 8, 1, 9, 2"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" loading={loading} onClick={handleSort}>
            Sort
          </Button>
        </Form.Item>
      </Form>

      {error && (
        <Alert
          type="error"
          message="Sort failed"
          description={error}
          showIcon
          action={<Button onClick={handleRetry}>Retry</Button>}
        />
      )}

      {sorted && !error && (
        <Alert
          type="success"
          message="Sorted result"
          description={`[${sorted.join(", ")}]`}
          showIcon
        />
      )}
    </Card>
  );
}
