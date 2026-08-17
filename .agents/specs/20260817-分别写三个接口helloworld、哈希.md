# 算法演示模块 — 实施计划

> **版本**: v1.0  
> **日期**: 2025-08-17  
> **状态**: 实施计划阶段  
> **关联仓库**: library-backend, library-frontend  
> **上游规格**: [dima.md](./dima.md) — 需求澄清与设计规格

---

## 1. 目标与范围

为图书管理系统新增"算法演示"功能模块，包含：

| 编号 | 功能 | 说明 |
|------|------|------|
| F1 | HelloWorld 接口 | GET 返回问候语与时间戳 |
| F2 | 哈希算法接口 | POST 对输入字符串执行 SHA-256 |
| F3 | 冒泡排序接口 | POST 对整数数组执行冒泡排序并返回过程 |
| F4 | 前端三 Tab 页面 | `/algorithm-demo` 分别调用 F1/F2/F3 并展示结果 |
| F5 | 导出按钮 | 前端触发 → 后端 POST /api/export 返回文件流 |

---

## 2. 架构确认

```
library-frontend (React 18 + TypeScript + Vite)
  └── /algorithm-demo
        ├── Tab "HelloWorld"  → GET  /api/helloworld
        ├── Tab "哈希算法"     → POST /api/hash
        ├── Tab "冒泡排序"     → POST /api/bubblesort
        └── [导出结果]         → POST /api/export
              │
              ▼ HTTP REST (JSON + Blob)
library-backend (Spring Boot 2.7+ / Java 11+ / Maven)
  ├── AlgorithmController
  ├── HashService / BubbleSortService / ExportService
  └── ApiResult<T> 统一响应包装
```

---

## 3. 待确认项决议

| # | 问题 | 决议 | 影响 |
|---|------|------|------|
| Q1 | 前端框架 | **React 18 + TypeScript + Vite** | 前端全部代码 |
| Q2 | 后端框架 | **Spring Boot 2.7 + Java 11 + Maven** | 后端全部代码 |
| Q3 | 哈希算法范围 | **仅 SHA-256**，后续可扩展 | HashService |
| Q4 | 排序步骤展示 | **是**，返回 steps[] 数组 | BubbleSortService + 前端渲染 |
| Q5 | 导出格式 | **JSON + CSV** | ExportService |
| Q6 | 路由路径 | **`/algorithm-demo`** | 前端路由 |
| Q7 | 权限控制 | **否**，公开页面 | 安全配置 |
| Q8 | 统一响应格式 | **`{code, message, data}`** | 全部接口 |

---

## 4. 跨库接口契约（不可偏离）

> 以下契约来自 `dima.md` §3，实施时必须严格遵循，**不允许偏离**。

### 4.1 GET /api/helloworld

```
请求: 无参数
响应 200: { "code": 0, "message": "success", "data": { "greeting": "Hello, World!", "timestamp": "2025-07-10T12:00:00.000Z" } }
响应 500: { "code": 500, "message": "Internal server error", "data": null }
```

### 4.2 POST /api/hash

```
请求: { "input": "hello world", "algorithm": "SHA-256" }
  - input: string (必填，非空)
  - algorithm: string (可选，默认 SHA-256)
响应 200: { "code": 0, "message": "success", "data": { "input": "hello world", "algorithm": "SHA-256", "hash": "b94d27b..." } }
响应 400: { "code": 400, "message": "Input must not be empty", "data": null }
```

### 4.3 POST /api/bubblesort

```
请求: { "array": [5, 3, 8, 1, 2] }
  - array: number[] (必填，非空，长度 ≤ 100)
响应 200: { "code": 0, "message": "success", "data": { "input": [...], "sorted": [...], "steps": [{ "round": N, "after": [...], "swapped": bool }], "comparisons": N, "swaps": N } }
响应 400: { "code": 400, "message": "Array must not be empty and length must not exceed 100", "data": null }
```

### 4.4 POST /api/export

```
请求: { "type": "bubblesort", "data": {...}, "format": "json" }
  - type: "helloworld" | "hash" | "bubblesort" (必填)
  - data: object (必填，对应 Tab 当前展示的完整结果)
  - format: "json" | "csv" (可选，默认 json)
响应 200: Content-Disposition: attachment; filename="export-{type}-{timestamp}.{json|csv}"
响应 400: { "code": 400, "message": "Unsupported type: xxx", "data": null }
```

---

## 5. 任务拆解

### 📦 Phase A: library-backend（5 个任务，顺序执行）

---

#### Task A1: 项目脚手架与基础配置

**目标**: 创建可运行的 Spring Boot 项目骨架。

**产物**:
- `library-backend/pom.xml` — Maven 配置，引入 spring-boot-starter-web / spring-boot-starter-validation / spring-boot-starter-test / lombok
- `library-backend/src/main/java/com/example/library/LibraryApplication.java` — 主启动类
- `library-backend/src/main/resources/application.yml` — 基础配置（端口 8080，CORS 开放）

**验收**: `mvn compile` 通过。

---

#### Task A2: 公共层 — ApiResult + 全局异常处理

**目标**: 建立统一响应格式与异常处理机制。

**产物**:
- `library-backend/src/main/java/com/example/library/common/ApiResult.java`

```java
public class ApiResult<T> {
    private int code;       // 0=成功
    private String message;
    private T data;

    public static <T> ApiResult<T> ok(T data) { return new ApiResult<>(0, "success", data); }
    public static <T> ApiResult<T> error(int code, String message) { return new ApiResult<>(code, message, null); }
}
```

- `library-backend/src/main/java/com/example/library/common/GlobalExceptionHandler.java`
  - 处理 `MethodArgumentNotValidException` → 400
  - 处理 `IllegalArgumentException` → 400
  - 处理 `Exception` → 500

**验收**: 空 Controller 返回 ApiResult 格式正确；异常场景返回统一错误格式。

---

#### Task A3: DTO 层 — 请求/响应对象

**目标**: 创建所有接口的数据传输对象，确保与契约严格一致。

**产物**:
- `library-backend/src/main/java/com/example/library/dto/HelloWorldResponse.java`
  - `String greeting`, `String timestamp`
- `library-backend/src/main/java/com/example/library/dto/HashRequest.java`
  - `@NotBlank String input`, `String algorithm` (默认 "SHA-256")
- `library-backend/src/main/java/com/example/library/dto/HashResponse.java`
  - `String input`, `String algorithm`, `String hash`
- `library-backend/src/main/java/com/example/library/dto/BubbleSortRequest.java`
  - `@NotNull @Size(min=1, max=100) List<Integer> array`
- `library-backend/src/main/java/com/example/library/dto/BubbleSortResponse.java`
  - `List<Integer> input`, `List<Integer> sorted`, `List<SortStep> steps`, `int comparisons`, `int swaps`
- `library-backend/src/main/java/com/example/library/dto/SortStep.java`
  - `int round`, `List<Integer> after`, `boolean swapped`
- `library-backend/src/main/java/com/example/library/dto/ExportRequest.java`
  - `@NotBlank String type`, `Map<String, Object> data`, `String format` (默认 "json")

**验收**: 编译通过；字段名、类型与契约 JSON 完全一致（Jackson 序列化后字段名匹配）。

---

#### Task A4: Service 层 — 三个核心服务

**目标**: 实现核心算法逻辑。

**产物**:
- `library-backend/src/main/java/com/example/library/service/HashService.java`
  - 使用 `java.security.MessageDigest.getInstance("SHA-256")`
  - 输入校验：非空字符串 → 否则抛 `IllegalArgumentException`
  - 返回：十六进制小写哈希字符串

- `library-backend/src/main/java/com/example/library/service/BubbleSortService.java`
  - 标准冒泡排序实现
  - 记录每轮排序后的数组状态（SortStep）
  - 统计比较次数和交换次数
  - 输入校验：非空、长度 ≤ 100

- `library-backend/src/main/java/com/example/library/service/ExportService.java`
  - 根据 `type` 校验（helloworld/hash/bubblesort）
  - JSON 格式：直接序列化 `data` 为 JSON 字节数组
  - CSV 格式：扁平化转换（bubblesort 的 steps 为 CSV 行；helloworld/hash 为键值对）
  - 返回：`byte[]` + `filename` + `contentType`

**验收**: 单元测试覆盖正常输入、边界输入、异常输入。

---

#### Task A5: Controller 层 + 集成测试

**目标**: 暴露 REST 端点，完成端到端验证。

**产物**:
- `library-backend/src/main/java/com/example/library/controller/AlgorithmController.java`
  - `GET /api/helloworld` → `ApiResult<HelloWorldResponse>`
  - `POST /api/hash` → `@Valid @RequestBody HashRequest` → `ApiResult<HashResponse>`
  - `POST /api/bubblesort` → `@Valid @RequestBody BubbleSortRequest` → `ApiResult<BubbleSortResponse>`
  - `POST /api/export` → `@Valid @RequestBody ExportRequest` → `ResponseEntity<byte[]>` (设置 Content-Disposition + Content-Type)

- `library-backend/src/test/java/com/example/library/controller/AlgorithmControllerTest.java`
  - MockMvc 测试所有端点：正常请求、参数校验失败、错误响应格式

**验收**: `mvn test` 全部通过；手动 `curl` 验证响应格式与契约一致。

---

### 📦 Phase B: library-frontend（4 个任务，顺序执行）

---

#### Task B1: 项目脚手架

**目标**: 创建可运行的 React + TypeScript 项目。

**产物**:
- `library-frontend/` — Vite + React 18 + TypeScript 脚手架
- `library-frontend/package.json` — 依赖：react, react-dom, react-router-dom, axios
- `library-frontend/vite.config.ts` — 配置代理 `/api` → `http://localhost:8080`
- `library-frontend/tsconfig.json`

**验收**: `npm install && npm run dev` 启动成功。

---

#### Task B2: API 层 + 类型定义

**目标**: 封装所有后端接口调用，定义前端类型。

**产物**:
- `library-frontend/src/types/algorithm.ts`
  ```typescript
  interface ApiResponse<T> { code: number; message: string; data: T; }
  interface HelloWorldData { greeting: string; timestamp: string; }
  interface HashRequest { input: string; algorithm?: string; }
  interface HashData { input: string; algorithm: string; hash: string; }
  interface BubbleSortRequest { array: number[]; }
  interface SortStep { round: number; after: number[]; swapped: boolean; }
  interface BubbleSortData { input: number[]; sorted: number[]; steps: SortStep[]; comparisons: number; swaps: number; }
  interface ExportRequest { type: string; data: any; format?: string; }
  ```

- `library-frontend/src/api/algorithm.ts`
  ```typescript
  export async function fetchHelloWorld(): Promise<ApiResponse<HelloWorldData>>;
  export async function fetchHash(input: string, algorithm?: string): Promise<ApiResponse<HashData>>;
  export async function fetchBubbleSort(array: number[]): Promise<ApiResponse<BubbleSortData>>;
  export async function exportResult(type: string, data: any, format?: string): Promise<Blob>;
  ```

**验收**: TypeScript 编译通过；Mock 环境测试 API 调用。

---

#### Task B3: 页面组件

**目标**: 实现 `/algorithm-demo` 完整页面。

**产物**:
- `library-frontend/src/pages/AlgorithmDemoPage.tsx`
  - 状态：`activeTab` (当前 Tab 索引)
  - 三 Tab 容器 + 导出按钮

- `library-frontend/src/components/HelloWorldPanel.tsx`
  - 页面加载时自动调用 GET /api/helloworld
  - 展示 greeting + timestamp
  - 状态：loading / data / error

- `library-frontend/src/components/HashPanel.tsx`
  - 输入框（字符串）+ "计算"按钮
  - 调用 POST /api/hash
  - 展示 hash 结果
  - 状态：idle / loading / data / error

- `library-frontend/src/components/BubbleSortPanel.tsx`
  - 输入框（逗号分隔数字）+ "排序"按钮
  - 调用 POST /api/bubblesort
  - 展示排序步骤（每轮 after 数组）+ 统计信息（comparisons / swaps）
  - 状态：idle / loading / data / error

- `library-frontend/src/components/ExportButton.tsx`
  - 接收当前 Tab 类型 + 最新结果数据
  - 调用 POST /api/export → 触发浏览器下载
  - 失败时 Toast/Alert 提示"导出失败，请重试"

**验收**: 每个组件渲染 Loading / Error / Data 三种状态正确；导出按钮触发文件下载。

---

#### Task B4: 路由配置 + 集成测试

**目标**: 将页面接入路由，完成端到端验证。

**产物**:
- `library-frontend/src/App.tsx` — 添加 `<Route path="/algorithm-demo" element={<AlgorithmDemoPage />} />`
- `library-frontend/src/__tests__/` — 组件测试（React Testing Library + Jest + MSW）
  - HelloWorldPanel: Mock GET /api/helloworld → 验证 greeting 渲染
  - HashPanel: Mock POST /api/hash → 验证 hash 渲染
  - BubbleSortPanel: Mock POST /api/bubblesort → 验证步骤渲染
  - ExportButton: Mock POST /api/export → 验证 Blob 下载触发

**验收**: `npm test` 全部通过；手动访问 `/algorithm-demo` 三个 Tab 功能正常。

---

## 6. 执行顺序

```
Phase A (Backend) ───────────────────── Phase B (Frontend) ──────────────────
A1 → A2 → A3 → A4 → A5 ──────────────── B1 → B2 → B3 → B4
                       │                              │
                       └── 后端就绪后前端可并行开发 ───┘
```

- **依赖**: A1→A2→A3→A4→A5 严格顺序；B1→B2→B3→B4 严格顺序
- **并行**: Phase A 全部完成后 Phase B 可获得稳定接口契约，但 A5 完成后即可开始 B1

---

## 7. 错误处理策略

| 层级 | 策略 | 实现位置 |
|------|------|----------|
| 后端参数校验 | `@Valid` + `GlobalExceptionHandler` → 400 | A2 |
| 后端内部错误 | `GlobalExceptionHandler` → 500 + 日志 | A2 |
| 前端网络错误 | `try/catch` → Toast 提示 | B3 |
| 前端超时 | axios 30s 超时 → "请求超时，请重试" | B2 |
| 前端导出失败 | Toast "导出失败，请重试"，不清空当前 Tab 数据 | B3 |

---

## 8. 测试策略

### 8.1 后端

| 层级 | 类型 | 覆盖范围 | 关联任务 |
|------|------|----------|----------|
| Service | JUnit 单元测试 | HashService 正常/边界/异常；BubbleSortService 各种数组 | A4 |
| Controller | MockMvc 集成测试 | 所有端点：正常请求、参数校验、错误响应 | A5 |

### 8.2 前端

| 层级 | 类型 | 覆盖范围 | 关联任务 |
|------|------|----------|----------|
| API 层 | Jest + MSW | Mock 后端响应，验证请求参数和返回数据 | B2 |
| 组件 | React Testing Library | 各 Tab 渲染、Loading/Error/Data 状态切换 | B3/B4 |
| 导出 | 手动验证 | 文件下载正确性 | B3 |

---

## 9. 风险与降级

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Greenfield 脚手架失败 | Phase A1/B1 阻塞 | 手动创建 pom.xml / package.json 作为兜底 |
| Maven 依赖下载慢 | A1 超时 | 使用本地缓存镜像 |
| npm 安装超时 | B1 超时 | 使用国内镜像源 |
| 跨库环境问题（依赖未发布） | A5/B4 集成测试失败 | 降级为静态审查：对齐入参/出参类型匹配 |

---

## 10. 自审结论

- **占位符扫描**: 无 TBD/TODO 残留
- **内部一致性**: 前后端接口契约一一对齐，请求/响应格式无矛盾
- **范围检查**: 聚焦于三个算法演示 + 导出，无范围蔓延
- **任务可执行性**: 每个 Task 均有明确的产物文件路径、验收标准和依赖关系
- **跨仓对齐**: 接口契约以 dima.md §3 为准，前端 DTO 与后端 DTO 字段名完全一致

---

*本实施计划基于 dima.md v1.0 需求澄清规格生成，待进入实施阶段。*