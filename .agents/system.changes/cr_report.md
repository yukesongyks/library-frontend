# Code Review Report

> **Change** `多功能演示页面 + 埋点报表系统` · **分支** `AI/task-DEV-f4ad1a6e-...` · **日期** `2025-07-24` · **审查者** AI

---

## §1 审查范围

### 后端 (library-backend) — 33 个 Java 文件 + 配置

| # | 文件路径 | 状态 |
|---|---------|------|
| 1 | `pom.xml` | ✅ 已审 |
| 2 | `src/main/resources/application.yml` | ✅ 已审 |
| 3 | `src/main/resources/db/migration/V1__create_demo_call_log.sql` | ✅ 已审 |
| 4 | `DemoApplication.java` | ✅ 已审 |
| 5 | `config/AsyncConfig.java` | ✅ 已审 |
| 6 | `controller/DemoController.java` | ✅ 已审 |
| 7 | `controller/AnalyticsController.java` | ✅ 已审 |
| 8 | `service/HelloWorldService.java` | ✅ 已审 |
| 9 | `service/HashService.java` | ✅ 已审 |
| 10 | `service/BubbleSortService.java` | ✅ 已审 |
| 11 | `service/ExportService.java` | ✅ 已审 |
| 12 | `service/AnalyticsService.java` | ✅ 已审 |
| 13 | `aspect/CallLogAspect.java` | ✅ 已审 |
| 14 | `annotation/CallLog.java` | ✅ 已审 |
| 15 | `entity/DemoCallLog.java` | ✅ 已审 |
| 16 | `mapper/DemoCallLogMapper.java` | ✅ 已审 |
| 17 | `dto/request/HelloWorldRequest.java` | ✅ 已审 |
| 18 | `dto/request/HashRequest.java` | ✅ 已审 |
| 19 | `dto/request/BubbleSortRequest.java` | ✅ 已审 |
| 20 | `dto/request/ExportRequest.java` | ✅ 已审 |
| 21 | `dto/request/AnalyticsQuery.java` | ✅ 已审 |
| 22 | `dto/response/DemoResponse.java` | ✅ 已审 |
| 23 | `dto/response/HelloWorldResult.java` | ✅ 已审 |
| 24 | `dto/response/HashResult.java` | ✅ 已审 |
| 25 | `dto/response/BubbleSortResult.java` | ✅ 已审 |
| 26 | `dto/response/AnalyticsSummary.java` | ✅ 已审 |
| 27 | `dto/response/AnalyticsTrend.java` | ✅ 已审 |
| 28 | `enums/ApiType.java` | ✅ 已审 |
| 29 | `enums/HashAlgorithm.java` | ✅ 已审 |
| 30 | `enums/SortOrder.java` | ✅ 已审 |
| 31 | `enums/AnalyticsDimension.java` | ✅ 已审 |
| 32 | `util/ExcelUtil.java` | ✅ 已审 |

### 前端 (library-frontend) — 15 个 TS/TSX 文件 + 配置

| # | 文件路径 | 状态 |
|---|---------|------|
| 1 | `package.json` | ✅ 已审 |
| 2 | `vite.config.ts` | ✅ 已审 |
| 3 | `src/App.tsx` | ✅ 已审 |
| 4 | `src/main.tsx` | ✅ 已审 |
| 5 | `src/utils/request.ts` | ✅ 已审 |
| 6 | `src/pages/Demo/index.tsx` | ✅ 已审 |
| 7 | `src/pages/Demo/types/demo.ts` | ✅ 已审 |
| 8 | `src/pages/Demo/services/demoApi.ts` | ✅ 已审 |
| 9 | `src/pages/Demo/components/HelloWorldTab.tsx` | ✅ 已审 |
| 10 | `src/pages/Demo/components/HashTab.tsx` | ✅ 已审 |
| 11 | `src/pages/Demo/components/BubbleSortTab.tsx` | ✅ 已审 |
| 12 | `src/pages/Demo/components/AnalyticsTab.tsx` | ✅ 已审 |
| 13 | `src/pages/Demo/components/ResultTable.tsx` | ✅ 已审 |
| 14 | `src/pages/Demo/components/ExportButton.tsx` | ✅ 已审 |
| 15 | `src/pages/Demo/components/charts/LineChart.tsx` | ✅ 已审 |
| 16 | `src/pages/Demo/components/charts/PieChart.tsx` | ✅ 已审 |
| 17 | `src/pages/Demo/components/charts/BarChart.tsx` | ✅ 已审 |

---

## §2 功能性检查 (Step 2)

| REQ | 功能点 | 状态 | 证据 |
|-----|--------|------|------|
| F01 | HelloWorld 接口 | ✅ | `DemoController:32-35` POST /api/demo/helloworld，`HelloWorldService:12-19` 实现正确 |
| F02 | 哈希算法接口 | ⚠️ | `DemoController:37-41` POST /api/demo/hash，核心逻辑正确，但非法算法输入未处理（见 P0-3） |
| F03 | 冒泡排序接口 | ✅ | `DemoController:43-47` POST /api/demo/bubble-sort，`BubbleSortService:14-57` 标准冒泡+交换计数 |
| F04 | 前端 Tab 页面 | ✅ | `Demo/index.tsx` 4 个 Tab，各 Tab 组件独立实现 |
| F05 | 数据导出 | ⚠️ | `DemoController:49-59` 导出接口存在，但 BUBBLE_SORT 导出数据列错位（见 P0-2） |
| F06 | AOP 埋点 | ⚠️ | `CallLogAspect:26-50` 切面拦截正确，但 @Async 自调用失效（见 P0-1） |
| F07 | 报表可视化 | ✅ | `AnalyticsTab.tsx` 折线图/饼图/柱状图三种展示，Segmented 切换 |
| F08 | 多维度筛选 | ✅ | `AnalyticsTab.tsx:66-77` 4 种维度选择器 |
| F09 | 调用趋势分析 | ✅ | `AnalyticsService:81-111` 按 apiType 分组趋势数据 |

---

## §3 可读性检查 (Step 3)

### 自动化扫描结果

| ID | 规则 | 等级 | 文件:行号 | 状态 |
|----|------|------|-----------|------|
| A2.2 | 通配符导入 `import ...*` | P2 | `DemoController.java:8,17` | ❌ `import com.library.demo.dto.response.*` 和 `import org.springframework.web.bind.annotation.*` |
| A2.2 | 通配符导入 | P2 | `DemoCallLog.java:3` | ❌ `import com.baomidou.mybatisplus.annotation.*` |
| A2.2 | 通配符导入 | P2 | `AnalyticsService.java:16` | ❌ `import java.util.*` |
| A2.2 | 通配符导入 | P2 | `ExcelUtil.java:3` | ❌ `import org.apache.poi.ss.usermodel.*` |

### LLM 补充检查

| ID | 检查项 | 等级 | 说明 |
|----|--------|------|------|
| A1.1 | 缩进一致性 | ✅ | 全部使用 4 空格缩进 |
| A3.1 | 命名规范 | ✅ | 类名 PascalCase，方法名 camelCase，常量 UPPER_CASE |
| A4.1 | Javadoc 缺失 | P2 | 所有 Service/Controller 类及公共方法无 Javadoc 注释 |
| A5.1 | 魔法值 | P2 | `CallLogAspect.java:59-63` 硬编码 "mock-user-001"、"Mock User"、"正式"、"P6"、"技术部" |
| A6.1 | 方法长度 | ✅ | 所有方法均在 50 行以内 |
| A7.1 | 类职责单一 | ✅ | 各 Service 职责清晰 |

---

## §4 可靠性检查 (Step 4)

### 4.1 自动化扫描结果（scan-all-rules.sh）

| ID | 规则 | 等级 | 文件:行号 | 说明 |
|----|------|------|-----------|------|
| G16.2 | CatchWithoutLogging | P0 | `CallLogAspect.java:45` | catch 块仅 `log.error` 但后续无告警/补救措施（脚本判定） |
| G16.2 | CatchWithoutLogging | P0 | `CallLogAspect.java:70` | 同上 |
| G16.2 | CatchWithoutLogging | P0 | `HashService.java:44` | `throw new RuntimeException` 包装后抛出，脚本误报，LLM 复核为 P1 |
| M016 | JavaTimeDefaultTimeZone | P1 | `CallLogAspect.java:67` | `LocalDateTime.now()` 使用默认时区 |
| M016 | JavaTimeDefaultTimeZone | P1 | `AnalyticsService.java:74-75` | `LocalDate.now()` 使用默认时区 |

### 4.2 LLM 补充 — 可靠性 (G)

| ID | 规则 | 等级 | 文件:行号 | 说明 |
|----|------|------|-----------|------|
| G4.3 | 无分页大列表查询 | **P0** | `AnalyticsService.java:29,83` | `selectList(wrapper)` 无 LIMIT，全量加载到内存，数据增长后 OOM 风险 |
| G8.1 | catch 吞异常仅打 log | P1 | `CallLogAspect.java:45-47` | 外层 catch 仅 log.error，不影响主流程（设计如此），但无告警机制 |
| G8.3 | I/O 流释放 | ✅ | `ExcelUtil.java:14` | try-with-resources 正确释放 SXSSFWorkbook |
| G8.4 | 线程池 shutdown | P2 | `AsyncConfig.java` | 未配置 `setWaitForTasksToCompleteOnShutdown(true)`，应用关闭时可能丢失未完成的写入任务 |
| G9.2 | 外部调用未设超时 | N/A | — | 无外部 HTTP/RPC 调用 |
| G11.1 | 新逻辑无单测 | P2 | — | spec 要求编写单元测试，但实际代码中未见 test 目录下的测试文件 |
| G11.3 | 入参空值防御 | P1 | `AnalyticsService.java:48` | `l.getCallTime().toLocalDate()` 若 callTime 为 null 则 NPE |
| G16.4 | 空 catch | ✅ | — | 所有 catch 块均有日志输出 |
| G17.1 | 功能开关 | P1 | — | 设计文档定义了 `demo.call-log.enabled` 等开关，但代码未实现 |

### 4.3 LLM 补充 — 安全 (S)

| ID | 规则 | 等级 | 文件:行号 | 说明 |
|----|------|------|-----------|------|
| S1.1 | SQL 预编译 | ✅ | — | 使用 MyBatis-Plus LambdaQueryWrapper，无 SQL 注入风险 |
| S8.1 | 接口鉴权 | P1 | `DemoController.java` | 未见 Spring Security 配置或鉴权注解，所有接口无认证保护 |
| S9.1 | 密钥硬编码 | P1 | `application.yml:7-8` | 数据库用户名/密码硬编码为 root/root，应从配置中心或环境变量获取 |
| S9.2 | 日志不记录敏感信息 | ✅ | — | 日志中无敏感信息 |

### 4.4 LLM 补充 — Bug 模式 (B/M/I)

| ID | 规则 | 等级 | 文件:行号 | 说明 |
|----|------|------|-----------|------|
| M016 | JavaTimeDefaultTimeZone | P1 | 多处 | `LocalDateTime.now()` / `LocalDate.now()` 未显式指定时区 |
| — | Spring @Async 自调用失效 | **P0** | `CallLogAspect.java:39` | `saveCallLogAsync()` 为同类内自调用，Spring AOP 代理无法拦截，@Async 不生效，方法同步执行阻塞主线程 |
| — | 导出数据列错位 | **P0** | `ExportService.java:55-68` | BUBBLE_SORT 分支使用 `row.add(index, value)` 插入导致列数与表头不匹配（8列 vs 7列），数据错位 |
| — | 全局异常处理器缺失 | **P0** | — | 无 `@ControllerAdvice`，`@Valid` 校验失败返回 Spring 默认 400 格式而非 `DemoResponse`，`HashAlgorithm.valueOf()` 非法输入抛 500 |

---

## §5 自定义扩展检查 (Step 5)

N/A（未启用自定义规则）

---

## §6 跨仓对齐点检查

| # | 对齐点 | 前端 | 后端 | 结论 |
|---|--------|------|------|------|
| 1 | API 基础路径 | `request.ts:5` baseURL `/api` + `demoApi.ts` 路径 `/demo/*` | `DemoController:22` `@RequestMapping("/api/demo")` | ✅ 一致 |
| 2 | 接口类型枚举 | `demo.ts:56` `'HELLOWORLD' \| 'HASH' \| 'BUBBLE_SORT'` | `ApiType.java` 同值 | ✅ 一致 |
| 3 | 统计维度枚举 | `demo.ts:55` 4 种维度 | `AnalyticsDimension.java` 同值 | ✅ 一致 |
| 4 | 哈希算法枚举 | `demo.ts:22` 4 种算法 | `HashAlgorithm.java` 同值 | ✅ 一致 |
| 5 | 排序方向 | `demo.ts:36` `'ASC' \| 'DESC'` | `SortOrder.java` 同值 | ✅ 一致 |
| 6 | 统一响应结构 | `demo.ts:2-6` `{ code, message, data }` | `DemoResponse.java` 同字段 | ✅ 一致 |
| 7 | 时间格式 | 前端 DatePicker 输出 yyyy-MM-dd | `AnalyticsService:24` `DateTimeFormatter.ofPattern("yyyy-MM-dd")` | ✅ 一致 |
| 8 | 导出协议 | `demoApi.ts:32` `responseType: 'blob'` | `DemoController:53` `application/octet-stream` | ✅ 一致 |
| 9 | 统计汇总响应 | `demo.ts:73-81` `AnalyticsSummaryData` | `AnalyticsSummary.java` 字段一致 | ✅ 一致 |
| 10 | 趋势数据响应 | `demo.ts:93-96` `AnalyticsTrendData` | `AnalyticsTrend.java` 字段一致 | ✅ 一致 |
| 11 | ExportRequest.recordIds 类型 | `demo.ts:51` `string[]` | `ExportRequest.java:12` `List<Long>` | ⚠️ **类型不匹配**：前端发送 string[]，后端期望 Long[]，Jackson 可自动转换但非最佳实践 |

---

## §7 问题汇总

### P0 — 阻塞（必须修复）

| # | 问题 | 文件 | 行号 | 规则 |
|---|------|------|------|------|
| 1 | **@Async 自调用失效**：`CallLogAspect.saveCallLogAsync()` 从同类 `logApiCall()` 中调用，Spring 代理无法拦截 @Async，方法同步执行阻塞主线程，完全违背异步埋点设计 | `CallLogAspect.java` | 39 | Bug |
| 2 | **BUBBLE_SORT 导出数据列错位**：使用 `row.add(index, value)` 在已有列表中插入，导致最终行有 8 列但表头仅 7 列，数据与表头不对应 | `ExportService.java` | 64-68 | Bug |
| 3 | **全局异常处理器缺失**：无 `@ControllerAdvice`/`@ExceptionHandler`，`@Valid` 校验失败返回 Spring 默认错误格式而非 `DemoResponse`；`HashAlgorithm.valueOf()` 非法输入抛 500 而非 spec 定义的 DEMO_002 | 全局 | — | F02/功能 |
| 4 | **AnalyticsService 全表扫描无 LIMIT**：`getSummary()` 和 `getTrend()` 使用 `selectList(wrapper)` 加载全部匹配记录到内存，无分页/限制，数据增长后 OOM | `AnalyticsService.java` | 29, 83 | G4.3 |

### P1 — 推荐修复

| # | 问题 | 文件 | 行号 | 规则 |
|---|------|------|------|------|
| 5 | 数据库凭证硬编码 root/root | `application.yml` | 7-8 | S9.1 |
| 6 | 接口无鉴权保护 | `DemoController.java` | — | S8.1 |
| 7 | `LocalDateTime.now()` / `LocalDate.now()` 未指定时区 | `CallLogAspect.java:67`, `AnalyticsService.java:74-75` | — | M016 |
| 8 | `AnalyticsService` DATE 维度 `callTime` 可能 NPE | `AnalyticsService.java` | 48 | G11.3 |
| 9 | 功能开关未实现（设计文档定义了 3 个开关） | 全局 | — | G17.1 |
| 10 | 前端 `ExportRequest.recordIds` 类型 `string[]` 与后端 `List<Long>` 不匹配 | `demo.ts:51` vs `ExportRequest.java:12` | — | 跨仓 |
| 11 | 线程池未配置优雅关闭 | `AsyncConfig.java` | — | G8.4 |

### P2 — 参考改进

| # | 问题 | 文件 | 行号 | 规则 |
|---|------|------|------|------|
| 12 | 通配符导入（5 处） | 多文件 | — | A2.2 |
| 13 | 公共方法无 Javadoc | 全局 | — | A4.1 |
| 14 | 硬编码模拟用户信息 | `CallLogAspect.java` | 59-63 | A5.1 |
| 15 | 单元测试文件缺失 | `src/test/` | — | G11.1 |

---

## §8 修复任务列表

- [ ] **P0-1** 修复 @Async 自调用失效：将 `saveCallLogAsync` 方法抽取到独立的 `@Service` 类（如 `CallLogAsyncWriter`），通过 Spring 注入调用，使 @Async 代理生效
- [ ] **P0-2** 修复 BUBBLE_SORT 导出数据列错位：重构 `ExportService.java:55-68`，按表头顺序逐列 add，不使用 `add(index, value)` 插入
- [ ] **P0-3** 新增 `@RestControllerAdvice` 全局异常处理器：处理 `MethodArgumentNotValidException`（返回 400 + DemoResponse 格式）、`IllegalArgumentException`（返回 DEMO_002/004 等业务错误码）
- [ ] **P0-4** AnalyticsService 添加查询限制：在 `buildBaseQuery` 中添加 `wrapper.last("LIMIT 10000")` 或使用数据库层面 GROUP BY 聚合替代全量加载
- [ ] **P1-5** 数据库凭证外部化：使用环境变量 `${DB_USERNAME:root}` / `${DB_PASSWORD:root}` 或 Spring Cloud Config
- [ ] **P1-6** 添加接口鉴权：引入 Spring Security 或在 Controller 层添加认证拦截器
- [ ] **P1-7** 显式指定时区：`LocalDateTime.now(ZoneId.of("Asia/Shanghai"))` 或在 application.yml 中配置 `spring.jackson.time-zone`
- [ ] **P1-8** AnalyticsService DATE 维度添加 null 检查：`.filter(l -> l.getCallTime() != null)`
- [ ] **P1-9** 实现功能开关：添加 `@ConfigurationProperties` 读取 `demo.call-log.enabled` 等配置，在切面和服务层判断开关状态
- [ ] **P1-10** 统一 ExportRequest.recordIds 类型：前端改为 `number[]` 或后端改为 `List<String>`
- [ ] **P1-11** AsyncConfig 添加 `setWaitForTasksToCompleteOnShutdown(true)` 和 `setAwaitTerminationSeconds(30)`
- [ ] **P2-12** 替换通配符导入为具体类导入
- [ ] **P2-13** 为公共 Service/Controller 方法添加 Javadoc
- [ ] **P2-14** 模拟用户信息提取为配置项或从 SecurityContext 获取
- [ ] **P2-15** 补充单元测试文件
