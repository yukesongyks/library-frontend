import React, { useState } from 'react';
import { Input, Select, Button, Space, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callBubbleSort } from '../services/demoApi';
import type { BubbleSortResult } from '../types/demo';
import ResultTable from './ResultTable';
import ExportButton from './ExportButton';
import type { ColumnsType } from 'antd/es/table';

const BubbleSortTab: React.FC = () => {
  const [numbersInput, setNumbersInput] = useState('');
  const [order, setOrder] = useState<string>('ASC');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BubbleSortResult[]>([]);

  const handleExecute = async () => {
    const nums = numbersInput
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map(Number);

    if (nums.length === 0 || nums.some(isNaN)) {
      message.warning('请输入有效的数字数组（逗号分隔）');
      return;
    }

    setLoading(true);
    try {
      const res = await callBubbleSort({
        numbers: nums,
        order: order as 'ASC' | 'DESC',
      });
      setResults((prev) => [res.data, ...prev]);
      message.success('执行成功');
    } catch {
      message.error('执行失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<BubbleSortResult> = [
    {
      title: '原始数组',
      dataIndex: 'original',
      key: 'original',
      render: (val: number[]) => `[${val.join(', ')}]`,
    },
    {
      title: '排序结果',
      dataIndex: 'sorted',
      key: 'sorted',
      render: (val: number[]) => `[${val.join(', ')}]`,
    },
    { title: '方向', dataIndex: 'order', key: 'order', width: 80 },
    { title: '交换次数', dataIndex: 'swapCount', key: 'swapCount', width: 100 },
    { title: '调用时间', dataIndex: 'timestamp', key: 'timestamp' },
    { title: '耗时(ms)', dataIndex: 'executionTimeMs', key: 'executionTimeMs', width: 100 },
  ];

  return (
    <div>
      <Card title="冒泡排序接口" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="输入数字，逗号分隔，如: 5, 3, 8, 1, 9, 2"
            value={numbersInput}
            onChange={(e) => setNumbersInput(e.target.value)}
            onPressEnter={handleExecute}
          />
          <Space>
            <Select
              value={order}
              onChange={setOrder}
              style={{ width: 120 }}
              options={[
                { label: '升序 (ASC)', value: 'ASC' },
                { label: '降序 (DESC)', value: 'DESC' },
              ]}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={handleExecute}
            >
              执行
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        title="执行结果"
        extra={<ExportButton apiType="BUBBLE_SORT" />}
      >
        <ResultTable columns={columns} dataSource={results} loading={loading} />
      </Card>
    </div>
  );
};

export default BubbleSortTab;
