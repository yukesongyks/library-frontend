# Java 代码审查报告 — library-demo-analytics

| 项目 | 值 |
|------|-----|
| 审查日期 | 2026-08-12 |
| 审查技能 | dtazziboot-java-code-review (v1.1.0) |
| 审查范围 | `library-backend` 仓库 Java 代码变更（16 个 `.java` 文件 + `schema.sql` + `pom.xml` + `application.yml`） |
| 代码来源 | `.agents/system.changes/code.md`（编码实现阶段交付物） |
| Spec 来源 | `.agents/specs/library-demo-analytics-design.md`、`.agents/system.changes/design.md` |
| 审查模式 | 纯 LLM 审查（降级） |
| Blocker 数量 | **7** |

> **[降级说明]** 物理磁盘后端仓库 `library-backend-main` 仅有 `README.md`，无 `.java` 源文件落盘。`scan-all-rules.sh` 无法对实际文件路径执行自动化预扫。本次审查以 `code.md` 中 Java 代码块为审查对象，由 LLM 逐文件完成 Step 2→3→4→5。脚本未覆盖项已由 LLM 补扫。

---

## §1 审查范围与执行队列

### §1.1 预检结论

| 检查项 | 结论 |
|--------|------|
| Git 仓库 | ✅ `library-backend-main` 为 git 仓库（branch: `AI/task-DEV-...`） |
| 变更范围 | ⚠️ `git diff --stat` 为空（代码未落盘到工作区，仅存在于 `code.md` 文档中） |
| Java 文件 | ✅ `code.md` 包含 16 个 `.java` 文件代码块，满足 Java 守卫 |
| 审查对象 | `code.md` §3 后端代码实现中的全部 Java 代码块 |

### §1.2 执行队列（Step 1 产物 A）

| # | 逻辑路径 | 归属原因 | 状态 |
|---|----------|----------|------|
| 1 | `src/main/java/com/library/backend/LibraryBackendApplication.java` | 主启动类 | ✅ 已审 |
| 2 | `src/main/java/com/library/backend/common/ApiResponse.java` | 统一响应体 | ⚠️ 已审有问题 |
| 3 | `src/main/java/com/library/backend/common/GlobalExceptionHandler.java` | 全局异常处理 | ⚠️ 已审有问题 |
| 4 | `src/main/java/com/library/backend/entity/CallLog.java` | 埋点实体 | ✅ 已审 |
| 5 | `src/main/java/com/library/backend/entity/Person.java` | 人员实体 | ✅ 已审 |
| 6 | `src/main/java/com/library/backend/mapper/CallLogMapper.java` | 埋点 Mapper | ⚠️ 已审有问题 |
| 7 | `src/main/java/com/library/backend/mapper/PersonMapper.java` | 人员 Mapper | ✅ 已审 |
| 8 | `src/main/java/com/library/backend/aspect/TrackCall.java` | 埋点注解 | ✅ 已审 |
| 9 | `src/main/java/com/library/backend/aspect/TrackCallAspect.java` | AOP 切面 | ⚠️ 已审有问题 |
| 10 | `src/main/java/com/library/backend/service/DemoService.java` | 演示业务逻辑 | ⚠️ 已审有问题 |
| 11 | `src/main/java/com/library/backend/service/ExportService.java` | 导出逻辑 | ⚠️ 已审有问题 |
| 12 | `src/main/java/com/library/backend/service/AnalyticsService.java` | 统计查询 | ⚠️ 已审有问题 |
| 13 | `src/main/java/com/library/backend/dto/BarLineChartDTO.java` | 柱/折线图 DTO | ✅ 已审 |
| 14 | `src/main/java/com/library/backend/dto/PieChartDTO.java` | 饼图 DTO | ✅ 已审 |
| 15 | `src/main/java/com/library/backend/controller/DemoController.java` | 演示 Controller | ⚠️ 已审有问题 |
| 16 | `src/main/java/com/library/backend/controller/AnalyticsController.java` | 统计 Controller | ✅ 已审 |
| 17 | `src/main/java/com/library/backend/config/WebConfig.java` | CORS 配置 | ⚠️ 已审有问题 |
| — | `src/main/resources/schema.sql` | 建表脚本（非 Java，参考审查） | ✅ 已审 |
| — | `pom.xml` | Maven 配置（非 Java，参考审查） | ✅ 已审 |
| — | `src/main/resources/application.yml` | 应用配置（非 Java，参考审查） | ✅ 已审 |

**核销验证**：执行队列 `⬜ 待审` = 0（跳过项除外），report 审查范围文件数 = 17（Java）+ 3（非 Java 参考）= 20，与已审队列一致。

---

## §2 功能性检查（Step 2 产物 B）

### REQ 清单（来源：`library-demo-analytics-design.md` + `design.md`）

| # | REQ（功能点） | Spec 证据 | 关联文件 | 结论 |
|---|---------------|-----------|----------|------|
| REQ-1 | 后端提供 HelloWorld 接口 | design.md §2.5 W01: `GET /api/demo/helloworld` | `DemoController.java:1019-1023`、`DemoService.java:helloWorld()` | ✅ 符合 |
| REQ-2 | 后端提供哈希算法接口 | design.md §2.5 W02: `GET /api/demo/hash?input=...` | `DemoController.java:1025-1029`、`DemoService.java:hash()` | ✅ 符合 |
| REQ-3 | 后端提供冒泡排序接口 | design.md §2.5 W03: `GET /api/demo/bubblesort?numbers=...` | `DemoController.java:1031-1035`、`DemoService.java:bubbleSort()` | ✅ 符合 |
| REQ-4 | 后端提供导出接口，支持导出各页面展示结果 | design.md §2.5 W04: `GET /api/demo/export?tab=...` | `DemoController.java:1037-1040`、`ExportService.java:exportTab()` | ✅ 符合 |
| REQ-5 | 后端做埋点，获取调用次数和调用人 | design.md §2.4: `call_log` 表记录 `caller_id`/`api_name`/`call_time` | `TrackCallAspect.java`、`CallLog.java`、`CallLogMapper.java` | ✅ 符合 |
| REQ-6 | 统计查询支持多维度（人员类型/层级/部门） | design.md §2.5 W05 + §2.4 person 表 `person_type`/`person_level`/`department` | `AnalyticsService.java:resolveDimensionColumn()`、`CallLogMapper.java:countByDimension()` | ✅ 符合 |
| REQ-7 | 统计查询支持折线图、饼图、柱状图 | design.md §2.5 W05: `chartType` 参数 | `AnalyticsController.java:1065-1080`、`AnalyticsService.java` | ✅ 符合 |
| REQ-8 | 埋点记录调用结果快照用于导出 | design.md §2.4: `result_snapshot TEXT` | `TrackCallAspect.java:saveCallLog()`、`ExportService.java` | ✅ 符合 |

**Step 2 章节级结论**：8 项 REQ 全部符合，无 P0 功能性不符。

---

## §3 可读性检查（Step 3 产物 C）

对照 `readability-checklist.md`（A1–A7）：

| 规则 | 检查项 | 结论 | 命中文件 |
|------|--------|------|----------|
| A1 | 命名规范：类名大驼峰、方法名小驼峰、常量全大写下划线 | ✅ 通过 | — |
| A2 | 包名全小写、层级合理 | ✅ 通过 | — |
| A3 | 方法长度合理（<80 行） | ⚠️ `ExportService.exportTab()` 约 35 行，可接受 | — |
| A4 | 注释完备：类/方法/复杂逻辑有注释 | ⚠️ P2 | `DemoService.java`、`AnalyticsService.java`、`ExportService.java` 缺少方法级 Javadoc |
| A5 | 魔法值处理 | ⚠️ P2 | `DemoService.java:hash()` 硬编码 `"SHA-256"`；`TrackCallAspect.java` 硬编码 `"anonymous"`/`"匿名"` |
| A6 | 日志规范：使用日志框架而非 `System.out` | ✅ 通过（当前无 `System.out`，但埋点异常静默吞掉，见 §4） | — |
| A7 | 代码格式：缩进/括号/空行统一 | ✅ 通过 | — |

---

## §4 可靠性 + 安全 + Bug 模式检查（Step 4 产物 D）

### §4.1 可靠性检查（G 类）

| # | 规则 | 等级 | 命中文件 | 问题描述 |
|---|------|------|----------|----------|
| G-1 | 资源释放：`Workbook` 未在 try-with-resources 中声明 | **P1** | `ExportService.java:763` | `new XSSFWorkbook()` 创建的 `Workbook` 在异常路径下可能泄漏。虽然 `try` 块末尾有 `workbook.close()`，但若 `workbook.write(os)` 抛异常，`close()` 不会执行。应改为 `try (Workbook workbook = new XSSFWorkbook())` |
| G-2 | 埋点异常静默吞掉，无日志 | **P1** | `TrackCallAspect.java:saveCallLog()` catch 块 | `catch (Exception e) {}` 空实现，埋点失败完全无感知，生产环境无法排查。应至少记录 `log.warn("埋点写入失败", e)` |
| G-3 | 埋点同步写入阻塞主流程 | **P2** | `TrackCallAspect.java:track()` | `@Around` 中 `callLogMapper.insert(log)` 为同步 DB 写入，高并发下会拖慢接口响应。design.md §5.3 已识别此风险，MVP 可接受，建议后续引入 `@Async` |
| G-4 | `result_snapshot` 无大小限制 | **P2** | `TrackCallAspect.java` | `objectMapper.writeValueAsString(result)` 对大响应体无截断，TEXT 字段可能存储超长 JSON。design.md §5.3 已建议 4KB 截断 |
| G-5 | 日期解析无异常处理 | **P1** | `AnalyticsService.java:resolveDateRange()` | `LocalDate.parse(startDate, fmt)` 若传入非法日期格式会抛 `DateTimeParseException`，被 `GlobalExceptionHandler` 的通用 `Exception` 捕获返回 500，应增加 `DateTimeParseException` 专属处理返回 400 |
| G-6 | `findSnapshotsByApiName` 无分页 | **P2** | `CallLogMapper.java` | 导出查询 `ORDER BY call_time DESC` 无 `LIMIT`，数据量大时全表扫描导致 OOM |

### §4.2 安全检查（S 类）

| # | 规则 | 等级 | 命中文件 | 问题描述 |
|---|------|------|----------|----------|
| S-1 | **SQL 注入漏洞** | **P0** | `CallLogMapper.java:countByDimension()` | `p.${dimensionColumn}` 使用字符串拼接注入列名，`dimensionColumn` 来自 `AnalyticsService.resolveDimensionColumn()` 的 switch 映射，当前为白名单映射（`person_type`/`person_level`/`department`），**暂时安全**。但 `${}` 拼接是 MyBatis SQL 注入高风险模式，若后续有人绕过 switch 直接传值将导致注入。建议改为枚举校验或 `#{} ` 参数化（列名无法参数化，应强化白名单校验并加注释警告） |
| S-2 | **身份伪造风险** | **P0** | `TrackCallAspect.java` + `request.ts` | 调用人身份通过 HTTP Header `X-User-Id`/`X-User-Name` 传递，前端从 `localStorage` 读取。任何人可伪造 Header 冒充他人身份，埋点数据不可信。design.md §5.4 A01 已标记"待确认"，但这是安全漏洞级别问题，生产环境必须对接 SSO/网关鉴权 |
| S-3 | **输入校验缺失** | **P0** | `DemoService.java:bubbleSort()` | `Integer.parseInt(parts[i].trim())` 无校验，传入非数字字符串（如 `abc`）会抛 `NumberFormatException`，被通用异常处理器返回 500。应捕获并返回 400 友好提示 |
| S-4 | **输入校验缺失** | **P0** | `DemoService.java:hash()` | `input.getBytes()` 使用默认字符集，未指定 `StandardCharsets.UTF_8`，不同环境可能产生不同哈希值 |
| S-5 | CORS 配置硬编码 origin | **P1** | `WebConfig.java` | `allowedOrigins("http://localhost:5173")` 硬编码，生产环境需改为配置项 |
| S-6 | 导出接口无权限控制 | **P1** | `DemoController.java:1037-1040` | `/api/demo/export` 无鉴权注解，任何人可导出全部调用记录快照 |

### §4.3 Bug 模式检查（B/M/I 类）

| # | 规则 ID | 等级 | 命中文件 | 问题描述 |
|---|---------|------|----------|----------|
| B-1 | **B01 — 空指针风险** | **P0 (Blocker)** | `ExportService.java:extractField()` | `json.indexOf(key)` 返回 -1 时返回 `""`，但后续 `json.charAt(start)` 若 `start >= json.length()` 会抛 `StringIndexOutOfBoundsException`。当 JSON 格式异常时（如 `result` 字段值为空字符串 `""`），`end = json.indexOf('"', start + 1)` 可能返回 -1，`json.substring(start + 1, -1)` 抛异常 |
| B-2 | **B02 — 异常处理不当** | **P0 (Blocker)** | `DemoService.java:hash()` | `catch (Exception e) { throw new RuntimeException("哈希计算失败", e); }` 捕获了 `NoSuchAlgorithmException`（SHA-256 是 JDK 标准算法，不会抛此异常），但用 `RuntimeException` 包装导致 `GlobalExceptionHandler` 返回 500 而非更精确的错误码 |
| B-3 | **M01 — 魔法值** | **P1 (Major)** | `DemoService.java:bubbleSort()` | `steps` 计数器只统计交换次数，不统计比较次数。spec 要求展示"执行结果"，`steps` 语义不明确（是交换次数还是比较次数？） |
| B-4 | **M02 — 资源泄漏** | **P1 (Major)** | `ExportService.java:792-795` | `try (OutputStream os = response.getOutputStream()) { workbook.write(os); workbook.close(); }` — `workbook.close()` 在 try 块内而非 try-with-resources 声明，若 `workbook.write(os)` 抛异常则 `workbook` 不会关闭 |
| B-5 | **M03 — 线程安全** | **P1 (Major)** | `TrackCallAspect.java` | `ObjectMapper` 作为成员变量注入，`ObjectMapper` 是线程安全的，✅ 正确。但 `request.getParameterMap()` 返回的 `Map<String, String[]>` 直接序列化，参数值数组可能包含敏感信息 |
| B-6 | **I01 — 代码风格** | **P2 (Info)** | `ApiResponse.java` | `traceId` 使用 `UUID.randomUUID()`，未接入分布式链路追踪（如 MDC/Sleuth），生产环境无法关联日志 |
| B-7 | **I02 — 代码风格** | **P2 (Info)** | `GlobalExceptionHandler.java` | `handleGeneric(Exception e)` 返回 `e.getMessage()` 可能泄露内部实现细节（如 SQL 错误信息），应脱敏 |
| B-8 | **I03 — 代码风格** | **P2 (Info)** | `AnalyticsService.java:929` | `dataMap.getOrDefault(an, new HashMap<>()).getOrDefault(cat, 0)` 每次调用 `getOrDefault` 创建新 `HashMap` 对象，虽不影响正确性但产生不必要的对象分配 |

---

## §5 自定义扩展检查（Step 5 产物 E）

N/A（未启用自定义规则）

---

## §6 问题汇总统计

| 等级 | 数量 | 说明 |
|------|------|------|
| **P0 (Blocker)** | **7** | S-1, S-2, S-3, S-4, B-1, B-2, G-5(升级) |
| **P1 (Major)** | **6** | G-1, G-2, G-5, S-5, S-6, B-3, B-4, B-5 |
| **P2 (Info)** | **7** | G-3, G-4, G-6, A-4, A-5, B-6, B-7, B-8 |

> **Blocker 明细（P0）**：
> 1. **S-1** SQL 注入风险 — `CallLogMapper.java` `${dimensionColumn}` 拼接
> 2. **S-2** 身份伪造 — Header 传递身份无鉴权
> 3. **S-3** 输入校验缺失 — `bubbleSort()` 未校验数字格式
> 4. **S-4** 字符集不确定 — `hash()` 未指定 UTF-8
> 5. **B-1** 空指针/越界 — `ExportService.extractField()` JSON 解析无边界保护
> 6. **B-2** 异常处理不当 — `hash()` 用 RuntimeException 包装
> 7. **G-5** 日期解析异常 — `resolveDateRange()` 无 `DateTimeParseException` 处理

---

## §7 逐文件审查结论

### 7.1 `LibraryBackendApplication.java`
- **Step 2**: ✅ 主启动类，符合 spec
- **Step 3**: ✅ 无可读性问题
- **Step 4**: ✅ 无可靠性/安全/Bug 问题
- **Step 5**: N/A
- **结论**: ✅ 通过

### 7.2 `ApiResponse.java`
- **Step 2**: ✅ 统一响应体 `{code, message, data, traceId}` 符合 spec
- **Step 3**: ✅ 命名规范
- **Step 4**: ⚠️ B-6 (P2) `traceId` 未接入链路追踪
- **Step 5**: N/A
- **结论**: ⚠️ 通过（P2 建议）

### 7.3 `GlobalExceptionHandler.java`
- **Step 2**: ✅ 异常处理覆盖 400/500
- **Step 3**: ✅ 无可读性问题
- **Step 4**: ⚠️ B-7 (P2) `e.getMessage()` 可能泄露内部信息；⚠️ G-5 (P1) 缺少 `DateTimeParseException` 处理
- **Step 5**: N/A
- **结论**: ⚠️ 有问题

### 7.4 `CallLog.java`
- **Step 2**: ✅ 实体字段与 `schema.sql` 一致
- **Step 3**: ✅ Lombok `@Data` + MyBatis-Plus 注解规范
- **Step 4**: ✅ 无问题
- **Step 5**: N/A
- **结论**: ✅ 通过

### 7.5 `Person.java`
- **Step 2**: ✅ 实体字段与 `schema.sql` 一致
- **Step 3**: ✅ 规范
- **Step 4**: ✅ 无问题
- **Step 5**: N/A
- **结论**: ✅ 通过

### 7.6 `CallLogMapper.java`
- **Step 2**: ✅ `countByDimension` + `findSnapshotsByApiName` 符合 spec
- **Step 3**: ✅ SQL 可读
- **Step 4**: ❌ **S-1 (P0)** `${dimensionColumn}` SQL 拼接；⚠️ G-6 (P2) 无分页
- **Step 5**: N/A
- **结论**: ❌ 有 Blocker

### 7.7 `PersonMapper.java`
- **Step 2**: ✅ BaseMapper CRUD
- **Step 3**: ✅ 规范
- **Step 4**: ✅ 无问题
- **Step 5**: N/A
- **结论**: ✅ 通过

### 7.8 `TrackCall.java`
- **Step 2**: ✅ 注解定义符合 spec
- **Step 3**: ✅ 规范
- **Step 4**: ✅ 无问题
- **Step 5**: N/A
- **结论**: ✅ 通过

### 7.9 `TrackCallAspect.java`
- **Step 2**: ✅ `@Around` 环绕通知实现埋点
- **Step 3**: ⚠️ A-5 (P2) 硬编码 `"anonymous"`/`"匿名"`
- **Step 4**: ❌ **S-2 (P0)** 身份伪造；⚠️ G-2 (P1) 异常静默吞掉；⚠️ G-3 (P2) 同步写入；⚠️ G-4 (P2) 无大小限制
- **Step 5**: N/A
- **结论**: ❌ 有 Blocker

### 7.10 `DemoService.java`
- **Step 2**: ✅ 三个方法实现 helloWorld/hash/bubbleSort
- **Step 3**: ⚠️ A-4 (P2) 缺 Javadoc；⚠️ A-5 (P2) 硬编码 `"SHA-256"`
- **Step 4**: ❌ **S-3 (P0)** bubbleSort 输入校验缺失；❌ **S-4 (P0)** hash 字符集不确定；❌ **B-2 (P0)** 异常处理不当；⚠️ B-3 (P1) steps 语义不明
- **Step 5**: N/A
- **结论**: ❌ 有 Blocker

### 7.11 `ExportService.java`
- **Step 2**: ✅ 导出逻辑实现 POI xlsx 生成
- **Step 3**: ✅ 方法长度可接受
- **Step 4**: ❌ **B-1 (P0)** extractField 越界风险；⚠️ G-1 (P1) Workbook 资源泄漏；⚠️ B-4 (P1) close 位置不当
- **Step 5**: N/A
- **结论**: ❌ 有 Blocker

### 7.12 `AnalyticsService.java`
- **Step 2**: ✅ 多维度聚合 + DTO 组装
- **Step 3**: ⚠️ A-4 (P2) 缺 Javadoc
- **Step 4**: ❌ **G-5 (P0)** 日期解析无异常处理；⚠️ B-8 (P2) 不必要对象分配
- **Step 5**: N/A
- **结论**: ❌ 有 Blocker

### 7.13 `BarLineChartDTO.java`
- **Step 2**: ✅ DTO 结构符合 spec
- **Step 3**: ✅ 规范
- **Step 4**: ✅ 无问题
- **Step 5**: N/A
- **结论**: ✅ 通过

### 7.14 `PieChartDTO.java`
- **Step 2**: ✅ DTO 结构符合 spec
- **Step 3**: ✅ 规范
- **Step 4**: ✅ 无问题
- **Step 5**: N/A
- **结论**: ✅ 通过

### 7.15 `DemoController.java`
- **Step 2**: ✅ 3 个演示接口 + 导出接口，路径符合 spec
- **Step 3**: ✅ 规范
- **Step 4**: ⚠️ S-6 (P1) 导出接口无鉴权
- **Step 5**: N/A
- **结论**: ⚠️ 有问题

### 7.16 `AnalyticsController.java`
- **Step 2**: ✅ 统计查询接口，参数符合 spec
- **Step 3**: ✅ 规范
- **Step 4**: ✅ 无问题
- **Step 5**: N/A
- **结论**: ✅ 通过

### 7.17 `WebConfig.java`
- **Step 2**: ✅ CORS 配置
- **Step 3**: ✅ 规范
- **Step 4**: ⚠️ S-5 (P1) origin 硬编码
- **Step 5**: N/A
- **结论**: ⚠️ 有问题

---

## §8 修复任务列表

### P0 (Blocker) — 必须修复后合并

- [ ] **S-1** `CallLogMapper.java` — `${dimensionColumn}` SQL 拼接改为强化白名单校验，增加 `@Param` 注释警告不可传入外部值；或改用 `Condition` API 动态构建 SQL
- [ ] **S-2** `TrackCallAspect.java` — 身份获取改为从 SecurityContext/网关注入的 JWT Claims 读取，禁止信任前端 Header；MVP 阶段至少增加注释标记风险
- [ ] **S-3** `DemoService.java:bubbleSort()` — 增加 `Integer.parseInt` 异常捕获，返回 400 友好提示"参数格式错误: 须为逗号分隔的整数"
- [ ] **S-4** `DemoService.java:hash()` — `input.getBytes()` 改为 `input.getBytes(StandardCharsets.UTF_8)`
- [ ] **B-1** `ExportService.java:extractField()` — 增加边界检查：`end < 0` 时返回 `""`；`start >= json.length()` 时返回 `""`；或改用 Jackson `ObjectMapper` 解析 JSON
- [ ] **B-2** `DemoService.java:hash()` — 移除 `catch (Exception e)`，`NoSuchAlgorithmException` 应在方法签名声明或转为 `IllegalStateException`（SHA-256 为标准算法，不存在则 JVM 环境异常）
- [ ] **G-5** `AnalyticsService.java:resolveDateRange()` + `GlobalExceptionHandler.java` — 增加 `@ExceptionHandler(DateTimeParseException.class)` 返回 400

### P1 (Major) — 合并前应修复

- [ ] **G-1** `ExportService.java` — `Workbook` 改为 try-with-resources: `try (Workbook workbook = new XSSFWorkbook(); OutputStream os = response.getOutputStream())`
- [ ] **G-2** `TrackCallAspect.java` — catch 块增加 `slf4j` 日志: `log.warn("埋点写入失败, apiName={}", trackCall.apiName(), e)`
- [ ] **S-5** `WebConfig.java` — `allowedOrigins` 改为 `@Value("${cors.allowed-origins}")` 配置项
- [ ] **S-6** `DemoController.java` — 导出接口增加鉴权注解（如 `@PreAuthorize` 或自定义拦截器）
- [ ] **B-3** `DemoService.java:bubbleSort()` — 明确 `steps` 语义为"交换次数"并重命名或增加注释
- [ ] **B-4** `ExportService.java` — `workbook.close()` 移入 try-with-resources 声明（与 G-1 合并修复）

### P2 (Info) — 可选改进

- [ ] **G-3** `TrackCallAspect.java` — 后续引入 `@Async` + MQ 削峰
- [ ] **G-4** `TrackCallAspect.java` — `result_snapshot` 增加 4KB 截断
- [ ] **G-6** `CallLogMapper.java` — `findSnapshotsByApiName` 增加 `LIMIT #{limit}` 分页
- [ ] **A-4** `DemoService.java`/`AnalyticsService.java`/`ExportService.java` — 补充方法级 Javadoc
- [ ] **A-5** `DemoService.java`/`TrackCallAspect.java` — 魔法值提取为常量
- [ ] **B-6** `ApiResponse.java` — `traceId` 接入 MDC/Sleuth
- [ ] **B-7** `GlobalExceptionHandler.java` — `handleGeneric` 脱敏 `e.getMessage()`
- [ ] **B-8** `AnalyticsService.java:929` — 优化 `getOrDefault` 避免不必要的 `new HashMap<>()`

---

## §9 跨仓对齐点检查结论

| 对齐点 | 检查项 | 结论 |
|--------|--------|------|
| **接口路径** | 前端 API 调用路径与后端 Controller `@RequestMapping` 路径一致 | ✅ `/api/demo/*`、`/api/analytics/calls` 完全对齐 |
| **请求/响应类型** | `ApiResponse<T>` 结构前后端字段一致 (code/message/data/traceId) | ✅ TypeScript 接口与 Java 泛型类对齐 |
| **导出契约** | 前端 `exportTab()` 返回 Blob，后端返回 `application/vnd.openxmlformats` 文件流 | ✅ MIME 类型与前端下载处理对齐 |
| **埋点身份传递** | 前端 Axios 拦截器注入 `X-User-Id`/`X-User-Name`，后端 AOP 从 Header 读取 | ⚠️ Header 名称一致但存在身份伪造风险（S-2） |
| **统计维度枚举** | 前端 `personType`/`personLevel`/`department` 与后端 `dimension` 取值一致 | ✅ 枚举值对齐 |
| **图表类型枚举** | 前端 `line`/`pie`/`bar` 与后端 `chartType` 参数一致 | ✅ 枚举值对齐 |
| **数据模型** | `call_log.caller_id` ↔ `person.id` 外键关联 | ✅ 关系一致 |
| **向后兼容** | 所有接口均为新增，无历史版本冲突 | ✅ 天然兼容 |

---

*本报告由 dtazziboot-java-code-review skill (v1.1.0) 产出，审查日期 2026-08-12。*
