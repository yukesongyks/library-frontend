# 个人藏书管理系统 — 设计文档

> 日期：2025-07-18  
> 版本：v1.0  
> 状态：待评审

---

## 1. 概述

### 1.1 目标

为个人用户提供一套 REST API，实现个人藏书的增删改查（CRUD）管理。

### 1.2 范围

- **包含**：图书基本信息的创建、查询、更新、删除。
- **不包含**：用户认证、前端界面、阅读状态追踪、借出归还、标签分类、数据统计。

### 1.3 技术选型

| 维度 | 选择 | 说明 |
|------|------|------|
| 语言 | Java 17 | LTS 版本 |
| 框架 | Spring Boot 3.x | 主流企业级微服务框架 |
| 数据访问 | Spring Data JPA + Hibernate | ORM 自动映射 |
| 数据库 | H2 (内存模式) | 零安装，适合开发与演示 |
| API 文档 | SpringDoc OpenAPI | Swagger UI 自动生成 |
| 校验 | Bean Validation (Jakarta) | 声明式参数校验 |
| 构建工具 | Maven | 标准依赖管理 |

---

## 2. 架构设计

### 2.1 分层架构

```
┌─────────────────────────────────────┐
│         Controller 层               │  ← REST 端点，DTO 转换
│         BookController.java         │
├─────────────────────────────────────┤
│         Service 层                  │  ← 业务逻辑
│    BookService / BookServiceImpl    │
├─────────────────────────────────────┤
│         Repository 层               │  ← 数据访问
│    BookRepository (JPA)             │
├─────────────────────────────────────┤
│         Entity 层                   │  ← 数据模型
│    Book.java                        │
└─────────────────────────────────────┘
```

### 2.2 项目结构

```
src/
├── main/java/com/example/library/
│   ├── controller/
│   │   └── BookController.java       # REST 控制器
│   ├── service/
│   │   ├── BookService.java          # 服务接口
│   │   └── BookServiceImpl.java      # 服务实现
│   ├── repository/
│   │   └── BookRepository.java       # JPA 仓库
│   ├── entity/
│   │   └── Book.java                 # 实体类
│   ├── dto/
│   │   ├── BookRequest.java          # 请求 DTO
│   │   └── BookResponse.java         # 响应 DTO
│   ├── exception/
│   │   └── GlobalExceptionHandler.java # 统一异常处理
│   └── LibraryApplication.java       # 启动类
├── main/resources/
│   ├── application.yml               # 主配置
│   └── data.sql                      # 初始数据（可选）
└── test/java/com/example/library/
    └── ...                           # 单元测试与集成测试
```

---

## 3. 数据模型

### 3.1 Book 实体

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | PK, AUTO_INCREMENT | 主键 |
| title | String(255) | NOT NULL | 书名 |
| author | String(255) | NOT NULL | 作者 |
| isbn | String(20) | UNIQUE, NOT NULL | ISBN 编号 |
| publisher | String(255) | | 出版社 |
| publishDate | LocalDate | | 出版日期 |
| createdAt | LocalDateTime | 自动填充 | 创建时间 |
| updatedAt | LocalDateTime | 自动填充 | 更新时间 |

### 3.2 请求 DTO（BookRequest）

```java
title:       @NotBlank @Size(max=255)
author:      @NotBlank @Size(max=255)
isbn:        @NotBlank @Size(max=20)
publisher:   @Size(max=255)
publishDate: @PastOrPresent (LocalDate)
```

### 3.3 响应 DTO（BookResponse）

```java
id, title, author, isbn, publisher, publishDate, createdAt, updatedAt
```

---

## 4. API 设计

### 4.1 端点总览

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/books` | 分页查询全部 | — | `Page<BookResponse>` |
| GET | `/api/books/{id}` | 按 ID 查询 | — | `BookResponse` |
| POST | `/api/books` | 新增图书 | `BookRequest` | `BookResponse` (201) |
| PUT | `/api/books/{id}` | 更新图书 | `BookRequest` | `BookResponse` |
| DELETE | `/api/books/{id}` | 删除图书 | — | 204 No Content |

### 4.2 分页参数

`GET /api/books?page=0&size=20&sort=title,asc`

### 4.3 错误响应格式

```json
{
  "timestamp": "2025-07-18T10:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "校验失败详情",
  "path": "/api/books"
}
```

### 4.4 状态码

| 状态码 | 场景 |
|--------|------|
| 200 | 查询成功 |
| 201 | 创建成功 |
| 204 | 删除成功 |
| 400 | 参数校验失败 |
| 404 | 资源不存在 |
| 409 | ISBN 重复 |
| 500 | 服务器内部错误 |

---

## 5. 配置

### 5.1 application.yml

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:library
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    database-platform: org.hibernate.dialect.H2Dialect

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

server:
  port: 8080
```

---

## 6. 依赖项

### Maven 核心依赖

```xml
<!-- Spring Boot Starters -->
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-validation

<!-- 数据库 -->
h2 (runtime)

<!-- OpenAPI -->
springdoc-openapi-starter-webmvc-ui

<!-- 开发工具 -->
spring-boot-devtools (optional)

<!-- 测试 -->
spring-boot-starter-test
```

---

## 7. 测试策略

| 层级 | 覆盖目标 | 工具 |
|------|----------|------|
| 单元测试 | Service 层逻辑 | JUnit 5 + Mockito |
| 集成测试 | Controller → DB 全链路 | SpringBootTest + MockMvc |
| API 冒烟测试 | 所有端点正向/异常路径 | MockMvc 或 Swagger UI 手动 |

---

## 8. 评审检查清单

- [x] 需求范围明确（仅 CRUD，不含用户/权限/前端）
- [x] 技术栈与依赖锁定
- [x] 数据模型字段确认
- [x] API 端点与状态码定义
- [x] 错误处理与校验方案
- [ ] 用户确认设计文档
- [ ] 进入实施阶段（writing-plans）

---

## 附录 A：后续扩展方向（不在本期范围）

- 阅读状态追踪（未读/在读/已读）
- 藏书位置管理（书架编号）
- 借出归还记录
- 标签与分类体系
- 用户认证（Spring Security）
- 数据导出（CSV/Excel）
- 前端界面（Vue/React）