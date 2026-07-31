# library-frontend

图书管理系统前端代码

## Hello World 功能演示页面

本项目包含一个 Hello World 功能演示页面，展示三个核心算法接口的执行结果、导出功能及调用情况报表。

### 技术栈

- Vite + React 18 + TypeScript
- ECharts 5（折线图、饼图、柱状图）
- Vitest（单元测试）

### 启动

```bash
# 安装依赖
npm install

# 开发模式启动（默认端口 5173）
npm run dev
```

### 后端依赖

前端依赖后端服务 `library-backend`（Spring Boot，默认端口 8080）。后端需提供以下接口：

| 接口 | 说明 |
|------|------|
| `GET /api/hello-world` | 返回 Hello World |
| `POST /api/hash` | 哈希计算（SHA-256/SHA-512/MD5） |
| `POST /api/bubble-sort` | 冒泡排序 |
| `GET /api/export?tab=&format=` | 导出结果（CSV/JSON） |
| `GET /api/metrics/summary?dimension=&chartType=` | 调用埋点报表数据 |

通过 `VITE_API_BASE` 环境变量配置后端地址（默认 `http://localhost:8080`），见 `.env`。

### 页面结构

1. **三个 Tab**：HelloWorld / 哈希 / 冒泡排序，各 Tab 可触发对应接口并渲染结果
2. **导出按钮**：每个 Tab 顶部有导出按钮，点击下载当前 Tab 结果为 CSV
3. **报表区**：页面底部含折线图（趋势）、饼图（维度占比）、柱状图（维度对比），可切换维度（人员类型/层级/部门/接口名称）

### 测试

```bash
npm run test
```
