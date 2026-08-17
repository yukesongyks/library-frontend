# 需求澄清与设计方案

## 1. 需求概述

实现三个后端接口（helloworld、哈希算法、冒泡排序）以及对应的前端页面，包含三个 Tab 分别展示结果，并支持导出功能。

## 2. 技术选型

| 层 | 技术栈 | 说明 |
|---|--------|------|
| 前端 | React + TypeScript | 主流前端框架，生态丰富 |
| 后端 | Spring Boot (Java) | 企业级 Java 后端框架 |
| 构建 | Maven (后端) / Vite (前端) | 标准构建工具 |

## 3. 接口设计

### 3.1 helloworld API
```
GET /api/helloworld
Response: { "message": "Hello World!", "timestamp": "2026-08-17T12:00:00Z" }
```

### 3.2 哈希算法 API
```
POST /api/hash
Request: { "input": "待计算字符串", "algorithm": "SHA-256" }
Response: { "input": "待计算字符串", "algorithm": "SHA-256", "hash": "abc123..." }
```
支持算法：SHA-256（默认）、MD5

### 3.3 冒泡排序 API
```
POST /api/bubble-sort
Request: { "array": [5, 3, 8, 1, 2] }
Response: { 
  "input": [5, 3, 8, 1, 2], 
  "steps": [[3,5,1,2,8], [1,2,3,5,8]], 
  "result": [1, 2, 3, 5, 8] 
}
```

### 3.4 导出 API
```
GET /api/export?tab=helloworld|hash|bubble-sort&format=json|csv
Response: 文件下载（JSON/CSV）
```

## 4. 前端页面设计

```
页面结构:
├── Tab1: Hello World
│   └── 调用 GET /api/helloworld → 展示消息和时间戳
├── Tab2: 哈希算法
│   ├── 输入框（输入字符串）
│   ├── 算法选择（SHA-256 / MD5）
│   ├── 计算按钮
│   └── 结果展示区
├── Tab3: 冒泡排序
│   ├── 输入框（输入逗号分隔的整数数组）
│   ├── 排序按钮
│   ├── 排序过程（分步展示）
│   └── 最终结果展示
└── 导出按钮（固定在页面右上角）
    └── 导出当前 Tab 结果
```

## 5. 跨仓依赖

| 依赖方向 | 说明 |
|---------|------|
| frontend → backend | 前端通过 HTTP 调用后端 API |
| 接口契约 | 统一 JSON 格式，后端返回结构体在前端使用 TypeScript 类型定义 |

## 6. 待确认项

> 以下问题因无法交互暂按默认方案处理：
> - 前端默认使用 React + TypeScript，后端使用 Spring Boot (Java)
> - 哈希算法默认使用 SHA-256
> - 导出格式默认 JSON
> - 冒泡排序输入为逗号分隔的整数数组