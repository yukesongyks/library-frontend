import React, { useState } from 'react'
import { Button, Card, Typography, Space, message, Descriptions } from 'antd'
import { callHello, exportExcel } from '../api/demoApi'
import type { UserInfo } from './UserInfoForm'

const { Text } = Typography

interface Props {
  userInfo: UserInfo
}

const HelloTab: React.FC<Props> = ({ userInfo }) => {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCall = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await callHello({ ...userInfo })
      if (resp.code === 200) {
        setResult(resp.data.message)
        message.success('调用成功')
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
      await exportExcel({ ...userInfo, tab: 'hello' })
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
          <Button type="primary" onClick={handleCall} loading={loading}>
            调用 Hello World
          </Button>
          <Button onClick={handleExport} disabled={!result}>
            导出 Excel
          </Button>
        </Space>
        {result && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="响应结果">
              <Text code style={{ fontSize: 16 }}>
                {result}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
        {error && <Text type="danger">{error}</Text>}
      </Space>
    </Card>
  )
}

export default HelloTab