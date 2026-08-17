# 算法演示模块 — 需求澄清与设计规格

> **版本**: v1.0  
> **日期**: 2025-07-10  
> **状态**: 需求澄清阶段  
> **关联仓库**: library-backend, library-frontend

---

## 1. 需求概述

为图书管理系统新增"算法演示"功能模块，包含三个后端算法接口和一个前端展示页面。

### 1.1 功能列表

| 编号 | 功能 | 说明 |
|------|------|------|
| F1 | HelloWorld 接口 | 返回问候语与时间戳 |
| F2 | 哈希算法接口 | 对输入字符串执行 SHA-256 哈希 |
| F3 | 冒泡排序接口 | 对整数数组执行冒泡排序，返回排序过程 |
| F4 | 前端三 Tab 页面 | 分别调用 F1/F2/F3 并展示结果 |
| F5 | 导出按钮 | 前端触发导出，后端提供导出接口 |

### 1.2 非功能需求

- 接口响应时间 < 500ms（正常输入规模）
- 冒泡排序输入数组长度 ≤ 100
- 导出文件格式支持 JSON（默认）和 CSV

---

## 2. 跨库架构总览

```
┌─────────────────────────────────────────────────┐
│                  library-frontend                │
│  ┌───────────────────────────────────────────┐   │
│  │  /algorithm-demo 页面                      │   │
│  │  ┌───────┬────────┬────────────┐          │   │
│  │  │Tab 1  │ Tab 2  │  Tab 3     │          │   │
│  │  │Hello  │ Hash   │ BubbleSort │          │   │
│  │  │World  │        │            │          │   │
│  │  └───────┴────────┴────────────┘          │   │
│  │  ┌─────────────────────────────────┐      │   │
│  │  │        [导出结果] 按钮           │      │   │
│  │  └─────────────────────────────────┘      │   │
│  └───────────────────────────────────────────┘   │
│         │  HTTP REST API                         │
└─────────┼───────────────────────────────────────┘
          │
┌─────────┼───────────────────────────────────────┐
│         ▼         library-backend               │
│  ┌───────────────────────────────────────────┐   │
│  │           AlgorithmController              │   │
│  │  GET  /api/helloworld                      │   │
│  │  POST /api/hash                            │   │
│  │  POST /api/bubblesort                      │   │
│  │  POST /api/export                          │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │  HashService / BubbleSortService /         │   │
│  │  ExportService                             │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 3. 跨库接口契约（核心对齐点）

### 3.1 GET /api/helloworld

**请求**: 无参数

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "greeting": "Hello, World!",
    "timestamp": "2025-07-10T12:00:00.000Z"
  }
}
```

**错误响应** (500):
```json
{
  "code": 500,
  "message": "Internal server error",
  "data": null
}
```

---

### 3.2 POST /api/hash

**请求**:
```json
{
  "input": "hello world",
  "algorithm": "SHA-256"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| input | string | 是 | 待哈希的原始字符串 |
| algorithm | string | 否 | 哈希算法，默认 SHA-256；当前仅支持 SHA-256 |

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "input": "hello world",
    "algorithm": "SHA-256",
    "hash": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
  }
}
```

**错误响应** (400):
```json
{
  "code": 400,
  "message": "Input must not be empty",
  "data": null
}
```

---

### 3.3 POST /api/bubblesort

**请求**:
```json
{
  "array": [5, 3, 8, 1, 2]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| array | number[] | 是 | 待排序整数数组，长度 ≤ 100 |

**响应** (200):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "input": [5, 3, 8, 1, 2],
    "sorted": [1, 2, 3, 5, 8],
    "steps": [
      { "round": 1, "after": [3, 5, 1, 2, 8], "swapped": true },
      { "round": 2, "after": [3, 1, 2, 5, 8], "swapped": true },
      { "round": 3, "after": [1, 2, 3, 5, 8], "swapped": true },
      { "round": 4, "after": [1, 2, 3, 5, 8], "swapped": false }
    ],
    "comparisons": 10,
    "swaps": 6
  }
}
```

**错误响应** (400):
```json
{
  "code": 400,
  "message": "Array must not be empty and length must not exceed 100",
  "data": null
}
```

---

### 3.4 POST /api/export

**请求**:
```json
{
  "type": "bubblesort",
  "data": {
    "input": [5, 3, 8, 1, 2],
    "sorted": [1, 2, 3, 5, 8],
    "steps": [...]
  },
  "format": "json"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 枚举: `helloworld` / `hash` / `bubblesort` |
| data | object | 是 | 对应 Tab 当前展示的完整结果数据 |
| format | string | 否 | 导出格式: `json`（默认）或 `csv` |

**响应** (200):
- `Content-Type: application/json` + `Content-Disposition: attachment; filename="export-{type}-{timestamp}.json"`
- 或 `Content-Type: text/csv` + `Content-Disposition: attachment; filename="export-{type}-{timestamp}.csv"`

**错误响应** (400):
```json
{
  "code": 400,
  "message": "Unsupported type: xxx",
  "data": null
}
```

---

## 4. 前端设计

### 4.1 路由

| 路径 | 页面组件 | 说明 |
|------|----------|------|
| `/algorithm-demo` | `AlgorithmDemoPage` | 算法演示主页面 |

### 4.2 组件树

```
AlgorithmDemoPage
├── Tabs (容器)
│   ├── Tab "HelloWorld" → HelloWorldPanel
│   │   ├── 调用 GET /api/helloworld
│   │   └── 展示 greeting + timestamp
│   ├── Tab "哈希算法" → HashPanel
│   │   ├── 输入框 + "计算"按钮
│   │   ├── 调用 POST /api/hash
│   │   └── 展示 hash 结果
│   └── Tab "冒泡排序" → BubbleSortPanel
│       ├── 输入框（逗号分隔数字）+ "排序"按钮
│       ├── 调用 POST /api/bubblesort
│       └── 展示排序步骤 + 统计信息
└── ExportButton
    └── 调用 POST /api/export（携带当前 Tab 类型 + 数据）
```

### 4.3 状态管理

每个 Tab 独立管理自身状态，不跨 Tab 共享：

```typescript
// 每个 Panel 的状态模型
interface PanelState<T> {
  loading: boolean;
  result: T | null;
  error: string | null;
}
```

导出按钮读取当前活跃 Tab 及其最新结果数据。

### 4.4 API 层 (frontend)

```typescript
// api/algorithm.ts
export async function fetchHelloWorld(): Promise<ApiResponse<HelloWorldData>>;
export async function fetchHash(input: string, algorithm?: string): Promise<ApiResponse<HashData>>;
export async function fetchBubbleSort(array: number[]): Promise<ApiResponse<BubbleSortData>>;
export async function exportResult(type: string, data: any, format?: string): Promise<Blob>;
```

---

## 5. 后端设计

### 5.1 包结构（library-backend）

```
com.example.library
├── controller
│   └── AlgorithmController.java
├── service
│   ├── HashService.java
│   ├── BubbleSortService.java
│   └── ExportService.java
├── dto
│   ├── HelloWorldResponse.java
│   ├── HashRequest.java
│   ├── HashResponse.java
│   ├── BubbleSortRequest.java
│   ├── BubbleSortResponse.java
│   └── ExportRequest.java
└── common
    └── ApiResult.java          # 统一响应包装 {code, message, data}
```

### 5.2 统一响应格式

```java
public class ApiResult<T> {
    private int code;       // 0=成功, 非0=错误
    private String message; // 提示信息
    private T data;         // 业务数据
}
```

### 5.3 服务逻辑

**HashService**:
- 使用 `java.security.MessageDigest` 实现 SHA-256
- 输入校验：非空字符串
- 输出：十六进制哈希字符串

**BubbleSortService**:
- 标准冒泡排序实现
- 记录每轮排序后的数组状态
- 统计比较次数和交换次数
- 输入校验：非空、长度 ≤ 100、元素为整数

**ExportService**:
- 根据 `type` 和 `format` 生成导出文件
- JSON: 直接序列化 data
- CSV: 扁平化转换（仅支持 bubblesort 的步骤数据）

---

## 6. 数据流

```
用户操作                    前端                      后端
   │                         │                        │
   │  打开页面               │                        │
   │ ──────────────────────► │                        │
   │                         │ GET /api/helloworld    │
   │                         │ ──────────────────────►│
   │                         │ ◄── 200 {greeting,...} │
   │  Tab1 展示 HelloWorld   │                        │
   │                         │                        │
   │  切换 Tab2, 输入字符串  │                        │
   │ ──────────────────────► │                        │
   │  点击"计算"             │ POST /api/hash         │
   │                         │ ──────────────────────►│
   │                         │ ◄── 200 {hash,...}     │
   │  Tab2 展示哈希结果      │                        │
   │                         │                        │
   │  切换 Tab3, 输入数组    │                        │
   │ ──────────────────────► │                        │
   │  点击"排序"             │ POST /api/bubblesort   │
   │                         │ ──────────────────────►│
   │                         │ ◄── 200 {sorted,steps} │
   │  Tab3 展示排序过程      │                        │
   │                         │                        │
   │  点击"导出"             │ POST /api/export       │
   │ ──────────────────────► │ ──────────────────────►│
   │                         │ ◄── 文件流             │
   │  浏览器下载文件         │                        │
```

---

## 7. 错误处理策略

| 层级 | 策略 |
|------|------|
| 后端参数校验 | `@Valid` + 全局异常处理器 → 统一 400 响应 |
| 后端内部错误 | 全局异常处理器 → 统一 500 响应，日志记录 |
| 前端网络错误 | try/catch 捕获，展示友好错误提示（Toast/Alert） |
| 前端超时 | 30s 超时，展示"请求超时，请重试" |
| 前端导出失败 | 提示"导出失败，请重试"，不清空当前 Tab 数据 |

---

## 8. 测试策略

### 8.1 后端

| 层级 | 测试类型 | 覆盖范围 |
|------|----------|----------|
| Service | 单元测试 (JUnit) | HashService 正常/边界/异常输入；BubbleSortService 各种数组场景 |
| Controller | 集成测试 (MockMvc) | 所有端点：正常请求、参数校验、错误响应格式 |

### 8.2 前端

| 层级 | 测试类型 | 覆盖范围 |
|------|----------|----------|
| API 层 | 单元测试 (Jest + MSW) | Mock 后端响应，验证请求参数和返回数据解析 |
| 组件 | 组件测试 (React Testing Library) | 各 Tab 渲染、Loading/Error/Data 状态切换 |
| 导出 | 手动/E2E | 验证文件下载正确性 |

---

## 9. 待确认项（开放问题）

以下项基于合理假设，**需在进入实现前确认**：

| # | 问题 | 当前假设 | 影响范围 |
|---|------|----------|----------|
| Q1 | 前端框架选型？ | React + TypeScript | 前端全部代码 |
| Q2 | 后端框架选型？ | Spring Boot (Java) | 后端全部代码 |
| Q3 | 哈希算法是否仅 SHA-256？ | 是，后续可扩展 | HashService |
| Q4 | 冒泡排序是否需要展示每轮步骤？ | 是，返回 steps 数组 | BubbleSortService + 前端渲染 |
| Q5 | 导出格式是否仅 JSON + CSV？ | 是 | ExportService |
| Q6 | 页面路由路径？ | `/algorithm-demo` | 前端路由配置 |
| Q7 | 是否需要权限控制？ | 否，公开页面 | 前后端安全配置 |
| Q8 | 统一响应格式 `{code, message, data}` 是否确认？ | 是 | 全部接口契约 |

---

## 10. 自审结论

- **占位符扫描**: 无 TBD/TODO 残留
- **内部一致性**: 前后端接口契约一一对齐，请求/响应格式无矛盾
- **范围检查**: 聚焦于三个算法演示 + 导出，无范围蔓延
- **歧义检查**: 所有开放问题已在 §9 显式标注，假设明确

---

*本规格文档由需求澄清阶段生成，待确认后进入实现计划阶段。*