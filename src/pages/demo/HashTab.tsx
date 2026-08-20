import React, { useState } from 'react';
import { Card, Input, Select, Button, Table, Space, Typography, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callHash } from '../../services/demoApi';
import type { HashData } from '../../types/demo';
import ExportButton from './components/ExportButton';

const { TextArea } = Input;

interface HistoryRecord {
  key: number;
  input: string;
  algorithm: string;
  hashValue: string;
  timestamp: string;
}

const HashTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<string>('SHA-256');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HashData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const handleCall = async () => {
    if (!input.trim()) {
      message.warning('请输入待哈希的原文');
      return;
    }
    setLoading(true);
    try {
      const res = await callHash({ input, algorithm: algorithm as any });
      if (res.code === 200) {
        setResult(res.data);
        setHistory((prev) => [
          {
            key: Date.now(),
            input: res.data.input,
            algorithm: res.data.algorithm,
            hashValue: res.data.hashValue,
            timestamp: res.data.timestamp,
          },
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
    { title: '原文', dataIndex: 'input', key: 'input', ellipsis: true },
    { title: '算法', dataIndex: 'algorithm', key: 'algorithm', width: 100 },
    { title: '哈希值', dataIndex: 'hashValue', key: 'hashValue', ellipsis: true },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 200 },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="哈希算法接口调用">
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            placeholder="请输入待哈希的原文"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
          />
          <Space>
            <Select value={algorithm} onChange={setAlgorithm} style={{ width: 160 }}>
              <Select.Option value="MD5">MD5</Select.Option>
              <Select.Option value="SHA-1">SHA-1</Select.Option>
              <Select.Option value="SHA-256">SHA-256</Select.Option>
            </Select>
            <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleCall}>
              计算哈希
            </Button>
          </Space>
        </Space>
        {result && (
          <Card style={{ marginTop: 16 }} type="inner" title="哈希结果">
            <Typography.Paragraph><strong>算法:</strong> {result.algorithm}</Typography.Paragraph>
            <Typography.Paragraph copyable><strong>哈希值:</strong> {result.hashValue}</Typography.Paragraph>
          </Card>
        )}
      </Card>

      <Card title="调用历史" extra={<ExportButton type="hash" />}>
        <Table dataSource={history} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  );
};

export default HashTab;
