import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useEffect, useRef } from 'react'

export default function EChart({
  option,
  height = 320,
  testId = 'echart'
}: {
  option: EChartsOption
  height?: number
  testId?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption(option)
    return () => chart.dispose()
  }, [option])

  return <div ref={ref} style={{ height }} data-testid={testId} />
}