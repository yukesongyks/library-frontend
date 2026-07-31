import { Alert, Button, Card, Spin } from "antd";
import { useApiResult } from "@/hooks/useApiResult";
import { getHelloWorld } from "@/api/helloworld";

/**
 * Fetches the hello-world message on mount and displays it in a Card.
 * - Loading: Spin.
 * - Error: Alert with a retry button (no white screen).
 */
export default function HelloWorldTab() {
  const { loading, error, data, retry } = useApiResult(getHelloWorld);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load hello-world data"
        description={error}
        showIcon
        action={<Button onClick={retry}>Retry</Button>}
      />
    );
  }

  if (!data) {
    return <Alert type="info" message="No data available." showIcon />;
  }

  return (
    <Card title="Hello World">
      <Alert type="success" message={data.message} showIcon />
    </Card>
  );
}
