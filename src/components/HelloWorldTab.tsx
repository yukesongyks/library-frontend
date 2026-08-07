import { useState } from 'react'
import { Button, Card, Typography, message, Space } from 'antd'
import { callHello, exportUrl } from '../api'
import { formatOutput } from '../types'
import type { AlgoResult } from '../types'

const { Text } = Typography

export default function HelloWorldTab() {
  const [result, setResult] = useState<AlgoResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    try {
      setResult(await callHello())
    } catch {
      message.error('调用失败')
    } finally {
      setLoading(false)
    }
  }

  // m3: 导出不依赖 result，始终可用
  function doExport() {
    window.open(exportUrl('helloworld'), '_blank')
  }

  return (
    <Card title="HelloWorld 算法">
      <Space>
        <Button type="primary" loading={loading} onClick={run}>执行</Button>
        <Button onClick={doExport}>导出 CSV</Button>
      </Space>
      {result && (
        <div style={{ marginTop: 16 }}>
          <Text>输出：{formatOutput(result.output)}</Text><br />
          <Text>耗时：{result.durationMs} ms</Text>
        </div>
      )}
    </Card>
  )
}
