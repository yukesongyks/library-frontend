import React, { useState } from 'react';
import { Card, Input, Select, Button, Table, Space, Typography, Tag, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callBubbleSort } from '../../services/demoApi';
import type { BubbleSortData } from '../../types/demo';
import ExportButton from './components/ExportButton';

interface HistoryRecord {
  key: number;
  original: string;
  sorted: string;
  order: string;
  stepsCount: number;
  timestamp: string;
}

const BubbleSortTab: React.FC = () => {
  const [numbersInput, setNumbersInput] = useState('5, 3, 8, 1, 9, 2');
  const [order, setOrder] = useState<string>('ASC');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BubbleSortData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const handleCall = async () => {
    const numbers = numbersInput
      .split(/[,\\s]+/)
      .filter((s) => s.trim() !== '')
      .map(Number);

    if (numbers.some(isNaN)) {
      message.warning('请输入有效的数字，用逗号分隔');
      return;
    }
    if (numbers.length === 0) {
      message.warning('请输入至少一个数字');
      return;
    }

    setLoading(true);
    try {
      const res = await callBubbleSort({ numbers, order: order as any });
      if (res.code === 200) {
        setResult(res.data);
        setHistory((prev) => [
          {
            key: Date.now(),
            original: res.data.original.join(', '),
            sorted: res.data.sorted.join(', '),
            order: res.data.order,
            stepsCount: res.data.steps.length,
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
    { title: '原始数组', dataIndex: 'original', key: 'original', ellipsis: true },
    { title: '排序结果', dataIndex: 'sorted', key: 'sorted', ellipsis: true },
    { title: '方向', dataIndex: 'order', key: 'order', width: 80 },
    { title: '步骤数', dataIndex: 'stepsCount', key: 'stepsCount', width: 80 },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 200 },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="冒泡排序接口调用">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="输入数字，用逗号分隔（如: 5, 3, 8, 1, 9, 2）"
            value={numbersInput}
            onChange={(e) => setNumbersInput(e.target.value)}
          />
          <Space>
            <Select value={order} onChange={setOrder} style={{ width: 120 }}>
              <Select.Option value="ASC">升序 (ASC)</Select.Option>
              <Select.Option value="DESC">降序 (DESC)</Select.Option>
            </Select>
            <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleCall}>
              排序
            </Button>
          </Space>
        </Space>

        {result && (
          <Card style={{ marginTop: 16 }} type="inner" title="排序结果">
            <Typography.Paragraph>
              <strong>原始:</strong> [{result.original.join(', ')}]
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>结果:</strong> [{result.sorted.join(', ')}] <Tag color="green">{result.order}</Tag>
            </Typography.Paragraph>
            <Typography.Title level={5}>排序步骤</Typography.Title>
            {result.steps.map((step, idx) => (
              <Typography.Paragraph key={idx}>
                <Tag>第 {idx + 1} 轮</Tag> [{step.join(', ')}]
              </Typography.Paragraph>
            ))}
          </Card>
        )}
      </Card>

      <Card title="调用历史" extra={<ExportButton type="bubble-sort" />}>
        <Table dataSource={history} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  );
};

export default BubbleSortTab;
