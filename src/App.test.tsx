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