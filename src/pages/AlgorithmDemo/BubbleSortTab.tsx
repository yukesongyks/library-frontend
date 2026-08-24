import React, { useState } from 'react';
import { Card, Input, Space, Typography, Alert, Spin, Tag } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { TextIconButton } from '../../components';
import { computeBubbleSort } from '../../services/dtcoderApi';

const { Text } = Typography;

/**
 * 冒泡排序 Tab
 */
function BubbleSortTab() {
  const [input, setInput] = useState<string>('');
  const [sorted, setSorted] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleExecute = async () => {
    const raw = input.trim();
    if (!raw) {
      setError('请输入数字数组，以逗号分隔');
      return;
    }

    const parts = raw.split(/[,，\s]+/).filter(Boolean);
    const array = parts.map(Number);
    if (array.some(Number.isNaN)) {
      setError('请输入有效的数字，以逗号分隔');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await computeBubbleSort({ array });
      if (response.code === 200) {
        setSorted(response.data.sorted);
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
    <Card title="冒泡排序" bordered={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">
          调用后端 POST /api/dtcoder/bubble-sort 接口，对输入数组进行冒泡排序
        </Text>
        <Input
          placeholder="请输入数字，以逗号分隔，例如：5,3,8,1,9,2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <TextIconButton
          icon={<PlayCircleOutlined />}
          onClick={handleExecute}
          loading={loading}
          disabled={!input.trim()}
        >
          执行排序
        </TextIconButton>
        <Spin spinning={loading}>
          {error && <Alert type="error" message={error} showIcon />}
          {sorted.length > 0 && (
            <Card type="inner" title="排序结果">
              <Space wrap>
                {sorted.map((num, idx) => (
                  <Tag key={idx} color="blue">
                    {num}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}
        </Spin>
      </Space>
    </Card>
  );
}

export default BubbleSortTab;
