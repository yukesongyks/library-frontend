### Task 8: Dashboard 总览页（指标卡 + 趋势图）

**Files:**
- Create: `library-frontend/src/components/EChart.tsx`
- Create: `library-frontend/src/components/StatCard.tsx`
- Create: `library-frontend/src/pages/Dashboard.tsx`
- Test: `library-frontend/src/pages/Dashboard.test.tsx`

**Interfaces:**
- Consumes: Task 7 的 `fetchSummary`、`CostSummary`、`formatMoney`、`formatPercent`。
- Produces: `Dashboard` 组件（`/` 路由渲染，Task 9 接入路由）；`EChart`、`StatCard` 复用组件。

- [ ] **Step 1: 创建通用图表组件 `src/components/EChart.tsx`**

```tsx
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
```

- [ ] **Step 2: 创建指标卡组件 `src/components/StatCard.tsx`**

```tsx
import { Card, Statistic } from 'antd'

export default function StatCard({
  title,
  value,
  extra
}: {
  title: string
  value: string
  extra?: string
}) {
  return (
    <Card data-testid={`stat-${title}`}>
      <Statistic title={title} value={value} />
      {extra ? <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginTop: 8 }}>{extra}</div> : null}
    </Card>
  )
}
```

- [ ] **Step 3: 创建 `src/pages/Dashboard.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Card, Col, Row, Select, Space, Spin, Typography } from 'antd'
import type { EChartsOption } from 'echarts'
import { fetchSummary } from '../api/cost'
import type { CostSummary } from '../api/types'
import EChart from '../components/EChart'
import StatCard from '../components/StatCard'
import { formatMoney, formatPercent } from '../utils/format'

export default function Dashboard() {
  const [year, setYear] = useState('2025')
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchSummary(year)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [year])

  const trendOption: EChartsOption | null = summary
    ? {
        tooltip: { trigger: 'axis' },
        legend: { data: ['人力成本', '项目成本'] },
        xAxis: { type: 'category', data: summary.monthlyTrend.map((m) => m.month) },
        yAxis: { type: 'value' },
        series: [
          { name: '人力成本', type: 'bar', data: summary.monthlyTrend.map((m) => m.laborCost) },
          { name: '项目成本', type: 'bar', data: summary.monthlyTrend.map((m) => m.projectCost) }
        ]
      }
    : null

  return (
    <div data-testid="dashboard">
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          成本总览 Dashboard
        </Typography.Title>
        <Select
          aria-label="年份"
          value={year}
          onChange={setYear}
          options={[
            { value: '2024', label: '2024年' },
            { value: '2025', label: '2025年' }
          ]}
          style={{ width: 120 }}
        />
      </Space>
      {loading ? <Spin data-testid="dashboard-loading" /> : null}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {summary ? (
        <>
          <Row gutter={16}>
            <Col span={6}>
              <StatCard title="总成本" value={formatMoney(summary.totalCost)} />
            </Col>
            <Col span={6}>
              <StatCard
                title="人力成本"
                value={formatMoney(summary.laborCost)}
                extra={`占比 ${formatPercent(summary.laborRatio)}`}
              />
            </Col>
            <Col span={6}>
              <StatCard
                title="项目成本"
                value={formatMoney(summary.projectCost)}
                extra={`占比 ${formatPercent(summary.projectRatio)}`}
              />
            </Col>
            <Col span={6}>
              <StatCard title="超支项目数" value={String(summary.overBudgetCount)} />
            </Col>
          </Row>
          <Card title="月度成本趋势" style={{ marginTop: 16 }}>
            {trendOption ? <EChart option={trendOption} testId="cost-trend-chart" /> : null}
          </Card>
        </>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: 编写 `src/pages/Dashboard.test.tsx`**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { fetchSummary } from '../api/cost'
import Dashboard from '../pages/Dashboard'

vi.mock('../api/cost', () => ({ fetchSummary: vi.fn() }))
vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn() }))
}))

const summary = {
  totalCost: 2004000,
  laborCost: 414000,
  projectCost: 1590000,
  laborRatio: 20.66,
  projectRatio: 79.34,
  overBudgetCount: 1,
  monthlyTrend: [
    { month: '2025-01', laborCost: 69000, projectCost: 265000, totalCost: 334000 },
    { month: '2025-02', laborCost: 69000, projectCost: 265000, totalCost: 334000 }
  ]
}

describe('Dashboard', () => {
  it('加载后展示总览指标与趋势图', async () => {
    ;(fetchSummary as ReturnType<typeof vi.fn>).mockResolvedValue(summary)
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByText('¥2,004,000.00')).toBeInTheDocument())
    expect(screen.getByText('超支项目数')).toBeInTheDocument()
    expect(screen.getByTestId('cost-trend-chart')).toBeInTheDocument()
  })

  it('接口失败时展示错误信息', async () => {
    ;(fetchSummary as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('网络错误'))
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByText('网络错误')).toBeInTheDocument())
  })
})
```

- [ ] **Step 5: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main && npm test && npm run build`
Expected: Dashboard 2 项测试通过；构建成功（类型无错误）。

- [ ] **Step 6: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add src/components src/pages/Dashboard.tsx src/pages/Dashboard.test.tsx
git commit -m "feat: Dashboard 成本总览页（指标卡与月度趋势图）

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

