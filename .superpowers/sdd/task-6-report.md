# Task 6 Report: 前端脚手架 (Vite + React + TypeScript + Vitest + RTK Toolkit + ECharts)

**Status:** DONE

## Files written (verbatim per task-6-brief.md)
| File | Purpose |
|---|---|
| `package.json` | Deps/devDeps exactly per brief (brief uses `^` ranges, kept verbatim) |
| `tsconfig.json` | TS config with `types: ["vitest/globals","@testing-library/jest-dom"]`, `include: ["src"]` |
| `vite.config.ts` | vite + react plugin; server port 5173, `/api` proxy → `http://localhost:8080`; vitest block (jsdom, globals, setupFiles `./src/test/setup.ts`, css:false) |
| `index.html` | zh-CN shell, title 成本统计报表, mounts `/src/main.tsx` |
| `src/index.css` | `body { margin: 0; } #root { min-height: 100vh; }` |
| `src/main.tsx` | ReactDOM root + StrictMode + antd ConfigProvider(zhCN) + BrowserRouter + `<App/>` |
| `src/App.tsx` | Placeholder shell `data-testid="app-shell"` rendering 成本统计报表 |
| `src/test/setup.ts` | jest-dom import + window.matchMedia jsdom polyfill |
| `src/App.test.tsx` | Smoke test: renders App, asserts app-shell + 成本统计报表 text |

`package-lock.json` created by npm install (accepted byproduct). No README.md content added; README.md and .git untouched. Commit step SKIPPED per hard constraint (git read-only).

## Verification (executed in `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main`)
1. **npm install** — exit 0; `added 344 packages, audited 345 packages` (~2m). npm audit: 7 vulnerabilities (5 moderate, 1 high, 1 critical) in transitive deps; not blocking, standard for this era of pinned ranges — do not `npm audit fix --force` (breaking changes).
2. **npm test** (`vitest run`, vitest 1.6.1) — exit 0; `✓ src/App.test.tsx (1 test)`, Test Files 1 passed (1), Tests 1 passed (1).
3. **npm run build** (`tsc --noEmit && vite build`, vite 5.4.21) — exit 0; 1471 modules transformed; `dist/index.html` (0.39 kB), `dist/assets/index-*.js` (420.90 kB, gzip 138.65 kB), `dist/assets/index-*.css` (0.04 kB). No TS errors.

## Resolved versions (from package-lock.json)
react 18.3.1, react-dom 18.3.1, antd 5.29.3, axios 1.19.0, dayjs 1.11.23, echarts 5.6.0, react-router-dom 6.30.6, vite 5.4.21, vitest 1.6.1, typescript 5.9.3, jsdom 24.1.3, @vitejs/plugin-react 4.7.0, @testing-library/react 14.3.1, @testing-library/jest-dom 6.9.1.

## Deviations / notes
- **Version pinning conflict**: parent task description said brief pins EXACT versions (no `^`/`~`) and mentioned `tsconfig.node.json`; the actual brief (`task-6-brief.md`, authoritative per constraint #2) uses `^` ranges and does NOT define `tsconfig.node.json`. Followed the brief verbatim: package.json uses the brief's `^` versions; no `tsconfig.node.json` created (build script is `tsc --noEmit && vite build`, not `tsc -b`, per brief). If exact-pin reproducibility is required later, `package-lock.json` now provides it.
- Git was left read-only; Step 10 (commit) skipped per constraint #1.

## Concerns
- `npm audit` reports 7 vulnerabilities (5 moderate, 1 high, 1 critical) in transitive deps of the brief-pinned ranges (e.g. dev-server deps). Expected; fixing requires breaking upgrades outside this task's scope.
- `src/App.test.tsx` renders `<App/>` without Router/ConfigProvider wrappers — fine because App.tsx itself doesn't use them (Task 9 will expand; if App later uses Router hooks, the test must wrap in MemoryRouter).

## Follow-up
- Task 7/8 (Redux Toolkit store + slices) and Task 9 (routes/pages) can build on this scaffold; RTK Toolkit and ECharts deps are not yet in package.json — the brief for Task 6 does not include `@reduxjs/toolkit`/`react-redux`, so those will need to be added by their own task if required by the plan.