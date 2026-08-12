# 需求规格文档：算法演示与调用埋点分析系统

> **任务边界 ID**: `tb-26d0dd18b7fdb9dd`
> **阶段**: 需求澄清（brainstorming）
> **日期**: 2026-08-12
> **涉及仓库**: `library-frontend`（前端）、`library-backend`（后端）
> **产物类型**: 需求规格文档（非代码产物，不涉及任何代码文件修改）

---

## 1. 概述

### 1.1 需求背景

当前 `library-frontend` 与 `library-backend` 两个仓库均为绿地项目（仅含 README.md）。本需求在图书管理系统基础上新增一套**算法演示与调用埋点分析**功能模块，包含：

- 后端提供三个算法演示接口（HelloWorld、哈希算法、冒泡排序）
- 前端新增页面，以三 Tab 形式展示各接口执行结果
- 导出功能：前端按钮触发，后端提供导出接口，支持导出各 Tab 展示结果
- 后端埋点：记录每个接口的调用次数和调用人信息
- 前端可视化报表：在当前页面展示调用情况，支持多维度（人员类型、人员层级、人员部门）和多图表形式（折线图、饼图、柱状图）

### 1.2 设计决策与假设

由于两个仓库均为绿地项目且无显式技术栈约束，以下决策基于企业级常见技术选型：

| 决策项 | 选型 | 理由 |
|--------|------|------|
| 前端框架 | React 18 + TypeScript | 生态成熟，组件化适合 Tab+图表场景 |
| UI 组件库 | Ant Design 5.x | 提供 Tabs/Table/Button 等开箱即用组件 |
| 图表库 | ECharts 5.x | 原生支持折线图/饼图/柱状图，中文生态好 |
| 后端框架 | Java 17 + Spring Boot 3.x | 企业级标准，与图书管理系统后端定位一致 |
| 数据库 | MySQL 8.x | 埋点数据持久化 |
| 前后端通信 | RESTful JSON API | 简单直接，适合演示场景 |
| 导出格式 | Excel (.xlsx) | 企业场景最通用的导出格式 |
| 人员信息来源 | 请求头 `X-User-Id` / `X-User-Name` + 上下文注入 | 演示阶段无独立认证中心，通过请求头模拟 |

> **假设**：调用人的人员类型、层级、部门等维度信息由后端在埋点时根据用户 ID 关联获取。演示阶段使用内置模拟数据映射表，生产环境对接组织架构服务。

---

## 2. 功能需求

### 2.1 后端算法接口（3 个）

#### 2.1.1 HelloWorld 接口

- **路径**: `GET /api/algorithm/helloworld`
- **功能**: 返回固定的 "Hello, World!" 字符串
- **请求参数**: 无
- **响应体**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "result": "Hello, World!",
    "timestamp": "2026-08-12T10:00:00Z"
  }
}
```

#### 2.1.2 哈希算法接口

- **路径**: `POST /api/algorithm/hash`
- **功能**: 对输入文本计算哈希摘要，支持多种哈希算法
- **请求体**:
```json
{
  "input": "hello world",
  "algorithm": "SHA-256"
}
```
- **algorithm 可选值**: `MD5`, `SHA-1`, `SHA-256`, `SHA-512`（默认 `SHA-256`）
- **响应体**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "input": "hello world",
    "algorithm": "SHA-256",
    "hashResult": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    "timestamp": "2026-08-12T10:00:00Z"
  }
}
```

#### 2.1.3 冒泡排序接口

- **路径**: `POST /api/algorithm/bubble-sort`
- **功能**: 对输入整数数组执行冒泡排序，返回排序结果及排序过程步骤
- **请求体**:
```json
{
  "input": [5, 3, 8, 1, 9, 2, 7]
}
```
- **响应体**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "input": [5, 3, 8, 1, 9, 2, 7],
    "sorted": [1, 2, 3, 5, 7, 8, 9],
    "steps": [
      [3, 5, 8, 1, 9, 2, 7],
      [3, 5, 1, 8, 9, 2, 7],
      [3, 5, 1, 8, 2, 9, 7],
      [3, 5, 1, 8, 2, 7, 9],
      [3, 1, 5, 8, 2, 7, 9],
      [3, 1, 5, 2, 8, 7, 9],
      [3, 1, 5, 2, 7, 8, 9],
      [1, 3, 5, 2, 7, 8, 9],
      [1, 3, 2, 5, 7, 8, 9],
      [1, 2, 3, 5, 7, 8, 9]
    ],
    "swapCount": 9,
    "timestamp": "2026-08-12T10:00:00Z"
  }
}
```

### 2.2 导出接口

- **路径**: `POST /api/export`
- **功能**: 根据指定 Tab 类型导出对应接口的执行结果为 Excel 文件
- **请求体**:
```json
{
  "tabType": "BUBBLE_SORT",
  "input": [5, 3, 8, 1, 9, 2, 7]
}
```
- **tabType 可选值**: `HELLO_WORLD`, `HASH`, `BUBBLE_SORT`
- **响应**: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，返回 `.xlsx` 文件流
- **导出内容**:
  - `HELLO_WORLD`: 单行结果（result, timestamp）
  - `HASH`: 输入文本、算法、哈希结果、时间戳
  - `BUBBLE_SORT`: 输入数组、排序结果、交换次数、每步中间状态（每步一行）

### 2.3 埋点采集

#### 2.3.1 埋点机制

- **方式**: AOP 切面自动采集，对三个算法接口方法织入埋点逻辑
- **采集时机**: 接口方法执行成功后（after-returning）
- **采集字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT (PK) | 自增主键 |
| api_name | VARCHAR(64) | 接口标识：`HELLO_WORLD` / `HASH` / `BUBBLE_SORT` |
| user_id | VARCHAR(64) | 调用人 ID（从请求头 `X-User-Id` 获取） |
| user_name | VARCHAR(128) | 调用人姓名（从请求头 `X-User-Name` 获取） |
| user_type | VARCHAR(32) | 人员类型（如：学生/教师/管理员） |
| user_level | VARCHAR(32) | 人员层级（如：L1/L2/L3） |
| user_department | VARCHAR(128) | 人员部门（如：计算机系/图书馆/行政部） |
| call_time | DATETIME | 调用时间 |
| call_result | VARCHAR(16) | 调用结果：`SUCCESS` / `FAIL` |
| duration_ms | INT | 耗时（毫秒） |
| request_params | TEXT | 请求参数摘要（JSON） |

#### 2.3.2 埋点查询接口

- **路径**: `GET /api/analytics/call-stats`
- **功能**: 查询调用统计数据，支持按维度和图表类型返回聚合结果
- **请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dimension | String | 是 | 统计维度：`USER_TYPE` / `USER_LEVEL` / `USER_DEPARTMENT` |
| chartType | String | 是 | 图表类型：`LINE` / `PIE` / `BAR` |
| apiName | String | 否 | 接口名过滤（不传则统计全部接口） |
| startDate | String | 否 | 起始日期 `yyyy-MM-dd`（默认近 7 天） |
| endDate | String | 否 | 截止日期 `yyyy-MM-dd` |

- **响应体（折线图 LINE）**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "chartType": "LINE",
    "dimension": "USER_TYPE",
    "xAxis": ["2026-08-06", "2026-08-07", "...", "2026-08-12"],
    "series": [
      { "name": "学生", "data": [12, 15, 8, 20, 18, 25, 30] },
      { "name": "教师", "data": [3, 5, 2, 6, 4, 8, 10] },
      { "name": "管理员", "data": [1, 0, 2, 1, 3, 2, 5] }
    ]
  }
}
```

- **响应体（饼图 PIE）**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "chartType": "PIE",
    "dimension": "USER_DEPARTMENT",
    "items": [
      { "name": "计算机系", "value": 85 },
      { "name": "图书馆", "value": 42 },
      { "name": "行政部", "value": 18 }
    ]
  }
}
```

- **响应体（柱状图 BAR）**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "chartType": "BAR",
    "dimension": "USER_LEVEL",
    "xAxis": ["L1", "L2", "L3"],
    "series": [
      { "name": "HELLO_WORLD", "data": [30, 20, 10] },
      { "name": "HASH", "data": [25, 15, 8] },
      { "name": "BUBBLE_SORT", "data": [40, 28, 12] }
    ]
  }
}
```

---

## 3. 前端页面设计

### 3.1 页面路由

- **路由路径**: `/algorithm-demo`
- **页面名称**: 算法演示与调用分析

### 3.2 页面布局

```
┌─────────────────────────────────────────────────────────┐
│  算法演示与调用分析                          [导出按钮]   │
├─────────────────────────────────────────────────────────┤
│  [ HelloWorld ] [ 哈希算法 ] [ 冒泡排序 ] [ 调用分析 ]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              Tab 内容区域（执行结果展示）                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │  维度选择: [人员类型▼]  图表类型: [折线图▼]          ││
│  ├─────────────────────────────────────────────────────┤│
│  │                                                     ││
│  │              ECharts 图表渲染区域                     ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 3.3 Tab 详情

#### Tab 1: HelloWorld
- **内容**: 展示 HelloWorld 接口返回的字符串和时间戳
- **交互**: 「执行」按钮触发接口调用，结果以卡片形式展示
- **导出**: 导出按钮导出当前结果为 Excel

#### Tab 2: 哈希算法
- **内容**: 输入框（文本 + 算法下拉选择）→ 执行 → 展示哈希结果
- **交互**: 用户输入文本、选择算法，点击「计算」按钮
- **导出**: 导出按钮导出输入文本、算法、哈希结果

#### Tab 3: 冒泡排序
- **内容**: 输入框（逗号分隔的数字数组）→ 执行 → 展示排序结果 + 每步中间状态
- **交互**: 用户输入数组，点击「排序」按钮，结果区域展示最终排序结果和步骤动画/表格
- **导出**: 导出按钮导出输入数组、排序结果、交换次数、每步中间状态

#### Tab 4: 调用分析（报表）
- **内容**: 埋点数据可视化报表
- **控件**:
  - 维度下拉框：人员类型 / 人员层级 / 人员部门
  - 图表类型下拉框：折线图 / 饼图 / 柱状图
  - 接口过滤下拉框（可选）：全部 / HelloWorld / 哈希算法 / 冒泡排序
  - 日期范围选择器
- **渲染**: 根据选择组合调用 `/api/analytics/call-stats`，用 ECharts 渲染对应图表
- **联动**: 切换维度或图表类型时自动重新请求并渲染

### 3.4 导出按钮行为

- 导出按钮位于页面顶部（全局），也可在每个 Tab 内放置
- 点击时根据当前激活的 Tab 类型，调用 `POST /api/export` 接口
- 后端返回 Excel 文件流，前端通过 `Blob` 下载
- 文件名格式: `{tabType}_export_{yyyyMMddHHmmss}.xlsx`

---

## 4. 跨库接口契约

### 4.1 接口清单

| 序号 | 接口 | 方法 | 仓库 | 前端调用方 |
|------|------|------|------|-----------|
| 1 | `/api/algorithm/helloworld` | GET | backend | HelloWorld Tab |
| 2 | `/api/algorithm/hash` | POST | backend | 哈希算法 Tab |
| 3 | `/api/algorithm/bubble-sort` | POST | backend | 冒泡排序 Tab |
| 4 | `/api/export` | POST | backend | 导出按钮 |
| 5 | `/api/analytics/call-stats` | GET | backend | 调用分析 Tab |

### 4.2 统一响应格式

所有后端 JSON 接口统一响应结构：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

错误响应：
```json
{
  "code": 500,
  "message": "具体错误信息",
  "data": null
}
```

### 4.3 请求头约定

所有请求携带以下请求头（演示阶段模拟认证）：

| Header | 说明 | 示例 |
|--------|------|------|
| `X-User-Id` | 用户 ID | `U001` |
| `X-User-Name` | 用户姓名 | `张三` |
| `Content-Type` | 内容类型 | `application/json` |

### 4.4 跨库对齐检查点

| 对齐点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 接口路径 | 调用方使用路径 | 提供方定义路径 | 需保持一致 |
| 请求/响应字段名 | TypeScript 类型定义 | Java DTO 字段名 | 需逐字段对齐 |
| tabType 枚举值 | `HELLO_WORLD` / `HASH` / `BUBBLE_SORT` | 同左 | 已定义统一枚举 |
| dimension 枚举值 | `USER_TYPE` / `USER_LEVEL` / `USER_DEPARTMENT` | 同左 | 已定义统一枚举 |
| chartType 枚举值 | `LINE` / `PIE` / `BAR` | 同左 | 已定义统一枚举 |
| 导出文件格式 | Blob 下载处理 | xlsx 文件流 | Content-Type 对齐 |

---

## 5. 数据模型

### 5.1 埋点表 `t_api_call_log`

```sql
CREATE TABLE t_api_call_log (
  id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  api_name        VARCHAR(64)  NOT NULL COMMENT '接口标识: HELLO_WORLD/HASH/BUBBLE_SORT',
  user_id         VARCHAR(64)  NOT NULL COMMENT '调用人ID',
  user_name       VARCHAR(128) NOT NULL COMMENT '调用人姓名',
  user_type       VARCHAR(32)  DEFAULT NULL COMMENT '人员类型: 学生/教师/管理员',
  user_level      VARCHAR(32)  DEFAULT NULL COMMENT '人员层级: L1/L2/L3',
  user_department VARCHAR(128) DEFAULT NULL COMMENT '人员部门',
  call_time       DATETIME     NOT NULL COMMENT '调用时间',
  call_result     VARCHAR(16)  NOT NULL COMMENT '调用结果: SUCCESS/FAIL',
  duration_ms     INT          DEFAULT NULL COMMENT '耗时(毫秒)',
  request_params  TEXT         DEFAULT NULL COMMENT '请求参数摘要JSON',
  PRIMARY KEY (id),
  INDEX idx_api_name (api_name),
  INDEX idx_user_id (user_id),
  INDEX idx_call_time (call_time),
  INDEX idx_user_type (user_type),
  INDEX idx_user_level (user_level),
  INDEX idx_user_department (user_department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API调用埋点日志';
```

### 5.2 人员维度映射表 `t_user_profile`（演示阶段）

```sql
CREATE TABLE t_user_profile (
  user_id         VARCHAR(64)  NOT NULL COMMENT '用户ID',
  user_name       VARCHAR(128) NOT NULL COMMENT '用户姓名',
  user_type       VARCHAR(32)  NOT NULL COMMENT '人员类型: 学生/教师/管理员',
  user_level      VARCHAR(32)  NOT NULL COMMENT '人员层级: L1/L2/L3',
  user_department VARCHAR(128) NOT NULL COMMENT '人员部门',
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户维度信息(演示阶段模拟)';
```

---

## 6. 架构设计

### 6.1 后端模块划分

```
library-backend/
└── src/main/java/com/library/
    ├── controller/
    │   ├── AlgorithmController.java       # 三个算法接口
    │   ├── ExportController.java           # 导出接口
    │   └── AnalyticsController.java       # 埋点查询接口
    ├── service/
    │   ├── AlgorithmService.java           # 算法逻辑
    │   ├── ExportService.java             # 导出逻辑
    │   └── AnalyticsService.java          # 统计查询逻辑
    ├── aspect/
    │   └── CallLogAspect.java             # 埋点AOP切面
    ├── mapper/
    │   ├── ApiCallLogMapper.java          # 埋点数据操作
    │   └── UserProfileMapper.java         # 用户维度查询
    ├── model/
    │   ├── dto/                           # 请求/响应DTO
    │   ├── entity/                        # 数据库实体
    │   └── enums/                         # 枚举(ApiNameEnum, DimensionEnum, ChartTypeEnum)
    └── config/
        └── WebConfig.java                 # 跨域等配置
```

### 6.2 前端模块划分

```
library-frontend/
└── src/
    ├── pages/
    │   └── algorithm-demo/
    │       ├── index.tsx                  # 页面主入口(Tabs容器)
    │       ├── components/
    │       │   ├── HelloWorldTab.tsx      # HelloWorld Tab
    │       │   ├── HashTab.tsx             # 哈希算法 Tab
    │       │   ├── BubbleSortTab.tsx      # 冒泡排序 Tab
    │       │   ├── AnalyticsTab.tsx       # 调用分析 Tab
    │       │   └── ChartContainer.tsx      # ECharts 图表容器
    │       └── hooks/
    │           ├── useAlgorithm.ts        # 算法接口调用
    │           ├── useExport.ts           # 导出接口调用
    │           └── useAnalytics.ts        # 埋点查询接口调用
    ├── services/
    │   └── api.ts                         # API 请求封装
    ├── types/
    │   └── api.ts                         # 接口类型定义(与后端DTO对齐)
    └── utils/
        └── download.ts                    # Blob 文件下载工具
```

### 6.3 数据流

```
用户操作 → 前端 Tab 组件 → API Service → 后端 Controller
                                              ↓
                                    Service (执行算法逻辑)
                                              ↓
                                    AOP切面 (自动埋点) → DB (t_api_call_log)
                                              ↓
                                    返回结果 → 前端展示

导出: 用户点击导出 → POST /api/export → ExportService → 生成xlsx → 文件流下载

报表: 用户选择维度+图表 → GET /api/analytics/call-stats → AnalyticsService
  → 查询 t_api_call_log 聚合 → 返回图表数据 → 前端 ECharts 渲染
```

---

## 7. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 算法接口入参非法 | 返回 `code=400`，message 描述具体参数错误 |
| 哈希算法不支持 | 返回 `code=400`，message: "不支持的哈希算法: {algorithm}" |
| 冒泡排序输入非数字 | 返回 `code=400`，message: "输入数组必须为整数" |
| 导出失败 | 返回 `code=500`，message: "导出失败: {reason}" |
| 埋点查询无数据 | 返回 `code=200`，data 中 series/items 为空数组 |
| 用户未登录(无X-User-Id) | 返回 `code=401`，message: "未获取到用户信息" |

---

## 8. 测试策略

| 层级 | 范围 | 方法 |
|------|------|------|
| 后端单元测试 | AlgorithmService 三种算法逻辑 | JUnit5，验证正确性+边界值 |
| 后端单元测试 | 埋点切面 CallLogAspect | 验证埋点数据正确写入 |
| 后端集成测试 | Controller 层 API | MockMvc，验证请求/响应格式 |
| 前端单元测试 | Tab 组件渲染+交互 | React Testing Library |
| 前端单元测试 | API Service 请求 | Mock fetch，验证参数传递 |
| 跨库契约测试 | 接口字段对齐 | 前端 types/api.ts 与后端 DTO 逐字段比对 |

---

## 9. 待确认事项（需求澄清遗留）

以下事项在自主决策模式下已做出合理假设，如需调整请在评审后反馈：

1. **技术栈确认**: 假设 React+TS / Spring Boot+Java，如已有其他技术栈规划请指定
2. **人员维度数据来源**: 演示阶段使用内置映射表，生产环境是否对接组织架构服务
3. **导出格式**: 假设 Excel(.xlsx)，如需 CSV/PDF 请指定
4. **埋点存储**: 假设 MySQL，如需 Elasticsearch/ClickHouse 等时序数据库请指定
5. **认证机制**: 演示阶段通过请求头模拟，生产环境是否需要对接统一认证
6. **冒泡排序步骤展示**: 假设返回完整步骤列表前端表格展示，如需动画效果请指定
7. **报表时间范围**: 默认近 7 天，如需可配置请指定

---

## 10. 验收标准

- [ ] 后端三个算法接口可独立调用并返回正确结果
- [ ] 前端页面三个 Tab 可分别展示对应接口执行结果
- [ ] 导出按钮可导出当前 Tab 结果为 Excel 文件
- [ ] 后端埋点自动记录每次调用的调用人信息和调用结果
- [ ] 前端调用分析 Tab 可按人员类型/层级/部门维度展示
- [ ] 报表支持折线图、饼图、柱状图三种展示形式
- [ ] 前后端接口字段名和枚举值完全对齐
- [ ] 统一响应格式 `{code, message, data}` 在所有接口一致

---

*本文档由 brainstorming 技能驱动生成，遵循需求澄清→设计呈现→规格落盘流程。*
