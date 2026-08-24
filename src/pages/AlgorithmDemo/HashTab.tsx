import React, { useState } from 'react';
import { Card, Input, Space, Typography, Alert, Spin } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { TextIconButton } from '../../components';
import { computeHash } from '../../services/dtcoderApi';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * 哈希算法 Tab
 */
function HashTab() {
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleExecute = async () => {
    if (!input.trim()) {
      setError('请输入待哈希的文本');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await computeHash({ input: input.trim() });
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
    <Card title="哈希算法" bordered={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">
          调用后端 POST /api/dtcoder/hash 接口，计算输入文本的哈希值
        </Text>
        <TextArea
          rows={3}
          placeholder="请输入待哈希的文本"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <TextIconButton
          icon={<PlayCircleOutlined />}
          onClick={handleExecute}
          loading={loading}
          disabled={!input.trim()}
        >
          执行哈希
        </TextIconButton>
        <Spin spinning={loading}>
          {error && <Alert type="error" message={error} showIcon />}
          {result && (
            <Card type="inner" title="哈希结果">
              <Text code copyable>
                {result}
              </Text>
            </Card>
          )}
        </Spin>
      </Space>
    </Card>
  );
}

export default HashTab;
