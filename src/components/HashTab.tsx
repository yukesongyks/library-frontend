import React, { useState } from 'react'
import { Button, Card, Input, Select, Space, Typography, message, Descriptions } from 'antd'
import { callHash, exportExcel } from '../api/demoApi'
import type { UserInfo } from './UserInfoForm'

const { Text } = Typography

const ALGO_OPTIONS = [{ label: 'SHA-256', value: 'SHA-256' }]

interface Props {
  userInfo: UserInfo
}

const HashTab: React.FC<Props> = ({ userInfo }) => {
  const [input, setInput] = useState('')
  const [algorithm, setAlgorithm] = useState('SHA-256')
  const [result, setResult] = useState<{ input: string; hash: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCall = async () => {
    if (!input.trim()) {
      message.warning('请输入待哈希的字符串')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await callHash({ ...userInfo, input: input.trim(), algorithm })
      if (resp.code === 200) {
        setResult(resp.data)
        message.success('哈希计算成功')
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
      await exportExcel({ ...userInfo, tab: 'hash' })
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
            placeholder="输入待哈希的字符串"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: 300 }}
          />
          <Select options={ALGO_OPTIONS} value={algorithm} onChange={setAlgorithm} style={{ width: 130 }} />
          <Button type="primary" onClick={handleCall} loading={loading}>
            计算哈希
          </Button>
          <Button onClick={handleExport} disabled={!result}>
            导出 Excel
          </Button>
        </Space>
        {result && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="输入">{result.input}</Descriptions.Item>
            <Descriptions.Item label="哈希值">
              <Text code copyable style={{ wordBreak: 'break-all' }}>
                {result.hash}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
        {error && <Text type="danger">{error}</Text>}
      </Space>
    </Card>
  )
}

export default HashTab