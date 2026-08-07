import { useState } from 'react'
import { Button, Card, Input, Typography, message, Space } from 'antd'
import { callHash, exportUrl } from '../api'
import { formatOutput } from '../types'
import type { AlgoResult } from '../types'

const { Text } = Typography

export default function HashTab() {
  const [input, setInput] = useState('hello')
  const [result, setResult] = useState<AlgoResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    try {
      setResult(await callHash(input))
    } catch {
      message.error('调用失败')
    } finally {
      setLoading(false)
    }
  }

  function doExport() {
    window.open(`${exportUrl('hash')}?input=${encodeURIComponent(input)}`, '_blank')
  }

  return (
    <Card title="哈希算法 (SHA-256)">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入待哈希字符串" />
        <Space>
          <Button type="primary" loading={loading} onClick={run}>执行</Button>
          <Button onClick={doExport}>导出 CSV</Button>
        </Space>
      </Space>
      {result && (
        <div style={{ marginTop: 16 }}>
          <Text>输入：{formatOutput(result.input as string | null)}</Text><br />
          <Text>输出(SHA-256)：{formatOutput(result.output)}</Text><br />
          <Text>耗时：{result.durationMs} ms</Text>
        </div>
      )}
    </Card>
  )
}
