### Task 6: 前端脚手架（Vite + React + TS + 测试）

**Files:**
- Create: `library-frontend/package.json`
- Create: `library-frontend/tsconfig.json`
- Create: `library-frontend/vite.config.ts`
- Create: `library-frontend/index.html`
- Create: `library-frontend/src/index.css`
- Create: `library-frontend/src/main.tsx`
- Create: `library-frontend/src/App.tsx`
- Create: `library-frontend/src/test/setup.ts`
- Test: `library-frontend/src/App.test.tsx`

**Interfaces:**
- Produces: `npm run dev`（端口 5173，`/api` 代理到 `http://localhost:8080`）、`npm test`（Vitest + jsdom）、`npm run build`（tsc + vite）。

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "library-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "antd": "^5.16.5",
    "axios": "^1.6.8",
    "dayjs": "^1.11.10",
    "echarts": "^5.5.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.2",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^24.0.0",
    "typescript": "^5.4.3",
    "vite": "^5.2.6",
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 2: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false
  }
})
```

- [ ] **Step 4: 创建 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>成本统计报表</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 `src/index.css` 与 `src/test/setup.ts`**

```css
body { margin: 0; }
#root { min-height: 100vh; }
```

```ts
import '@testing-library/jest-dom'

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })) as unknown as typeof window.matchMedia
}
```

- [ ] **Step 6: 创建 `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
)
```

- [ ] **Step 7: 创建应用外壳 `src/App.tsx`（Task 9 会扩充为完整路由）**

```tsx
import { Typography } from 'antd'

export default function App() {
  return (
    <div style={{ padding: 24 }} data-testid="app-shell">
      <Typography.Title level={3}>成本统计报表</Typography.Title>
      <Typography.Paragraph>Dashboard 与成本统计分析页面将在后续任务接入。</Typography.Paragraph>
    </div>
  )
}
```

- [ ] **Step 8: 编写冒烟测试 `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

it('渲染应用外壳标题', () => {
  render(<App />)
  expect(screen.getByTestId('app-shell')).toBeInTheDocument()
  expect(screen.getByText('成本统计报表')).toBeInTheDocument()
})
```

- [ ] **Step 9: 安装依赖并运行测试/构建**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
npm install
npm test
npm run build
```
Expected: `npm test` → 1 pass；`npm run build` → tsc 无错误 + vite build 打包成功。

- [ ] **Step 10: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src
git commit -m "feat: 初始化 Vite+React+TS 前端脚手架与测试环境

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

