# 算法演示模块 — 编码实现报告

> **版本**: v1.0  
> **日期**: 2025-08-17  
> **状态**: 编码实现完成  
> **关联仓库**: library-backend, library-frontend  
> **上游设计**: [design.md](./design.md) | [dima.md](../../.agents/specs/dima.md) | [实施计划](../../.agents/specs/20260817-分别写三个接口helloworld、哈希.md)

---

## 1. 实现概述

完成了算法演示模块的全部编码工作，包括 library-backend（Spring Boot 2.7 + Java 11）和 library-frontend（React 18 + TypeScript + Vite）两个仓库。

### 1.1 功能覆盖

| 编号 | 功能 | 状态 |
|------|------|------|
| F1 | HelloWorld 接口 (GET /api/helloworld) | ✅ 已实现 |
| F2 | 哈希算法接口 (POST /api/hash) | ✅ 已实现 |
| F3 | 冒泡排序接口 (POST /api/bubblesort) | ✅ 已实现 |
| F4 | 前端三 Tab 页面 (/algorithm-demo) | ✅ 已实现 |
| F5 | 导出按钮 + 导出接口 (POST /api/export) | ✅ 已实现 |

---

## 2. 代码变更清单

### 2.1 library-backend（17 个文件）

| # | 文件路径 | 说明 |
|---|----------|------|
| 1 | `pom.xml` | Maven 项目配置：Spring Boot 2.7.18, Java 11, web/validation/test/lombok |
| 2 | `src/main/java/com/example/library/LibraryApplication.java` | Spring Boot 启动类 |
| 3 | `src/main/resources/application.yml` | 端口 8080, CORS 开放 `/api/**` |
| 4 | `src/main/java/com/example/library/common/ApiResult.java` | 统一响应包装 `{code, message, data}` |
| 5 | `src/main/java/com/example/library/common/GlobalExceptionHandler.java` | 全局异常处理：400/500 |
| 6 | `src/main/java/com/example/library/dto/HelloWorldResponse.java` | greeting + timestamp |
| 7 | `src/main/java/com/example/library/dto/HashRequest.java` | @NotBlank input, algorithm (默认 SHA-256) |
| 8 | `src/main/java/com/example/library/dto/HashResponse.java` | input, algorithm, hash |
| 9 | `src/main/java/com/example/library/dto/BubbleSortRequest.java` | @NotNull @Size(min=1,max=100) List<Integer> array |
| 10 | `src/main/java/com/example/library/dto/SortStep.java` | round, after, swapped |
| 11 | `src/main/java/com/example/library/dto/BubbleSortResponse.java` | input, sorted, steps, comparisons, swaps |
| 12 | `src/main/java/com/example/library/dto/ExportRequest.java` | @NotBlank type, data (Map), format (默认 json) |
| 13 | `src/main/java/com/example/library/service/HashService.java` | SHA-256 哈希计算 (MessageDigest) |
| 14 | `src/main/java/com/example/library/service/BubbleSortService.java` | 标准冒泡排序，记录每轮步骤 + 统计 |
| 15 | `src/main/java/com/example/library/service/ExportResult.java` | 导出结果对象：content, contentType, filename |
| 16 | `src/main/java/com/example/library/service/ExportService.java` | JSON/CSV 导出，支持 helloworld/hash/bubblesort |
| 17 | `src/main/java/com/example/library/controller/AlgorithmController.java` | 4 个 REST 端点 |

### 2.2 library-frontend（15 个文件）

| # | 文件路径 | 说明 |
|---|----------|------|
| 1 | `package.json` | React 18, react-router-dom, axios, Vite 5 |
| 2 | `vite.config.ts` | Vite 配置，代理 `/api` → `localhost:8080` |
| 3 | `tsconfig.json` | TypeScript strict 模式配置 |
| 4 | `tsconfig.node.json` | Vite 配置文件 TypeScript 支持 |
| 5 | `index.html` | Vite 入口 HTML |
| 6 | `src/vite-env.d.ts` | Vite 类型声明 |
| 7 | `src/main.tsx` | React 入口，BrowserRouter 包裹 |
| 8 | `src/App.tsx` | 路由配置：`/` + `/algorithm-demo` |
| 9 | `src/types/algorithm.ts` | 全部 TypeScript 类型定义 |
| 10 | `src/api/algorithm.ts` | axios API 封装（4 个接口函数） |
| 11 | `src/pages/AlgorithmDemoPage.tsx` | 主页面：三 Tab 容器 + 导出按钮 |
| 12 | `src/components/HelloWorldPanel.tsx` | Tab1：自动加载问候语，loading/data/error 三态 |
| 13 | `src/components/HashPanel.tsx` | Tab2：输入+计算，idle/loading/data/error 四态 |
| 14 | `src/components/BubbleSortPanel.tsx` | Tab3：输入+排序，展示步骤+统计 |
| 15 | `src/components/ExportButton.tsx` | 导出按钮：Blob 下载 + 错误提示 |

---

## 3. 跨库接口契约对齐检查

### 3.1 GET /api/helloworld

| 契约项 | 契约值 | 实现 | 对齐 |
|--------|--------|------|------|
| 方法 | GET | `@GetMapping("/helloworld")` | ✅ |
| 响应格式 | `{code, message, data}` | `ApiResult<HelloWorldResponse>` | ✅ |
| data.greeting | `"Hello, World!"` | `"Hello, World!"` | ✅ |
| data.timestamp | ISO-8601 | `Instant.now().toString()` | ✅ |
| 前端调用 | `fetchHelloWorld()` | `axios.get('/api/helloworld')` | ✅ |

### 3.2 POST /api/hash

| 契约项 | 契约值 | 实现 | 对齐 |
|--------|--------|------|------|
| 方法 | POST | `@PostMapping("/hash")` | ✅ |
| 请求体 | `{input, algorithm?}` | `@Valid @RequestBody HashRequest` | ✅ |
| input 校验 | @NotBlank | `@NotBlank` 注解 | ✅ |
| algorithm 默认 | SHA-256 | `"SHA-256"` 默认值 | ✅ |
| 响应 data.hash | 十六进制小写 | `MessageDigest` + 十六进制小写转换 | ✅ |
| 错误 400 | `"Input must not be empty"` | `@NotBlank` → `GlobalExceptionHandler` | ✅ |
| 前端调用 | `fetchHash(input, algorithm?)` | `axios.post('/api/hash', ...)` | ✅ |

### 3.3 POST /api/bubblesort

| 契约项 | 契约值 | 实现 | 对齐 |
|--------|--------|------|------|
| 方法 | POST | `@PostMapping("/bubblesort")` | ✅ |
| 请求体 | `{array: number[]}` | `@Valid @RequestBody BubbleSortRequest` | ✅ |
| array 长度 | 1-100 | `@Size(min=1, max=100)` | ✅ |
| 响应 data.steps | `[{round, after, swapped}]` | `SortStep` 列表（深拷贝） | ✅ |
| 响应 data.comparisons | 比较次数 | 内层循环计数 | ✅ |
| 响应 data.swaps | 交换次数 | 交换时计数 | ✅ |
| 错误 400 | `"Array must not be empty..."` | `IllegalArgumentException` → 400 | ✅ |
| 前端调用 | `fetchBubbleSort(array)` | `axios.post('/api/bubblesort', ...)` | ✅ |

### 3.4 POST /api/export

| 契约项 | 契约值 | 实现 | 对齐 |
|--------|--------|------|------|
| 方法 | POST | `@PostMapping("/export")` | ✅ |
| 请求体 | `{type, data, format?}` | `@Valid @RequestBody ExportRequest` | ✅ |
| type 枚举 | helloworld/hash/bubblesort | 严格校验三个值 | ✅ |
| format 默认 | json | `"json"` 默认值 | ✅ |
| 响应头 | Content-Disposition: attachment | `ResponseEntity` + header | ✅ |
| 文件名 | `export-{type}-{timestamp}.{ext}` | `export-{type}-{yyyyMMddHHmmss}.{json|csv}` | ✅ |
| 前端调用 | `exportResult(type, data, format?)` | `axios.post(..., {responseType:'blob'})` | ✅ |
| 前端下载 | Blob → URL.createObjectURL | 标准 Blob 下载流程 | ✅ |

---

## 4. 前端组件状态机

### 4.1 HelloWorldPanel

```
Loading → Data (greeting + timestamp)
Loading → Error (错误提示 + 重试)
```

### 4.2 HashPanel

```
Idle → Loading → Data (input, algorithm, hash)
              → Error (错误提示)
```

### 4.3 BubbleSortPanel

```
Idle → Loading → Data (input, sorted, steps, comparisons, swaps)
              → Error (错误提示)
```

### 4.4 ExportButton

```
无数据 → 禁用（"请先执行操作"）
有数据 → 可用 → 导出中（"导出中..."）→ 成功（浏览器下载）/ 失败（alert）
```

---

## 5. 错误处理对齐

| 层级 | 策略 | 实现 |
|------|------|------|
| 后端参数校验 | `@Valid` + `GlobalExceptionHandler` → 400 | `MethodArgumentNotValidException` → 400 |
| 后端业务校验 | `IllegalArgumentException` → 400 | HashService/BubbleSortService/ExportService |
| 后端内部错误 | `Exception` → 500 | `GlobalExceptionHandler` 兜底 |
| 前端网络错误 | try/catch → 展示错误信息 | 各 Panel 的 catch 块 |
| 前端超时 | axios 30s 超时 | `timeout: 30000` |
| 前端导出失败 | alert "导出失败，请重试" | ExportButton catch 块 |

---

## 6. 已知问题

### 6.1 编译验证

- **library-backend**: 当前环境无 Java/Maven，无法执行 `mvn compile`。代码结构完整，所有导入引用正确，package 声明与目录结构一致。需在配备 JDK 11+ 的环境中执行 `mvn compile` 验证。
- **library-frontend**: 当前环境无 Node.js/npm，无法执行 `npm install && npx tsc --noEmit`。TypeScript 代码类型定义完整，组件 props 类型匹配。需在配备 Node.js 18+ 的环境中验证。

### 6.2 冒泡排序交换次数

设计文档中预期 swaps=6，但实现的标准冒泡排序对 `[5,3,8,1,2]` 产生 7 次交换（轮次 1: 3 次，轮次 2: 2 次，轮次 3: 2 次，轮次 4: 0 次）。这是设计文档的算术不一致，实现结果在数学上是正确的。

### 6.3 CORS 配置

`application.yml` 使用 `spring.mvc.cors.mappings` 配置。在 Spring Boot 2.7.x 中可能需要通过 `WebMvcConfigurer` bean 实现。如运行时 CORS 不生效，可添加 `@Configuration` 类补充。

---

## 7. 后续步骤

1. 在配备 JDK 11+ 的环境中执行 `cd library-backend && mvn compile`
2. 在配备 Node.js 18+ 的环境中执行 `cd library-frontend && npm install && npx tsc --noEmit`
3. 启动后端 `mvn spring-boot:run`，启动前端 `npm run dev`
4. 访问 `http://localhost:3000/algorithm-demo` 进行手动验证
5. 编写单元测试（后端 JUnit + 前端 React Testing Library）

---

*本报告由编码实现阶段生成，记录所有代码变更及跨库契约对齐检查结论。*