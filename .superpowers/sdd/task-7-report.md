# Task 7 Report: 前端 API 客户端、类型与格式化工具

## Status: DONE

## Files written (6 new files, verbatim per `task-7-brief.md`)
- `src/api/types.ts` — `Dimension` / `DIMENSION_LABELS` / `ROLES` (DEV|TEST|PM|OPS) / `Role` / `ROLE_LABELS` / `ApiResponse<T>` / `MonthlyTrendItem` / `CostSummary` / `CostAnalysisItem` / `AnalysisResponse` / `AnalysisQuery`. Field names match the verified backend contract exactly: `CostSummaryDTO{totalCost,laborCost,projectCost,laborRatio,projectRatio,overBudgetCount,monthlyTrend[{month,laborCost,projectCost,totalCost}]}`; analysis records `{name,laborCost,projectBudget,projectActual,budgetRatio,overBudgetAmount}` + `total`.
- `src/api/client.ts` — axios instance `http` (baseURL `/api`, timeout 15s); response interceptor rejects when JSON body `code` is a number and `code !== 0` (message fallback `'请求失败'`); HTTP non-2xx rejects via axios error handler; `unwrap<T>` returns `resp.data.data`. Used project deps `axios@^1.6.8` already present from Task 6 (no package.json change needed).
- `src/api/cost.ts` — `fetchSummary(year)` → GET `/cost/summary?year=`, `fetchAnalysis(query)` → GET `/cost/analysis` with query params, `buildExportUrl(query, format='xlsx')` → `/api/cost/export?...&format=`.
- `src/utils/format.ts` — `formatMoney` (zh-CN CNY, 2 decimals, `-` for null/undefined/NaN; note this is 千分位 via Intl, not raw `toLocaleString`), `formatPercent` (2-decimal `%`, `-` placeholder).
- `src/utils/format.test.ts` — 4 tests (money formatting, null/NaN placeholder, percent 2-decimal, undefined placeholder).
- `src/api/cost.test.ts` — 3 tests via `vi.mock('./client')` (summary call+unwrap, analysis params passthrough, export URL exact string).
- Report: `.superpowers/sdd/task-7-report.md` (this file).

## Verification (run once each, both pass)
- `npm test` → **3 files / 8 tests passed** (`src/api/cost.test.ts` 3, `src/utils/format.test.ts` 4, `src/App.test.tsx` 1); exit 0 (Vitest 1.6.1, 5.26s).
- `npm run build` (tsc --noEmit && vite build) → **tsc clean, vite build success**; 1471 modules, `dist/assets/index-eHGP7Mbk.js` 420.90 kB / gzip 138.65 kB, built in 8.58s; exit 0.

## Deviations
- **Commit SKIPPED** per hard constraint #1 (git read-only). Brief's Step 8 not executed.
- Parent task text mentioned `src/types/cost.ts` and a mocked-fetch `src/api/client.test.ts`; the **brief (binding, verbatim)** instead specifies `src/api/types.ts` and `src/api/cost.test.ts` (module-mocked client). Followed the brief exactly; new files only.
- All 6 target files already existed in the worktree at start (remnant of the previously interrupted attempt). I verified each file byte-for-byte against the brief's verbatim content — **zero diffs, no edits required**. No Task-6 files (`package.json`, `App.test.tsx`, etc.) were modified; `.git/README/dist/node_modules` untouched.

## Concerns
- None blocking. Minor notes: (1) `formatMoney` output `¥2,004,000.00` depends on full-ICU Intl (Node ≥18 default — verified by passing test); (2) export is a URL builder (per brief); binary/blob responses bypass the JSON-code interceptor naturally (axios blob body has no numeric `code`), and non-2xx on export would still reject via the axios error path; (3) `AnalysisQuery.role` is `string` (widened from `Role`) per brief — Task 8/9 may want to narrow to `Role`.