# 算法工具与调用分析平台 — 需求规格文档

> **版本**: v1.0  
> **日期**: 2025-07-14  
> **项目**: library-frontend / library-backend（图书管理系统）  
> **状态**: 设计阶段

---

## 1. 概述

在图书管理系统基础上，新增一个**算法工具与调用分析**模块，包含三个核心算法接口的在线调用、结果导出，以及基于埋点数据的可视化分析报表。

### 1.1 目标

- 提供三个算法接口（HelloWorld、哈希算法、冒泡排序）的在线调用能力
- 前端以三 Tab 页面展示各算法的输入/输出结果
- 支持将各 Tab 展示结果导出为文件
- 后端对每次 API 调用进行埋点记录（调用人、调用次数、时间等）
- 前端在同一页面以可视化报表（折线图、饼图、柱状图）展示调用统计，支持按人员类型、人员层级、人员部门等维度切换

### 1.2 用户角色

| 角色 | 说明 |
|------|------|
| 普通用户 | 可使用算法工具、导出结果、查看自己的调用统计 |
| 管理员 | 可查看全量调用统计报表，按多维度筛选 |

---

## 2. 技术栈选型

### 2.1 library-backend（后端）

| 层次 | 技术 |
|------|------|
| 框架 | Spring Boot 3.x + Java 17 |
| 持久层 | MyBatis-Plus + MySQL 8.0 |
| 埋点存储 | MySQL（metrics 表） |
| 导出 | Apache POI（Excel）/ OpenCSV（CSV） |
| 接口文档 | Swagger / OpenAPI 3 |

### 2.2 library-frontend（前端）

| 层次 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| UI 组件 | Ant Design 5.x |
| 图表 | ECharts 5.x（或 @ant-design/charts） |
| HTTP | Axios |

---

## 3. 后端接口设计

### 3.1 算法接口

#### 3.1.1 HelloWorld

```
GET /api/helloworld?name={name}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 问候名称，默认 "World" |

**响应**:
```json
{
  "code": 200,
  "data": {
    "message": "Hello, World!",
    "timestamp": 1720958400000
  }
}
```

#### 3.1.2 哈希算法

```
POST /api/hash
Content-Type: application/json
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| input | string | 是 | 待哈希字符串 |
| algorithm | string | 否 | 算法类型，默认 "SHA-256"，可选 "MD5"/"SHA-1"/"SHA-512" |

**响应**:
```json
{
  "code": 200,
  "data": {
    "hash": "e3b0c44298fc1c14...",
    "algorithm": "SHA-256",
    "input": "hello"
  }
}
```

#### 3.1.3 冒泡排序

```
POST /api/bubblesort
Content-Type: application/json
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| array | number[] | 是 | 待排序数组，长度 2~1000 |
| order | string | 否 | "asc"（升序，默认）/ "desc"（降序） |

**响应**:
```json
{
  "code": 200,
  "data": {
    "sorted": [1, 2, 3, 5, 8],
    "steps": 10,
    "original": [5, 3, 8, 1, 2]
  }
}
```

### 3.2 导出接口

```
POST /api/export
Content-Type: application/json
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 导出类型: "helloworld" / "hash" / "bubblesort" |
| data | object | 是 | 当前 Tab 展示的结果数据 |
| format | string | 否 | "csv"（默认）/ "xlsx" |

**响应**: `Content-Type: application/octet-stream`，返回文件流。

### 3.3 埋点与统计接口

#### 3.3.1 埋点记录（中间件自动触发）

每个算法接口调用时，由 AOP 切面自动记录到 `api_metrics` 表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| api_path | VARCHAR | 接口路径 |
| caller_id | VARCHAR | 调用人 ID |
| caller_name | VARCHAR | 调用人姓名 |
| caller_type | VARCHAR | 人员类型（内部员工/外部访客/管理员） |
| caller_level | VARCHAR | 人员层级（P1-P10） |
| caller_dept | VARCHAR | 人员部门 |
| call_time | DATETIME | 调用时间 |
| duration_ms | INT | 执行耗时(ms) |
| success | TINYINT | 是否成功 |

#### 3.3.2 统计查询接口

```
GET /api/metrics?dimension={dimension}&startDate={...}&endDate={...}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dimension | string | 否 | 统计维度: "caller_type" / "caller_level" / "caller_dept"，默认 "caller_type" |
| startDate | string | 否 | 开始日期 yyyy-MM-dd |
| endDate | string | 否 | 结束日期 yyyy-MM-dd |
| apiPath | string | 否 | 按接口路径筛选 |

**响应**:
```json
{
  "code": 200,
  "data": {
    "dimension": "caller_type",
    "total": 1523,
    "breakdown": [
      {"label": "内部员工", "count": 800, "percentage": 52.5},
      {"label": "外部访客", "count": 500, "percentage": 32.8},
      {"label": "管理员", "count": 223, "percentage": 14.7}
    ],
    "trend": [
      {"date": "2025-07-01", "count": 45},
      {"date": "2025-07-02", "count": 62}
    ]
  }
}
```

---

## 4. 前端页面设计

### 4.1 路由

新增路由 `/algorithm-tools`，在左侧菜单中新增"算法工具"菜单项。

### 4.2 页面布局

```
┌──────────────────────────────────────────────────┐
│  算法工具与调用分析                                │
├──────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┐                 │
│  │HelloWorld│ 哈希算法 │ 冒泡排序 │  ← 算法 Tab    │
│  └─────────┴─────────┴─────────┘                 │
│  ┌──────────────────────────────────────────────┐ │
│  │  [输入区]                                     │ │
│  │  ┌──────────────────────────────────┐        │ │
│  │  │ 输入框                             │        │ │
│  │  └──────────────────────────────────┘        │ │
│  │  [执行]  [导出]                               │ │
│  │                                              │ │
│  │  [结果展示区]                                  │ │
│  │  ┌──────────────────────────────────┐        │ │
│  │  │ 结果 JSON / 文本                   │        │ │
│  │  └──────────────────────────────────┘        │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │  调用分析报表  [维度选择▼]  [图表类型切换]      │ │
│  │  ┌──────────────────────────────────┐        │ │
│  │  │         ECharts 图表区             │        │ │
│  │  │  折线图 | 饼图 | 柱状图             │        │ │
│  │  └──────────────────────────────────┘        │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 4.3 组件树

```
AlgorithmToolsPage
├── AlgorithmTabs
│   ├── HelloWorldTab
│   │   ├── NameInput
│   │   ├── ExecuteButton
│   │   └── ResultDisplay
│   ├── HashTab
│   │   ├── InputTextArea
│   │   ├── AlgorithmSelect (MD5/SHA-1/SHA-256/SHA-512)
│   │   ├── ExecuteButton
│   │   └── ResultDisplay
│   └── BubbleSortTab
│       ├── ArrayInput (逗号分隔数字)
│       ├── OrderSelect (升序/降序)
│       ├── ExecuteButton
│       └── ResultDisplay (含排序步骤数)
├── ExportButton (当前 Tab 结果导出)
└── MetricsDashboard
    ├── DimensionSelect (人员类型/层级/部门)
    ├── ChartTypeSwitch (折线图/饼图/柱状图)
    ├── DateRangePicker
    └── ChartContainer (ECharts)
```

---

## 5. 数据流

```
用户输入 → 前端表单 → POST/GET /api/xxx → Controller → Service → 返回结果
                                                          │
                                                    AOP 埋点拦截
                                                          │
                                                    写入 api_metrics 表
                                                          │
用户查看报表 → GET /api/metrics → 聚合查询 → 前端 ECharts 渲染
```

---

## 6. 埋点中间件设计

### 6.1 AOP 切面

```java
@Aspect
@Component
public class MetricsAspect {
    @Around("@annotation(org.springframework.web.bind.annotation.GetMapping) || 
            @annotation(org.springframework.web.bind.annotation.PostMapping)")
    public Object recordMetrics(ProceedingJoinPoint joinPoint) {
        // 1. 提取调用人信息（从 JWT/Session/Request Header）
        // 2. 记录开始时间
        // 3. 执行原方法
        // 4. 记录结束时间、成功状态
        // 5. 异步写入 api_metrics 表
    }
}
```

### 6.2 调用人信息获取策略

1. 从请求头 `X-User-Id`、`X-User-Name`、`X-User-Type`、`X-User-Level`、`X-User-Dept` 获取
2. 若缺失，从当前登录会话（Spring Security Context）获取
3. 若仍缺失，记录为 "anonymous"

---

## 7. 数据库表设计

### 7.1 api_metrics 表

```sql
CREATE TABLE api_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_path VARCHAR(255) NOT NULL COMMENT '接口路径',
    caller_id VARCHAR(64) COMMENT '调用人ID',
    caller_name VARCHAR(128) COMMENT '调用人姓名',
    caller_type VARCHAR(32) COMMENT '人员类型',
    caller_level VARCHAR(16) COMMENT '人员层级',
    caller_dept VARCHAR(128) COMMENT '人员部门',
    call_time DATETIME NOT NULL COMMENT '调用时间',
    duration_ms INT COMMENT '耗时(ms)',
    success TINYINT DEFAULT 1 COMMENT '1成功 0失败',
    INDEX idx_api_path (api_path),
    INDEX idx_caller_type (caller_type),
    INDEX idx_caller_level (caller_level),
    INDEX idx_caller_dept (caller_dept),
    INDEX idx_call_time (call_time)
);
```

---

## 8. 错误处理

| 场景 | HTTP 状态码 | 响应 |
|------|------------|------|
| 参数校验失败 | 400 | `{code: 400, message: "参数错误: xxx"}` |
| 数组长度超限 | 400 | `{code: 400, message: "数组长度需在2~1000之间"}` |
| 不支持的哈希算法 | 400 | `{code: 400, message: "不支持的算法: xxx"}` |
| 服务器内部错误 | 500 | `{code: 500, message: "服务器内部错误"}` |

---

## 9. 跨仓对齐清单

| 对齐项 | library-backend | library-frontend | 状态 |
|--------|:---:|:---:|:---:|
| 接口路径 | `/api/helloworld`, `/api/hash`, `/api/bubblesort` | Axios 请求路径一致 | ✅ |
| 请求/响应结构 | `{code, data, message}` 统一封装 | 拦截器统一解析 | ✅ |
| 导出格式 | CSV/XLSX 文件流 | Blob 下载处理 | ✅ |
| 埋点字段 | caller_type/level/dept | 维度下拉选项一致 | ✅ |
| 认证信息传递 | 请求头 `X-User-*` | Axios 拦截器注入 | ✅ |

---

## 10. 自审清单

- [x] 无 TBD/TODO 占位符
- [x] 接口契约前后端一致
- [x] 数据库表字段完整覆盖可视化维度
- [x] 错误场景已覆盖
- [x] 技术栈选型明确
- [x] 组件树清晰
- [x] 数据流完整

---

## 11. 后续步骤

1. 本规格文档确认后，进入 `writing-plans` 阶段生成实施计划
2. 按后端 → 前端顺序实施，优先完成算法接口与埋点中间件
3. 前端图表组件可并行开发