import React, { useState } from 'react';
import { Card, Input, Button, Table, Space, Typography, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callHelloWorld } from '../../services/demoApi';
import type { HelloWorldData } from '../../types/demo';
import ExportButton from './components/ExportButton';

const { Title } = Typography;

interface HistoryRecord {
  key: number;
  input: string;
  result: string;
  timestamp: string;
}

const HelloWorldTab: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HelloWorldData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const handleCall = async () => {
    setLoading(true);
    try {
      const res = await callHelloWorld({ name: name || undefined });
      if (res.code === 200) {
        setResult(res.data);
        setHistory((prev) => [
          { key: Date.now(), input: name || '(empty)', result: res.data.result, timestamp: res.data.timestamp },
          ...prev,
        ]);
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '输入', dataIndex: 'input', key: 'input' },
    { title: '结果', dataIndex: 'result', key: 'result' },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="HelloWorld 接口调用">
        <Space>
          <Input
            placeholder="输入姓名（可选，默认 World）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleCall}
          />
          <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleCall}>
            调用
          </Button>
        </Space>
        {result && (
          <Card style={{ marginTop: 16 }} type="inner" title="返回结果">
            <Title level={4}>{result.result}</Title>
            <Typography.Text type="secondary">时间: {result.timestamp}</Typography.Text>
          </Card>
        )}
      </Card>

      <Card title="调用历史" extra={<ExportButton type="helloworld" />}>
        <Table dataSource={history} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  );
};

export default HelloWorldTab;
