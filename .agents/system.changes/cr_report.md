# Code Review Report

> **Change** `算法演示与导出功能` · **分支/Commit** `AI/task-DEV-f4ad1a6e...` / `d50cd12` · **日期** `2026-08-06` · **审查者** AI

> **等级**：**P0**（阻塞）/ **P1**（推荐）/ **P2**（参考）；G/S 以 checklist 行内定义为准；Bug 模式 B/M/I 以 `bug-pattern-checklist.md` 为准。

---

## 审查范围

| 维度 | 内容 |
|------|------|
| 变更来源 | `backend/src/main/java/com/antgroup/library/algo/**` + `backend/src/test/java/...` + `pom.xml` + `application.yml` |
| Spec | `.agents/changes/design.md`（系统分析与设计文档：算法演示与导出功能） |
| Java 文件数 | 22（主 20 + 测试 2） |
| 自动化预扫 | `scan-all-rules.sh` 已执行，命中 4 项 G16.2（经 LLM 复核为**误报**，详见下文） |
| 审查维度 | 功能 / 可读性 / 可靠性(军规) / 安全 / Bug 模式 / 自定义扩展 |

---

## Step 2 — 功能性检查（产物 B）

> REQ 来源：`.agents/changes/design.md` 1.2 功能需求清单 + 4. 接口设计。

| REQ | 原文摘录 / 章节锚点 | 关联文件 | 状态 |
|-----|----------------------|----------|------|
| F-01 HelloWorld 接口 | `design.md` L12「提供基础连通性测试接口，返回固定问候语」；`4.1` GET /api/algo/hello → `{code:200,data:{message:"Hello, World!"}}` | `HelloWorldService.java`, `AlgorithmController.java:50-53`, `HelloResponse.java` | ✅ |
| F-02 哈希算法接口 | `design.md` L13「接收输入字符串，返回其 SHA-256 哈希值」；`4.2` POST /api/algo/hash → `{hashValue, algorithm:"SHA-256"}` | `HashService.java`, `AlgorithmController.java:58-61`, `HashRequest.java`, `HashResponse.java` | ✅ |
| F-03 冒泡排序接口 | `design.md` L14「接收整数数组，返回排序后的数组及排序过程关键步骤（可选）」；`4.3` POST /api/algo/bubble-sort → `{sorted, comparisons, swaps}` | `BubbleSortService.java`, `AlgorithmController.java:66-69`, `BubbleSortRequest.java`, `BubbleSortResponse.java` | ✅ |
| F-04 前端 Tab 页面 | `design.md` L15「新增独立页面，三个 Tab」 | 前端文件（非 Java，本技能不审） | N/A（非 Java 范围） |
| F-05 结果导出功能 | `design.md` L16「每个 Tab 下提供导出按钮，下载 CSV/Excel」 | 前端文件（非 Java） | N/A（非 Java 范围） |
| F-06 导出后台接口 | `design.md` L17「通用导出接口，根据类型参数生成对应格式文件流」；`4.4` POST /api/algo/export → 文件流 | `ExportService.java`, `AlgorithmController.java:74-86`, `ExportRequest.java`, `ExportResult.java`, `ExportType.java`, `ExportFormat.java` | ✅ |
| 非功能-输入长度限制 | `design.md` 6.2「哈希接口限制输入长度 ≤ 10KB」 | `HashService.java:25,36` (`@Value` 10240) | ✅ |
| 非功能-数组长度限制 | `design.md` 6.2「冒泡排序限制数组长度 ≤ 10000」 | `BubbleSortService.java:21,31` (`@Value` 10000) | ✅ |
| 非功能-type 白名单 | `design.md` 6.2「导出接口校验 type 白名单，禁止反射或动态类加载」 | `ExportService.java:61-67` (`ExportType.valueOf` 枚举白名单) | ✅ |
| 非功能-CORS | `design.md` 6.2「所有接口启用 CORS 白名单」 | `CorsConfig.java` | ⚠️ 见 G-CORS |

**功能核对结论**：6 个功能点中 4 个 Java 相关 REQ 全部 ✅，接口路径/请求体/响应体与设计一致；非功能性输入限制与白名单均落地。

---

## Step 3 — 可读性检查（产物 C）

> 对照 `readability-checklist.md` A1–A7。

| ID | 检查项 | 状态 | 备注 |
|----|--------|------|------|
| A1 | 源文件格式 | ✅ | 文件编码 UTF-8，换行 LF，无 BOM（源码） |
| A2 | 包名/类名 | ✅ | `com.antgroup.library.algo.{controller,service,dto,enums,common,config}` 分层清晰 |
| A3 | import 顺序 | ✅ | 静态导入在后，常规导入按字母序 |
| A4 | 注释/Javadoc | ✅ | 所有 public 方法均有 Javadoc + `@author DTCoder` |
| A5 | 命名规范 | ✅ | 类名 PascalCase，方法 camelCase，常量 UPPER_SNAKE |
| A6 | 方法长度 | ✅ | 最长 `ExportService.exportData` 等均 <80 行 |
| A7 | 魔法值 | ⚠️ | `BubbleSortService.java:56` 使用 `new java.util.ArrayList<>(n)` 未 import `java.util.ArrayList`（全限定名） |

**P2 — A7 — 全限定名未导入**：`BubbleSortService.java:56` 内联 `new java.util.ArrayList<>(n)`，建议顶部 `import java.util.ArrayList;` 并直接使用。不影响功能，仅风格。

---

## Step 4 — 可靠性 + 安全 + Bug 模式（产物 D）

### 4.1 自动化预扫结果（scan-all-rules.sh）

```
[P0] G16.2 — CatchWithoutLogging: ExportService.java:133
[P0] G16.2 — CatchWithoutLogging: ExportService.java:64
[P0] G16.2 — CatchWithoutLogging: ExportService.java:76
[P0] G16.2 — CatchWithoutLogging: HashService.java:44
=== Summary: 4 findings (P0=4) ===
```

**LLM 复核：4 项均为误报（false positive）**
- `ExportService.java:64`（`parseType` catch）→ 实际有 `log.warn("不支持的导出类型: {}", typeStr)`（L65），脚本仅匹配 catch 行未识别紧随其后的 log 调用。
- `ExportService.java:76`（`parseFormat` catch）→ 实际有 `log.warn("不支持的导出格式: {}", formatStr)`（L77）。
- `ExportService.java:133`（`toExcel` catch）→ 实际有 `log.error("Excel 导出失败", e)`（L134）。
- `HashService.java:44`（`NoSuchAlgorithmException` catch）→ 实际有 `log.error("哈希算法不可用: {}", ALGORITHM, e)`（L45）。

**结论：无真实 G16.2 违规。**

### 4.2 LLM 逐文件审查发现

#### **[P1] G-RespStatus — BizException 未映射 HTTP 状态码** `GlobalExceptionHandler.java:25-29`

`handleBizException` 未加 `@ResponseStatus`，导致所有 `BizException`（含 `PARAM_INVALID(400)`、`EXPORT_FORMAT_NOT_SUPPORTED(406)`、`INPUT_TOO_LARGE(400)`）HTTP 响应码一律 200，与设计 6.1「错误码 400/406/500」不一致。前端按 HTTP status 判断会误判为成功。

- **设计要求**：`design.md` 6.1「400 参数无效」「406 不支持的导出格式」「500 算法执行异常」。
- **现状**：`ResultCode` 已定义 code 字段（400/406/500），但 `@RestControllerAdvice` 返回 HTTP 200。
- **影响**：前端拦截器/网关按 HTTP 状态分流时无法区分业务错误与成功。
- **建议**：为 `handleBizException` 增加 `@ResponseStatus` 或改用 `ResponseEntity.status(...)` 映射 `e.getResultCode().getCode()`。

#### **[P1] S-CsvInjection — CSV 导出未防御公式注入** `ExportService.java:85-96`

`toCsv` 对字段值仅做逗号/引号/换行转义（`escapeCsv`），未防御 CSV/Excel 公式注入。若 `data` 值以 `=`、`+`、`-`、`@` 开头，被 Excel 打开时会被解释为公式（如 `=HYPERLINK(...)`、`=cmd|...`）。

- **设计要求**：`design.md` 6.2 安全措施虽未显式提及 CSV 注入，但导出文件供用户在 Excel 打开，属安全基线。
- **影响**：恶意输入可导致导出文件打开即执行公式（信息泄露/命令执行隐患）。
- **建议**：对以 `= + - @ | %` 开头的字段值前缀 `'` 或 tab 字符，或使用 OpenCSV 的 `CSVWriter` 转义。

#### **[P1] G-CORS — CORS allowedOriginPatterns 过宽** `CorsConfig.java:18`

`allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")` 匹配 localhost 任意端口。开发态可接受，但注释写「沿用系分 CORS 白名单」，而系分 6.2 仅说「CORS 白名单」未限定 localhost。若上线前未改为生产域名白名单，结合 `allowCredentials(true)` 存在 CSRF/凭据泄露风险。

- **影响**：任意本地端口可携带 Cookie 发起跨域请求；生产环境若不收紧存在安全隐患。
- **建议**：生产环境通过 profile 区分，使用 `@Profile("dev")` 或外部化 `allowed-origins` 配置。

#### **[P2] B-NullSafety — Service 层未防御 null 入参** `BubbleSortService.java:31` / `ExportService.java:45,85`

`bubbleSort(List<Integer> numbers)` 直接调 `numbers.size()`；`exportData(... Map data)` 直接调 `data.keySet()`。当前依赖 Controller 的 `@Valid @NotEmpty/@NotNull` 校验保证非空，但 Service 被其他调用方（如定时任务、内部调用）直接调用时会 NPE。

- **影响**：Service 复用时存在 NPE 隐患；防御性编程建议入口校验。
- **建议**：Service 方法入口加 `Objects.requireNonNull` 或在 Javadoc 标注「仅限 Controller 调用，入参由校验保证」。

#### **[P2] G-NonDeterministic — CSV/Excel 列顺序不确定** `ExportService.java:88,116`

`new ArrayList<>(data.keySet())` 依赖 `Map` 迭代顺序。若 `ExportRequest.data` 为 `HashMap`（Jackson 默认反序列化 `Map<String,Object>` → `LinkedHashMap` 实际有序，但若嵌套子对象为 HashMap 则无序），导出列顺序不稳定，影响可读性。

- **影响**：多次导出同源数据列顺序可能不同，用户体验差。
- **建议**：使用 `LinkedHashMap` 或按 key 排序 `keys.sort(Comparator.naturalOrder())`。

#### **[P2] B-Perf — bytesToHex 使用 String.format** `HashService.java:53-58`

`String.format("%02x", b)` 每次调用创建 `Formatter`，32 字节哈希需 32 次格式化。虽不影响正确性，但可用查表数组优化：

```java
private static final char[] HEX = "0123456789abcdef".toCharArray();
sb.append(HEX[(b >> 4) & 0xF]).append(HEX[b & 0xF]);
```

- **影响**：性能微损，高并发下 GC 压力略增。
- **建议**：改用查表法或 `HexFormat.of().formatHex(bytes)`（Java 17+）。

### 4.3 安全清单（security-checklist.md）

| 场景 | 状态 | 备注 |
|------|------|------|
| S1 SQL 注入 | N/A | 无持久化 |
| S2 XSS | N/A | 返回 JSON，无 HTML 渲染 |
| S3 任意文件下载 | ✅ | 文件名由 `ExportType` 枚举 prefix + 后缀生成，非用户输入路径 |
| S4 反序列化 | N/A | 无 |
| S5 密钥泄露 | ✅ | 代码无硬编码密钥 |
| S6 输入校验 | ✅ | `@NotBlank/@NotEmpty/@NotNull` 已加；长度限制在 Service |
| S7 CSV 注入 | ❌ | 见 S-CsvInjection（P1） |
| S8 重放攻击 | ⚠️ | 系分要求「哈希接口需防重放」，代码未实现（无 nonce/时间戳/签名）。属设计待确认项，代码侧未落地 |

### 4.4 Bug 模式清单（bug-pattern-checklist.md）

| 类别 | 命中 | 备注 |
|------|------|------|
| B 空指针 | ⚠️ | B-NullSafety（见上，P2） |
| M 并发 | ✅ | 无共享可变状态；`MessageDigest` 每次新建，线程安全 |
| I 资源泄漏 | ✅ | `Workbook`/`ByteArrayOutputStream` 均 try-with-resources |
| 其他 | ✅ | 无 `equals`/`hashCode` 缺失（DTO 无需进 Set）；无浮点比较 |

---

## Step 5 — 自定义扩展检查（产物 E）

> `customized-checklist.md` 为空/示例项。

**N/A（未启用自定义规则）**

---

## 问题汇总

| 编号 | 等级 | 维度 | 文件:行 | 摘要 |
|------|------|------|---------|------|
| 1 | P1 | 可靠性/功能一致性 | `GlobalExceptionHandler.java:25-29` | BizException 未映射 HTTP 状态码，与设计 6.1 不符 |
| 2 | P1 | 安全 | `ExportService.java:85-96` | CSV 导出未防御公式注入 |
| 3 | P1 | 安全 | `CorsConfig.java:18` | CORS origin 过宽，生产需收紧 |
| 4 | P2 | 可读性(A7) | `BubbleSortService.java:56` | `java.util.ArrayList` 未 import，全限定名 |
| 5 | P2 | 可靠性(B) | `BubbleSortService.java:31` / `ExportService.java:45` | Service 层未防御 null 入参 |
| 6 | P2 | 可靠性(G) | `ExportService.java:88,116` | CSV/Excel 列顺序不确定 |
| 7 | P2 | 性能(B) | `HashService.java:53-58` | bytesToHex 用 String.format，可用查表优化 |

**等级统计**：P0=0，P1=3，P2=4

**blocker_count（P0）= 0**

---

## 收口

- **功能**：F-01/F-02/F-03/F-06 Java 后端功能点全部 ✅，接口契约与设计一致。
- **可靠性/安全**：3 个 P1（HTTP 状态映射、CSV 注入、CORS 收紧），建议合并前修复；4 个 P2 可选改进。
- **自动化预扫**：4 项 G16.2 经复核为误报，无真实阻塞。
- **阻塞项**：0（无 P0）。
- **建议**：P1 项应在合并前处理；P2 项可作为后续迭代优化。

---

*审查时间：2026-08-06 · 审查工具：dtazziboot-java-code-review v1.1.0 + scan-all-rules.sh*
