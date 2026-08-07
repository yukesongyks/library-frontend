import { useState } from 'react'
import { Button, Card, Input, Typography, message, Space } from 'antd'
import { callBubble, exportUrl } from '../api'
import type { AlgoResult } from '../types'

const { Text } = Typography

export default function BubbleSortTab() {
  const [input, setInput] = useState('5,3,8,1,9,2,7')
  const [result, setResult] = useState<AlgoResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    try {
      setResult(await callBubble(input))
    } catch {
      message.error('调用失败')
    } finally {
      setLoading(false)
    }
  }

  function doExport() {
    window.open(`${exportUrl('bubblesort')}?sortInput=${encodeURIComponent(input)}`, '_blank')
  }

  return (
    <Card title="冒泡排序">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入逗号分隔的数字" />
        <Space>
          <Button type="primary" loading={loading} onClick={run}>执行</Button>
          <Button onClick={doExport} disabled={!result}>导出 CSV</Button>
        </Space>
      </Space>
      {result && (
        <div style={{ marginTop: 16 }}>
          <Text>输入：{String(result.input)}</Text><br />
          <Text>输出：{String(result.output)}</Text><br />
          <Text>耗时：{result.durationMs} ms</Text>
        </div>
      )}
    </Card>
  )
}
