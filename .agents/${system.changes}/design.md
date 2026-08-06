# 系统分析设计文档：算法演示与导出功能

## 1. 需求概述

在现有 library 前后端项目基础上，提供 HelloWorld、哈希算法、冒泡排序三类算法的交互式执行与结果展示，并支持将各 Tab 页的执行结果导出为 Excel 文件。

| 编号 | 功能点 | 描述 | 所属仓库 |
|------|--------|------|----------|
| F-01 | HelloWorld 接口 | GET `/api/helloworld` 返回 `{ message: "Hello, World!" }` | library-backend |
| F-02 | 哈希算法接口 | POST `/api/hash` 接收 `input` + `algorithm`(sha256/md5)，返回哈希值 | library-backend |
| F-03 | 冒泡排序接口 | POST `/api/bubble-sort` 接收 `array: number[]`，返回排序后数组 | library-backend |
| F-04 | 导出接口 | POST `/api/export` 接收 `tab` + `dataRows`，返回 xlsx 文件流 | library-backend |
| F-05 | 算法演示页面 | 前端 `/algorithms` 页面，含三个 Tab 分别展示三种算法执行结果 | library-frontend |
| F-06 | 导出按钮 | 每个 Tab 内提供"导出"按钮，调用后端导出接口下载当前 Tab 结果 | library-frontend |

> **现状结论：** 后端接口（F-01 ~ F-04）已在 library-backend 仓库中实现；前端算法演示页面及导出按钮（F-05、F-06）**尚未实现**，需在后续开发阶段补充。本文档是对已有后端实现的结构化梳理与契约确认，并作为前端开发的输入依据。

---

## 2. 架构与数据流

```
library-frontend (Vue 3 + Axios)          library-backend (Express 4 + ExcelJS)
┌─────────────────────────────┐            ┌──────────────────────────────────┐
│ /algorithms                 │            │                                  │
│ ┌─────────┬────────┬──────┐ │   HTTP     │  /api/helloworld  GET            │
│ │HelloWorld│ Hash  │Bubble│ │ ─────────► │  /api/hash        POST          │
│ │  Tab    │  Tab   │Sort  │ │            │  /api/bubble-sort POST          │
│ └────┬────┴───┬────┴──┬───┘ │            │  /api/export      POST          │
│      ▼        ▼       ▼     │            │                                  │
│ src/api/algorithms.ts       │            │  中间件: callerId→metrics→error  │
└─────────────────────────────┘            └──────────────────────────────────┘
```

**数据流：** 用户切换 Tab → 组件调用 API → 后端 route 处理 → `success()/fail()` 统一响应 → 前端渲染；点击导出 → 前端收集 dataRows → POST `/api/export` → 后端生成 xlsx Buffer → 浏览器下载。

---

## 3. 接口契约

### 3.1 统一响应格式

```typescript
type ApiResponse<T> = { code: number; message?: string; data?: T };
// code=0 成功，非 0 失败
```

### 3.2 接口列表

| Method | Path | Request Body | Response Data | 错误码 |
|--------|------|-------------|---------------|--------|
| GET | `/api/helloworld` | 无 | `{ message: string }` | — |
| POST | `/api/hash` | `{ input: string, algorithm: "sha256"\|"md5" }` | `{ input, algorithm, hash }` | 422: 参数缺失/非法 |
| POST | `/api/bubble-sort` | `{ array: number[] }` | `{ sorted: number[] }` | 422: array 非 number[] |
| POST | `/api/export` | `{ tab: string, dataRows: Record<string,unknown>[] }` | Binary xlsx stream | 422: tab/dataRows 非法 |

**导出接口说明：**
- `tab` 取值：`helloworld` | `hash` | `bubble-sort`
- 后端使用 ExcelJS 动态生成 xlsx，首行为表头（取 `dataRows[0]` 的 keys）
- 响应头：`Content-Disposition: attachment; filename={tab}.xlsx`
- 前端通过 Blob + `<a>` download 触发浏览器下载

---

## 4. 异常兜底方案

### 4.1 后端异常分层

| 层级 | 机制 | 覆盖范围 | 响应 |
|------|------|----------|------|
| 路由参数校验 | 各 route 内显式校验 | 入参类型/必填缺失 | `422 fail(422, msg)` |
| 业务逻辑异常 | try-catch + errorMiddleware | utils 层运行时错误 | `500 { code:500, message:"internal error" }` |
| 全局未捕获异常 | Express error middleware | 所有未处理 Error | `500 { code:500, message:"internal error" }` |
| 进程级崩溃 | Node.js uncaughtException/unhandledRejection | 致命错误 | 日志记录 + 进程退出（由 PM2/k8s 重启） |

### 4.2 前端异常兜底

| 场景 | 处理方式 |
|------|----------|
| HTTP 网络错误/超时 | Axios interceptor catch → ElMessage.error("网络异常，请稍后重试") |
| 业务错误 (code≠0) | 解析 `ApiResponse.message` → ElMessage.warning(message) |
| 导出失败 | catch blob 请求 → 提示"导出失败"，不触发下载 |
| 组件渲染异常 | Vue errorCaptured → 降级显示"加载失败"占位 |

### 4.3 默认确认项

| 确认项 | 默认值 | 说明 |
|--------|--------|------|
| 导出文件名特殊字符转义 | ✅ 已处理 | `tab` 仅允许 `[a-z0-9-]`，非法字符替换为 `_` |
| 大数据量导出上限 | 10000 行 | 超出返回 422，提示"数据量过大，请筛选后导出" |
| CORS 配置 | 开发环境 Vite proxy 代理；生产环境由网关/Nginx 统一配置 | `app.ts` 不内置 cors 中间件 |
| X-User-Id 来源 | 开发环境默认 `dev-user`；生产环境由网关注入 | `client.ts` 拦截器读取 header 或 fallback |
| 冒泡排序数组长度上限 | 10000 | 超出返回 422，避免 O(n²) 阻塞事件循环 |
| 哈希算法白名单 | `sha256`, `md5` | 其他值返回 422 |

---

## 5. 仓间对齐确认

| 对齐项 | 后端 | 前端 | 状态 |
|--------|------|------|------|
| 响应结构 | `ApiResponse<T>` types/api.ts | `ApiResponse<T>` api/types.ts | ✅ 一致 |
| helloworld | `GET /api/helloworld` | `client.get('/helloworld')` | ✅ |
| hash | `POST /api/hash` | `client.post('/hash', ...)` | ✅ |
| bubble-sort | `POST /api/bubble-sort` | `client.post('/bubble-sort', ...)` | ✅ |
| export | `POST /api/export` | `client.post('/export', ..., responseType:'blob')` | ✅ |
| 错误码 422 | `fail(422, "...")` | catch 解析 message | ✅ |

---

## 6. 变更影响

> **本次系分为存量代码文档化梳理，无新增代码变更。**

后续扩展影响面：
- 后端：新增 route + util，在 `app.ts` 挂载
- 前端：新增 Tab 组件，在 `AlgorithmPage.vue` 注册，在 `algorithms.ts` 添加 API 方法
- 契约：更新本文档第 3 节接口契约
