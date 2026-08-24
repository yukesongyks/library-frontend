import React, { useState } from 'react';
import { Card, Space, Typography, Alert, Spin } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { TextIconButton } from '../../components';
import { fetchHelloworld } from '../../services/dtcoderApi';

const { Text } = Typography;

/**
 * Helloworld 演示 Tab
 */
function HelloworldTab() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleExecute = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchHelloworld();
      if (response.code === 200) {
        setResult(response.data.result);
      } else {
        setError(response.message || '请求失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求异常');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Helloworld 演示" bordered={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">
          调用后端 GET /api/dtcoder/helloworld 接口，获取 Helloworld 响应
        </Text>
        <TextIconButton
          icon={<PlayCircleOutlined />}
          onClick={handleExecute}
          loading={loading}
        >
          执行
        </TextIconButton>
        <Spin spinning={loading}>
          {error && <Alert type="error" message={error} showIcon />}
          {result && (
            <Card type="inner" title="执行结果">
              <Text code>{result}</Text>
            </Card>
          )}
        </Spin>
      </Space>
    </Card>
  );
}

export default HelloworldTab;
