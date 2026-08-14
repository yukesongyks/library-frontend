import React, { useState } from 'react';
import { Input, Select, Button, Space, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callHash } from '../services/demoApi';
import type { HashResult } from '../types/demo';
import ResultTable from './ResultTable';
import ExportButton from './ExportButton';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

const HashTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<string>('SHA256');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HashResult[]>([]);

  const handleExecute = async () => {
    if (!input.trim()) {
      message.warning('请输入原始文本');
      return;
    }
    setLoading(true);
    try {
      const res = await callHash({
        input,
        algorithm: algorithm as 'MD5' | 'SHA1' | 'SHA256' | 'SHA512',
      });
      setResults((prev) => [res.data, ...prev]);
      message.success('执行成功');
    } catch {
      message.error('执行失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<HashResult> = [
    { title: '原始文本', dataIndex: 'input', key: 'input', ellipsis: true },
    { title: '算法', dataIndex: 'algorithm', key: 'algorithm', width: 100 },
    { title: '哈希结果', dataIndex: 'hashResult', key: 'hashResult', ellipsis: true },
    { title: '调用时间', dataIndex: 'timestamp', key: 'timestamp' },
    { title: '耗时(ms)', dataIndex: 'executionTimeMs', key: 'executionTimeMs', width: 100 },
  ];

  return (
    <div>
      <Card title="哈希算法接口" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            placeholder="请输入待哈希的原始文本"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
          />
          <Space>
            <Select
              value={algorithm}
              onChange={setAlgorithm}
              style={{ width: 150 }}
              options={[
                { label: 'MD5', value: 'MD5' },
                { label: 'SHA1', value: 'SHA1' },
                { label: 'SHA256', value: 'SHA256' },
                { label: 'SHA512', value: 'SHA512' },
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
        extra={<ExportButton apiType="HASH" />}
      >
        <ResultTable columns={columns} dataSource={results} loading={loading} />
      </Card>
    </div>
  );
};

export default HashTab;
