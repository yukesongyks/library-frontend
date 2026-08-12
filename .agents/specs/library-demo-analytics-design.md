# 图书管理系统 — 演示接口、导出与调用埋点可视化 设计规格

> **阶段**: 需求澄清 / 设计 (Spec)
> **日期**: 2026-08-12
> **涉及仓库**: `library-frontend` (前端) · `library-backend` (后端)
> **仓库状态**: 双仓库均为 greenfield 空仓库（仅含 README.md），无历史代码约束
> **方法论**: brainstorming skill — 探索意图 → 澄清问题 → 提出 2-3 方案 → 呈现设计 → 自审 → 落盘

---

## 1. 通览 (Overview)

### 1.1 需求原文拆解

原始需求包含 **5 个功能域**：

| # | 功能域 | 归属仓库 | 说明 |
|---|--------|----------|------|
| F1 | 三个演示接口：HelloWorld、哈希算法、冒泡排序 | `library-backend` | 后端提供 REST 接口，前端调用展示 |
| F2 | 前端三 Tab 页面 | `library-frontend` | 一个页面内三个 Tab，分别展示三个接口的执行结果 |
| F3 | 导出按钮 + 后端导出接口 | 双仓库 | 前端按钮触发，后端提供导出接口，支持导出各 Tab 展示结果 |
| F4 | 后端埋点：调用次数 + 调用人 | `library-backend` | 对三个演示接口的调用进行埋点记录 |
| F5 | 前端可视化报表 | `library-frontend` | 在当前页面可视化调用情况，多维度（人员类型/层级/部门），多图表形式（折线图/饼图/柱状图） |

### 1.2 跨库依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                   library-frontend                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Demo Page   │  │  Export Btn  │  │  Analytics      │ │
│  │  (3 Tabs)    │  │              │  │  Charts         │ │
│  │              │  │              │  │  (Line/Pie/Bar) │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬─────────┘ │
│         │                  │                  │           │
│         │ ①调用演示接口     │ ②请求导出        │ ③查询埋点  │
│         │                  │                  │   统计数据  │
└─────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼───────────┐
│                   library-backend                          │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Demo        │  │ Export       │  │ Analytics        │  │
│  │ Controller  │  │ Controller   │  │ Controller        │  │
│  │ (3 APIs)    │  │              │  │                  │  │
│  └──────┬──────┘  └──────────────┘  └──────────────────┘  │
│         │                                                  │
│         │ ④AOP切面埋点                                     │
│         ▼                                                  │
│  ┌─────────────┐  ┌──────────────────────────────────────┐│
│  │ Demo        │  │ Tracking Store (DB)                  ││
│  │ Service     │  │ call_log: api, caller, time, dims... ││
│  └─────────────┘  └──────────────────────────────────────┘
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Person Service (人员维度数据源)                       │ │
│  │  person: id, name, type, level, department            │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 1.3 关键设计决策（自主裁定）

由于双仓库均为空仓库，无既有技术栈约束。基于"图书管理系统"的典型形态和需求复杂度，做出以下技术栈选型：

| 维度 | 选型 | 理由 |
|------|------|------|
| **后端框架** | Spring Boot 3.x + Java 17 | 企业级标准，AOP 埋点天然支持，生态成熟 |
| **前端框架** | React 18 + TypeScript | 组件化开发，类型安全，图表生态丰富 |
| **图表库** | ECharts (via echarts-for-react) | 同时支持折线图/饼图/柱状图，中文文档完善 |
| **HTTP 客户端** | Axios | 拦截器机制便于统一处理 |
| **构建工具** | Vite | 快速开发体验 |
| **数据库** | H2 (开发) / MySQL (生产) | 埋点数据持久化 |
| **ORM** | MyBatis-Plus | 简化 CRUD，灵活查询 |
| **导出格式** | Excel (.xlsx) via Apache POI | 通用性强，适合表格数据 |

---

## 2. 规划 (Planning)

### 2.1 后端接口契约 (library-backend)

#### 2.1.1 演示接口 (F1)

三个演示接口统一前缀 `/api/demo`，统一响应体 `ApiResponse<T>`。

**统一响应体：**
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "traceId": "uuid"
}
```

**接口 1 — HelloWorld**

| 项 | 值 |
|----|----|
| Method | `GET` |
| Path | `/api/demo/helloworld` |
| 请求参数 | 无 |
| 响应 data | `{ "result": "Hello, World!" }` |
| 说明 | 返回固定问候字符串 |

**接口 2 — 哈希算法**

| 项 | 值 |
|----|----|
| Method | `GET` |
| Path | `/api/demo/hash` |
| 请求参数 | `input` (String, query param, 必填) |
| 响应 data | `{ "input": "abc", "algorithm": "SHA-256", "hashValue": "ba7816bf..." }` |
| 说明 | 对输入字符串计算 SHA-256 哈希并返回十六进制摘要 |

**接口 3 — 冒泡排序**

| 项 | 值 |
|----|----|
| Method | `GET` |
| Path | `/api/demo/bubblesort` |
| 请求参数 | `numbers` (String, query param, 逗号分隔整数, 必填, 如 `5,3,8,1,9`) |
| 响应 data | `{ "input": [5,3,8,1,9], "sorted": [1,3,5,8,9], "steps": 4 }` |
| 说明 | 对输入整数数组执行冒泡排序，返回排序结果及交换步数 |

#### 2.1.2 导出接口 (F3)

| 项 | 值 |
|----|----|
| Method | `GET` |
| Path | `/api/demo/export` |
| 请求参数 | `tab` (String, query param, 枚举: `helloworld` / `hash` / `bubblesort`) |
| 响应 | `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，文件流下载 |
| 响应头 | `Content-Disposition: attachment; filename="demo_<tab>_<timestamp>.xlsx"` |
| 说明 | 根据指定 Tab 导出对应接口最近一次或全部执行结果为 Excel |

**导出数据结构（按 Tab 区分）：**

- `helloworld` Tab → 单列：`result`（问候字符串）
- `hash` Tab → 三列：`input`、`algorithm`、`hashValue`
- `bubblesort` Tab → 三列：`input`（JSON 数组字符串）、`sorted`（JSON 数组字符串）、`steps`

> **设计决策**：导出接口从埋点表 `call_log` 中读取该 Tab 对应接口的历史调用结果记录进行导出，而非仅导出当前页面内存数据。这样导出数据有持久化保障，且与埋点系统复用同一数据源。

#### 2.1.3 埋点统计接口 (F4 → F5)

| 项 | 值 |
|----|----|
| Method | `GET` |
| Path | `/api/analytics/calls` |
| 请求参数 | 见下表 |
| 响应 data | 见下方结构 |

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `dimension` | String | 是 | 统计维度枚举: `personType` / `personLevel` / `department` |
| `chartType` | String | 否 | 图表类型: `line` / `pie` / `bar`（影响数据聚合方式，默认 `bar`） |
| `apiName` | String | 否 | 过滤特定接口: `helloworld` / `hash` / `bubblesort`，不传则统计全部 |
| `startDate` | String | 否 | 起始日期 `yyyy-MM-dd`，默认近 7 天 |
| `endDate` | String | 否 | 结束日期 `yyyy-MM-dd`，默认今天 |

**响应 data 结构（折线图/柱状图通用）：**
```json
{
  "dimension": "department",
  "chartType": "bar",
  "categories": ["研发部", "产品部", "测试部", "运维部"],
  "series": [
    {
      "name": "helloworld",
      "data": [120, 80, 45, 30]
    },
    {
      "name": "hash",
      "data": [90, 60, 30, 15]
    },
    {
      "name": "bubblesort",
      "data": [75, 50, 20, 10]
    }
  ]
}
```

**响应 data 结构（饼图）：**
```json
{
  "dimension": "personType",
  "chartType": "pie",
  "series": [
    { "name": "正式员工", "value": 350 },
    { "name": "实习生", "value": 120 },
    { "name": "外包", "value": 80 }
  ]
}
```

#### 2.1.4 埋点机制 (F4)

**方案：Spring AOP 注解式埋点**

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TrackCall {
    String apiName();       // 接口标识: helloworld / hash / bubblesort
    String description();   // 接口描述
}
```

在三个演示接口的 Controller 方法上标注 `@TrackCall`，AOP 切面在方法执行后异步写入 `call_log` 表。

**埋点数据模型 `call_log`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT (PK) | 自增主键 |
| `api_name` | VARCHAR(50) | 接口标识: helloworld / hash / bubblesort |
| `caller_id` | VARCHAR(64) | 调用人 ID |
| `caller_name` | VARCHAR(100) | 调用人姓名 |
| `call_time` | DATETIME | 调用时间 |
| `call_result` | VARCHAR(20) | 调用结果: SUCCESS / FAIL |
| `result_snapshot` | TEXT | 接口返回结果快照（JSON，用于导出） |
| `input_params` | TEXT | 请求参数快照（JSON） |
| `duration_ms` | INT | 耗时毫秒 |

**人员维度数据模型 `person`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(64) (PK) | 人员 ID |
| `name` | VARCHAR(100) | 姓名 |
| `person_type` | VARCHAR(30) | 人员类型: 正式员工/实习生/外包 |
| `person_level` | VARCHAR(30) | 人员层级: P5/P6/P7/P8/管理 |
| `department` | VARCHAR(50) | 部门: 研发部/产品部/测试部/运维部 |

> `call_log.caller_id` 关联 `person.id`，统计查询通过 JOIN 获取人员维度信息。

**调用人身份获取：** 通过 HTTP 请求头 `X-User-Id` 和 `X-User-Name` 传递（模拟登录态），AOP 切面从 `RequestContextHolder` 读取。前端 Axios 请求拦截器统一注入这两个 Header。

### 2.2 前端页面规划 (library-frontend)

#### 2.2.1 页面路由与结构

```
/demo                    → DemoPage (三 Tab + 导出 + 报表)
```

单页面 `DemoPage` 内部布局：

```
┌─────────────────────────────────────────────────────────────┐
│  Demo 演示页                            [导出当前Tab ▼]     │
├─────────────────────────────────────────────────────────────┤
│  [ HelloWorld ] [ 哈希算法 ] [ 冒泡排序 ]                    │  ← Tab 栏
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tab 内容区（根据选中 Tab 展示不同接口的输入与结果）          │
│                                                              │
│  ┌─ HelloWorld Tab ─────────────────────────────────────┐    │
│  │  [执行] 按钮                                          │    │
│  │  结果: Hello, World!                                 │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ 哈希算法 Tab ───────────────────────────────────────┐    │
│  │  输入框: [abc          ]  [执行]                      │    │
│  │  算法: SHA-256                                        │    │
│  │  哈希值: ba7816bf...                                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ 冒泡排序 Tab ───────────────────────────────────────┐    │
│  │  输入: [5,3,8,1,9     ]  [执行]                       │    │
│  │  排序结果: [1,3,5,8,9]                                │    │
│  │  交换步数: 4                                          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  调用情况分析报表                                             │
│                                                              │
│  维度: [人员类型 ▼]  图表: [柱状图 ▼]  接口: [全部 ▼]        │
│  日期: [近7天 ▼]                                             │
│                                                              │
│  ┌────────────────────────┐  ┌────────────────────────┐    │
│  │     柱状图               │  │     折线图              │    │
│  │  (按维度展示调用次数)     │  │  (按日期趋势)          │    │
│  └────────────────────────┘  └────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │     饼图 (按维度占比)                                 │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.2 前端组件树

```
DemoPage
├── TabContainer
│   ├── HelloWorldTab
│   │   ├── ExecuteButton
│   │   └── ResultDisplay
│   ├── HashTab
│   │   ├── InputField
│   │   ├── ExecuteButton
│   │   └── ResultDisplay (input / algorithm / hashValue)
│   └── BubbleSortTab
│       ├── InputField (逗号分隔数字)
│       ├── ExecuteButton
│       └── ResultDisplay (input / sorted / steps)
├── ExportButton (导出当前 Tab 结果)
└── AnalyticsPanel
    ├── DimensionSelector (人员类型/人员层级/人员部门)
    ├── ChartTypeSelector (折线图/饼图/柱状图)
    ├── ApiFilterSelector (全部/helloworld/hash/bubblesort)
    ├── DateRangeSelector
    ├── BarChart (ECharts)
    ├── LineChart (ECharts)
    └── PieChart (ECharts)
```

#### 2.2.3 前端 API 调用层

```typescript
// src/api/demo.ts
export interface HelloWorldResult { result: string }
export interface HashResult { input: string; algorithm: string; hashValue: string }
export interface BubbleSortResult { input: number[]; sorted: number[]; steps: number }

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

// 演示接口
export function callHelloWorld(): Promise<ApiResponse<HelloWorldResult>>;
export function callHash(input: string): Promise<ApiResponse<HashResult>>;
export function callBubbleSort(numbers: string): Promise<ApiResponse<BubbleSortResult>>;

// 导出接口
export function exportTab(tab: 'helloworld' | 'hash' | 'bubblesort'): Promise<Blob>;

// 埋点统计接口
export interface AnalyticsQuery {
  dimension: 'personType' | 'personLevel' | 'department';
  chartType?: 'line' | 'pie' | 'bar';
  apiName?: 'helloworld' | 'hash' | 'bubblesort';
  startDate?: string;
  endDate?: string;
}
export interface BarLineChartData {
  dimension: string;
  chartType: string;
  categories: string[];
  series: { name: string; data: number[] }[];
}
export interface PieChartData {
  dimension: string;
  chartType: string;
  series: { name: string; value: number }[];
}
export function getAnalytics(query: AnalyticsQuery): Promise<ApiResponse<BarLineChartData | PieChartData>>;
```

#### 2.2.4 Axios 拦截器（注入调用人 Header）

```typescript
// src/api/request.ts
import axios from 'axios';

const request = axios.create({ baseURL: '/api', timeout: 10000 });

request.interceptors.request.use((config) => {
  // 模拟登录态 — 实际项目从登录上下文获取
  config.headers['X-User-Id'] = localStorage.getItem('userId') || 'guest';
  config.headers['X-User-Name'] = localStorage.getItem('userName') || '访客';
  return config;
});

export default request;
```

### 2.3 跨库接口契约对齐矩阵

| 契约点 | 后端 (library-backend) | 前端 (library-frontend) | 对齐状态 |
|--------|------------------------|-------------------------|----------|
| 演示接口路径 | `/api/demo/helloworld`, `/api/demo/hash`, `/api/demo/bubblesort` | `callHelloWorld()`, `callHash()`, `callBubbleSort()` 调用同路径 | ✅ 一致 |
| 统一响应体 | `ApiResponse<T>` {code, message, data, traceId} | `ApiResponse<T>` 接口定义 | ✅ 一致 |
| 导出接口 | `/api/demo/export?tab=xxx` → xlsx 文件流 | `exportTab(tab)` → Blob 下载 | ✅ 一致 |
| 埋点统计接口 | `/api/analytics/calls?dimension=xxx&chartType=xxx` | `getAnalytics(query)` | ✅ 一致 |
| 调用人身份 | 从 `X-User-Id` / `X-User-Name` Header 读取 | Axios 拦截器注入 Header | ✅ 一致 |
| 导出数据源 | 从 `call_log.result_snapshot` 读取 | 前端无需感知数据源 | ✅ 后端封装 |

### 2.4 向后兼容性声明

> **契约优先原则**：所有跨库接口变更始终向后兼容。

- 演示接口：新增接口，无历史版本，天然兼容。
- 导出接口：新增接口，无历史版本，天然兼容。
- 埋点统计接口：新增接口，无历史版本，天然兼容。
- 统一响应体 `ApiResponse<T>`：后续如需扩展，仅新增字段（如 `timestamp`），不修改/删除现有字段。

---

## 3. 执行 (Execution)

### 3.1 后端目录结构规划 (library-backend)

```
library-backend/
├── pom.xml
├── src/main/java/com/library/backend/
│   ├── LibraryBackendApplication.java
│   ├── config/
│   │   └── WebConfig.java              # CORS + 拦截器配置
│   ├── common/
│   │   ├── ApiResponse.java            # 统一响应体
│   │   └── GlobalExceptionHandler.java # 全局异常处理
│   ├── controller/
│   │   ├── DemoController.java         # 三个演示接口 + 导出接口
│   │   └── AnalyticsController.java    # 埋点统计接口
│   ├── service/
│   │   ├── DemoService.java            # HelloWorld / Hash / BubbleSort 业务逻辑
│   │   ├── ExportService.java         # Excel 导出逻辑
│   │   └── AnalyticsService.java       # 统计查询逻辑
│   ├── aspect/
│   │   ├── TrackCall.java              # 埋点注解
│   │   └── TrackCallAspect.java        # AOP 切面
│   ├── entity/
│   │   ├── CallLog.java                # 埋点记录实体
│   │   └── Person.java                 # 人员实体
│   ├── mapper/
│   │   ├── CallLogMapper.java          # 埋点 MyBatis-Plus Mapper
│   │   └── PersonMapper.java           # 人员 Mapper
│   └── dto/
│       ├── BarLineChartDTO.java        # 柱状图/折线图响应
│       └── PieChartDTO.java            # 饼图响应
├── src/main/resources/
│   ├── application.yml
│   └── schema.sql                      # H2 初始化建表 + 人员种子数据
└── src/test/java/com/library/backend/
    ├── DemoServiceTest.java
    └── AnalyticsServiceTest.java
```

### 3.2 前端目录结构规划 (library-frontend)

```
library-frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   ├── request.ts                  # Axios 实例 + 拦截器
│   │   ├── demo.ts                     # 演示 + 导出接口
│   │   ├── analytics.ts                # 埋点统计接口
│   │   └── types.ts                    # 共享类型定义
│   ├── pages/
│   │   └── DemoPage.tsx                # 主页面（三 Tab + 导出 + 报表）
│   ├── components/
│   │   ├── tabs/
│   │   │   ├── HelloWorldTab.tsx
│   │   │   ├── HashTab.tsx
│   │   │   └── BubbleSortTab.tsx
│   │   ├── ExportButton.tsx
│   │   └── charts/
│   │       ├── BarChart.tsx
│   │       ├── LineChart.tsx
│   │       └── PieChart.tsx
│   ├── hooks/
│   │   ├── useDemoApi.ts               # 演示接口调用 Hook
│   │   └── useAnalytics.ts            # 统计数据查询 Hook
│   └── styles/
│       └── DemoPage.css
└── public/
```

### 3.3 数据库初始化脚本 (schema.sql)

```sql
-- 埋点记录表
CREATE TABLE IF NOT EXISTS call_log (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_name     VARCHAR(50)  NOT NULL COMMENT '接口标识',
    caller_id    VARCHAR(64)  NOT NULL COMMENT '调用人ID',
    caller_name  VARCHAR(100) NOT NULL COMMENT '调用人姓名',
    call_time    DATETIME     NOT NULL COMMENT '调用时间',
    call_result  VARCHAR(20) NOT NULL COMMENT '调用结果 SUCCESS/FAIL',
    result_snapshot TEXT     COMMENT '返回结果快照JSON',
    input_params TEXT     COMMENT '请求参数快照JSON',
    duration_ms  INT          COMMENT '耗时毫秒'
);

-- 人员表
CREATE TABLE IF NOT EXISTS person (
    id           VARCHAR(64)  PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    person_type  VARCHAR(30)  NOT NULL COMMENT '人员类型: 正式员工/实习生/外包',
    person_level VARCHAR(30)  NOT NULL COMMENT '人员层级: P5/P6/P7/P8/管理',
    department   VARCHAR(50)  NOT NULL COMMENT '部门'
);

-- 人员种子数据
INSERT INTO person (id, name, person_type, person_level, department) VALUES
('u001', '张三', '正式员工', 'P7', '研发部'),
('u002', '李四', '正式员工', 'P6', '产品部'),
('u003', '王五', '实习生',   'P5', '测试部'),
('u004', '赵六', '外包',     'P6', '运维部'),
('u005', '钱七', '正式员工', 'P8', '研发部');
```

### 3.4 关键后端代码骨架

**ApiResponse.java**
```java
package com.library.backend.common;

import lombok.Data;

@Data
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    private String traceId;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.code = 200;
        resp.message = "success";
        resp.data = data;
        resp.traceId = java.util.UUID.randomUUID().toString();
        return resp;
    }
}
```

**TrackCall.java (注解)**
```java
package com.library.backend.aspect;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TrackCall {
    String apiName();
    String description() default "";
}
```

**DemoController.java (接口定义)**
```java
package com.library.backend.controller;

import com.library.backend.aspect.TrackCall;
import com.library.backend.common.ApiResponse;
import com.library.backend.service.DemoService;
import com.library.backend.service.ExportService;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    private final DemoService demoService;
    private final ExportService exportService;

    public DemoController(DemoService demoService, ExportService exportService) {
        this.demoService = demoService;
        this.exportService = exportService;
    }

    @GetMapping("/helloworld")
    @TrackCall(apiName = "helloworld", description = "HelloWorld演示接口")
    public ApiResponse<Map<String, String>> helloWorld() {
        return ApiResponse.success(demoService.helloWorld());
    }

    @GetMapping("/hash")
    @TrackCall(apiName = "hash", description = "哈希算法演示接口")
    public ApiResponse<Map<String, String>> hash(@RequestParam String input) {
        return ApiResponse.success(demoService.hash(input));
    }

    @GetMapping("/bubblesort")
    @TrackCall(apiName = "bubblesort", description = "冒泡排序演示接口")
    public ApiResponse<Map<String, Object>> bubbleSort(@RequestParam String numbers) {
        return ApiResponse.success(demoService.bubbleSort(numbers));
    }

    @GetMapping("/export")
    public void export(@RequestParam String tab, HttpServletResponse response) {
        exportService.exportTab(tab, response);
    }
}
```

**TrackCallAspect.java (AOP 埋点切面)**
```java
package com.library.backend.aspect;

import com.library.backend.entity.CallLog;
import com.library.backend.entity.Person;
import com.library.backend.mapper.CallLogMapper;
import com.library.backend.mapper.PersonMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class TrackCallAspect {

    private final CallLogMapper callLogMapper;
    private final PersonMapper personMapper;
    private final ObjectMapper objectMapper;

    public TrackCallAspect(CallLogMapper callLogMapper, PersonMapper personMapper, ObjectMapper objectMapper) {
        this.callLogMapper = callLogMapper;
        this.personMapper = personMapper;
        this.objectMapper = objectMapper;
    }

    @Around("@annotation(trackCall)")
    public Object track(ProceedingJoinPoint joinPoint, TrackCall trackCall) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = null;
        String callResult = "SUCCESS";
        try {
            result = joinPoint.proceed();
        } catch (Throwable e) {
            callResult = "FAIL";
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - start;
            saveCallLog(trackCall, result, callResult, duration);
        }
        return result;
    }

    private void saveCallLog(TrackCall trackCall, Object result, String callResult, long durationMs) {
        try {
            HttpServletRequest request = ((ServletRequestAttributes)
                RequestContextHolder.currentRequestAttributes()).getRequest();

            String callerId = request.getHeader("X-User-Id");
            String callerName = request.getHeader("X-User-Name");

            CallLog log = new CallLog();
            log.setApiName(trackCall.apiName());
            log.setCallerId(callerId != null ? callerId : "anonymous");
            log.setCallerName(callerName != null ? callerName : "匿名");
            log.setCallTime(LocalDateTime.now());
            log.setCallResult(callResult);
            log.setResultSnapshot(result != null ? objectMapper.writeValueAsString(result) : null);
            log.setDurationMs((int) durationMs);

            // 记录请求参数
            Map<String, String[]> params = request.getParameterMap();
            log.setInputParams(objectMapper.writeValueAsString(params));

            callLogMapper.insert(log);
        } catch (Exception e) {
            // 埋点失败不影响主流程
        }
    }
}
```

**AnalyticsController.java**
```java
package com.library.backend.controller;

import com.library.backend.common.ApiResponse;
import com.library.backend.dto.BarLineChartDTO;
import com.library.backend.dto.PieChartDTO;
import com.library.backend.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/calls")
    public ApiResponse<Object> getCalls(
            @RequestParam String dimension,
            @RequestParam(defaultValue = "bar") String chartType,
            @RequestParam(required = false) String apiName,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        if ("pie".equals(chartType)) {
            PieChartDTO data = analyticsService.getPieData(dimension, apiName, startDate, endDate);
            return ApiResponse.success(data);
        } else {
            BarLineChartDTO data = analyticsService.getBarLineData(dimension, chartType, apiName, startDate, endDate);
            return ApiResponse.success(data);
        }
    }
}
```

### 3.5 关键前端代码骨架

**DemoPage.tsx**
```tsx
import React, { useState } from 'react';
import HelloWorldTab from '../components/tabs/HelloWorldTab';
import HashTab from '../components/tabs/HashTab';
import BubbleSortTab from '../components/tabs/BubbleSortTab';
import ExportButton from '../components/ExportButton';
import AnalyticsPanel from '../components/AnalyticsPanel';
import './DemoPage.css';

type TabKey = 'helloworld' | 'hash' | 'bubblesort';

const DemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('helloworld');

  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Demo 演示页</h1>
        <ExportButton tab={activeTab} />
      </header>

      <nav className="tab-nav">
        <button className={activeTab === 'helloworld' ? 'active' : ''} onClick={() => setActiveTab('helloworld')}>HelloWorld</button>
        <button className={activeTab === 'hash' ? 'active' : ''} onClick={() => setActiveTab('hash')}>哈希算法</button>
        <button className={activeTab === 'bubblesort' ? 'active' : ''} onClick={() => setActiveTab('bubblesort')}>冒泡排序</button>
      </nav>

      <main className="tab-content">
        {activeTab === 'helloworld' && <HelloWorldTab />}
        {activeTab === 'hash' && <HashTab />}
        {activeTab === 'bubblesort' && <BubbleSortTab />}
      </main>

      <section className="analytics-section">
        <h2>调用情况分析报表</h2>
        <AnalyticsPanel />
      </section>
    </div>
  );
};

export default DemoPage;
```

**BarChart.tsx (ECharts 示例)**
```tsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { BarLineChartData } from '../../api/types';

interface Props { data: BarLineChartData; }

const BarChart: React.FC<Props> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: data.series.map(s => s.name) },
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'value', name: '调用次数' },
      series: data.series.map(s => ({ name: s.name, type: 'bar', data: s.data })),
    });
    return () => chart.dispose();
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: 350 }} />;
};

export default BarChart;
```

---

## 4. 汇总 (Summary)

### 4.1 代码变更清单

| 仓库 | 变更类型 | 说明 |
|------|----------|------|
| `library-frontend` | **新增规格文档** | `.agents/specs/library-demo-analytics-design.md`（本文件） |

> **注**：当前阶段为需求澄清，产物仅为设计规格文档。代码实现将在后续阶段进行。本规格文档中包含的代码骨架为设计参考，不作为本阶段交付物。

### 4.2 跨仓对齐点检查结论

| 对齐点 | 检查项 | 结论 |
|--------|--------|------|
| **接口路径** | 前端 API 调用路径与后端 Controller `@RequestMapping` 路径一致 | ✅ `/api/demo/*`、`/api/analytics/calls` 完全对齐 |
| **请求/响应类型** | `ApiResponse<T>` 结构前后端字段一致 (code/message/data/traceId) | ✅ TypeScript 接口与 Java 泛型类对齐 |
| **导出契约** | 前端 `exportTab()` 返回 Blob，后端返回 `application/vnd.openxmlformats` 文件流 | ✅ MIME 类型与前端下载处理对齐 |
| **埋点身份传递** | 前端 Axios 拦截器注入 `X-User-Id`/`X-User-Name`，后端 AOP 从 Header 读取 | ✅ Header 名称完全一致 |
| **统计维度枚举** | 前端 `personType`/`personLevel`/`department` 与后端 `@RequestParam dimension` 取值一致 | ✅ 枚举值对齐 |
| **图表类型枚举** | 前端 `line`/`pie`/`bar` 与后端 `chartType` 参数一致 | ✅ 枚举值对齐 |
| **数据模型** | `call_log.caller_id` ↔ `person.id` 外键关联，统计查询 JOIN 获取维度 | ✅ 关系一致 |
| **向后兼容** | 所有接口均为新增，无历史版本冲突 | ✅ 天然兼容 |

### 4.3 风险与假设

| 类别 | 内容 |
|------|------|
| **假设** | 1. 调用人身份通过 HTTP Header 模拟传递（无真实登录系统），实际项目需对接 SSO |
| **假设** | 2. 人员维度数据（person 表）为种子数据，实际项目需对接人员中心 API |
| **假设** | 3. 导出数据源为埋点表历史记录，非前端内存数据 |
| **风险** | 1. 埋点 AOP 异步写入需注意高并发场景下的数据库压力（可后续引入消息队列削峰） |
| **风险** | 2. `result_snapshot` 为 TEXT 类型，大响应体可能占用存储（可设置截断阈值） |
| **风险** | 3. 前端图表组件需处理空数据状态（无调用记录时的友好提示） |

### 4.4 后续阶段建议

1. **开发阶段**：按本规格文档的目录结构和代码骨架，分别在 `library-backend` 和 `library-frontend` 仓库中实现代码。
2. **联调阶段**：启动后端服务（默认 8080 端口），前端 Vite dev server 配置代理转发 `/api` 到后端。
3. **测试阶段**：后端单元测试覆盖三个 Service 方法 + AOP 埋点 + 统计查询；前端组件测试覆盖 Tab 切换 + 图表渲染。
4. **埋点验证**：调用演示接口后检查 `call_log` 表是否有记录，且 `caller_id` 能正确关联 `person` 表。

---

## 附录 A: 方案备选记录 (brainstorming — Explore Alternatives)

### A.1 埋点方案备选

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **A. Spring AOP 注解式** ✅ | 声明式、低侵入、可复用 | 需理解 AOP | **采用** — 侵入性最低 |
| B. 拦截器式 | 统一拦截所有请求 | 粒度粗，无法区分接口语义 | 不采用 |
| C. 手动埋点 | 灵活 | 代码侵入高，易遗漏 | 不采用 |

### A.2 导出数据源备选

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **A. 从埋点表读取** ✅ | 数据持久化、可追溯 | 需额外查询 | **采用** — 数据可靠 |
| B. 前端传参导出 | 实时性强 | 数据不持久、请求体大 | 不采用 |

### A.3 图表库备选

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **A. ECharts** ✅ | 三种图表全覆盖、中文文档 | 包体较大 | **采用** — 功能完备 |
| B. Ant Design Charts | 封装好、美观 | 底层也是 ECharts，多一层抽象 | 不采用 |
| C. Recharts | 轻量 | 饼图/柱状图支持不如 ECharts 灵活 | 不采用 |

---

## 附录 B: Spec 自审清单 (brainstorming — Spec Self-Review)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 需求覆盖完整性 | ✅ | F1-F5 五个功能域全部覆盖 |
| 跨库接口契约明确 | ✅ | 路径、参数、响应类型、枚举值全部定义 |
| 数据模型完整 | ✅ | `call_log` + `person` 两表，字段/类型/注释齐全 |
| 向后兼容性声明 | ✅ | 新增接口天然兼容，扩展仅加字段 |
| 技术栈选型有理由 | ✅ | 每项选型附理由 |
| 方案备选有记录 | ✅ | 埋点/导出/图表三处备选 |
| 风险与假设列出 | ✅ | 3 假设 + 3 风险 |
| 目录结构规划 | ✅ | 前后端目录树完整 |
| 代码骨架可参考 | ✅ | 关键类/组件骨架给出 |
| 产物已落盘 | ✅ | 本文件已写入指定路径 |

---

*本规格文档由 brainstorming skill 方法论指导产出，作为后续开发阶段的唯一设计基准。*
