import React, { useState } from 'react';
import { Input, Button, Space, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callHelloWorld } from '../services/demoApi';
import type { HelloWorldResult } from '../types/demo';
import ResultTable from './ResultTable';
import ExportButton from './ExportButton';
import type { ColumnsType } from 'antd/es/table';

const HelloWorldTab: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HelloWorldResult[]>([]);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await callHelloWorld({ name: name || undefined });
      setResults((prev) => [res.data, ...prev]);
      message.success('执行成功');
    } catch {
      message.error('执行失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<HelloWorldResult> = [
    { title: '返回结果', dataIndex: 'result', key: 'result' },
    { title: '调用时间', dataIndex: 'timestamp', key: 'timestamp' },
    { title: '耗时(ms)', dataIndex: 'executionTimeMs', key: 'executionTimeMs', width: 100 },
  ];

  return (
    <div>
      <Card title="HelloWorld 接口" style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="输入名称（可选，默认 World）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleExecute}
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
      </Card>

      <Card
        title="执行结果"
        extra={<ExportButton apiType="HELLOWORLD" />}
      >
        <ResultTable columns={columns} dataSource={results} loading={loading} />
      </Card>
    </div>
  );
};

export default HelloWorldTab;
