import { Card, Typography } from 'antd';

const { Text } = Typography;

interface Props<T = Record<string, unknown>> {
  data: T | null;
}

export default function ResultDisplay<T = Record<string, unknown>>({ data }: Props<T>) {
  if (!data) return null;

  return (
    <Card title="执行结果" size="small" style={{ marginTop: 16 }}>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
        <Text code>{JSON.stringify(data, null, 2)}</Text>
      </pre>
    </Card>
  );
}