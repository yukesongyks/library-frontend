# Code Review Report

> **Change** 算法演示模块 (algorithm-demo) · **分支** `AI/task-DEV-966dcd0a` · **日期** 2025-08-17 · **审查者** AI
>
> **AI**：等级 **P0 / P1 / P2**；G/S 以 checklist 行内定义为准；Bug 模式以 `bug-pattern-checklist.md` 表头为准（Blocker→P0、Major→P1、Info→P2）。**已先**运行 `scan-all-rules.sh` 并将要点并入 §5，**再**写 LLM 结论。问题须含 `path:line` 或清单 ID。

---

## 1. 审查范围

| 项 | 值 |
|----|-----|
| 仓库 | library-backend (17 `.java` 文件) + library-frontend (15 `.tsx/.ts` 文件) |
| 变更行数 | backend: +722 / -0; frontend: +2583 / -0 |

### library-backend（Java 审查）

| 类/接口 | 路径 | 角色 |
|---------|------|------|
| `LibraryApplication` | `src/main/java/.../LibraryApplication.java` | 启动类 |
| `ApiResult` | `src/main/java/.../common/ApiResult.java` | 统一响应 |
| `GlobalExceptionHandler` | `src/main/java/.../common/GlobalExceptionHandler.java` | 全局异常处理 |
| `AlgorithmController` | `src/main/java/.../controller/AlgorithmController.java` | REST 控制器 |
| `HelloWorldResponse` | `src/main/java/.../dto/HelloWorldResponse.java` | DTO |
| `HashRequest` | `src/main/java/.../dto/HashRequest.java` | DTO |
| `HashResponse` | `src/main/java/.../dto/HashResponse.java` | DTO |
| `BubbleSortRequest` | `src/main/java/.../dto/BubbleSortRequest.java` | DTO |
| `BubbleSortResponse` | `src/main/java/.../dto/BubbleSortResponse.java` | DTO |
| `SortStep` | `src/main/java/.../dto/SortStep.java` | DTO |
| `ExportRequest` | `src/main/java/.../dto/ExportRequest.java` | DTO |
| `HashService` | `src/main/java/.../service/HashService.java` | 哈希计算 |
| `BubbleSortService` | `src/main/java/.../service/BubbleSortService.java` | 冒泡排序 |
| `ExportService` | `src/main/java/.../service/ExportService.java` | 导出 |
| `ExportResult` | `src/main/java/.../service/ExportResult.java` | 导出结果 |

### library-frontend（跨仓对齐审查）

| 文件 | 路径 | 角色 |
|------|------|------|
| `algorithm.ts` | `src/api/algorithm.ts` | API 层 |
| `algorithm.ts` | `src/types/algorithm.ts` | 类型定义 |
| `AlgorithmDemoPage.tsx` | `src/pages/AlgorithmDemoPage.tsx` | 主页面 |
| `HelloWorldPanel.tsx` | `src/components/HelloWorldPanel.tsx` | Tab1 |
| `HashPanel.tsx` | `src/components/HashPanel.tsx` | Tab2 |
| `BubbleSortPanel.tsx` | `src/components/BubbleSortPanel.tsx` | Tab3 |
| `ExportButton.tsx` | `src/components/ExportButton.tsx` | 导出按钮 |

---

## 2. 问题计数

| P0 | P1 | P2 |
|----|----|-----|
| 2 | 2 | 5 |

---

## 3. Step 2 — 功能（REQ）

> 需求来源：`dima.md` §1.1 + `design.md` §1 核心功能 + `code.md` §1.1

### REQ-F01: HelloWorld 接口

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| GET /api/helloworld 返回 greeting + timestamp | ✅ | dima.md §3.1 | `AlgorithmController.java:40-44` | `"Hello, World!"` + `Instant.now().toString()` |
| 统一响应格式 `{code, message, data}` | ✅ | dima.md §3.1 | `ApiResult.java:18-19` | `code=0, message="success"` |
| 前端调用 GET /api/helloworld | ✅ | dima.md §4.2 | `algorithm.ts:9-12` | `axios.get('/api/helloworld')` |

### REQ-F02: 哈希算法接口

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| POST /api/hash，SHA-256 哈希 | ✅ | dima.md §3.2 | `HashService.java:21-25` | `MessageDigest.getInstance("SHA-256")` |
| @NotBlank 校验 input | ✅ | dima.md §3.2 | `HashRequest.java:7-8` | `@NotBlank` 注解 |
| algorithm 默认 SHA-256 | ✅ | design.md §1 A08 | `HashRequest.java:10` | `private String algorithm = "SHA-256"` |
| 十六进制小写输出 | ✅ | dima.md §3.2 | `HashService.java:34` | `String.format("%02x", b)` |
| 前端调用 POST /api/hash | ✅ | dima.md §4.2 | `algorithm.ts:14-17` | `axios.post('/api/hash', ...)` |

### REQ-F03: 冒泡排序接口

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| POST /api/bubblesort，返回排序过程 | ✅ | dima.md §3.3 | `BubbleSortService.java:27-45` | 标准冒泡排序 + steps 记录 |
| @Size(min=1,max=100) 校验 | ✅ | dima.md §3.3 | `BubbleSortRequest.java:10` | `@Size(min = 1, max = 100)` |
| steps 含 round/after/swapped | ✅ | dima.md §3.3 | `SortStep.java:7-9` | 三个字段完全匹配 |
| comparisons + swaps 统计 | ✅ | dima.md §3.3 | `BubbleSortService.java:24-25,30,35` | 正确计数 |
| 前端调用 POST /api/bubblesort | ✅ | dima.md §4.2 | `algorithm.ts:19-22` | `axios.post('/api/bubblesort', ...)` |

### REQ-F04: 前端三 Tab 页面

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| 路由 /algorithm-demo | ✅ | dima.md §4.1 | `App.tsx:13` | `<Route path="/algorithm-demo" ...>` |
| 三个 Tab 切换 | ✅ | dima.md §4.2 | `AlgorithmDemoPage.tsx:16-20,36-57` | helloworld / hash / bubblesort |
| 各 Tab 独立状态 | ✅ | dima.md §4.3 | 各 Panel 内部 useState | 不跨 Tab 共享 |

### REQ-F05: 导出功能

| Scenario | 结果 | Spec证据 | 代码证据 | 说明 |
|----------|------|----------|----------|------|
| POST /api/export，JSON/CSV | ✅ | dima.md §3.4 | `ExportService.java:21-73` | 支持 json + csv |
| type 枚举校验 | ✅ | dima.md §3.4 | `ExportService.java:25-27` | helloworld/hash/bubblesort 白名单 |
| Content-Disposition: attachment | ✅ | dima.md §3.4 | `AlgorithmController.java:63` | header 正确设置 |
| 前端 Blob 下载 | ✅ | dima.md §4.4 | `ExportButton.tsx:17-25` | `URL.createObjectURL` + `<a>` click |
| 前端导出按钮禁用态 | ✅ | code.md §4.4 | `ExportButton.tsx:37,48` | "请先执行操作" / "导出中..." |

---

## 4. Step 3 — 可读性检查

> 参考 `readability-checklist.md` A1–A7。脚本已覆盖 A3.4，以下为 LLM 逐项核对。

| ID | 结果 | 说明 |
|----|------|------|
| A1.1 | ✅ | 文件名与类名一致 |
| A1.2 | ✅ | UTF-8 编码 |
| A1.3 | ✅ | 无 Tab 字符 |
| A2.1 | ✅ | package → import → class 顺序正确 |
| A2.2 | ✅ | 无 `import *` |
| A2.3 | ✅ | 无静态 import，无需分组 |
| A2.4 | ✅ | import 按字典序排列 |
| A2.5 | N/A | 无重载方法 |
| A3.1 | ✅ | K&R 大括号风格 |
| A3.2 | N/A | 无空 catch/finally 简写 |
| A3.3 | ✅ | 4 空格缩进 |
| A3.4 | ❌ | **3 处超 120 字符**：`AlgorithmController.java:34`（128 字符）、`BubbleSortResponse.java:16`（127 字符）、`ExportService.java:26`（122 字符） |
| A3.5 | ✅ | 换行位置正确 |
| A3.6 | ✅ | 类成员间有空行 |
| A3.7 | ✅ | 关键字与括号间有空格 |
| A3.8 | ✅ | 运算符两侧空格正确 |
| A4.1 | ✅ | 包名全小写 |
| A4.2 | ✅ | 类名 UpperCamelCase |
| A4.3 | ✅ | 方法名 lowerCamelCase |
| A4.4 | ✅ | 常量 `JSON_TYPE`/`CSV_TYPE`/`DATE_FORMAT` 符合 UPPER_SNAKE_CASE |
| A4.5 | ✅ | 无匈牙利命名 |
| A4.6 | ✅ | 泛型 `<T>` |
| A4.7 | N/A | 无测试类 |
| A5.1 | N/A | 无重写方法 |
| A5.2 | ✅ | 无空 catch 块 |
| A5.3 | ✅ | 静态方法通过类名调用 |
| A5.4 | ✅ | 无 `finalize()` |
| A6.1 | ✅ | `String[] args` 风格 |
| A6.2 | N/A | 无 switch |
| A6.3 | ✅ | 修饰符顺序正确 |
| A6.4 | ✅ | 注解格式正确 |
| A6.5 | N/A | 无 long 字面量 |
| A7.1 | ⚠️ | 所有 public 类/方法缺少 Javadoc（P2）。由于是演示模块，影响有限 |
| A7.2–A7.4 | N/A | 无 Javadoc |

---

## 5. Step 4 — 可靠性检查

### 自动化预扫结果（`scan-all-rules.sh`）

脚本扫描了 `library-backend/src/main/java/com/example/library/`，命中 6 条：

| 等级 | 规则 ID | 文件:行 | 说明 |
|------|---------|---------|------|
| **P0** | G16.2 | `ExportService.java:70` | catch(Exception) 未记录日志即重新抛出 |
| **P0** | G16.2 | `HashService.java:26` | catch(NoSuchAlgorithmException) 未记录日志即重新抛出 |
| P1 | M016 | `ExportService.java:37` | `LocalDateTime.now()` 使用系统默认时区 |
| P2 | A3.4 | `AlgorithmController.java:34` | 行宽 128 > 120 |
| P2 | A3.4 | `BubbleSortResponse.java:16` | 行宽 127 > 120 |
| P2 | A3.4 | `ExportService.java:26` | 行宽 122 > 120 |

### LLM 补充审查

| 域 | 参考 | 结果 | 等级 | 说明 |
|----|------|------|------|------|
| 可靠性 | G1 并发 | N/A | — | 无状态服务，无并发共享资源 |
| 可靠性 | G2 幂等 | N/A | — | 纯计算型接口，无写操作 |
| 可靠性 | G3 事务 | N/A | — | 无数据库操作 |
| 可靠性 | G4 SQL | N/A | — | 无 SQL |
| 可靠性 | G5–G15 | N/A | — | 与本次变更无关 |
| 可靠性 | G16.2 可监控 | ❌ | P0 | 脚本已命中 2 处 + LLM 补充 `GlobalExceptionHandler.java:29` catch(Exception) 无日志 |
| 可靠性 | G16.4 空catch | ✅ | — | 无空 catch 块 |
| 可靠性 | G17 可应急 | N/A | — | 演示模块，无应急需求 |
| 安全 | S1 SQL注入 | N/A | — | 无 SQL |
| 安全 | S2 XSS | N/A | — | 后端不渲染 HTML |
| 安全 | S3 SSRF | N/A | — | 无外部请求 |
| 安全 | S4 命令执行 | N/A | — | 无命令执行 |
| 安全 | S5 XXE | N/A | — | 无 XML 解析 |
| 安全 | S6 反序列化 | ✅ | — | Jackson 默认配置，无多态反序列化 |
| 安全 | S7 文件上传 | N/A | — | 无文件上传 |
| 安全 | S8 访问控制 | ✅ | — | 设计明确：公开页面，无需鉴权 |
| 安全 | S9 数据安全 | ✅ | — | 无硬编码密钥/凭证 |
| 安全 | S10.2 CORS | ❌ | P1 | `application.yml:9` `allowed-origins: "*"` 允许任意来源 |
| Bug 模式 | B/M/I | N/A | — | 脚本已扫 52/222 条，余下 LLM 未发现额外命中 |

---

## 6. Step 5 — 自定义扩展检查

| 域 | 参考 | 结果 | 等级 | 说明 |
|----|------|------|------|------|
| 自定义扩展 | `customized-checklist.md` | N/A | — | 未启用自定义规则 |

---

## 7. 跨仓对齐检查

| 对齐项 | 前端 | 后端 | 结果 |
|--------|------|------|------|
| GET /api/helloworld 响应类型 | `ApiResponse<HelloWorldData>` | `ApiResult<HelloWorldResponse>` | ✅ |
| POST /api/hash 请求体 | `{input, algorithm?}` | `HashRequest` | ✅ |
| POST /api/hash 响应体 | `HashData {input,algorithm,hash}` | `HashResponse` | ✅ |
| POST /api/bubblesort 请求体 | `{array: number[]}` | `BubbleSortRequest` | ✅ |
| POST /api/bubblesort 响应体 | `BubbleSortData {steps,comparisons,swaps}` | `BubbleSortResponse` | ✅ |
| POST /api/export 请求体 | `{type, data, format?}` | `ExportRequest` | ✅ |
| POST /api/export 响应处理 | `responseType: 'blob'` | `ResponseEntity<byte[]>` | ✅ |
| 前端超时 30s | `timeout: 30000` | N/A | ✅ |
| Vite proxy /api → :8080 | `vite.config.ts:9-12` | `server.port: 8080` | ✅ |

**结论：跨库接口契约完全对齐，无类型不匹配。**

---

## 7.1 问题片段（必填）

### P0 问题

- **P0** `G16.2` `library-backend/src/main/java/com/example/library/service/ExportService.java:70` — catch(Exception) 捕获后仅重新抛出 IllegalArgumentException，未记录原始异常日志，排障可观测性不足。

  片段范围：`ExportService.java:68-73`

```java
L68|            return new ExportResult(content, CSV_TYPE, filename);
L69|        }
L70|        } catch (Exception e) {
L71|            throw new IllegalArgumentException("Export failed: " + e.getMessage(), e);
L72|        }
L73|    }
```

- **P0** `G16.2` `library-backend/src/main/java/com/example/library/service/HashService.java:26` — catch(NoSuchAlgorithmException) 未记录日志即重新抛出。

  片段范围：`HashService.java:24-28`

```java
L24|            String hash = bytesToHex(digest);
L25|            return new HashResponse(input, algorithm, hash);
L26|        } catch (NoSuchAlgorithmException e) {
L27|            throw new IllegalArgumentException("Unsupported algorithm: " + algorithm, e);
L28|        }
```

### P1 问题

- **P1** `M016` `library-backend/src/main/java/com/example/library/service/ExportService.java:37` — `LocalDateTime.now()` 使用系统默认时区，可能导致跨时区部署时文件名时间戳不一致。

  片段范围：`ExportService.java:36-38`

```java
L36|        String ext = format.equals("json") ? "json" : "csv";
L37|        String timestamp = LocalDateTime.now().format(DATE_FORMAT);
L38|        String filename = "export-" + type + "-" + timestamp + "." + ext;
```

- **P1** `S10.2` `library-backend/src/main/resources/application.yml:9` — CORS 配置 `allowed-origins: "*"` 允许任意来源跨域访问，存在安全隐患。

  片段范围：`application.yml:7-11`

```yaml
L7 |      mappings:
L8 |        /api/**:
L9 |          allowed-origins: "*"
L10|          allowed-methods: GET,POST,PUT,DELETE,OPTIONS
L11|          allowed-headers: "*"
```

### P2 问题

- **P2** `A3.4` `library-backend/src/main/java/com/example/library/controller/AlgorithmController.java:34` — 构造器参数行宽 128 字符，超过 120 限制。

- **P2** `A3.4` `library-backend/src/main/java/com/example/library/dto/BubbleSortResponse.java:16` — 构造器参数行宽 127 字符。

- **P2** `A3.4` `library-backend/src/main/java/com/example/library/service/ExportService.java:26` — 类型校验行宽 122 字符。

- **P2** `A7.1` — 所有 public 类和方法缺少 Javadoc 文档注释（`AlgorithmController`, `HashService`, `BubbleSortService`, `ExportService` 等）。

- **P2** `library-frontend/src/components/HelloWorldPanel.tsx:34-36` — `useEffect` 缺少 `load` 依赖项，React 严格模式可能触发 lint 警告。

---

## 8. 修复任务列表

### P0

- [ ] **P0** `library-backend/.../service/ExportService.java:70` — 在 `catch(Exception e)` 块中添加日志记录（如 `log.error("Export failed", e)`），再重新抛出
- [ ] **P0** `library-backend/.../service/HashService.java:26` — 在 `catch(NoSuchAlgorithmException e)` 块中添加日志记录

### P1

- [ ] **P1** `library-backend/.../service/ExportService.java:37` — 使用 `LocalDateTime.now(ZoneOffset.UTC)` 或 `ZonedDateTime.now(ZoneOffset.UTC)` 替代系统默认时区
- [ ] **P1** `library-backend/src/main/resources/application.yml:9` — 将 `allowed-origins: "*"` 改为具体的前端域名白名单（如 `http://localhost:3000`）

### P2

- [ ] **P2** `library-backend/.../controller/AlgorithmController.java:34` — 将构造器参数换行以符合 120 字符限制
- [ ] **P2** `library-backend/.../dto/BubbleSortResponse.java:16` — 将构造器参数换行
- [ ] **P2** `library-backend/.../service/ExportService.java:26` — 将类型校验条件换行
- [ ] **P2** `library-backend` — 为核心 public 类和方法补充 Javadoc（A7.1）
- [ ] **P2** `library-frontend/src/components/HelloWorldPanel.tsx:34` — 将 `load` 加入 `useEffect` 依赖数组或使用 `useCallback` 包裹

---

## 9. 结论

- **合并建议**：修复 P0 后合并
- **P0**（2 项）：ExportService 和 HashService 中 catch 块缺少日志记录
- **P1**（2 项）：时区默认值 + CORS 通配符
- **P2**（5 项）：行宽超限（3）+ Javadoc 缺失（1）+ React hooks 依赖（1）
- **一句话**：代码功能完整、跨库接口契约对齐正确，但异常处理缺少可观测性日志，需补充后合并；整体质量良好，无功能缺陷。

---

*本报告由 DTCoder 基于 `dtazziboot-java-code-review` 技能生成，审查日期 2025-08-17。*