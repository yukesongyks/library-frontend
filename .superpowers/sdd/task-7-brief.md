### Task 7: 前端 API 客户端、类型与格式化工具

**Files:**
- Create: `library-frontend/src/api/types.ts`
- Create: `library-frontend/src/api/client.ts`
- Create: `library-frontend/src/api/cost.ts`
- Create: `library-frontend/src/utils/format.ts`
- Test: `library-frontend/src/utils/format.test.ts`
- Test: `library-frontend/src/api/cost.test.ts`

**Interfaces:**
- Consumes: 无（纯前端）。
- Produces:
  - `fetchSummary(year: string): Promise<CostSummary>`
  - `fetchAnalysis(query: AnalysisQuery): Promise<AnalysisResponse>`
  - `buildExportUrl(query: AnalysisQuery, format: 'xlsx'|'csv'): string`
  - `formatMoney(value): string`、`formatPercent(value): string`
  - 类型 `Dimension`、`ROLE_LABELS`、`DIMENSION_LABELS` 等（Task 8/9 使用）。

- [ ] **Step 1: 创建 `src/api/types.ts`**

```ts
export type Dimension =
  | 'department'
  | 'project'
  | 'business_line'
  | 'employee'
  | 'month'
  | 'quarter'
  | 'year'

export const DIMENSION_LABELS: Record<Dimension, string> = {
  department: '部门',
  project: '项目',
  business_line: '业务线',
  employee: '人员',
  month: '月份',
  quarter: '季度',
  year: '年度'
}

export const ROLES = ['DEV', 'TEST', 'PM', 'OPS'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  DEV: '开发',
  TEST: '测试',
  PM: '产品',
  OPS: '运维'
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface MonthlyTrendItem {
  month: string
  laborCost: number
  projectCost: number
  totalCost: number
}

export interface CostSummary {
  totalCost: number
  laborCost: number
  projectCost: number
  laborRatio: number
  projectRatio: number
  overBudgetCount: number
  monthlyTrend: MonthlyTrendItem[]
}

export interface CostAnalysisItem {
  name: string
  laborCost: number
  projectBudget: number
  projectActual: number
  budgetRatio: number
  overBudgetAmount: number
}

export interface AnalysisResponse {
  records: CostAnalysisItem[]
  total: number
}

export interface AnalysisQuery {
  dimension: Dimension
  year?: string
  month?: string
  quarter?: string
  role?: string
}
```

- [ ] **Step 2: 创建 `src/api/client.ts`**

```ts
import axios from 'axios'
import type { ApiResponse } from './types'

export const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

http.interceptors.response.use(
  (resp) => {
    const body = resp.data as ApiResponse<unknown> | undefined
    if (body && typeof body.code === 'number' && body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return resp
  },
  (error) => Promise.reject(error)
)

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const resp = await promise
  return resp.data.data
}
```

- [ ] **Step 3: 创建 `src/api/cost.ts`**

```ts
import { http, unwrap } from './client'
import type { AnalysisQuery, AnalysisResponse, CostSummary } from './types'

export function fetchSummary(year: string): Promise<CostSummary> {
  return unwrap<CostSummary>(http.get('/cost/summary', { params: { year } }))
}

export function fetchAnalysis(query: AnalysisQuery): Promise<AnalysisResponse> {
  return unwrap<AnalysisResponse>(http.get('/cost/analysis', { params: query }))
}

export function buildExportUrl(
  query: AnalysisQuery,
  format: 'xlsx' | 'csv' = 'xlsx'
): string {
  const params = new URLSearchParams()
  params.set('dimension', query.dimension)
  if (query.year) params.set('year', query.year)
  if (query.month) params.set('month', query.month)
  if (query.quarter) params.set('quarter', query.quarter)
  if (query.role) params.set('role', query.role)
  params.set('format', format)
  return `/api/cost/export?${params.toString()}`
}
```

- [ ] **Step 4: 创建 `src/utils/format.ts`**

```ts
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }
  return `${value.toFixed(2)}%`
}
```

- [ ] **Step 5: 编写 `src/utils/format.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { formatMoney, formatPercent } from './format'

describe('formatMoney', () => {
  it('格式化金额为人民币两位小数', () => {
    expect(formatMoney(2004000)).toBe('¥2,004,000.00')
    expect(formatMoney(80000)).toBe('¥80,000.00')
  })

  it('空值与 NaN 显示占位符', () => {
    expect(formatMoney(null)).toBe('-')
    expect(formatMoney(undefined)).toBe('-')
    expect(formatMoney(Number.NaN)).toBe('-')
  })
})

describe('formatPercent', () => {
  it('保留两位小数的百分比', () => {
    expect(formatPercent(66.25)).toBe('66.25%')
    expect(formatPercent(10)).toBe('10.00%')
  })

  it('空值显示占位符', () => {
    expect(formatPercent(undefined)).toBe('-')
  })
})
```

- [ ] **Step 6: 编写 `src/api/cost.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest'
import { buildExportUrl, fetchAnalysis, fetchSummary } from './cost'
import { http } from './client'

vi.mock('./client', async () => {
  const get = vi.fn()
  return {
    http: { get },
    unwrap: async <T,>(p: Promise<{ data: { data: T } }>): Promise<T> => (await p).data.data
  }
})

describe('fetchSummary', () => {
  it('调用 /cost/summary 并解包 data', async () => {
    const get = http.get as ReturnType<typeof vi.fn>
    get.mockResolvedValue({ data: { code: 0, message: 'ok', data: { totalCost: 2004000 } } })
    const result = await fetchSummary('2025')
    expect(get).toHaveBeenCalledWith('/cost/summary', { params: { year: '2025' } })
    expect(result.totalCost).toBe(2004000)
  })
})

describe('fetchAnalysis', () => {
  it('透传维度查询参数', async () => {
    const get = http.get as ReturnType<typeof vi.fn>
    get.mockResolvedValue({ data: { code: 0, message: 'ok', data: { records: [], total: 0 } } })
    await fetchAnalysis({ dimension: 'department', year: '2025' })
    expect(get).toHaveBeenCalledWith('/cost/analysis', { params: { dimension: 'department', year: '2025' } })
  })
})

describe('buildExportUrl', () => {
  it('生成带查询参数与格式的导出地址', () => {
    const url = buildExportUrl({ dimension: 'department', year: '2025', role: 'DEV' }, 'xlsx')
    expect(url).toBe('/api/cost/export?dimension=department&year=2025&role=DEV&format=xlsx')
  })
})
```

- [ ] **Step 7: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main && npm test`
Expected: 新增 6 项全过（format 4 + cost 3 + App 1 = 8 项总过）。

- [ ] **Step 8: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add src/api src/utils src/App.test.tsx
git commit -m "feat: 前端成本 API 客户端、类型与格式化工具

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

