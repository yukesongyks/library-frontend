# 需求规格说明书：多功能演示页面（HelloWorld / 哈希算法 / 冒泡排序）

> **版本**: v1.0  
> **日期**: 2025-01-23  
> **阶段**: 需求澄清  
> **涉及仓库**: library-frontend（前端）、library-backend（后端）

---

## 1. 需求概述

在图书管理系统中新增一个「功能演示」页面，包含以下核心能力：

1. **三个后端接口**：HelloWorld、哈希算法、冒泡排序
2. **前端三 Tab 页面**：分别展示三个接口的执行结果
3. **导出功能**：每个 Tab 支持导出当前展示结果，后端提供导出接口
4. **调用埋点**：后端记录每次接口调用的次数与调用者信息
5. **可视化报表**：前端在同一页面展示调用情况统计，支持多维度（人员类型、人员层级、人员部门）及多种图表（折线图、饼图、柱状图）

---

## 2. 技术选型决策

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| 前端框架 | React 18 + TypeScript | 企业级标准选型 |
| UI 组件库 | Ant Design 5.x | 中文企业应用主流 |
| 图表库 | ECharts 5.x (via echarts-for-react) | 支持折线图/饼图/柱状图 |
| 导出格式 | Excel (.xlsx) | 后端使用 Apache POI 生成 |
| 后端框架 | Java 17 + Spring Boot 3.x | 企业级标准选型 |
| 数据存储 | H2 内存数据库（演示）/ MySQL（生产） | 埋点数据持久化 |
| API 风格 | RESTful JSON | 前后端统一契约 |

---

## 3. 后端接口设计

### 3.1 HelloWorld 接口

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
    "result": "Hello, World!",
    "timestamp": "2025-01-23T10:00:00Z"
  }
}
```

### 3.2 哈希算法接口

```
POST /api/demo/hash
```

**请求体**:
```json
{
  "input": "string (必填, 待哈希的原文)",
  "algorithm": "string (可选, 枚举: MD5 | SHA-1 | SHA-256, 默认 SHA-256)"
}
```

**响应体**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "input": "原始输入",
    "algorithm": "SHA-256",
    "hashValue": "a1b2c3d4...",
    "timestamp": "2025-01-23T10:00:00Z"
  }
}
```

### 3.3 冒泡排序接口

```
POST /api/demo/bubble-sort
```

**请求体**:
```json
{
  "numbers": [5, 3, 8, 1, 9, 2],
  "order": "string (可选, 枚举: ASC | DESC, 默认 ASC)"
}
```

**响应体**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "original": [5, 3, 8, 1, 9, 2],
    "sorted": [1, 2, 3, 5, 8, 9],
    "order": "ASC",
    "steps": [
      [3, 5, 1, 8, 2, 9],
      [3, 1, 5, 2, 8, 9],
      ...
    ],
    "timestamp": "2025-01-23T10:00:00Z"
  }
}
```

> **设计说明**: `steps` 字段记录每轮排序的中间状态，便于前端可视化排序过程。

### 3.4 导出接口

```
POST /api/demo/export
```

**请求体**:
```json
{
  "type": "string (枚举: helloworld | hash | bubble-sort)",
  "recordIds": ["string (可选, 指定导出记录ID列表; 为空则导出全部)"]
}
```

**响应**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`（Excel 文件流）

**Excel 内容结构**:

| 列名 | 说明 |
|------|------|
| 序号 | 自增序号 |
| 调用时间 | ISO 8601 格式 |
| 调用人 | 用户姓名 |
| 输入参数 | JSON 格式 |
| 输出结果 | JSON 格式 |
| 耗时(ms) | 接口执行耗时 |

### 3.5 调用统计查询接口

```
GET /api/demo/analytics
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dimension | string | 是 | 统计维度: `personnelType` / `personnelLevel` / `department` |
| apiType | string | 否 | 接口类型过滤: `helloworld` / `hash` / `bubble-sort` / `all` |
| startDate | string | 否 | 起始日期 (yyyy-MM-dd) |
| endDate | string | 否 | 结束日期 (yyyy-MM-dd) |
| chartType | string | 否 | 图表类型偏好: `line` / `pie` / `bar`（仅影响前端渲染） |

**响应体**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dimension": "department",
    "apiType": "all",
    "totalCalls": 1520,
    "groups": [
      {
        "name": "技术部",
        "count": 580,
        "percentage": 38.2
      },
      {
        "name": "产品部",
        "count": 420,
        "percentage": 27.6
      }
    ],
    "timeSeries": [
      {
        "date": "2025-01-20",
        "groups": {
          "技术部": 85,
          "产品部": 62
        }
      }
    ]
  }
}
```

> **`groups`** 用于饼图/柱状图；**`timeSeries`** 用于折线图。前端根据所选图表类型取用对应数据。

---

## 4. 埋点设计

### 4.1 埋点采集字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| apiType | String | 接口标识: helloworld / hash / bubble-sort |
| userId | String | 调用者工号 |
| userName | String | 调用者姓名 |
| personnelType | String | 人员类型（如：正式/外包/实习） |
| personnelLevel | String | 人员层级（如：P5/P6/P7） |
| department | String | 所属部门 |
| requestPayload | String | 请求参数 JSON |
| responsePayload | String | 响应结果 JSON |
| durationMs | Long | 执行耗时（毫秒） |
| timestamp | LocalDateTime | 调用时间 |

### 4.2 埋点实现方式

- 采用 **Spring AOP 切面** 拦截 `/api/demo/**` 路径下的所有请求
- 调用者信息从 **请求头** 获取（`X-User-Id`, `X-User-Name`, `X-User-Type`, `X-User-Level`, `X-User-Dept`）
- 前端在每次 API 请求时注入上述 Header
- 埋点数据异步写入数据库，不阻塞主流程响应

### 4.3 数据表结构

```sql
CREATE TABLE api_call_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_type VARCHAR(32) NOT NULL,
    user_id VARCHAR(64),
    user_name VARCHAR(128),
    personnel_type VARCHAR(32),
    personnel_level VARCHAR(32),
    department VARCHAR(128),
    request_payload TEXT,
    response_payload TEXT,
    duration_ms BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_type ON api_call_log(api_type);
CREATE INDEX idx_department ON api_call_log(department);
CREATE INDEX idx_personnel_type ON api_call_log(personnel_type);
CREATE INDEX idx_personnel_level ON api_call_log(personnel_level);
CREATE INDEX idx_created_at ON api_call_log(created_at);
```

---

## 5. 前端页面设计

### 5.1 页面结构

```
┌─────────────────────────────────────────────────────┐
│  功能演示                                              │
├─────────────────────────────────────────────────────┤
│  [HelloWorld] [哈希算法] [冒泡排序] [调用统计]           │
│  ─────────────────────────────────────────────────   │
│                                                     │
│              (Tab 内容区域)                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

共 **4 个 Tab**：

| Tab | 内容 |
|-----|------|
| HelloWorld | 输入姓名 → 调用 → 展示结果 + 历史记录表格 + 导出按钮 |
| 哈希算法 | 输入原文 + 选择算法 → 调用 → 展示哈希值 + 历史记录 + 导出 |
| 冒泡排序 | 输入数字数组 + 排序方向 → 调用 → 展示排序结果（含步骤动画）+ 导出 |
| 调用统计 | 维度选择 + 图表类型切换 + 报表可视化 |

### 5.2 Tab 1-3 通用交互模式

每个功能 Tab 包含：

1. **输入区域**：表单控件（Input / Select / TextArea）
2. **执行按钮**：触发后端接口调用
3. **结果展示区**：格式化展示返回结果
4. **历史记录表格**：Ant Design Table，展示本会话内的调用历史
5. **导出按钮**：点击后调用导出接口，下载 Excel 文件

### 5.3 Tab 4 - 调用统计报表

#### 5.3.1 筛选区域

| 控件 | 说明 |
|------|------|
| 统计维度 Select | 人员类型 / 人员层级 / 人员部门 |
| 接口类型 Select | 全部 / HelloWorld / 哈希算法 / 冒泡排序 |
| 日期范围 DatePicker | 起止日期 |
| 图表类型 Radio | 折线图 / 饼图 / 柱状图 |

#### 5.3.2 图表展示区域

- **折线图**：X 轴为日期，Y 轴为调用次数，不同分组为不同线条
- **饼图**：各分组占比
- **柱状图**：各分组调用次数对比

#### 5.3.3 汇总卡片

顶部展示 4 个统计卡片：
- 总调用次数
- 今日调用次数
- 活跃用户数
- 平均响应耗时

---

## 6. 跨库接口契约

### 6.1 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

错误码约定：

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数校验失败 |
| 500 | 服务端异常 |

### 6.2 请求头契约

| Header | 必填 | 说明 |
|--------|------|------|
| Content-Type | 是 | application/json |
| X-User-Id | 是 | 用户工号 |
| X-User-Name | 是 | 用户姓名 |
| X-User-Type | 是 | 人员类型 |
| X-User-Level | 是 | 人员层级 |
| X-User-Dept | 是 | 所属部门 |

### 6.3 接口清单汇总

| # | 方法 | 路径 | 用途 |
|---|------|------|------|
| 1 | POST | /api/demo/helloworld | HelloWorld 接口 |
| 2 | POST | /api/demo/hash | 哈希算法接口 |
| 3 | POST | /api/demo/bubble-sort | 冒泡排序接口 |
| 4 | POST | /api/demo/export | 导出 Excel |
| 5 | GET | /api/demo/analytics | 调用统计查询 |

---

## 7. 非功能性要求

| 项目 | 要求 |
|------|------|
| 接口响应时间 | 单接口 < 500ms（不含排序超大数组） |
| 冒泡排序上限 | 数组长度 ≤ 1000，超出返回 400 |
| 导出上限 | 单次导出 ≤ 10000 条记录 |
| 埋点写入 | 异步，不影响主接口响应 |
| 前端兼容 | Chrome 90+ / Edge 90+ / Firefox 88+ |

---

## 8. 项目结构规划

### 8.1 后端 (library-backend)

```
library-backend/
├── pom.xml
├── src/main/java/com/library/demo/
│   ├── DemoApplication.java
│   ├── controller/
│   │   ├── DemoController.java        # HelloWorld / Hash / BubbleSort
│   │   ├── ExportController.java      # 导出接口
│   │   └── AnalyticsController.java   # 统计查询
│   ├── service/
│   │   ├── HelloWorldService.java
│   │   ├── HashService.java
│   │   ├── BubbleSortService.java
│   │   ├── ExportService.java
│   │   └── AnalyticsService.java
│   ├── model/
│   │   ├── request/                   # 请求 DTO
│   │   ├── response/                  # 响应 DTO
│   │   └── entity/                    # 数据库实体
│   ├── repository/
│   │   └── ApiCallLogRepository.java
│   ├── aspect/
│   │   └── ApiCallLogAspect.java      # 埋点切面
│   └── config/
│       └── WebConfig.java             # CORS 等配置
└── src/main/resources/
    ├── application.yml
    └── schema.sql
```

### 8.2 前端 (library-frontend)

```
library-frontend/
├── package.json
├── tsconfig.json
├── src/
│   ├── pages/
│   │   └── demo/
│   │       ├── index.tsx              # 主页面（Tab 容器）
│   │       ├── HelloWorldTab.tsx
│   │       ├── HashTab.tsx
│   │       ├── BubbleSortTab.tsx
│   │       ├── AnalyticsTab.tsx
│   │       └── components/
│   │           ├── ExportButton.tsx
│   │           ├── ChartPanel.tsx
│   │           └── StatsCard.tsx
│   ├── services/
│   │   └── demoApi.ts                 # API 调用封装
│   └── types/
│       └── demo.d.ts                  # TypeScript 类型定义
```

---

## 9. 实施顺序建议

| 阶段 | 内容 | 仓库 |
|------|------|------|
| Phase 1 | 后端三个核心接口 + 单元测试 | library-backend |
| Phase 2 | 后端埋点切面 + 数据库表 | library-backend |
| Phase 3 | 后端导出接口 + 统计查询接口 | library-backend |
| Phase 4 | 前端页面框架 + 三个功能 Tab | library-frontend |
| Phase 5 | 前端导出按钮 + 调用统计报表 + 图表 | library-backend + library-frontend |
| Phase 6 | 联调测试 + 端到端验证 | 双库 |

---

## 10. 风险与约束

| 风险项 | 影响 | 缓解措施 |
|--------|------|----------|
| 两仓库均为空仓库，需从零搭建 | 工作量较大 | 使用 Spring Initializr / Create React App 脚手架 |
| 用户身份信息依赖请求头注入 | 前端需模拟用户 | 前端提供用户选择器，演示时手动选择 |
| 冒泡排序大数据量性能 | 前端阻塞 | 后端限制数组长度 ≤ 1000 |
| 埋点数据量增长 | 存储压力 | 定期归档，演示环境使用 H2 |
