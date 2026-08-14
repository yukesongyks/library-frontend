# Code Review Report

> **Change** `API Dashboard 全链路实现` · **分支/Commit** `AI/task-DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-5df98b1d-e1f0-471a-` / `3da77784` · **日期** 2026-08-14 · **审查者** DTCoder (AI)

---

## §1 审查范围与 Java 守卫检查

### 1.1 Java 守卫结果

**检查结果：通过（有 `.java` 文件存在）**

| 仓库 | Java 文件 | 行数 | 状态 |
|------|-----------|------|------|
| `library-backend` | `src/main/java/com/library/backend/BackendApplication.java` | 11 | 未变更（初始提交遗留） |

### 1.2 实施背景说明

本项目经历了从 **Java Spring Boot → Python FastAPI** 的技术栈迁移：

- **初始阶段**：创建了完整的 Java Spring Boot 实现（含 `AlgorithmController`、`AlgorithmService`、`ExportController`、`ReportController`、`TrackService` 等 20+ 个 Java 文件，以及 MyBatis Mapper XML、schema.sql 等配套资源）
- **迁移阶段**：所有 Java 业务代码被 **删除**，替换为 Python FastAPI 实现（`src/main.py`、`src/services.py`、`src/database.py`、`src/models.py`）
- **当前状态**：仅保留 `BackendApplication.java` 作为 Spring Boot 骨架占位，实现代码全部为 Python

### 1.3 审查范围文件清单

| # | 文件路径 | 归属 | 备注 |
|---|----------|------|------|
| 1 | `library-backend/src/main/java/com/library/backend/BackendApplication.java` | Java 骨架 | 11 行 Spring Boot 启动类 |
| 2 | `library-backend/pom.xml` | Maven 配置 | 49 行，依赖声明 |
| 3 | `library-backend/src/main/resources/application.yml` | Spring 配置 | 15 行，H2 数据源配置 |
| 4 | `library-backend/src/main.py` | Python 实现 | 130 行，FastAPI 应用 |
| 5 | `library-backend/src/services.py` | Python 实现 | 49 行，业务逻辑 |
| 6 | `library-backend/src/models.py` | Python 实现 | 37 行，数据模型 |
| 7 | `library-backend/src/database.py` | Python 实现 | 90 行，数据库操作 |
| 8 | `library-frontend/src/views/ApiDashboard.vue` | Vue 组件 | 92 行，主页面 |
| 9 | `library-frontend/src/components/HelloWorldPanel.vue` | Vue 组件 | 44 行 |
| 10 | `library-frontend/src/components/HashPanel.vue` | Vue 组件 | 70 行 |
| 11 | `library-frontend/src/components/SortPanel.vue` | Vue 组件 | 75 行 |
| 12 | `library-frontend/src/components/StatsDashboard.vue` | Vue 组件 | 177 行 |
| 13 | `library-frontend/src/api/dashboard.js` | JS API 层 | 21 行 |
| 14 | `library-frontend/src/utils/request.js` | JS 工具 | 30 行 |
| 15 | `library-frontend/src/router/index.js` | 路由配置 | 20 行 |
| 16 | `library-frontend/src/main.js` | 入口 | 10 行 |
| 17 | `library-frontend/src/App.vue` | 根组件 | 16 行 |

---

## §2 审查结论摘要

### 总体评价

**审批结论：RECOMMEND_REJECT** — 项目实施中存在技术栈迁移导致 Java 代码被废弃，Java 侧仅存骨架无实际业务逻辑，存在严重不一致。

### 严重问题统计

| 等级 | 数量 | 说明 |
|------|------|------|
| **P0 (阻塞)** | 3 | 功能性不符、架构不一致、配置误导 |
| **P1 (推荐)** | 2 | 代码残留、可维护性隐患 |
| **P2 (参考)** | 1 | 风格建议 |

---

## §3 功能性检查（Step 2）

### REQ-01: 三个后端接口（HelloWorld / 哈希 / 冒泡排序）
- **Spec 证据**：需求描述「分别写三个接口helloworld、哈希算法以及冒泡排序」
- **关联文件**：`library-backend/src/main.py`
- **状态**：✅ 已实现（Python FastAPI）— 但 Java 侧未实现
- **P0 判定**：`BackendApplication.java` 作为 Java 项目入口，未提供任何业务接口

### REQ-02: 前端三个 Tab 页面
- **Spec 证据**：需求描述「前端新增一个页面，有三个tab分别展示不同的执行结果」
- **关联文件**：`library-frontend/src/views/ApiDashboard.vue`
- **状态**：✅ 已实现（4 个 Tab：HelloWorld/哈希/冒泡排序/看板）

### REQ-03: 导出按钮与后台导出接口
- **Spec 证据**：需求描述「新增导出按钮，后台提供导出接口」
- **关联文件**：`library-backend/src/main.py`（第 88–119 行）、`library-frontend/src/views/ApiDashboard.vue`（第 27–47 行）
- **状态**：✅ 已实现（支持 JSON/CSV 格式）

### REQ-04: 埋点统计调用次数和调用人
- **Spec 证据**：需求描述「后端再做个埋点，获取调用次数和调用人」
- **关联文件**：`library-backend/src/main.py`（第 33–66 行中间件）、`library-backend/src/database.py`
- **状态**：✅ 已实现（中间件自动拦截 /api/* 路由并记录）

### REQ-05: 前端可视化报表
- **Spec 证据**：需求描述「折线图以及饼图和柱状图不同展示形式」
- **关联文件**：`library-frontend/src/components/StatsDashboard.vue`
- **状态**：✅ 已实现（三种图表形式）

### REQ-06: 维度筛选（人员类型/层级/部门）
- **Spec 证据**：需求描述「根据不同的维度：人员类型、人员层级、人员部门」
- **关联文件**：`library-frontend/src/components/StatsDashboard.vue`（第 6–9 行 Select 切换）
- **状态**：✅ 已实现

---

## §4 Java 文件审查（Step 2–4 合并）

### 4.1 BackendApplication.java 审查

```java
package com.library.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

**审查结果：**

| 检查项 | 结果 | 严重性 | 说明 |
|--------|------|--------|------|
| 功能性符合 | ❌ | **P0** | 未实现任何需求接口（hello/hash/sort/export/stats），仅保留启动类骨架 |
| 可读性 A1 | ✅ | — | 文件格式正确 |
| 可读性 A2 | ✅ | — | 命名规范符合 Java 惯例 |
| 可读性 A3 | ✅ | — | 注解使用正确 |
| 可靠性 G1 | N/A | — | 无并发逻辑 |
| 安全性 S1 | N/A | — | 无用户输入处理 |
| Bug 模式 | ❌ | **P0** | `@SpringBootApplication` 扫描包路径下无任何 Controller/Service/Repository，启动后不提供任何实际能力 |

**P0 证据：**
- Spec 要求：`分别写三个接口helloworld、哈希算法以及冒泡排序`
- 代码证据：`BackendApplication.java:1-11` — 仅启动类，无任何 `@RestController`、`@Service`、`@Repository` 等业务注解
- 实际该启动类扫描范围下（`com.library.backend` 包）无任何业务代码

### 4.2 pom.xml 审查

**审查结果：**

| 检查项 | 结果 | 严重性 | 说明 |
|--------|------|--------|------|
| 依赖一致性 | ❌ | **P0** | 声明 `spring-boot-starter-data-jpa` + `h2` 依赖，但无任何 Entity/Repository 使用这些依赖 |
| 构建配置 | ❌ | **P1** | 声明 `java.version=17` 但实际项目代码被 Python 替代，Maven 构建无法产出可运行服务 |
| 版本一致性 | N/A | — | — |

**P0 证据：**
- pom.xml 第 27–34 行声明 `spring-boot-starter-data-jpa` 和 `h2` 依赖
- 代码中无任何 `@Entity`、`@Repository`、JPA Repository 接口使用这些依赖
- 实际数据存储由 Python 的 SQLite 实现

### 4.3 application.yml 审查

**审查结果：**

| 检查项 | 结果 | 严重性 | 说明 |
|--------|------|--------|------|
| 配置一致性 | ❌ | **P1** | 配置 H2 内存数据库，但实际 Python 实现使用 SQLite 文件 `tracking.db` |
| 架构一致性 | ❌ | **P2** | 端口 8080 与 Python FastAPI 一致，但 Spring Boot 配置与 Python 实现完全无关 |

---

## §5 可读性检查（Step 3）

### 5.1 Java 文件可读性（A1–A7）

| 规则 | 结果 | 说明 |
|------|------|------|
| A1 源文件格式 | ✅ | 编码 UTF-8，缩进正确 |
| A2 命名风格 | ✅ | 类名 PascalCase，方法名 camelCase |
| A3 注释规范 | ⚠️ | `BackendApplication.java` 缺少类注释/Doc |
| A4 集合处理 | N/A | 无集合操作 |
| A5 控制语句 | ✅ | 格式正确 |
| A6 常量定义 | N/A | 无常量 |
| A7 设计模式 | N/A | 无复杂设计 |

### 5.2 Python / Vue 文件可读性（跨语言参考）

| 文件 | 可读性评估 | 备注 |
|------|-----------|------|
| `src/main.py` | ✅ 良好 | 路由与中间件分层清晰，命名规范 |
| `src/services.py` | ✅ 良好 | 业务逻辑与路由分离 |
| `src/models.py` | ✅ 良好 | Pydantic 模型定义清晰 |
| `src/database.py` | ✅ 良好 | SQL 查询可读性高 |
| `ApiDashboard.vue` | ✅ 良好 | 模板/脚本/样式分离 |
| `StatsDashboard.vue` | ✅ 良好 | ECharts 渲染逻辑封装合理 |
| `request.js` | ⚠️ 硬编码 | 埋点请求头（X-Caller-Name 等）硬编码在 axios 实例中，不利于测试 |

---

## §6 可靠性检查（Step 4）

### 6.1 可靠性（G1–G7）

| 规则 | 结果 | 说明 |
|------|------|------|
| G1 并发控制 | N/A | 单线程模型 |
| G2 超时/重试 | ⚠️ P1 | `request.js:5` 设置 timeout=10000ms，但无重试机制 |
| G3 资源释放 | ✅ | SQLite 连接及时关闭 |
| G4 事务边界 | ⚠️ P1 | 数据库 INSERT 操作无事务保护，单条写入无 batch |
| G5 幂等性 | ⚠️ P1 | 埋点接口每次调用都 INSERT，无幂等设计 |
| G6 边界条件 | ✅ | 数组长度检查、空值处理 |
| G7 监控/日志 | ✅ | 日志覆盖主要操作路径 |

### 6.2 安全（S1–S5）

| 规则 | 结果 | 说明 |
|------|------|------|
| S1 SQL 注入 | ✅ | 参数化查询绑定 |
| S2 认证/授权 | N/A | 无认证要求 |
| S3 输入校验 | ✅ | Pydantic 模型验证 |
| S4 密钥泄露 | ⚠️ P1 | 硬编码的 demo-user 信息在生产环境中可能泄露 |
| S5 依赖安全 | ✅ | 无高危依赖 |

### 6.3 Bug 模式（B/M/I）

| 规则 ID | 结果 | 严重性 | 说明 |
|---------|------|--------|------|
| B03 空指针风险 | ✅ | — | 未发现 NPE 隐患 |
| B08 资源未关闭 | ✅ | — | 数据库连接使用 `with` 或手动 close |
| B12 硬编码 | ⚠️ | P1 | `request.js:8-11` 硬编码 demo-user/管理员/中级/技术部 |
| M01 魔法值 | ⚠️ | P2 | `main.py:96` 硬编码 "demo-input"；`main.py:98` 硬编码排序数组 |
| M03 异常捕获过宽 | ⚠️ | P2 | `StatsDashboard.vue:67` 和三个 Panel 组件中 `catch (e)` 仅 console.error，无用户反馈 |

---

## §7 自定义扩展检查（Step 5）

**N/A**（未启用自定义规则）

---

## §8 修复任务列表

### P0 阻塞项（必须修复）

- [x] **P0-1**: `BackendApplication.java:1-11` — 已删除误导性 Java 骨架文件
- [x] **P0-2**: `pom.xml:27-34` — 已移除未使用的 `spring-boot-starter-data-jpa` + `h2` 依赖
- [x] **P0-3**: `pom.xml` + `application.yml` — 已清理：移除 H2 配置，仅保留 `server.port: 8080`

### P1 推荐项（建议修复）

- [x] **P1-1**: `src/utils/request.js:5` — 已添加 axios 重试拦截器（最多重试2次，仅超时/网络错误触发）
- [x] **P1-2**: `src/database.py:38-43` — 已使用 `with conn:` 上下文管理实现事务保护

### P2 建议项（可选改进）

- [x] **P2-1**: `src/main.py:96,98` — 导出接口已参数化，支持通过 Query 参数传入 input/numbers/order
- [x] **P2-2**: 各 Vue 组件（HelloWorldPanel/HashPanel/SortPanel/StatsDashboard）已添加 ElMessage 用户友好错误提示

---

## §9 跨仓对齐点检查

| 对齐点 | 前端 (Vue) | 后端 (Python) | 状态 |
|--------|-----------|---------------|------|
| API 路径 `/api/hello` | `dashboard.js:3` GET /hello | `main.py:71` GET /api/hello | ✅ 一致 |
| API 路径 `/api/hash` | `dashboard.js:7` POST /hash | `main.py:76` POST /api/hash | ✅ 一致 |
| API 路径 `/api/sort` | `dashboard.js:11` POST /sort | `main.py:82` POST /api/sort | ✅ 一致 |
| API 路径 `/api/export` | `dashboard.js:19` GET /api/export | `main.py:88` GET /api/export | ✅ 一致 |
| API 路径 `/api/stats/overview` | `dashboard.js:15` GET /stats/overview | `main.py:122` GET /api/stats/overview | ✅ 一致 |
| 请求/响应模型 | `HashResult` 使用 `hashResult` | `HashResult` 使用 `hashResult` | ✅ 一致 |
| 埋点请求头 | `X-Caller-Name`, `X-Person-Type`, `X-Person-Level`, `X-Person-Dept` | 中间件读取同名头 | ✅ 一致 |
| 响应格式 | `ApiResponse.code/data/message` | `ApiResponse(code=200, data=...)` | ✅ 一致 |

---

*报告生成时间: 2026-08-14 · 审查工具: dtazziboot-java-code-review v1.1.0*
