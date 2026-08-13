# 多功能演示页面 + 埋点报表系统 — 设计规格文档

> **版本**: v1.0  
> **日期**: 2025-01-24  
> **阶段**: 需求澄清 / Brainstorming  
> **涉及仓库**: library-frontend, library-backend

---

## 1. 需求概述

在图书管理系统中新增一个「功能演示」模块，包含以下核心能力：

| # | 功能模块 | 描述 |
|---|---------|------|
| 1 | 三接口演示 | HelloWorld、哈希算法、冒泡排序三个后端接口 |
| 2 | Tab 展示页 | 前端新增页面，三个 Tab 分别展示各接口执行结果 |
| 3 | 数据导出 | 每个 Tab 支持导出当前展示结果为 Excel 文件 |
| 4 | 接口埋点 | 后端记录每次接口调用的次数与调用者信息 |
| 5 | 可视化报表 | 前端在当前页面展示调用统计报表（折线图/饼图/柱状图），支持按人员类型、层级、部门等维度筛选 |

---

## 2. 技术选型

### 2.1 前端 (library-frontend)

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Ant Design | 5.x | UI 组件库（Tabs、Table、Button、Select 等） |
| ECharts | 5.x | 图表可视化（折线图、饼图、柱状图） |
| Axios | 1.x | HTTP 请求 |
| echarts-for-react | 3.x | React 封装的 ECharts 组件 |

### 2.2 后端 (library-backend)

| 技术 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.x | Web 框架 |
| MyBatis-Plus | 3.5.x | ORM 框架 |
| MySQL | 8.x | 关系型数据库 |
| Apache POI | 5.x | Excel 导出 |
| Lombok | latest | 简化代码 |

---

## 3. 跨库接口契约 (API Contract)

### 3.1 功能演示接口

#### 3.1.1 HelloWorld 接口

```
POST /api/demo/helloworld
```

**请求体 (Request)**:
```json
{
  "name": "string (可选, 默认 World)"
}
```

**响应体 (Response)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "result": "Hello, {name}!",
    "timestamp": "2025-01-24T10:00:00Z",
    "executionTimeMs": 1
  }
}
```

#### 3.1.2 哈希算法接口

```
POST /api/demo/hash
```

**请求体 (Request)**:
```json
{
  "input": "string (必填, 待哈希的原始文本)",
  "algorithm": "string (可选, 枚举: MD5|SHA1|SHA256|SHA512, 默认 SHA256)"
}
```

**响应体 (Response)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "input": "原始文本",
    "algorithm": "SHA256",
    "hashResult": "a1b2c3d4...",
    "timestamp": "2025-01-24T10:00:00Z",
    "executionTimeMs": 3
  }
}
```

#### 3.1.3 冒泡排序接口

```
POST /api/demo/bubble-sort
```

**请求体 (Request)**:
```json
{
  "numbers": [5, 3, 8, 1, 9, 2],
  "order": "string (可选, 枚举: ASC|DESC, 默认 ASC)"
}
```

**响应体 (Response)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "original": [5, 3, 8, 1, 9, 2],
    "sorted": [1, 2, 3, 5, 8, 9],
    "order": "ASC",
    "swapCount": 8,
    "timestamp": "2025-01-24T10:00:00Z",
    "executionTimeMs": 2
  }
}
```

### 3.2 导出接口

```
POST /api/demo/export
```

**请求体 (Request)**:
```json
{
  "type": "string (必填, 枚举: HELLOWORLD|HASH|BUBBLE_SORT)",
  "recordIds": ["string (可选, 指定导出的记录ID列表, 为空则导出全部)"]
}
```

**响应**: `application/octet-stream` (Excel .xlsx 文件流)

**导出列定义**:

| 接口类型 | 导出列 |
|---------|--------|
| HELLOWORLD | 序号、输入名称、返回结果、调用时间、耗时(ms) |
| HASH | 序号、原始文本、算法类型、哈希结果、调用时间、耗时(ms) |
| BUBBLE_SORT | 序号、原始数组、排序结果、排序方向、交换次数、调用时间、耗时(ms) |

### 3.3 埋点统计接口

#### 3.3.1 查询调用统计

```
GET /api/demo/analytics/summary
```

**请求参数 (Query)**:
```
dimension: string (必填, 枚举: PERSON_TYPE|PERSON_LEVEL|DEPARTMENT|DATE)
apiType: string (可选, 枚举: HELLOWORLD|HASH|BUBBLE_SORT, 不传则查全部)
startDate: string (可选, yyyy-MM-dd)
endDate: string (可选, yyyy-MM-dd)
```

**响应体 (Response)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dimension": "DEPARTMENT",
    "items": [
      {
        "label": "技术部",
        "count": 156,
        "percentage": 35.2
      },
      {
        "label": "产品部",
        "count": 89,
        "percentage": 20.1
      }
    ],
    "totalCount": 443,
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-24"
    }
  }
}
```

#### 3.3.2 查询趋势数据（折线图用）

```
GET /api/demo/analytics/trend
```

**请求参数 (Query)**:
```
apiType: string (可选)
granularity: string (可选, 枚举: DAY|WEEK|MONTH, 默认 DAY)
startDate: string (可选)
endDate: string (可选)
```

**响应体 (Response)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "granularity": "DAY",
    "series": [
      {
        "apiType": "HELLOWORLD",
        "points": [
          { "date": "2025-01-20", "count": 12 },
          { "date": "2025-01-21", "count": 18 }
        ]
      }
    ]
  }
}
```

---

## 4. 数据库设计

### 4.1 调用记录表 `demo_call_log`

```sql
CREATE TABLE demo_call_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_type        VARCHAR(32) NOT NULL COMMENT '接口类型: HELLOWORLD/HASH/BUBBLE_SORT',
    caller_id       VARCHAR(64) NOT NULL COMMENT '调用者ID',
    caller_name     VARCHAR(128) COMMENT '调用者姓名',
    person_type     VARCHAR(32) COMMENT '人员类型: 正式/实习/外包',
    person_level    VARCHAR(32) COMMENT '人员层级: P5/P6/P7/P8...',
    department      VARCHAR(128) COMMENT '所属部门',
    request_params  TEXT COMMENT '请求参数(JSON)',
    response_data   TEXT COMMENT '响应结果(JSON)',
    execution_time_ms INT COMMENT '执行耗时(ms)',
    call_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '调用时间',
    INDEX idx_api_type (api_type),
    INDEX idx_caller_id (caller_id),
    INDEX idx_call_time (call_time),
    INDEX idx_department (department),
    INDEX idx_person_type (person_type),
    INDEX idx_person_level (person_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='功能演示接口调用记录';
```

---

## 5. 前端页面设计

### 5.1 页面结构

```
┌─────────────────────────────────────────────────────────┐
│  功能演示                                                 │
├─────────────────────────────────────────────────────────┤
│  [HelloWorld] [哈希算法] [冒泡排序] [调用统计]              │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ┌─ Tab 内容区 ──────────────────────────────────────┐  │
│  │                                                    │  │
│  │  [输入区域]                                        │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │ 参数输入表单                                 │   │  │
│  │  │ [执行] 按钮                                 │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │                                                    │  │
│  │  [结果展示区域]                                    │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │ 执行结果 Table/List                         │   │  │
│  │  │ [导出] 按钮                                 │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Tab 详细说明

#### Tab 1: HelloWorld
- **输入**: 文本框输入 name（可选）
- **执行**: 点击按钮调用 `/api/demo/helloworld`
- **结果展示**: 表格展示历史调用记录（结果文本、时间、耗时）
- **导出**: 导出当前 HelloWorld 调用记录为 Excel

#### Tab 2: 哈希算法
- **输入**: 文本框输入原始文本 + 下拉选择算法类型（MD5/SHA1/SHA256/SHA512）
- **执行**: 点击按钮调用 `/api/demo/hash`
- **结果展示**: 表格展示历史调用记录（原文、算法、哈希值、时间、耗时）
- **导出**: 导出当前哈希调用记录为 Excel

#### Tab 3: 冒泡排序
- **输入**: 文本框输入数字数组（逗号分隔）+ 下拉选择排序方向（升序/降序）
- **执行**: 点击按钮调用 `/api/demo/bubble-sort`
- **结果展示**: 表格展示历史调用记录（原数组、排序结果、方向、交换次数、时间、耗时）
- **导出**: 导出当前排序调用记录为 Excel

#### Tab 4: 调用统计（报表可视化）
- **筛选区**: 
  - 维度选择：人员类型 / 人员层级 / 人员部门 / 日期
  - 接口类型筛选：全部 / HelloWorld / 哈希算法 / 冒泡排序
  - 时间范围选择
- **图表展示区**（三种图表切换）:
  - 📈 **折线图**: 展示调用趋势（按日/周/月粒度）
  - 🥧 **饼图**: 展示各维度占比分布
  - 📊 **柱状图**: 展示各维度调用次数对比
- **汇总卡片**: 总调用次数、今日调用次数、最活跃接口、最活跃部门

### 5.3 前端组件拆分

```
src/pages/Demo/
├── index.tsx                    # 主页面（Tabs 容器）
├── components/
│   ├── HelloWorldTab.tsx        # HelloWorld Tab
│   ├── HashTab.tsx              # 哈希算法 Tab
│   ├── BubbleSortTab.tsx        # 冒泡排序 Tab
│   ├── AnalyticsTab.tsx         # 调用统计 Tab
│   ├── ResultTable.tsx          # 通用结果表格
│   ├── ExportButton.tsx         # 导出按钮组件
│   └── charts/
│       ├── LineChart.tsx        # 折线图组件
│       ├── PieChart.tsx         # 饼图组件
│       └── BarChart.tsx         # 柱状图组件
├── services/
│   └── demoApi.ts               # API 请求封装
└── types/
    └── demo.ts                  # TypeScript 类型定义
```

---

## 6. 后端模块设计

### 6.1 包结构

```
com.library.demo/
├── controller/
│   ├── DemoController.java          # 三个演示接口 + 导出
│   └── AnalyticsController.java     # 统计查询接口
├── service/
│   ├── HelloWorldService.java       # HelloWorld 业务逻辑
│   ├── HashService.java             # 哈希算法业务逻辑
│   ├── BubbleSortService.java       # 冒泡排序业务逻辑
│   ├── ExportService.java           # 导出业务逻辑
│   └── AnalyticsService.java        # 统计分析业务逻辑
├── mapper/
│   └── DemoCallLogMapper.java       # MyBatis-Plus Mapper
├── entity/
│   └── DemoCallLog.java             # 调用记录实体
├── dto/
│   ├── request/
│   │   ├── HelloWorldRequest.java
│   │   ├── HashRequest.java
│   │   ├── BubbleSortRequest.java
│   │   ├── ExportRequest.java
│   │   └── AnalyticsQuery.java
│   └── response/
│       ├── DemoResponse.java        # 统一响应包装
│       ├── HelloWorldResult.java
│       ├── HashResult.java
│       ├── BubbleSortResult.java
│       ├── AnalyticsSummary.java
│       └── AnalyticsTrend.java
├── aspect/
│   └── CallLogAspect.java           # AOP 埋点切面
├── enums/
│   ├── ApiType.java                 # 接口类型枚举
│   ├── HashAlgorithm.java           # 哈希算法枚举
│   ├── SortOrder.java               # 排序方向枚举
│   └── AnalyticsDimension.java      # 统计维度枚举
└── util/
    └── ExcelUtil.java               # Excel 工具类
```

### 6.2 埋点方案

采用 **AOP 切面 + 注解** 方式实现自动埋点：

```java
// 自定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CallLog {
    ApiType apiType();
}

// 使用示例
@CallLog(apiType = ApiType.HELLOWORLD)
@PostMapping("/helloworld")
public DemoResponse<HelloWorldResult> helloWorld(@RequestBody HelloWorldRequest request) {
    // ...
}
```

**切面逻辑**:
1. 拦截带 `@CallLog` 注解的方法
2. 从 SecurityContext / Token 中获取当前用户信息（caller_id, caller_name, person_type, person_level, department）
3. 记录请求参数和响应结果
4. 异步写入 `demo_call_log` 表（避免影响接口响应时间）

### 6.3 导出方案

- 使用 Apache POI 生成 `.xlsx` 文件
- 支持按接口类型导出
- 支持选择性导出（指定 recordIds）或全量导出
- 响应头设置 `Content-Disposition: attachment; filename=xxx.xlsx`
- 大数据量时使用 `SXSSFWorkbook` 流式写入

---

## 7. 跨仓对齐点检查

| 对齐点 | 前端约定 | 后端约定 | 状态 |
|--------|---------|---------|------|
| API 基础路径 | `/api/demo/*` | `@RequestMapping("/api/demo")` | ✅ 一致 |
| 接口类型枚举 | `HELLOWORLD / HASH / BUBBLE_SORT` | `ApiType { HELLOWORLD, HASH, BUBBLE_SORT }` | ✅ 一致 |
| 统计维度枚举 | `PERSON_TYPE / PERSON_LEVEL / DEPARTMENT / DATE` | `AnalyticsDimension { PERSON_TYPE, PERSON_LEVEL, DEPARTMENT, DATE }` | ✅ 一致 |
| 时间格式 | `yyyy-MM-dd` / ISO 8601 | `@DateTimeFormat` / `@JsonFormat` | ✅ 一致 |
| 导出格式 | 请求 xlsx → 接收 blob 下载 | 返回 `application/octet-stream` | ✅ 一致 |
| 统一响应结构 | `{ code, message, data }` | `DemoResponse<T>` 包装 | ✅ 一致 |
| 图表数据格式 | ECharts option 结构 | 返回 `{ label, count, percentage }` 列表 | ✅ 前端做数据转换 |

---

## 8. 错误处理

### 8.1 统一错误码

| 错误码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 500 | 服务器内部错误 |

### 8.2 前端错误处理
- 接口调用失败时展示 Ant Design `message.error` 提示
- 导出失败时提示用户重试
- 图表数据为空时展示空状态占位

---

## 9. 非功能性要求

| 项目 | 要求 |
|------|------|
| 接口响应时间 | 演示接口 < 500ms，统计接口 < 2s |
| 导出文件大小 | 单次导出不超过 10000 条记录 |
| 埋点写入 | 异步写入，不影响主接口性能 |
| 浏览器兼容 | Chrome 90+, Edge 90+, Firefox 90+ |

---

## 10. 实施建议

### 10.1 开发顺序

1. **Phase 1**: 后端三个演示接口 + 单元测试
2. **Phase 2**: 前端 Tab 页面 + 接口联调
3. **Phase 3**: 后端埋点切面 + 数据库表
4. **Phase 4**: 后端导出接口 + 前端导出按钮
5. **Phase 5**: 后端统计接口 + 前端图表可视化

### 10.2 风险点

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 用户信息来源依赖认证系统 | 埋点数据不完整 | 兜底方案：从请求头获取模拟用户信息 |
| 大量调用记录导致查询慢 | 报表加载缓慢 | 预聚合 + 索引优化 + 分页 |
| ECharts 在大数据量下卡顿 | 用户体验差 | 数据采样 + 限制展示条数 |

---

## 11. 附录：Mock 数据示例

### 调用统计 Mock（饼图 - 按部门）
```json
{
  "dimension": "DEPARTMENT",
  "items": [
    { "label": "技术部", "count": 156, "percentage": 35.2 },
    { "label": "产品部", "count": 89, "percentage": 20.1 },
    { "label": "运营部", "count": 67, "percentage": 15.1 },
    { "label": "市场部", "count": 54, "percentage": 12.2 },
    { "label": "人事部", "count": 45, "percentage": 10.2 },
    { "label": "财务部", "count": 32, "percentage": 7.2 }
  ],
  "totalCount": 443
}
```

### 趋势数据 Mock（折线图 - 按日）
```json
{
  "granularity": "DAY",
  "series": [
    {
      "apiType": "HELLOWORLD",
      "points": [
        { "date": "2025-01-18", "count": 8 },
        { "date": "2025-01-19", "count": 15 },
        { "date": "2025-01-20", "count": 12 },
        { "date": "2025-01-21", "count": 18 },
        { "date": "2025-01-22", "count": 22 },
        { "date": "2025-01-23", "count": 25 },
        { "date": "2025-01-24", "count": 30 }
      ]
    },
    {
      "apiType": "HASH",
      "points": [
        { "date": "2025-01-18", "count": 5 },
        { "date": "2025-01-19", "count": 10 },
        { "date": "2025-01-20", "count": 8 },
        { "date": "2025-01-21", "count": 14 },
        { "date": "2025-01-22", "count": 16 },
        { "date": "2025-01-23", "count": 20 },
        { "date": "2025-01-24", "count": 18 }
      ]
    },
    {
      "apiType": "BUBBLE_SORT",
      "points": [
        { "date": "2025-01-18", "count": 3 },
        { "date": "2025-01-19", "count": 7 },
        { "date": "2025-01-20", "count": 6 },
        { "date": "2025-01-21", "count": 9 },
        { "date": "2025-01-22", "count": 11 },
        { "date": "2025-01-23", "count": 13 },
        { "date": "2025-01-24", "count": 15 }
      ]
    }
  ]
}
```
