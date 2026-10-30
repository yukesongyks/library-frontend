import React, { useState } from 'react'
import { Button, Card, Input, Space, Typography, message, Descriptions } from 'antd'
import { callBubbleSort, exportExcel } from '../api/demoApi'
import type { UserInfo } from './UserInfoForm'

const { Text } = Typography

interface Props {
  userInfo: UserInfo
}

const BubbleSortTab: React.FC<Props> = ({ userInfo }) => {
  const [input, setInput] = useState('5,3,8,1,2')
  const [result, setResult] = useState<{ original: number[]; sorted: number[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseArray = (): number[] => {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map(Number)
      .filter((n) => !isNaN(n))
  }

  const handleCall = async () => {
    const arr = parseArray()
    if (arr.length === 0) {
      message.warning('请输入有效的数字数组（逗号分隔）')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await callBubbleSort({ ...userInfo, array: arr })
      if (resp.code === 200) {
        setResult(resp.data)
        message.success('排序完成')
      } else {
        setError(resp.message || '接口返回异常')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '网络错误'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      await exportExcel({ ...userInfo, tab: 'bubble-sort' })
      message.success('导出成功')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '导出失败'
      message.error(msg)
    }
  }

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Input
            placeholder="输入数字数组（逗号分隔）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: 300 }}
          />
          <Button type="primary" onClick={handleCall} loading={loading}>
            冒泡排序
          </Button>
          <Button onClick={handleExport} disabled={!result}>
            导出 Excel
          </Button>
        </Space>
        {result && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="原始数组">
              <Text code>[{result.original.join(', ')}]</Text>
            </Descriptions.Item>
            <Descriptions.Item label="排序结果">
              <Text code style={{ color: '#52c41a' }}>
                [{result.sorted.join(', ')}]
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
        {error && <Text type="danger">{error}</Text>}
      </Space>
    </Card>
  )
}

export default BubbleSortTab