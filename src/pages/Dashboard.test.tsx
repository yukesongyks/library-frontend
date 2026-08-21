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