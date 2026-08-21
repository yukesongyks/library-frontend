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

    fireEvent.mouseDown(screen.getByRole('combobox', { name: '维度' }))
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