# 算法演示页 — 前端需求澄清

> 阶段：clarify ｜ 日期：2026-08-06 ｜ 仓库：library-frontend
> 配套后端：library-backend/docs/specs/2026-08-06-algo-demo-clarification.md

---

## 1. 现状

- 页面：`src/views/AlgorithmDemoPage.vue`（三 Tab：HelloWorld / 哈希 / 冒泡排序）
- API 封装：`src/api/algo.js`（baseURL `/api/algo`）
- 路由：`/algorithm-demo` 已注册

## 2. 待补充能力

| 项 | 说明 |
|----|------|
| 导出按钮交互 | 每个 Tab 内增加「导出」按钮，点击后调用 `algoApi.export(type, format, data)` |
| 格式选择 | 弹出下拉或 Radio 选择 CSV / Excel，默认 CSV |
| 文件下载 | 接收 blob 响应，创建临时 `<a>` 触发浏览器下载 |
| 错误提示 | 接口返回非 2xx 时，Toast 显示 `response.data.message` |

## 3. 异常兜底（前端侧）

| 场景 | 处理 |
|------|------|
| 网络超时/断开 | Toast "网络异常，请重试" |
| 导出失败（非 blob） | 解析 JSON error.message 并 Toast |
| 空数据导出 | 禁用导出按钮或 Toast "暂无数据可导出" |
| 未知错误 | Toast "操作失败，请稍后重试" |

axios interceptor 统一拦截非 2xx 响应，将 `error.response.data.message` 透传给组件；blob 请求失败时先尝试 JSON 解析再降级为通用提示。

## 4. 对齐点

- 后端接口路径、字段名、响应结构与 `algo.js` 现有定义完全一致
- 导出接口 `responseType: 'blob'` 已在 algo.js:27 配置
- 新增 UI 组件遵循现有 CSS 变量与 Tab 样式规范
