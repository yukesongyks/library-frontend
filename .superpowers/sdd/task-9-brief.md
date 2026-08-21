### Task 9: 成本统计分析页（多维筛选 + 表格 + 图表 + 导出）与路由接入

**Files:**
- Create: `library-frontend/src/pages/CostAnalysis.tsx`
- Test: `library-frontend/src/pages/CostAnalysis.test.tsx`
- Modify: `library-frontend/src/App.tsx`（替换 Task 6 外壳为完整 Layout 路由）
- Modify: `library-frontend/src/App.test.tsx`（替换为路由级冒烟测试）

**Interfaces:**
- Consumes: Task 7 的 `fetchAnalysis`、`buildExportUrl`、`DIMENSION_LABELS`、`ROLES`、`ROLE_LABELS`、`CostAnalysisItem`、`AnalysisQuery`、`Dimension`；Task 8 的 `EChart`。
- Produces: `/` 与 `/cost-analysis` 两个路由页面；导出链接直连 `GET /api/cost/export`。

- [ ] **Step 1: 创建 `src/pages/CostAnalysis.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { Button, Select, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { buildExportUrl, fetchAnalysis } from '../api/cost'
import { DIMENSION_LABELS, ROLES, ROLE_LABELS } from '../api/types'
import type { AnalysisQuery, CostAnalysisItem, Dimension } from '../api/types'
import EChart from '../components/EChart'
import { formatMoney, formatPercent } from '../utils/format'

export default function CostAnalysis() {
  const [dimension, setDimension] = useState<Dimension>('department')
  const [year, setYear] = useState('2025')
  const [role, setRole] = useState<string | undefined>(undefined)
  const [rows, setRows] = useState<CostAnalysisItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const query: AnalysisQuery = { dimension, year, role }

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchAnalysis(query)
      .then((resp) => setRows(resp.records))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension, year, role])

  useEffect(() => {
    load()
  }, [load])

  const columns: ColumnsType<CostAnalysisItem> = [
    { title: DIMENSION_LABELS[dimension], dataIndex: 'name', key: 'name' },
    {
      title: '人力成本',
      dataIndex: 'laborCost',
      key: 'laborCost',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '项目预算',
      dataIndex: 'projectBudget',
      key: 'projectBudget',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '实际消耗',
      dataIndex: 'projectActual',
      key: 'projectActual',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '预算占比',
      dataIndex: 'budgetRatio',
      key: 'budgetRatio',
      render: (v: number) => formatPercent(v)
    },
    {
      title: '预计超支金额',
      dataIndex: 'overBudgetAmount',
      key: 'overBudgetAmount',
      render: (v: number) => formatMoney(v)
    }
  ]

  const chartOption =
    rows.length > 0
      ? {
          tooltip: { trigger: 'axis' },
          legend: { data: ['人力成本', '实际消耗'] },
          xAxis: { type: 'category', data: rows.slice(0, 10).map((r) => r.name) },
          yAxis: { type: 'value' },
          series: [
            { name: '人力成本', type: 'bar', data: rows.slice(0, 10).map((r) => r.laborCost) },
            { name: '实际消耗', type: 'bar', data: rows.slice(0, 10).map((r) => r.projectActual) }
          ]
        }
      : null

  return (
    <div data-testid="cost-analysis">
      <Space style={{ marginBottom: 16 }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          成本统计分析
        </Typography.Title>
        <Select
          aria-label="维度"
          value={dimension}
          onChange={(v: Dimension) => setDimension(v)}
          options={Object.entries(DIMENSION_LABELS).map(([value, label]) => ({ value, label }))}
          style={{ width: 120 }}
        />
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
        <Select
          aria-label="岗位角色"
          value={role}
          onChange={setRole}
          allowClear
          placeholder="全部角色"
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          style={{ width: 140 }}
        />
        <Button type="primary" onClick={load}>
          查询
        </Button>
        <Button>
          <a href={buildExportUrl(query, 'xlsx')} download>
            导出 Excel
          </a>
        </Button>
        <Button>
          <a href={buildExportUrl(query, 'csv')} download>
            导出 CSV
          </a>
        </Button>
      </Space>
      {loading ? <Spin data-testid="analysis-loading" /> : null}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {chartOption ? <EChart option={chartOption} testId="analysis-chart" /> : null}
      <Table
        rowKey={(r) => r.name}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        style={{ marginTop: 16 }}
      />
    </div>
  )
}
```

- [ ] **Step 2: 编写 `src/pages/CostAnalysis.test.tsx`**

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { fetchAnalysis } from '../api/cost'
import CostAnalysis from '../pages/CostAnalysis'

vi.mock('../api/cost', () => ({
  fetchAnalysis: vi.fn(),
  buildExportUrl: vi.fn((_q: unknown, format: string) => `/api/cost/export?format=${format}`)
}))
vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn() }))
}))

const records = [
  {
    name: '研发部',
    laborCost: 306000,
    projectBudget: 1800000,
    projectActual: 1290000,
    budgetRatio: 71.67,
    overBudgetAmount: -510000
  },
  {
    name: '产品部',
    laborCost: 108000,
    projectBudget: 600000,
    projectActual: 300000,
    budgetRatio: 50,
    overBudgetAmount: -300000
  }
]

describe('CostAnalysis', () => {
  it('默认按部门维度加载并渲染表格与导出入口', async () => {
    ;(fetchAnalysis as ReturnType<typeof vi.fn>).mockResolvedValue({ records, total: 2 })
    render(<CostAnalysis />)
    await waitFor(() => expect(screen.getByText('研发部')).toBeInTheDocument())
    expect(screen.getByText('¥1,290,000.00')).toBeInTheDocument()
    expect(screen.getByText('导出 Excel')).toBeInTheDocument()
    expect(screen.getByText('导出 CSV')).toBeInTheDocument()
  })

  it('查询失败展示错误', async () => {
    ;(fetchAnalysis as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('接口异常'))
    render(<CostAnalysis />)
    await waitFor(() => expect(screen.getByText('接口异常')).toBeInTheDocument())
  })

  it('切换维度为项目后按新维度重新查询', async () => {
    ;(fetchAnalysis as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ records, total: 2 })
      .mockResolvedValueOnce({
        records: [
          {
            name: '数据中台',
            laborCost: 0,
            projectBudget: 400000,
            projectActual: 480000,
            budgetRatio: 120,
            overBudgetAmount: 80000
          }
        ],
        total: 1
      })
    render(<CostAnalysis />)
    await waitFor(() => expect(screen.getByText('研发部')).toBeInTheDocument())

    fireEvent.mouseDown(screen.getByLabelText('维度').closest('.ant-select-selector')!)
    await screen.findByTitle('项目')
    fireEvent.click(screen.getByTitle('项目'))

    await waitFor(() => expect(screen.getByText('数据中台')).toBeInTheDocument())
    expect(fetchAnalysis).toHaveBeenLastCalledWith({
      dimension: 'project',
      year: '2025',
      role: undefined
    })
  })
})
```

- [ ] **Step 3: 改写 `src/App.tsx` 为完整路由**

```tsx
import { Layout, Menu } from 'antd'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import CostAnalysis from './pages/CostAnalysis'
import Dashboard from './pages/Dashboard'

const menuItems = [
  { key: '/', label: <Link to="/">Dashboard</Link> },
  { key: '/cost-analysis', label: <Link to="/cost-analysis">成本统计分析</Link> }
]

export default function App() {
  const location = useLocation()
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider>
        <div style={{ color: '#fff', padding: 16, fontWeight: 600 }}>成本统计报表</div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Layout.Sider>
      <Layout.Content style={{ padding: 24, background: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cost-analysis" element={<CostAnalysis />} />
        </Routes>
      </Layout.Content>
    </Layout>
  )
}
```

- [ ] **Step 4: 改写 `src/App.test.tsx` 为路由级冒烟测试**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from './App'

vi.mock('./api/cost', () => ({
  fetchSummary: vi.fn(() =>
    Promise.resolve({
      totalCost: 0,
      laborCost: 0,
      projectCost: 0,
      laborRatio: 0,
      projectRatio: 0,
      overBudgetCount: 0,
      monthlyTrend: []
    })
  ),
  fetchAnalysis: vi.fn(() => Promise.resolve({ records: [], total: 0 }))
}))
vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn() }))
}))

it('渲染侧边菜单与默认 Dashboard 路由', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByText('成本统计报表')).toBeInTheDocument()
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
  expect(await screen.findByTestId('dashboard')).toBeInTheDocument()
})
```

- [ ] **Step 5: 运行测试与构建**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main && npm test && npm run build`
Expected: CostAnalysis 3 项 + App 1 项通过（总约 12 项）；构建成功。

- [ ] **Step 6: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add src/pages/CostAnalysis.tsx src/pages/CostAnalysis.test.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: 成本统计分析页（多维筛选/表格/图表/导出）与路由接入

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

