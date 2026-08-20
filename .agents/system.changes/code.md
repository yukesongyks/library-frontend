# 编码实现报告

> **文档元信息**
>
> | 项目 | 内容 |
> |------|------|
> | 文档版本 | v1.0 |
> | 作者 | DTCoder |
> | 创建日期 | 2025-08-20 |
> | 关联系分 | .agents/system.changes/design.md |
> | 关联实施计划 | .agents/specs/20260820-分别写三个接口helloworld_哈希.md |

---

## 1. 实现概述

根据系分设计和实施计划，完成了前后端两个仓库的全量编码实现。涵盖以下核心功能：

- **后端 5 个 RESTful API**：HelloWorld、哈希算法、冒泡排序、导出 Excel、调用统计查询
- **后端 AOP 埋点切面**：自动拦截 `/api/demo/**` 请求，异步写入调用日志
- **前端四 Tab 页面**：HelloWorld / 哈希算法 / 冒泡排序 / 调用统计
- **前端可视化报表**：ECharts 折线图、饼图、柱状图，多维度统计（人员类型/层级/部门）
- **导出功能**：每个功能 Tab 支持导出调用历史为 Excel

---

## 2. 后端代码变更清单 (library-backend)

### 2.1 项目脚手架

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `pom.xml` | 新增 | Maven 项目配置，Spring Boot 3.2.2 + JPA + AOP + POI + H2 |
| `src/main/java/com/library/demo/DemoApplication.java` | 新增 | Spring Boot 启动类，启用 @EnableAsync |
| `src/main/resources/application.yml` | 新增 | 端口 8080，H2 内存数据库，JPA 配置 |
| `src/main/resources/schema.sql` | 新增 | api_call_log 表 DDL + 5 个索引 |
| `src/main/java/com/library/demo/config/WebConfig.java` | 新增 | CORS 全局配置 |

### 2.2 数据模型层

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `model/request/HelloWorldRequest.java` | 新增 | `{name?: string}` |
| `model/request/HashRequest.java` | 新增 | `{input: string, algorithm?: string}` + @NotBlank 校验 |
| `model/request/BubbleSortRequest.java` | 新增 | `{numbers: int[], order?: string}` + @NotEmpty + @Size(max=1000) |
| `model/request/ExportRequest.java` | 新增 | `{type: string, recordIds?: long[]}` |
| `model/response/ApiResponse.java` | 新增 | 统一响应 `{code, message, data}` |
| `model/response/HelloWorldResponse.java` | 新增 | `{result, timestamp}` |
| `model/response/HashResponse.java` | 新增 | `{input, algorithm, hashValue, timestamp}` |
| `model/response/BubbleSortResponse.java` | 新增 | `{original, sorted, order, steps, timestamp}` |
| `model/response/AnalyticsResponse.java` | 新增 | `{dimension, apiType, totalCalls, todayCalls, activeUsers, avgDurationMs, groups, timeSeries}` |
| `model/entity/ApiCallLog.java` | 新增 | JPA 实体，映射 api_call_log 表 |

### 2.3 服务层

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `service/HelloWorldService.java` | 新增 | greet(name) → "Hello, {name}!" |
| `service/HashService.java` | 新增 | hash(input, algorithm) → 支持 MD5/SHA-1/SHA-256 |
| `service/BubbleSortService.java` | 新增 | sort(numbers, order) → 含每轮步骤记录 |
| `service/ExportService.java` | 新增 | export(type, recordIds) → Apache POI 生成 xlsx |
| `service/AnalyticsService.java` | 新增 | getAnalytics(dimension, apiType, startDate, endDate) → 多维度聚合统计 |

### 2.4 控制器层

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `controller/DemoController.java` | 新增 | POST /api/demo/helloworld, /hash, /bubble-sort |
| `controller/ExportController.java` | 新增 | POST /api/demo/export → Excel 文件流 |
| `controller/AnalyticsController.java` | 新增 | GET /api/demo/analytics → JSON 统计数据 |
| `controller/GlobalExceptionHandler.java` | 新增 | 全局异常处理（400/500） |

### 2.5 数据访问层

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `repository/ApiCallLogRepository.java` | 新增 | JPA Repository + 自定义 JPQL 统计查询（按部门/类型/层级分组 + 时序查询） |

### 2.6 横切关注点

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `aspect/ApiCallLogAspect.java` | 新增 | @Around 拦截 DemoController，@Async 异步写入埋点 |

### 2.7 单元测试

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/test/.../service/HelloWorldServiceTest.java` | 新增 | 3 个测试用例：正常/空值/空白 |
| `src/test/.../service/HashServiceTest.java` | 新增 | 4 个测试用例：SHA-256/MD5/默认/不支持算法 |
| `src/test/.../service/BubbleSortServiceTest.java` | 新增 | 5 个测试用例：升序/降序/默认/非法/单元素 |

---

## 3. 前端代码变更清单 (library-frontend)

### 3.1 项目脚手架

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `package.json` | 新增 | React 18 + Ant Design 5.x + ECharts 5.x + axios + dayjs |
| `tsconfig.json` | 新增 | TypeScript 严格模式，ES2020 target |
| `vite.config.ts` | 新增 | Vite 配置，端口 3000，代理 /api → localhost:8080 |
| `index.html` | 新增 | HTML 入口 |
| `src/main.tsx` | 新增 | React 入口 |
| `src/App.tsx` | 新增 | 根组件，ConfigProvider + DemoPage |

### 3.2 类型定义与服务层

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/types/demo.d.ts` | 新增 | 全部 TypeScript 类型定义（ApiResponse, 请求/响应 DTO, AnalyticsData, UserContext） |
| `src/services/demoApi.ts` | 新增 | axios 实例 + 请求头拦截器（注入 X-User-*）+ 5 个 API 函数 |

### 3.3 页面组件

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/pages/demo/index.tsx` | 新增 | 主页面，Tabs 容器（4 个 Tab） |
| `src/pages/demo/HelloWorldTab.tsx` | 新增 | HelloWorld Tab：输入 + 调用 + 结果展示 + 历史表格 + 导出 |
| `src/pages/demo/HashTab.tsx` | 新增 | 哈希算法 Tab：原文输入 + 算法选择 + 哈希结果 + 历史 + 导出 |
| `src/pages/demo/BubbleSortTab.tsx` | 新增 | 冒泡排序 Tab：数字输入 + 方向选择 + 排序步骤可视化 + 历史 + 导出 |
| `src/pages/demo/AnalyticsTab.tsx` | 新增 | 调用统计 Tab：筛选条件 + 4 统计卡片 + 图表区域（折线/饼/柱状） |

### 3.4 通用组件

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/pages/demo/components/ExportButton.tsx` | 新增 | 通用导出按钮，调用后端导出接口下载 Excel |
| `src/pages/demo/components/ChartPanel.tsx` | 新增 | ECharts 图表面板，支持 line/pie/bar 三种类型动态切换 |
| `src/pages/demo/components/StatsCard.tsx` | 新增 | 统计卡片组件（Ant Design Statistic） |

---

## 4. 跨仓对齐点检查

| # | 检查项 | 前端实现 | 后端实现 | 状态 |
|---|--------|----------|----------|------|
| 1 | 统一响应格式 `{code, message, data}` | `ApiResponse<T>` 类型 (demo.d.ts) | `ApiResponse.java` | ✅ 对齐 |
| 2 | 请求头 `X-User-Id/Name/Type/Level/Dept` | `demoApi.ts` 拦截器注入 | `ApiCallLogAspect.java` 读取 | ✅ 对齐 |
| 3 | POST `/api/demo/helloworld` 请求/响应体 | `HelloWorldRequest/Data` | `DemoController.helloWorld()` | ✅ 对齐 |
| 4 | POST `/api/demo/hash` 请求/响应体 | `HashRequest/Data` | `DemoController.hash()` | ✅ 对齐 |
| 5 | POST `/api/demo/bubble-sort` 请求/响应体 | `BubbleSortRequest/Data` | `DemoController.bubbleSort()` | ✅ 对齐 |
| 6 | POST `/api/demo/export` 请求体 + blob 响应 | `exportData()` blob 下载 | `ExportController.export()` | ✅ 对齐 |
| 7 | GET `/api/demo/analytics` 查询参数 + 响应 | `AnalyticsParams/Data` | `AnalyticsController.getAnalytics()` | ✅ 对齐 |
| 8 | 导出类型枚举 `helloworld/hash/bubble-sort` | `ExportRequest.type` | `ExportRequest.java.type` | ✅ 对齐 |
| 9 | 统计维度枚举 `personnelType/personnelLevel/department` | `AnalyticsParams.dimension` | `AnalyticsService` switch | ✅ 对齐 |
| 10 | Vite 代理 `/api` → `localhost:8080` | `vite.config.ts` proxy | Spring Boot port 8080 | ✅ 对齐 |

---

## 5. 接口契约汇总

### 5.1 后端 API 端点

| 方法 | 路径 | 请求体 | 响应体 | 说明 |
|------|------|--------|--------|------|
| POST | /api/demo/helloworld | `{name?: string}` | `{code, message, data: {result, timestamp}}` | HelloWorld 问候 |
| POST | /api/demo/hash | `{input: string, algorithm?: string}` | `{code, message, data: {input, algorithm, hashValue, timestamp}}` | 哈希计算 |
| POST | /api/demo/bubble-sort | `{numbers: int[], order?: string}` | `{code, message, data: {original, sorted, order, steps, timestamp}}` | 冒泡排序 |
| POST | /api/demo/export | `{type: string, recordIds?: long[]}` | Excel 文件流 (blob) | 导出 Excel |
| GET | /api/demo/analytics | Query: dimension, apiType, startDate, endDate, chartType | `{code, message, data: {dimension, apiType, totalCalls, todayCalls, activeUsers, avgDurationMs, groups, timeSeries}}` | 调用统计 |

### 5.2 请求头约定

| Header | 说明 | 示例 |
|--------|------|------|
| X-User-Id | 调用者工号 | U001 |
| X-User-Name | 调用者姓名 | 张三 |
| X-User-Type | 人员类型 | 正式 |
| X-User-Level | 人员层级 | P6 |
| X-User-Dept | 所属部门 | 技术部 |

---

## 6. 数据库表结构

### api_call_log

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | 主键 |
| api_type | VARCHAR(32) | NOT NULL | 接口标识 |
| user_id | VARCHAR(64) | | 调用者工号 |
| user_name | VARCHAR(128) | | 调用者姓名 |
| personnel_type | VARCHAR(32) | | 人员类型 |
| personnel_level | VARCHAR(32) | | 人员层级 |
| department | VARCHAR(128) | | 所属部门 |
| request_payload | TEXT | | 请求参数 JSON |
| response_payload | TEXT | | 响应结果 JSON |
| duration_ms | BIGINT | | 执行耗时(ms) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引**: idx_api_type, idx_department, idx_personnel_type, idx_personnel_level, idx_created_at

---

## 7. 技术栈确认

| 层 | 技术 | 版本 |
|----|------|------|
| 后端框架 | Spring Boot | 3.2.2 |
| 后端语言 | Java | 17 |
| ORM | Spring Data JPA | (随 Spring Boot) |
| 数据库 | H2 (内存) | (随 Spring Boot) |
| Excel 生成 | Apache POI | 5.2.5 |
| 前端框架 | React | 18.2.0 |
| 前端语言 | TypeScript | 5.3.0 |
| UI 组件库 | Ant Design | 5.12.0 |
| 图表库 | ECharts + echarts-for-react | 5.4.3 / 3.0.2 |
| HTTP 客户端 | axios | 1.6.0 |
| 构建工具 | Vite | 5.0.0 |
| 日期处理 | dayjs | 1.11.10 |

---

## 8. 文件统计

| 仓库 | 新增文件数 | 主要模块 |
|------|-----------|----------|
| library-backend | 22 | 脚手架(5) + 模型(10) + 服务(5) + 控制器(4) + 仓库(1) + 切面(1) + 测试(3) |
| library-frontend | 14 | 脚手架(6) + 类型/服务(2) + 页面(5) + 组件(3) |
| **合计** | **36** | |
