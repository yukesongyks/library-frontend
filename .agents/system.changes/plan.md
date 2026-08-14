# 成本统计报表系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建企业成本统计报表系统，支持多维度成本统计、Dashboard 可视化、数据录入/导入/导出及 RBAC 权限控制。

**Architecture:** 前后端分离 + 微服务架构。前端 React SPA 通过 API Gateway 访问后端 4 个微服务（auth-service / base-data-service / cost-core-service / report-service），JWT 鉴权，MySQL 持久化。

**Tech Stack:**
- 前端: React 18 + TypeScript + Vite + Ant Design 5 + ECharts 5 + Zustand + React Router 6 + Axios
- 后端: Java 17 + Spring Boot 3.2 + Spring Cloud Gateway + MyBatis-Plus + MySQL 8 + EasyExcel + JWT
- 构建: Maven (后端) + pnpm (前端)

**跨库仓库:**
- `library-frontend` — 前端 React 应用
- `library-backend` — 后端 Maven 多模块项目（含 gateway + 4 微服务 + common）

---

## Global Constraints

- Java 版本 ≥ 17，Spring Boot 3.2.x
- Node.js ≥ 18，pnpm 作为包管理器
- 所有 API 响应统一格式 `{ code, message, data, timestamp }`
- 分页响应 `{ list, total, pageNum, pageSize }`
- JWT Token 有效期 24h，Refresh Token 7d
- 数据库表名小写下划线，字段名小写下划线
- 前端路由使用 React Router v6，页面组件使用函数组件 + Hooks
- 所有接口需添加 Swagger 注解
- 成本金额使用 `DECIMAL(15,2)`，前端使用 `number` 并保留两位小数
- RBAC 三角色：admin / dept_manager / viewer
- 导出格式仅 Excel (.xlsx)，使用 EasyExcel

---

## File Structure

### library-backend（后端）

```
library-backend-main/
├── pom.xml                                    # 父 POM，管理依赖版本
├── common/                                    # 公共模块
│   ├── pom.xml
│   └── src/main/java/com/library/common/
│       ├── response/Result.java               # 统一响应封装
│       ├── response/PageResult.java           # 分页响应封装
│       ├── exception/BusinessException.java   # 业务异常
│       ├── exception/GlobalExceptionHandler.java
│       ├── config/MyBatisPlusConfig.java      # MyBatis-Plus 配置
│       ├── config/CorsConfig.java             # 跨域配置
│       ├── util/JwtUtil.java                  # JWT 工具类
│       └── constant/RoleConstants.java        # 角色常量
├── gateway/                                   # API Gateway
│   ├── pom.xml
│   └── src/main/java/com/library/gateway/
│       ├── GatewayApplication.java
│       ├── config/RouteConfig.java            # 路由配置
│       └── filter/JwtAuthGlobalFilter.java    # JWT 鉴权过滤器
├── auth-service/                              # 认证授权服务 (8081)
│   ├── pom.xml
│   └── src/main/java/com/library/auth/
│       ├── AuthApplication.java
│       ├── controller/AuthController.java
│       ├── controller/UserController.java
│       ├── controller/RoleController.java
│       ├── service/AuthService.java
│       ├── service/UserService.java
│       ├── service/RoleService.java
│       ├── mapper/UserMapper.java
│       ├── mapper/RoleMapper.java
│       ├── mapper/UserRoleMapper.java
│       ├── mapper/PermissionMapper.java
│       ├── mapper/RolePermissionMapper.java
│       ├── entity/User.java
│       ├── entity/Role.java
│       ├── entity/UserRole.java
│       ├── entity/Permission.java
│       ├── entity/RolePermission.java
│       └── dto/LoginRequest.java / LoginResponse.java / UserDTO.java / RoleDTO.java
├── base-data-service/                         # 基础数据服务 (8082)
│   ├── pom.xml
│   └── src/main/java/com/library/basedata/
│       ├── BaseDataApplication.java
│       ├── controller/DepartmentController.java
│       ├── controller/ProjectController.java
│       ├── controller/BusinessLineController.java
│       ├── controller/EmployeeController.java
│       ├── service/ + mapper/ + entity/ + dto/
├── cost-core-service/                         # 成本数据服务 (8083)
│   ├── pom.xml
│   └── src/main/java/com/library/cost/
│       ├── CostCoreApplication.java
│       ├── controller/CostEntryController.java
│       ├── controller/CostImportController.java
│       ├── controller/CostRecordController.java
│       ├── service/CostEntryService.java
│       ├── service/CostImportService.java
│       ├── mapper/CostRecordMapper.java
│       ├── entity/CostRecord.java
│       └── dto/CostEntryRequest.java / ImportResultDTO.java
├── report-service/                            # 报表统计服务 (8084)
│   ├── pom.xml
│   └── src/main/java/com/library/report/
│       ├── ReportApplication.java
│       ├── controller/DashboardController.java
│       ├── controller/AnalysisController.java
│       ├── controller/ExportController.java
│       ├── service/DashboardService.java
│       ├── service/AnalysisService.java
│       ├── service/ExportService.java
│       ├── mapper/ReportMapper.java
│       ├── dto/DashboardDTO.java / AnalysisQuery.java / ExportRequest.java
│       └── feign/BaseDataClient.java          # Feign 调用 base-data-service
└── sql/
    └── init.sql                               # 数据库初始化脚本
```

### library-frontend（前端）

```
library-frontend-main/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
└── src/
    ├── main.tsx                               # 入口
    ├── App.tsx                                # 路由配置
    ├── api/                                   # API 请求封装
    │   ├── request.ts                         # Axios 实例 + 拦截器
    │   ├── auth.ts
    │   ├── baseData.ts
    │   ├── cost.ts
    │   └── report.ts
    ├── types/                                 # TypeScript 类型
    │   ├── api.ts                             # 通用响应类型
    │   ├── auth.ts
    │   ├── baseData.ts
    │   ├── cost.ts
    │   └── report.ts
    ├── store/                                 # Zustand 状态管理
    │   ├── useAuthStore.ts
    │   └── useFilterStore.ts
    ├── layouts/
    │   └── MainLayout.tsx                     # 侧边栏 + 顶栏布局
    ├── components/                            # 通用组件
    │   ├── Charts/LineChart.tsx
    │   ├── Charts/PieChart.tsx
    │   ├── Charts/BarChart.tsx
    │   ├── StatCard/index.tsx
    │   ├── FilterBar/index.tsx
    │   ├── ExportButton/index.tsx
    │   └── AuthRoute/index.tsx
    ├── pages/
    │   ├── Login/index.tsx
    │   ├── Dashboard/index.tsx
    │   ├── CostAnalysis/index.tsx
    │   ├── LaborCost/index.tsx
    │   ├── ProjectCost/index.tsx
    │   ├── DataEntry/index.tsx
    │   ├── DataImport/index.tsx
    │   ├── ReportExport/index.tsx
    │   └── System/
    │       ├── UserManage/index.tsx
    │       └── RoleManage/index.tsx
    └── utils/
        ├── format.ts                          # 金额/日期格式化
        └── constants.ts                       # 常量定义
```

---

## Task 1: 后端项目脚手架搭建 + 数据库初始化

**Files:**
- Create: `library-backend-main/pom.xml`
- Create: `library-backend-main/common/pom.xml`
- Create: `library-backend-main/common/src/main/java/com/library/common/response/Result.java`
- Create: `library-backend-main/common/src/main/java/com/library/common/response/PageResult.java`
- Create: `library-backend-main/common/src/main/java/com/library/common/exception/BusinessException.java`
- Create: `library-backend-main/common/src/main/java/com/library/common/exception/GlobalExceptionHandler.java`
- Create: `library-backend-main/common/src/main/java/com/library/common/config/MyBatisPlusConfig.java`
- Create: `library-backend-main/common/src/main/java/com/library/common/util/JwtUtil.java`
- Create: `library-backend-main/common/src/main/java/com/library/common/constant/RoleConstants.java`
- Create: `library-backend-main/sql/init.sql`

**Interfaces:**
- Produces: `Result<T>` — 统一响应 `{code, message, data, timestamp}`，静态方法 `success(data)` / `fail(code, msg)`
- Produces: `PageResult<T>` — 分页响应 `{list, total, pageNum, pageSize}`
- Produces: `BusinessException` — 业务异常，含 `code` + `message`
- Produces: `JwtUtil` — `generateToken(userId, username, roles)`, `parseToken(token)`, `isTokenExpired(token)`
- Produces: `RoleConstants` — `ROLE_ADMIN`, `ROLE_DEPT_MANAGER`, `ROLE_VIEWER`

- [ ] **Step 1: 创建父 POM**

```xml
<!-- library-backend-main/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
    </parent>
    <groupId>com.library</groupId>
    <artifactId>library-backend</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>
    <modules>
        <module>common</module>
        <module>gateway</module>
        <module>auth-service</module>
        <module>base-data-service</module>
        <module>cost-core-service</module>
        <module>report-service</module>
    </modules>
    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.6</mybatis-plus.version>
        <jjwt.version>0.12.5</jjwt.version>
        <easyexcel.version>3.3.4</easyexcel.version>
        <spring-cloud.version>2023.0.1</spring-cloud.version>
    </properties>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>com.baomidou</groupId>
                <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
                <version>${mybatis-plus.version}</version>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-api</artifactId>
                <version>${jjwt.version}</version>
            </dependency>
            <dependency>
                <groupId>com.alibaba</groupId>
                <artifactId>easyexcel</artifactId>
                <version>${easyexcel.version}</version>
            </dependency>
            <dependency>
                <groupId>com.library</groupId>
                <artifactId>common</artifactId>
                <version>${project.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

- [ ] **Step 2: 创建 common 模块 POM**

```xml
<!-- library-backend-main/common/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.library</groupId>
        <artifactId>library-backend</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>common</artifactId>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 3: 创建 Result.java 统一响应**

```java
package com.library.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.io.Serializable;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> implements Serializable {
    private int code;
    private String message;
    private T data;
    private long timestamp;

    public Result() { this.timestamp = System.currentTimeMillis(); }

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.code = 200; r.message = "success"; r.data = data;
        return r;
    }

    public static <T> Result<T> fail(int code, String message) {
        Result<T> r = new Result<>();
        r.code = code; r.message = message;
        return r;
    }

    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
```

- [ ] **Step 4: 创建 PageResult.java**

```java
package com.library.common.response;

import java.util.List;

public class PageResult<T> {
    private List<T> list;
    private long total;
    private int pageNum;
    private int pageSize;

    public PageResult(List<T> list, long total, int pageNum, int pageSize) {
        this.list = list; this.total = total;
        this.pageNum = pageNum; this.pageSize = pageSize;
    }

    public List<T> getList() { return list; }
    public long getTotal() { return total; }
    public int getPageNum() { return pageNum; }
    public int getPageSize() { return pageSize; }
}
```

- [ ] **Step 5: 创建 BusinessException + GlobalExceptionHandler**

```java
package com.library.common.exception;

public class BusinessException extends RuntimeException {
    private final int code;
    public BusinessException(int code, String message) {
        super(message); this.code = code;
    }
    public int getCode() { return code; }
}
```

```java
package com.library.common.exception;

import com.library.common.response.Result;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusiness(BusinessException e) {
        return Result.fail(e.getCode(), e.getMessage());
    }
    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e) {
        return Result.fail(500, "服务器内部错误: " + e.getMessage());
    }
}
```

- [ ] **Step 6: 创建 JwtUtil.java**

```java
package com.library.common.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class JwtUtil {
    private static final String SECRET = "cost-report-system-jwt-secret-key-must-be-at-least-256-bits";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    private static final long EXPIRE_MS = 24 * 60 * 60 * 1000L;

    public static String generateToken(Long userId, String username, List<String> roles) {
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("roles", roles)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRE_MS))
                .signWith(KEY)
                .compact();
    }

    public static Claims parseToken(String token) {
        return Jwts.parser().verifyWith(KEY).build()
                .parseSignedClaims(token).getPayload();
    }

    public static boolean isTokenExpired(String token) {
        try {
            return parseToken(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}
```

- [ ] **Step 7: 创建 RoleConstants.java**

```java
package com.library.common.constant;

public final class RoleConstants {
    public static final String ROLE_ADMIN = "admin";
    public static final String ROLE_DEPT_MANAGER = "dept_manager";
    public static final String ROLE_VIEWER = "viewer";
    public static final String DATA_SCOPE_ALL = "all";
    public static final String DATA_SCOPE_DEPT = "dept";
    public static final String DATA_SCOPE_SELF = "self";
    private RoleConstants() {}
}
```

- [ ] **Step 8: 创建 MyBatisPlusConfig.java**

```java
package com.library.common.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MyBatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

- [ ] **Step 9: 创建数据库初始化脚本 sql/init.sql**

```sql
CREATE DATABASE IF NOT EXISTS cost_report DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cost_report;

CREATE TABLE department (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    parent_id BIGINT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE business_line (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(500),
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    dept_id BIGINT,
    biz_line_id BIGINT,
    start_date DATE,
    end_date DATE,
    status TINYINT DEFAULT 1 COMMENT '1-进行中 2-已完成 0-已关闭',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_project_dept (dept_id),
    INDEX idx_project_biz (biz_line_id)
) ENGINE=InnoDB;

CREATE TABLE employee (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    emp_no VARCHAR(50) UNIQUE NOT NULL,
    dept_id BIGINT,
    role_type VARCHAR(20) COMMENT 'dev/test/product/ops',
    salary DECIMAL(12,2),
    entry_date DATE,
    status TINYINT DEFAULT 1 COMMENT '1-在职 0-离职',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee_dept (dept_id)
) ENGINE=InnoDB;

CREATE TABLE cost_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dept_id BIGINT,
    project_id BIGINT,
    biz_line_id BIGINT,
    employee_id BIGINT,
    role_type VARCHAR(20),
    cost_type VARCHAR(30) COMMENT 'labor/infra/license/travel/other',
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
    source VARCHAR(20) COMMENT 'manual/import/api',
    remark VARCHAR(500),
    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cost_dept_period (dept_id, period),
    INDEX idx_cost_project_period (project_id, period),
    INDEX idx_cost_biz_period (biz_line_id, period),
    INDEX idx_cost_emp_period (employee_id, period),
    INDEX idx_cost_type_period (cost_type, period),
    UNIQUE KEY uk_cost_dedup (dept_id, project_id, employee_id, period, cost_type)
) ENGINE=InnoDB;

CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    name VARCHAR(50),
    dept_id BIGINT,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE sys_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200),
    data_scope VARCHAR(20) DEFAULT 'all',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE sys_user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB;

CREATE TABLE sys_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) COMMENT 'menu/button/api',
    parent_id BIGINT DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE sys_role_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    UNIQUE KEY uk_role_perm (role_id, permission_id)
) ENGINE=InnoDB;

INSERT INTO sys_role (name, code, description, data_scope) VALUES
('系统管理员', 'admin', '拥有所有权限', 'all'),
('部门经理', 'dept_manager', '管理本部门数据', 'dept'),
('普通查看者', 'viewer', '仅查看本人数据', 'self');

INSERT INTO sys_permission (name, code, type, parent_id) VALUES
('Dashboard', 'dashboard:view', 'menu', 0),
('成本分析', 'cost:analysis:view', 'menu', 0),
('人力成本', 'cost:labor:view', 'menu', 0),
('项目成本', 'cost:project:view', 'menu', 0),
('数据录入', 'cost:entry:create', 'button', 0),
('数据导入', 'cost:import:create', 'button', 0),
('报表导出', 'report:export', 'button', 0),
('基础数据管理', 'base:manage', 'menu', 0),
('用户管理', 'system:user:manage', 'menu', 0),
('角色管理', 'system:role:manage', 'menu', 0);

INSERT INTO sys_user (username, password, name, dept_id, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', NULL, 1);

INSERT INTO sys_user_role (user_id, role_id) VALUES (1, 1);
```

- [ ] **Step 10: 验证 common 模块编译**

Run: `cd library-backend-main && mvn compile -pl common -am`
Expected: BUILD SUCCESS

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: init backend project scaffold with common module and database schema"
```

---

## Task 2: API Gateway 搭建

**Files:**
- Create: `library-backend-main/gateway/pom.xml`
- Create: `library-backend-main/gateway/src/main/java/com/library/gateway/GatewayApplication.java`
- Create: `library-backend-main/gateway/src/main/java/com/library/gateway/config/RouteConfig.java`
- Create: `library-backend-main/gateway/src/main/java/com/library/gateway/filter/JwtAuthGlobalFilter.java`
- Create: `library-backend-main/gateway/src/main/resources/application.yml`

**Interfaces:**
- Consumes: `JwtUtil.parseToken()` / `JwtUtil.isTokenExpired()` from common
- Produces: Gateway 路由转发至 4 个微服务，JWT 鉴权过滤器

- [ ] **Step 1: 创建 gateway/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.library</groupId>
        <artifactId>library-backend</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>gateway</artifactId>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        <dependency>
            <groupId>com.library</groupId>
            <artifactId>common</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 GatewayApplication.java**

```java
package com.library.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
```

- [ ] **Step 3: 创建 application.yml 路由配置**

```yaml
server:
  port: 8080

spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: http://localhost:8081
          predicates:
            - Path=/api/auth/**
        - id: base-data-service
          uri: http://localhost:8082
          predicates:
            - Path=/api/base/**
        - id: cost-core-service
          uri: http://localhost:8083
          predicates:
            - Path=/api/cost/**
        - id: report-service
          uri: http://localhost:8084
          predicates:
            - Path=/api/report/**
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: "http://localhost:5173"
            allowedMethods: "*"
            allowedHeaders: "*"
            allowCredentials: true
```

- [ ] **Step 4: 创建 JwtAuthGlobalFilter.java**

```java
package com.library.gateway.filter;

import com.library.common.util.JwtUtil;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class JwtAuthGlobalFilter implements GlobalFilter, Ordered {

    private static final List<String> WHITE_LIST = List.of(
            "/api/auth/login", "/api/auth/logout"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (WHITE_LIST.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        if (JwtUtil.isTokenExpired(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // 将用户信息传递到下游服务
        var claims = JwtUtil.parseToken(token);
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header("X-User-Id", claims.get("userId").toString())
                .header("X-Username", claims.getSubject())
                .header("X-Roles", claims.get("roles").toString())
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() { return -100; }
}
```

- [ ] **Step 5: 验证 Gateway 编译**

Run: `cd library-backend-main && mvn compile -pl gateway -am`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add API Gateway with JWT auth filter and route config"
```

---

## Task 3: Auth Service 搭建（认证授权服务）

**Files:**
- Create: `library-backend-main/auth-service/pom.xml`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/AuthApplication.java`
- Create: `library-backend-main/auth-service/src/main/resources/application.yml`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/entity/User.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/entity/Role.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/entity/UserRole.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/entity/Permission.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/entity/RolePermission.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/mapper/UserMapper.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/mapper/RoleMapper.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/mapper/UserRoleMapper.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/mapper/PermissionMapper.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/mapper/RolePermissionMapper.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/dto/LoginRequest.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/dto/LoginResponse.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/dto/UserDTO.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/service/AuthService.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/service/UserService.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/service/RoleService.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/controller/AuthController.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/controller/UserController.java`
- Create: `library-backend-main/auth-service/src/main/java/com/library/auth/controller/RoleController.java`

**Interfaces:**
- Consumes: `Result<T>`, `JwtUtil`, `BusinessException` from common
- Produces: `POST /api/auth/login` → `LoginResponse { token, username, roles }`
- Produces: `GET /api/auth/users` → `Result<List<UserDTO>>`
- Produces: `POST /api/auth/users` → `Result<UserDTO>`
- Produces: `GET /api/auth/roles` → `Result<List<Role>>`

- [ ] **Step 1: 创建 auth-service/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.library</groupId>
        <artifactId>library-backend</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>auth-service</artifactId>
    <dependencies>
        <dependency>
            <groupId>com.library</groupId>
            <artifactId>common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-crypto</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 application.yml**

```yaml
server:
  port: 8081
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/cost_report?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
```

- [ ] **Step 3: 创建 Entity 类**

```java
// User.java
package com.library.auth.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("sys_user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String name;
    private Long deptId;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    // getters and setters omitted for brevity
}
```

```java
// Role.java
package com.library.auth.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("sys_role")
public class Role {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private String description;
    private String dataScope;
    private LocalDateTime createdAt;
    // getters and setters omitted for brevity
}
```

```java
// UserRole.java
package com.library.auth.entity;

import com.baomidou.mybatisplus.annotation.*;

@TableName("sys_user_role")
public class UserRole {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long roleId;
}
```

```java
// Permission.java
package com.library.auth.entity;

import com.baomidou.mybatisplus.annotation.*;

@TableName("sys_permission")
public class Permission {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private String type;
    private Long parentId;
}
```

```java
// RolePermission.java
package com.library.auth.entity;

import com.baomidou.mybatisplus.annotation.*;

@TableName("sys_role_permission")
public class RolePermission {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long roleId;
    private Long permissionId;
}
```

- [ ] **Step 4: 创建 Mapper 接口**

```java
// UserMapper.java
package com.library.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.auth.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {}
```

```java
// RoleMapper.java, UserRoleMapper.java, PermissionMapper.java, RolePermissionMapper.java
// 同上模式，继承 BaseMapper<对应Entity>
```

- [ ] **Step 5: 创建 DTO**

```java
// LoginRequest.java
package com.library.auth.dto;

public class LoginRequest {
    private String username;
    private String password;
    // getters and setters
}
```

```java
// LoginResponse.java
package com.library.auth.dto;

import java.util.List;

public class LoginResponse {
    private String token;
    private String username;
    private String name;
    private List<String> roles;
    // constructor, getters
}
```

```java
// UserDTO.java
package com.library.auth.dto;

import java.util.List;

public class UserDTO {
    private Long id;
    private String username;
    private String name;
    private Long deptId;
    private Integer status;
    private List<String> roles;
    // getters and setters
}
```

- [ ] **Step 6: 创建 AuthService**

```java
package com.library.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.auth.dto.*;
import com.library.auth.entity.*;
import com.library.auth.mapper.*;
import com.library.common.exception.BusinessException;
import com.library.common.util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {
    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserMapper userMapper, UserRoleMapper userRoleMapper, RoleMapper roleMapper) {
        this.userMapper = userMapper;
        this.userRoleMapper = userRoleMapper;
        this.roleMapper = roleMapper;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername()));
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }
        if (user.getStatus() != 1) {
            throw new BusinessException(403, "账号已被禁用");
        }

        List<UserRole> userRoles = userRoleMapper.selectList(
                new LambdaQueryWrapper<UserRole>().eq(UserRole::getUserId, user.getId()));
        List<String> roleCodes = userRoles.stream()
                .map(ur -> roleMapper.selectById(ur.getRoleId()).getCode())
                .collect(Collectors.toList());

        String token = JwtUtil.generateToken(user.getId(), user.getUsername(), roleCodes);
        return new LoginResponse(token, user.getUsername(), user.getName(), roleCodes);
    }
}
```

- [ ] **Step 7: 创建 UserService + RoleService**

```java
package com.library.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.auth.dto.UserDTO;
import com.library.auth.entity.*;
import com.library.auth.mapper.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserMapper userMapper, UserRoleMapper userRoleMapper, RoleMapper roleMapper) {
        this.userMapper = userMapper;
        this.userRoleMapper = userRoleMapper;
        this.roleMapper = roleMapper;
    }

    public List<UserDTO> listUsers() {
        List<User> users = userMapper.selectList(null);
        return users.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public UserDTO createUser(UserDTO dto, String rawPassword) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setName(dto.getName());
        user.setDeptId(dto.getDeptId());
        user.setStatus(1);
        userMapper.insert(user);
        // 分配角色
        if (dto.getRoles() != null) {
            for (String roleCode : dto.getRoles()) {
                Role role = roleMapper.selectOne(
                        new LambdaQueryWrapper<Role>().eq(Role::getCode, roleCode));
                if (role != null) {
                    UserRole ur = new UserRole();
                    ur.setUserId(user.getId());
                    ur.setRoleId(role.getId());
                    userRoleMapper.insert(ur);
                }
            }
        }
        return toDTO(user);
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setName(user.getName());
        dto.setDeptId(user.getDeptId());
        dto.setStatus(user.getStatus());
        List<UserRole> urs = userRoleMapper.selectList(
                new LambdaQueryWrapper<UserRole>().eq(UserRole::getUserId, user.getId()));
        dto.setRoles(urs.stream()
                .map(ur -> roleMapper.selectById(ur.getRoleId()).getCode())
                .collect(Collectors.toList()));
        return dto;
    }
}
```

- [ ] **Step 8: 创建 Controller**

```java
// AuthController.java
package com.library.auth.controller;

import com.library.auth.dto.*;
import com.library.auth.service.AuthService;
import com.library.common.response.Result;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody LoginRequest request) {
        return Result.success(authService.login(request));
    }
}
```

```java
// UserController.java
package com.library.auth.controller;

import com.library.auth.dto.UserDTO;
import com.library.auth.service.UserService;
import com.library.common.response.Result;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public Result<List<UserDTO>> list() {
        return Result.success(userService.listUsers());
    }

    @PostMapping
    public Result<UserDTO> create(@RequestBody Map<String, Object> body) {
        UserDTO dto = new UserDTO();
        dto.setUsername((String) body.get("username"));
        dto.setName((String) body.get("name"));
        String password = (String) body.get("password");
        return Result.success(userService.createUser(dto, password));
    }
}
```

- [ ] **Step 9: 创建 AuthApplication.java**

```java
package com.library.auth;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@MapperScan("com.library.auth.mapper")
@ComponentScan(basePackages = {"com.library.auth", "com.library.common"})
public class AuthApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}
```

- [ ] **Step 10: 验证编译**

Run: `cd library-backend-main && mvn compile -pl auth-service -am`
Expected: BUILD SUCCESS

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add auth-service with login, user CRUD, and RBAC"
```

---

## Task 4: Base Data Service（基础数据服务）

**Files:**
- Create: `library-backend-main/base-data-service/pom.xml`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/BaseDataApplication.java`
- Create: `library-backend-main/base-data-service/src/main/resources/application.yml`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/entity/Department.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/entity/Project.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/entity/BusinessLine.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/entity/Employee.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/mapper/DepartmentMapper.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/mapper/ProjectMapper.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/mapper/BusinessLineMapper.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/mapper/EmployeeMapper.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/service/DepartmentService.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/service/ProjectService.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/service/BusinessLineService.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/service/EmployeeService.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/controller/DepartmentController.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/controller/ProjectController.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/controller/BusinessLineController.java`
- Create: `library-backend-main/base-data-service/src/main/java/com/library/basedata/controller/EmployeeController.java`

**Interfaces:**
- Consumes: `Result<T>`, `PageResult<T>`, `BusinessException` from common
- Produces: `GET /api/base/departments` → 部门列表（支持 `?tree=true` 树形返回）
- Produces: `POST /api/base/departments` → 创建部门
- Produces: `GET /api/base/projects` → 项目列表（分页 `pageNum`, `pageSize`）
- Produces: `GET /api/base/business-lines` → 业务线列表
- Produces: `GET /api/base/employees` → 人员列表（支持 `?deptId=X&roleType=Y` 筛选）

- [ ] **Step 1: 创建 base-data-service/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.library</groupId>
        <artifactId>library-backend</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>base-data-service</artifactId>
    <dependencies>
        <dependency>
            <groupId>com.library</groupId>
            <artifactId>common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 application.yml**

```yaml
server:
  port: 8082
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/cost_report?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
```

- [ ] **Step 3: 创建 Entity 类**

```java
// Department.java
package com.library.basedata.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("department")
public class Department {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private Long parentId;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    // getters and setters
}
```

```java
// Project.java
package com.library.basedata.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@TableName("project")
public class Project {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private BigDecimal budget;
    private Long deptId;
    private Long bizLineId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    // getters and setters
}
```

```java
// BusinessLine.java
package com.library.basedata.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("business_line")
public class BusinessLine {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private String description;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    // getters and setters
}
```

```java
// Employee.java
package com.library.basedata.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@TableName("employee")
public class Employee {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String empNo;
    private Long deptId;
    private String roleType;
    private BigDecimal salary;
    private LocalDate entryDate;
    private Integer status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    // getters and setters
}
```

- [ ] **Step 4: 创建 Mapper 接口**

```java
// DepartmentMapper.java
package com.library.basedata.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.basedata.entity.Department;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DepartmentMapper extends BaseMapper<Department> {}
```

```java
// ProjectMapper.java, BusinessLineMapper.java, EmployeeMapper.java
// 同上模式，继承 BaseMapper<对应Entity>
```

- [ ] **Step 5: 创建 DepartmentService（含树形构建）**

```java
package com.library.basedata.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.basedata.entity.Department;
import com.library.basedata.mapper.DepartmentMapper;
import com.library.common.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DepartmentService {
    private final DepartmentMapper departmentMapper;

    public DepartmentService(DepartmentMapper departmentMapper) {
        this.departmentMapper = departmentMapper;
    }

    public List<Department> listAll() {
        return departmentMapper.selectList(
                new LambdaQueryWrapper<Department>().eq(Department::getStatus, 1));
    }

    public List<Map<String, Object>> listTree() {
        List<Department> all = listAll();
        Map<Long, Map<String, Object>> map = new LinkedHashMap<>();
        for (Department d : all) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", d.getId());
            node.put("name", d.getName());
            node.put("code", d.getCode());
            node.put("parentId", d.getParentId());
            node.put("children", new ArrayList<>());
            map.put(d.getId(), node);
        }
        List<Map<String, Object>> roots = new ArrayList<>();
        for (Department d : all) {
            Map<String, Object> node = map.get(d.getId());
            if (d.getParentId() == null || d.getParentId() == 0) {
                roots.add(node);
            } else {
                Map<String, Object> parent = map.get(d.getParentId());
                if (parent != null) {
                    ((List<Map<String, Object>>) parent.get("children")).add(node);
                } else {
                    roots.add(node);
                }
            }
        }
        return roots;
    }

    public Department create(Department dept) {
        Department existing = departmentMapper.selectOne(
                new LambdaQueryWrapper<Department>().eq(Department::getCode, dept.getCode()));
        if (existing != null) {
            throw new BusinessException(400, "部门编码已存在: " + dept.getCode());
        }
        dept.setStatus(1);
        departmentMapper.insert(dept);
        return dept;
    }

    public Department update(Long id, Department dept) {
        dept.setId(id);
        departmentMapper.updateById(dept);
        return dept;
    }

    public void delete(Long id) {
        long childCount = departmentMapper.selectCount(
                new LambdaQueryWrapper<Department>().eq(Department::getParentId, id));
        if (childCount > 0) {
            throw new BusinessException(400, "存在子部门，无法删除");
        }
        departmentMapper.deleteById(id);
    }
}
```

- [ ] **Step 6: 创建 ProjectService / BusinessLineService / EmployeeService**

```java
// ProjectService.java — 标准 CRUD + 分页
package com.library.basedata.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.basedata.entity.Project;
import com.library.basedata.mapper.ProjectMapper;
import com.library.common.response.PageResult;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {
    private final ProjectMapper projectMapper;

    public ProjectService(ProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
    }

    public PageResult<Project> list(int pageNum, int pageSize, Long deptId) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        if (deptId != null) wrapper.eq(Project::getDeptId, deptId);
        wrapper.orderByDesc(Project::getCreatedAt);
        Page<Project> page = projectMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
        return new PageResult<>(page.getRecords(), page.getTotal(), pageNum, pageSize);
    }

    public Project create(Project project) {
        projectMapper.insert(project);
        return project;
    }

    public Project update(Long id, Project project) {
        project.setId(id);
        projectMapper.updateById(project);
        return project;
    }
}
```

```java
// BusinessLineService.java — 标准 CRUD
// EmployeeService.java — 标准 CRUD + 支持 deptId/roleType 筛选
// 实现模式同 ProjectService，使用 LambdaQueryWrapper 条件查询
```

- [ ] **Step 7: 创建 Controller**

```java
// DepartmentController.java
package com.library.basedata.controller;

import com.library.basedata.entity.Department;
import com.library.basedata.service.DepartmentService;
import com.library.common.response.Result;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/departments")
public class DepartmentController {
    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public Result<?> list(@RequestParam(defaultValue = "false") boolean tree) {
        if (tree) {
            return Result.success(departmentService.listTree());
        }
        return Result.success(departmentService.listAll());
    }

    @PostMapping
    public Result<Department> create(@RequestBody Department dept) {
        return Result.success(departmentService.create(dept));
    }

    @PutMapping("/{id}")
    public Result<Department> update(@PathVariable Long id, @RequestBody Department dept) {
        return Result.success(departmentService.update(id, dept));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        departmentService.delete(id);
        return Result.success(null);
    }
}
```

```java
// ProjectController.java
package com.library.basedata.controller;

import com.library.basedata.entity.Project;
import com.library.basedata.service.ProjectService;
import com.library.common.response.PageResult;
import com.library.common.response.Result;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/base/projects")
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public Result<PageResult<Project>> list(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) Long deptId) {
        return Result.success(projectService.list(pageNum, pageSize, deptId));
    }

    @PostMapping
    public Result<Project> create(@RequestBody Project project) {
        return Result.success(projectService.create(project));
    }

    @PutMapping("/{id}")
    public Result<Project> update(@PathVariable Long id, @RequestBody Project project) {
        return Result.success(projectService.update(id, project));
    }
}
```

```java
// BusinessLineController.java, EmployeeController.java
// 同上模式，@RequestMapping 分别为 /api/base/business-lines 和 /api/base/employees
```

- [ ] **Step 8: 创建 BaseDataApplication.java**

```java
package com.library.basedata;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@MapperScan("com.library.basedata.mapper")
@ComponentScan(basePackages = {"com.library.basedata", "com.library.common"})
public class BaseDataApplication {
    public static void main(String[] args) {
        SpringApplication.run(BaseDataApplication.class, args);
    }
}
```

- [ ] **Step 9: 验证编译**

Run: `cd library-backend-main && mvn compile -pl base-data-service -am`
Expected: BUILD SUCCESS

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add base-data-service with department/project/business-line/employee CRUD"
```

---

## Task 5: Cost Core Service（成本数据服务）

**Files:**
- Create: `library-backend-main/cost-core-service/pom.xml`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/CostCoreApplication.java`
- Create: `library-backend-main/cost-core-service/src/main/resources/application.yml`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/entity/CostRecord.java`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/mapper/CostRecordMapper.java`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/dto/CostEntryRequest.java`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/dto/ImportResultDTO.java`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/service/CostEntryService.java`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/service/CostImportService.java`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/controller/CostEntryController.java`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/controller/CostImportController.java`
- Create: `library-backend-main/cost-core-service/src/main/java/com/library/cost/controller/CostRecordController.java`

**Interfaces:**
- Consumes: `Result<T>`, `PageResult<T>`, `BusinessException` from common
- Produces: `POST /api/cost/entry` → 单条录入 `Result<CostRecord>`
- Produces: `POST /api/cost/batch-entry` → 批量录入 `Result<List<CostRecord>>`
- Produces: `GET /api/cost/import/template` → 下载 Excel 模板
- Produces: `POST /api/cost/import` → Excel 上传导入 `Result<ImportResultDTO>`
- Produces: `GET /api/cost/records` → 分页查询成本记录

- [ ] **Step 1: 创建 cost-core-service/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.library</groupId>
        <artifactId>library-backend</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>cost-core-service</artifactId>
    <dependencies>
        <dependency>
            <groupId>com.library</groupId>
            <artifactId>common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>easyexcel</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 application.yml**

```yaml
server:
  port: 8083
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/cost_report?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
```

- [ ] **Step 3: 创建 CostRecord Entity**

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@TableName("cost_record")
public class CostRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long deptId;
    private Long projectId;
    private Long bizLineId;
    private Long employeeId;
    private String roleType;
    private String costType;
    private BigDecimal amount;
    private String period;
    private String source;
    private String remark;
    private Long createdBy;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    // getters and setters
}
```

- [ ] **Step 4: 创建 DTO**

```java
// CostEntryRequest.java
package com.library.cost.dto;

import java.math.BigDecimal;

public class CostEntryRequest {
    private Long deptId;
    private Long projectId;
    private Long bizLineId;
    private Long employeeId;
    private String roleType;
    private String costType;
    private BigDecimal amount;
    private String period;
    private String remark;
    // getters and setters
}
```

```java
// ImportResultDTO.java
package com.library.cost.dto;

import java.util.List;

public class ImportResultDTO {
    private int totalCount;
    private int successCount;
    private int failCount;
    private List<FailDetail> failDetails;

    public static class FailDetail {
        private int rowNum;
        private String reason;
        public FailDetail(int rowNum, String reason) {
            this.rowNum = rowNum; this.reason = reason;
        }
        // getters
    }
    // getters and setters
}
```

- [ ] **Step 5: 创建 CostEntryService**

```java
package com.library.cost.service;

import com.library.cost.dto.CostEntryRequest;
import com.library.cost.entity.CostRecord;
import com.library.cost.mapper.CostRecordMapper;
import com.library.common.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CostEntryService {
    private static final Pattern PERIOD_PATTERN = Pattern.compile("^\\d{4}-(0[1-9]|1[0-2])$");
    private final CostRecordMapper costRecordMapper;

    public CostEntryService(CostRecordMapper costRecordMapper) {
        this.costRecordMapper = costRecordMapper;
    }

    public CostRecord entry(CostEntryRequest req, Long userId) {
        validate(req);
        CostRecord record = new CostRecord();
        record.setDeptId(req.getDeptId());
        record.setProjectId(req.getProjectId());
        record.setBizLineId(req.getBizLineId());
        record.setEmployeeId(req.getEmployeeId());
        record.setRoleType(req.getRoleType());
        record.setCostType(req.getCostType());
        record.setAmount(req.getAmount());
        record.setPeriod(req.getPeriod());
        record.setSource("manual");
        record.setRemark(req.getRemark());
        record.setCreatedBy(userId);
        costRecordMapper.insert(record);
        return record;
    }

    public List<CostRecord> batchEntry(List<CostEntryRequest> reqs, Long userId) {
        return reqs.stream().map(r -> entry(r, userId)).collect(Collectors.toList());
    }

    private void validate(CostEntryRequest req) {
        if (req.getDeptId() == null) throw new BusinessException(400, "部门不能为空");
        if (req.getCostType() == null) throw new BusinessException(400, "成本类型不能为空");
        if (req.getAmount() == null || req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(400, "金额必须大于0");
        }
        if (req.getPeriod() == null || !PERIOD_PATTERN.matcher(req.getPeriod()).matches()) {
            throw new BusinessException(400, "期间格式错误，应为 YYYY-MM");
        }
    }
}
```

- [ ] **Step 6: 创建 CostImportService（Excel 导入）**

```java
package com.library.cost.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.library.cost.dto.ImportResultDTO;
import com.library.cost.entity.CostRecord;
import com.library.cost.mapper.CostRecordMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class CostImportService {
    private final CostRecordMapper costRecordMapper;

    public CostImportService(CostRecordMapper costRecordMapper) {
        this.costRecordMapper = costRecordMapper;
    }

    public ImportResultDTO importExcel(MultipartFile file, Long userId) throws IOException {
        List<ImportResultDTO.FailDetail> failDetails = new ArrayList<>();
        int[] counts = {0, 0}; // [total, success]

        EasyExcel.read(file.getInputStream(), CostRecord.class, new ReadListener<CostRecord>() {
            @Override
            public void invoke(CostRecord data, AnalysisContext context) {
                counts[0]++;
                try {
                    data.setSource("import");
                    data.setCreatedBy(userId);
                    costRecordMapper.insert(data);
                    counts[1]++;
                } catch (Exception e) {
                    int rowNum = context.readRowHolder().getRowIndex() + 1;
                    failDetails.add(new ImportResultDTO.FailDetail(rowNum, e.getMessage()));
                }
            }
            @Override
            public void doAfterAllAnalysed(AnalysisContext context) {}
        }).sheet().doRead();

        ImportResultDTO result = new ImportResultDTO();
        result.setTotalCount(counts[0]);
        result.setSuccessCount(counts[1]);
        result.setFailCount(counts[0] - counts[1]);
        result.setFailDetails(failDetails);
        return result;
    }
}
```

- [ ] **Step 7: 创建 Controller**

```java
// CostEntryController.java
package com.library.cost.controller;

import com.library.cost.dto.CostEntryRequest;
import com.library.cost.entity.CostRecord;
import com.library.cost.service.CostEntryService;
import com.library.common.response.Result;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cost")
public class CostEntryController {
    private final CostEntryService costEntryService;

    public CostEntryController(CostEntryService costEntryService) {
        this.costEntryService = costEntryService;
    }

    @PostMapping("/entry")
    public Result<CostRecord> entry(@RequestBody CostEntryRequest req,
                                     @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return Result.success(costEntryService.entry(req, userId));
    }

    @PostMapping("/batch-entry")
    public Result<List<CostRecord>> batchEntry(@RequestBody List<CostEntryRequest> reqs,
                                                @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return Result.success(costEntryService.batchEntry(reqs, userId));
    }
}
```

```java
// CostImportController.java
package com.library.cost.controller;

import com.library.cost.dto.ImportResultDTO;
import com.library.cost.service.CostImportService;
import com.library.common.response.Result;
import jakarta.servlet.http.HttpServletResponse;
import com.alibaba.excel.EasyExcel;
import com.library.cost.entity.CostRecord;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/cost/import")
public class CostImportController {
    private final CostImportService costImportService;

    public CostImportController(CostImportService costImportService) {
        this.costImportService = costImportService;
    }

    @GetMapping("/template")
    public void downloadTemplate(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment;filename=cost_import_template.xlsx");
        EasyExcel.write(response.getOutputStream(), CostRecord.class)
                .sheet("成本导入模板").doWrite(java.util.Collections.emptyList());
    }

    @PostMapping
    public Result<ImportResultDTO> importExcel(@RequestParam("file") MultipartFile file,
                                                @RequestHeader(value = "X-User-Id", required = false) Long userId)
            throws IOException {
        return Result.success(costImportService.importExcel(file, userId));
    }
}
```

```java
// CostRecordController.java
package com.library.cost.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.cost.entity.CostRecord;
import com.library.cost.mapper.CostRecordMapper;
import com.library.common.response.PageResult;
import com.library.common.response.Result;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cost/records")
public class CostRecordController {
    private final CostRecordMapper costRecordMapper;

    public CostRecordController(CostRecordMapper costRecordMapper) {
        this.costRecordMapper = costRecordMapper;
    }

    @GetMapping
    public Result<PageResult<CostRecord>> list(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) String period) {
        LambdaQueryWrapper<CostRecord> wrapper = new LambdaQueryWrapper<>();
        if (deptId != null) wrapper.eq(CostRecord::getDeptId, deptId);
        if (period != null) wrapper.eq(CostRecord::getPeriod, period);
        wrapper.orderByDesc(CostRecord::getCreatedAt);
        Page<CostRecord> page = costRecordMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
        return Result.success(new PageResult<>(page.getRecords(), page.getTotal(), pageNum, pageSize));
    }

    @PutMapping("/{id}")
    public Result<CostRecord> update(@PathVariable Long id, @RequestBody CostRecord record) {
        record.setId(id);
        costRecordMapper.updateById(record);
        return Result.success(record);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        costRecordMapper.deleteById(id);
        return Result.success(null);
    }
}
```

- [ ] **Step 8: 创建 CostCoreApplication.java**

```java
package com.library.cost;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@MapperScan("com.library.cost.mapper")
@ComponentScan(basePackages = {"com.library.cost", "com.library.common"})
public class CostCoreApplication {
    public static void main(String[] args) {
        SpringApplication.run(CostCoreApplication.class, args);
    }
}
```

- [ ] **Step 9: 验证编译**

Run: `cd library-backend-main && mvn compile -pl cost-core-service -am`
Expected: BUILD SUCCESS

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add cost-core-service with entry, batch-entry, and Excel import"
```

---

## Task 6: Report Service（报表统计服务）

**Files:**
- Create: `library-backend-main/report-service/pom.xml`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/ReportApplication.java`
- Create: `library-backend-main/report-service/src/main/resources/application.yml`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/dto/DashboardDTO.java`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/dto/AnalysisQuery.java`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/dto/ExportRequest.java`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/mapper/ReportMapper.java`
- Create: `library-backend-main/report-service/src/main/resources/mapper/ReportMapper.xml`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/service/DashboardService.java`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/service/AnalysisService.java`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/service/ExportService.java`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/controller/DashboardController.java`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/controller/AnalysisController.java`
- Create: `library-backend-main/report-service/src/main/java/com/library/report/controller/ExportController.java`

**Interfaces:**
- Consumes: `Result<T>`, `BusinessException` from common
- Consumes: cost_record 表（同库直查，或通过 Feign 调用 cost-core-service）
- Produces: `GET /api/report/dashboard` → `DashboardDTO { totalCost, monthCost, budgetRate, overBudgetCount, trendData, typeDistribution, deptComparison }`
- Produces: `GET /api/report/analysis` → 多维度聚合统计
- Produces: `GET /api/report/labor` → 人力成本统计（按 roleType 分组）
- Produces: `GET /api/report/project` → 项目成本统计（预算 vs 实际）
- Produces: `POST /api/report/export` → Excel 文件下载

- [ ] **Step 1: 创建 report-service/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.library</groupId>
        <artifactId>library-backend</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <artifactId>report-service</artifactId>
    <dependencies>
        <dependency>
            <groupId>com.library</groupId>
            <artifactId>common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>easyexcel</artifactId>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 application.yml**

```yaml
server:
  port: 8084
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/cost_report?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
mybatis-plus:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
```

- [ ] **Step 3: 创建 DashboardDTO**

```java
package com.library.report.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardDTO {
    private BigDecimal totalCost;
    private BigDecimal monthCost;
    private BigDecimal monthCostGrowthRate;
    private BigDecimal budgetExecutionRate;
    private int overBudgetProjectCount;
    private List<Map<String, Object>> trendData;       // [{period, amount}]
    private List<Map<String, Object>> typeDistribution; // [{costType, amount}]
    private List<Map<String, Object>> deptComparison;   // [{deptName, amount}]
    private List<Map<String, Object>> projectBudget;    // [{projectName, budget, actual, rate}]
    // getters and setters
}
```

- [ ] **Step 4: 创建 AnalysisQuery**

```java
package com.library.report.dto;

public class AnalysisQuery {
    private Long deptId;
    private Long projectId;
    private Long bizLineId;
    private Long employeeId;
    private String roleType;
    private String periodStart;
    private String periodEnd;
    private String costType;
    private String groupBy; // dept/project/bizLine/employee/roleType/month
    // getters and setters
}
```

- [ ] **Step 5: 创建 ReportMapper + XML**

```java
package com.library.report.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface ReportMapper {
    Map<String, Object> sumTotalCost(@Param("periodStart") String periodStart, @Param("periodEnd") String periodEnd);
    Map<String, Object> sumMonthCost(@Param("period") String period);
    List<Map<String, Object>> trendByMonth(@Param("periodStart") String periodStart, @Param("periodEnd") String periodEnd);
    List<Map<String, Object>> distributionByType(@Param("periodStart") String periodStart, @Param("periodEnd") String periodEnd);
    List<Map<String, Object>> comparisonByDept(@Param("periodStart") String periodStart, @Param("periodEnd") String periodEnd);
    List<Map<String, Object>> projectBudgetAnalysis();
    List<Map<String, Object>> laborCostByRoleType(@Param("periodStart") String periodStart, @Param("periodEnd") String periodEnd);
    List<Map<String, Object>> analysisGroupBy(@Param("query") com.library.report.dto.AnalysisQuery query);
}
```

```xml
<!-- report-service/src/main/resources/mapper/ReportMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.library.report.mapper.ReportMapper">

    <select id="sumTotalCost" resultType="java.util.Map">
        SELECT COALESCE(SUM(amount), 0) as totalCost
        FROM cost_record
        <where>
            <if test="periodStart != null">AND period &gt;= #{periodStart}</if>
            <if test="periodEnd != null">AND period &lt;= #{periodEnd}</if>
        </where>
    </select>

    <select id="sumMonthCost" resultType="java.util.Map">
        SELECT COALESCE(SUM(amount), 0) as monthCost
        FROM cost_record WHERE period = #{period}
    </select>

    <select id="trendByMonth" resultType="java.util.Map">
        SELECT period, SUM(amount) as amount
        FROM cost_record
        WHERE period &gt;= #{periodStart} AND period &lt;= #{periodEnd}
        GROUP BY period ORDER BY period
    </select>

    <select id="distributionByType" resultType="java.util.Map">
        SELECT cost_type as costType, SUM(amount) as amount
        FROM cost_record
        WHERE period &gt;= #{periodStart} AND period &lt;= #{periodEnd}
        GROUP BY cost_type
    </select>

    <select id="comparisonByDept" resultType="java.util.Map">
        SELECT d.name as deptName, SUM(cr.amount) as amount
        FROM cost_record cr
        LEFT JOIN department d ON cr.dept_id = d.id
        WHERE cr.period &gt;= #{periodStart} AND cr.period &lt;= #{periodEnd}
        GROUP BY cr.dept_id, d.name ORDER BY amount DESC
    </select>

    <select id="projectBudgetAnalysis" resultType="java.util.Map">
        SELECT p.name as projectName, p.budget,
               COALESCE(SUM(cr.amount), 0) as actual,
               CASE WHEN p.budget > 0 THEN ROUND(COALESCE(SUM(cr.amount), 0) / p.budget * 100, 2) ELSE 0 END as rate
        FROM project p
        LEFT JOIN cost_record cr ON cr.project_id = p.id
        WHERE p.status IN (1, 2)
        GROUP BY p.id, p.name, p.budget
    </select>

    <select id="laborCostByRoleType" resultType="java.util.Map">
        SELECT role_type as roleType, SUM(amount) as amount, COUNT(DISTINCT employee_id) as headCount
        FROM cost_record
        WHERE cost_type = 'labor'
        AND period &gt;= #{periodStart} AND period &lt;= #{periodEnd}
        GROUP BY role_type
    </select>

    <select id="analysisGroupBy" resultType="java.util.Map">
        SELECT
        <choose>
            <when test="query.groupBy == 'dept'">d.name as groupName, cr.dept_id as groupId</when>
            <when test="query.groupBy == 'project'">p.name as groupName, cr.project_id as groupId</when>
            <when test="query.groupBy == 'bizLine'">bl.name as groupName, cr.biz_line_id as groupId</when>
            <when test="query.groupBy == 'employee'">e.name as groupName, cr.employee_id as groupId</when>
            <when test="query.groupBy == 'roleType'">cr.role_type as groupName, cr.role_type as groupId</when>
            <when test="query.groupBy == 'month'">cr.period as groupName, cr.period as groupId</when>
            <otherwise>cr.cost_type as groupName, cr.cost_type as groupId</otherwise>
        </choose>
        , SUM(cr.amount) as amount, COUNT(*) as recordCount
        FROM cost_record cr
        LEFT JOIN department d ON cr.dept_id = d.id
        LEFT JOIN project p ON cr.project_id = p.id
        LEFT JOIN business_line bl ON cr.biz_line_id = bl.id
        LEFT JOIN employee e ON cr.employee_id = e.id
        <where>
            <if test="query.deptId != null">AND cr.dept_id = #{query.deptId}</if>
            <if test="query.projectId != null">AND cr.project_id = #{query.projectId}</if>
            <if test="query.bizLineId != null">AND cr.biz_line_id = #{query.bizLineId}</if>
            <if test="query.employeeId != null">AND cr.employee_id = #{query.employeeId}</if>
            <if test="query.roleType != null">AND cr.role_type = #{query.roleType}</if>
            <if test="query.costType != null">AND cr.cost_type = #{query.costType}</if>
            <if test="query.periodStart != null">AND cr.period &gt;= #{query.periodStart}</if>
            <if test="query.periodEnd != null">AND cr.period &lt;= #{query.periodEnd}</if>
        </where>
        GROUP BY groupName, groupId ORDER BY amount DESC
    </select>
</mapper>
```

- [ ] **Step 6: 创建 DashboardService**

```java
package com.library.report.service;

import com.library.report.dto.DashboardDTO;
import com.library.report.mapper.ReportMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {
    private final ReportMapper reportMapper;

    public DashboardService(ReportMapper reportMapper) {
        this.reportMapper = reportMapper;
    }

    public DashboardDTO getDashboard() {
        DashboardDTO dto = new DashboardDTO();
        String currentPeriod = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String yearStart = LocalDate.now().getYear() + "-01";
        String yearEnd = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

        Map<String, Object> total = reportMapper.sumTotalCost(null, null);
        dto.setTotalCost(new BigDecimal(total.get("totalCost").toString()));

        Map<String, Object> month = reportMapper.sumMonthCost(currentPeriod);
        dto.setMonthCost(new BigDecimal(month.get("monthCost").toString()));

        dto.setTrendData(reportMapper.trendByMonth(yearStart, yearEnd));
        dto.setTypeDistribution(reportMapper.distributionByType(yearStart, yearEnd));
        dto.setDeptComparison(reportMapper.comparisonByDept(yearStart, yearEnd));
        dto.setProjectBudget(reportMapper.projectBudgetAnalysis());

        // 计算超支项目数
        long overBudget = dto.getProjectBudget().stream()
                .filter(p -> new BigDecimal(p.get("rate").toString()).compareTo(new BigDecimal("100")) > 0)
                .count();
        dto.setOverBudgetProjectCount((int) overBudget);

        // 预算执行率 = 总消耗 / 总预算
        BigDecimal totalBudget = dto.getProjectBudget().stream()
                .map(p -> new BigDecimal(p.get("budget").toString()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalBudget.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal totalActual = dto.getProjectBudget().stream()
                    .map(p -> new BigDecimal(p.get("actual").toString()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setBudgetExecutionRate(totalActual.divide(totalBudget, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")));
        } else {
            dto.setBudgetExecutionRate(BigDecimal.ZERO);
        }

        return dto;
    }
}
```

- [ ] **Step 7: 创建 AnalysisService**

```java
package com.library.report.service;

import com.library.report.dto.AnalysisQuery;
import com.library.report.mapper.ReportMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AnalysisService {
    private final ReportMapper reportMapper;

    public AnalysisService(ReportMapper reportMapper) {
        this.reportMapper = reportMapper;
    }

    public List<Map<String, Object>> analyze(AnalysisQuery query) {
        return reportMapper.analysisGroupBy(query);
    }

    public List<Map<String, Object>> laborCost(String periodStart, String periodEnd) {
        return reportMapper.laborCostByRoleType(periodStart, periodEnd);
    }

    public List<Map<String, Object>> projectCost() {
        return reportMapper.projectBudgetAnalysis();
    }
}
```

- [ ] **Step 8: 创建 ExportService（Excel 导出）**

```java
package com.library.report.service;

import com.alibaba.excel.EasyExcel;
import com.library.report.dto.AnalysisQuery;
import com.library.report.mapper.ReportMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class ExportService {
    private final ReportMapper reportMapper;

    public ExportService(ReportMapper reportMapper) {
        this.reportMapper = reportMapper;
    }

    public void exportExcel(AnalysisQuery query, HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition",
                "attachment;filename=" + URLEncoder.encode("成本统计报表.xlsx", StandardCharsets.UTF_8));

        List<Map<String, Object>> data = reportMapper.analysisGroupBy(query);

        try (var writer = EasyExcel.write(response.getOutputStream()).build()) {
            // Sheet 1: 汇总
            var sheet1 = com.alibaba.excel.write.metadata.WriteSheet.writeSheet(0, "汇总").build();
            writer.write(data, sheet1);

            // Sheet 2: 项目成本
            var projectData = reportMapper.projectBudgetAnalysis();
            var sheet2 = com.alibaba.excel.write.metadata.WriteSheet.writeSheet(1, "项目成本").build();
            writer.write(projectData, sheet2);

            // Sheet 3: 人力成本
            String periodStart = query.getPeriodStart() != null ? query.getPeriodStart() : "2024-01";
            String periodEnd = query.getPeriodEnd() != null ? query.getPeriodEnd() : "2025-12";
            var laborData = reportMapper.laborCostByRoleType(periodStart, periodEnd);
            var sheet3 = com.alibaba.excel.write.metadata.WriteSheet.writeSheet(2, "人力成本").build();
            writer.write(laborData, sheet3);
        }
    }
}
```

- [ ] **Step 9: 创建 Controller**

```java
// DashboardController.java
package com.library.report.controller;

import com.library.common.response.Result;
import com.library.report.dto.DashboardDTO;
import com.library.report.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/report/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public Result<DashboardDTO> getDashboard() {
        return Result.success(dashboardService.getDashboard());
    }
}
```

```java
// AnalysisController.java
package com.library.report.controller;

import com.library.common.response.Result;
import com.library.report.dto.AnalysisQuery;
import com.library.report.service.AnalysisService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/report")
public class AnalysisController {
    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping("/analysis")
    public Result<List<Map<String, Object>>> analyze(AnalysisQuery query) {
        return Result.success(analysisService.analyze(query));
    }

    @GetMapping("/labor")
    public Result<List<Map<String, Object>>> labor(
            @RequestParam String periodStart, @RequestParam String periodEnd) {
        return Result.success(analysisService.laborCost(periodStart, periodEnd));
    }

    @GetMapping("/project")
    public Result<List<Map<String, Object>>> project() {
        return Result.success(analysisService.projectCost());
    }
}
```

```java
// ExportController.java
package com.library.report.controller;

import com.library.report.dto.AnalysisQuery;
import com.library.report.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/report/export")
public class ExportController {
    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping
    public void export(@RequestBody AnalysisQuery query, HttpServletResponse response) throws IOException {
        exportService.exportExcel(query, response);
    }
}
```

- [ ] **Step 10: 创建 ReportApplication.java**

```java
package com.library.report;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@MapperScan("com.library.report.mapper")
@ComponentScan(basePackages = {"com.library.report", "com.library.common"})
public class ReportApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReportApplication.class, args);
    }
}
```

- [ ] **Step 11: 验证编译**

Run: `cd library-backend-main && mvn compile -pl report-service -am`
Expected: BUILD SUCCESS

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add report-service with dashboard, analysis, labor/project stats, and Excel export"
```

---

## Task 7: 前端项目脚手架搭建

**Files:**
- Create: `library-frontend-main/package.json`
- Create: `library-frontend-main/tsconfig.json`
- Create: `library-frontend-main/tsconfig.node.json`
- Create: `library-frontend-main/vite.config.ts`
- Create: `library-frontend-main/index.html`
- Create: `library-frontend-main/src/main.tsx`
- Create: `library-frontend-main/src/App.tsx`
- Create: `library-frontend-main/src/api/request.ts`
- Create: `library-frontend-main/src/types/api.ts`
- Create: `library-frontend-main/src/utils/format.ts`
- Create: `library-frontend-main/src/utils/constants.ts`
- Create: `library-frontend-main/src/store/useAuthStore.ts`

**Interfaces:**
- Produces: Axios 实例 `request` — 自动附加 JWT Token、统一错误处理
- Produces: `ApiResponse<T>` 类型 — `{ code: number; message: string; data: T; timestamp: number }`
- Produces: `PageResponse<T>` 类型 — `{ list: T[]; total: number; pageNum: number; pageSize: number }`
- Produces: `useAuthStore` — Zustand store，管理 token/user/login/logout

- [ ] **Step 1: 初始化项目**

Run:
```bash
cd library-frontend-main
pnpm create vite . --template react-ts
```

- [ ] **Step 2: 安装依赖**

Run:
```bash
pnpm add antd @ant-design/icons echarts echarts-for-react react-router-dom zustand axios dayjs
pnpm add -D @types/react @types/react-dom
```

- [ ] **Step 3: 配置 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: 创建 API 请求封装 src/api/request.ts**

```typescript
import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    message.error(error.response?.data?.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request;
```

- [ ] **Step 5: 创建类型定义 src/types/api.ts**

```typescript
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}
```

- [ ] **Step 6: 创建 Zustand Auth Store**

```typescript
// src/store/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  name: string | null;
  roles: string[];
  setAuth: (token: string, username: string, name: string, roles: string[]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  name: localStorage.getItem('name'),
  roles: JSON.parse(localStorage.getItem('roles') || '[]'),

  setAuth: (token, username, name, roles) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('name', name);
    localStorage.setItem('roles', JSON.stringify(roles));
    set({ token, username, name, roles });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('roles');
    set({ token: null, username: null, name: null, roles: [] });
  },

  isAuthenticated: () => !!get().token,
  hasRole: (role) => get().roles.includes(role),
}));
```

- [ ] **Step 7: 创建工具函数**

```typescript
// src/utils/format.ts
export const formatMoney = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const roleTypeLabel: Record<string, string> = {
  dev: '开发', test: '测试', product: '产品', ops: '运维',
};

export const costTypeLabel: Record<string, string> = {
  labor: '人力成本', infra: '基础设施', license: '许可证', travel: '差旅', other: '其他',
};
```

```typescript
// src/utils/constants.ts
export const PERIOD_OPTIONS = [
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年度', value: 'year' },
  { label: '自定义', value: 'custom' },
];

export const COST_TYPES = [
  { label: '人力成本', value: 'labor' },
  { label: '基础设施', value: 'infra' },
  { label: '许可证', value: 'license' },
  { label: '差旅', value: 'travel' },
  { label: '其他', value: 'other' },
];

export const ROLE_TYPES = [
  { label: '开发', value: 'dev' },
  { label: '测试', value: 'test' },
  { label: '产品', value: 'product' },
  { label: '运维', value: 'ops' },
];
```

- [ ] **Step 8: 验证项目启动**

Run: `cd library-frontend-main && pnpm dev`
Expected: Vite dev server starts on http://localhost:5173

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: init frontend scaffold with Vite, React, Ant Design, ECharts, Zustand"
```

---

## Task 8: 前端布局 + 登录页 + 路由守卫

**Files:**
- Create: `library-frontend-main/src/layouts/MainLayout.tsx`
- Create: `library-frontend-main/src/components/AuthRoute/index.tsx`
- Create: `library-frontend-main/src/pages/Login/index.tsx`
- Create: `library-frontend-main/src/api/auth.ts`
- Create: `library-frontend-main/src/types/auth.ts`
- Modify: `library-frontend-main/src/App.tsx`

**Interfaces:**
- Consumes: `useAuthStore` from store
- Produces: `MainLayout` — Ant Design ProLayout 风格侧边栏布局
- Produces: `AuthRoute` — 路由守卫组件，未登录重定向到 /login
- Produces: `POST /api/auth/login` 前端调用

- [ ] **Step 1: 创建 auth API + 类型**

```typescript
// src/api/auth.ts
import request from './request';
import { ApiResponse } from '../types/api';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  username: string;
  name: string;
  roles: string[];
}

export const loginApi = (params: LoginParams): Promise<ApiResponse<LoginResult>> =>
  request.post('/auth/login', params);
```

```typescript
// src/types/auth.ts
export interface UserInfo {
  id: number;
  username: string;
  name: string;
  deptId: number | null;
  status: number;
  roles: string[];
}
```

- [ ] **Step 2: 创建 MainLayout**

```tsx
// src/layouts/MainLayout.tsx
import React from 'react';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import {
  DashboardOutlined, BarChartOutlined, TeamOutlined,
  ProjectOutlined, EditOutlined, UploadOutlined,
  DownloadOutlined, SettingOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/cost/analysis', icon: <BarChartOutlined />, label: '成本分析' },
  { key: '/cost/labor', icon: <TeamOutlined />, label: '人力成本' },
  { key: '/cost/project', icon: <ProjectOutlined />, label: '项目成本' },
  { key: '/cost/entry', icon: <EditOutlined />, label: '数据录入' },
  { key: '/cost/import', icon: <UploadOutlined />, label: '数据导入' },
  { key: '/cost/export', icon: <DownloadOutlined />, label: '报表导出' },
  { key: '/system', icon: <SettingOutlined />, label: '系统管理' },
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text strong style={{ color: '#fff', fontSize: 18 }}>成本统计报表</Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space>
            <Text>{name || '用户'}</Text>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
          </Space>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
```

- [ ] **Step 3: 创建 AuthRoute 路由守卫**

```tsx
// src/components/AuthRoute/index.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children, requiredRole }) => {
  const { token, roles } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
```

- [ ] **Step 4: 创建 Login 页面**

```tsx
// src/pages/Login/index.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';

const { Title } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await loginApi(values);
      const { token, username, name, roles } = res.data;
      setAuth(token, username, name, roles);
      message.success('登录成功');
      navigate('/dashboard');
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>成本统计报表系统</Title>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
```

- [ ] **Step 5: 配置 App.tsx 路由**

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import AuthRoute from './components/AuthRoute';
import Login from './pages/Login';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CostAnalysis = React.lazy(() => import('./pages/CostAnalysis'));
const LaborCost = React.lazy(() => import('./pages/LaborCost'));
const ProjectCost = React.lazy(() => import('./pages/ProjectCost'));
const DataEntry = React.lazy(() => import('./pages/DataEntry'));
const DataImport = React.lazy(() => import('./pages/DataImport'));
const ReportExport = React.lazy(() => import('./pages/ReportExport'));

const App: React.FC = () => (
  <ConfigProvider locale={zhCN}>
    <BrowserRouter>
      <React.Suspense fallback={<div style={{ padding: 48, textAlign: 'center' }}>加载中...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthRoute><MainLayout /></AuthRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cost/analysis" element={<CostAnalysis />} />
            <Route path="cost/labor" element={<LaborCost />} />
            <Route path="cost/project" element={<ProjectCost />} />
            <Route path="cost/entry" element={<DataEntry />} />
            <Route path="cost/import" element={<DataImport />} />
            <Route path="cost/export" element={<ReportExport />} />
          </Route>
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  </ConfigProvider>
);

export default App;
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add MainLayout, Login page, AuthRoute guard, and router config"
```

---

## Task 9: Dashboard 页面

**Files:**
- Create: `library-frontend-main/src/api/report.ts`
- Create: `library-frontend-main/src/types/report.ts`
- Create: `library-frontend-main/src/components/StatCard/index.tsx`
- Create: `library-frontend-main/src/components/Charts/LineChart.tsx`
- Create: `library-frontend-main/src/components/Charts/PieChart.tsx`
- Create: `library-frontend-main/src/components/Charts/BarChart.tsx`
- Create: `library-frontend-main/src/pages/Dashboard/index.tsx`

**Interfaces:**
- Consumes: `GET /api/report/dashboard` → `DashboardDTO`
- Produces: Dashboard 页面含 4 个统计卡片 + 4 个图表（折线图/饼图/柱状图/进度条）

- [ ] **Step 1: 创建 report API + 类型**

```typescript
// src/api/report.ts
import request from './request';
import { ApiResponse } from '../types/api';

export interface DashboardData {
  totalCost: number;
  monthCost: number;
  monthCostGrowthRate: number;
  budgetExecutionRate: number;
  overBudgetProjectCount: number;
  trendData: Array<{ period: string; amount: number }>;
  typeDistribution: Array<{ costType: string; amount: number }>;
  deptComparison: Array<{ deptName: string; amount: number }>;
  projectBudget: Array<{ projectName: string; budget: number; actual: number; rate: number }>;
}

export interface AnalysisParams {
  deptId?: number;
  projectId?: number;
  bizLineId?: number;
  employeeId?: number;
  roleType?: string;
  periodStart?: string;
  periodEnd?: string;
  costType?: string;
  groupBy?: string;
}

export const getDashboard = (): Promise<ApiResponse<DashboardData>> =>
  request.get('/report/dashboard');

export const getAnalysis = (params: AnalysisParams): Promise<ApiResponse<any[]>> =>
  request.get('/report/analysis', { params });

export const getLaborCost = (params: { periodStart: string; periodEnd: string }): Promise<ApiResponse<any[]>> =>
  request.get('/report/labor', { params });

export const getProjectCost = (): Promise<ApiResponse<any[]>> =>
  request.get('/report/project');

export const exportReport = (params: AnalysisParams): Promise<Blob> =>
  request.post('/report/export', params, { responseType: 'blob' });
```

```typescript
// src/types/report.ts
export interface AnalysisItem {
  groupName: string;
  groupId: string | number;
  amount: number;
  recordCount: number;
}

export interface LaborCostItem {
  roleType: string;
  amount: number;
  headCount: number;
}

export interface ProjectCostItem {
  projectName: string;
  budget: number;
  actual: number;
  rate: number;
}
```

- [ ] **Step 2: 创建 StatCard 组件**

```tsx
// src/components/StatCard/index.tsx
import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  growthRate?: number;
  precision?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, suffix, growthRate, precision = 2 }) => (
  <Card>
    <Statistic
      title={title}
      value={value}
      prefix={prefix}
      suffix={suffix}
      precision={precision}
    />
    {growthRate !== undefined && (
      <Typography.Text type={growthRate >= 0 ? 'danger' : 'success'} style={{ fontSize: 12 }}>
        {growthRate >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {` ${Math.abs(growthRate).toFixed(1)}%`}
      </Typography.Text>
    )}
  </Card>
);

export default StatCard;
```

- [ ] **Step 3: 创建 ECharts 图表组件**

```tsx
// src/components/Charts/LineChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface LineChartProps {
  title: string;
  data: Array<{ period: string; amount: number }>;
}

const LineChart: React.FC<LineChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>金额: ¥{c}' },
    xAxis: { type: 'category', data: data.map(d => d.period) },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{ type: 'line', data: data.map(d => d.amount), smooth: true, areaStyle: { opacity: 0.15 } }],
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default LineChart;
```

```tsx
// src/components/Charts/PieChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { costTypeLabel } from '../../utils/format';

interface PieChartProps {
  title: string;
  data: Array<{ costType: string; amount: number }>;
}

const PieChart: React.FC<PieChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '65%'],
      data: data.map(d => ({ name: costTypeLabel[d.costType] || d.costType, value: d.amount })),
      label: { formatter: '{b}\n{d}%' },
    }],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default PieChart;
```

```tsx
// src/components/Charts/BarChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface BarChartProps {
  title: string;
  data: Array<{ deptName: string; amount: number }>;
}

const BarChart: React.FC<BarChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>金额: ¥{c}' },
    xAxis: { type: 'category', data: data.map(d => d.deptName), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{ type: 'bar', data: data.map(d => d.amount), itemStyle: { borderRadius: [4, 4, 0, 0] } }],
    grid: { left: 60, right: 20, top: 40, bottom: 50 },
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default BarChart;
```

- [ ] **Step 4: 创建 Dashboard 页面**

```tsx
// src/pages/Dashboard/index.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Spin, Table } from 'antd';
import { DollarOutlined, CalendarOutlined, PieChartOutlined, WarningOutlined } from '@ant-design/icons';
import StatCard from '../../components/StatCard';
import LineChart from '../../components/Charts/LineChart';
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import { getDashboard, DashboardData } from '../../api/report';
import { formatMoney } from '../../utils/format';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data) return <div>加载失败</div>;

  const projectColumns = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '预算', dataIndex: 'budget', key: 'budget', render: (v: number) => formatMoney(v) },
    { title: '实际消耗', dataIndex: 'actual', key: 'actual', render: (v: number) => formatMoney(v) },
    {
      title: '执行率', dataIndex: 'rate', key: 'rate',
      render: (v: number) => (
        <Progress
          percent={v}
          status={v > 100 ? 'exception' : v > 80 ? 'normal' : 'success'}
          size="small"
          style={{ width: 120 }}
        />
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="总成本" value={data.totalCost} prefix={<DollarOutlined />} precision={2} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="本月成本" value={data.monthCost} prefix={<CalendarOutlined />} precision={2} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="预算执行率" value={data.budgetExecutionRate} prefix={<PieChartOutlined />} suffix="%" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="超支预警" value={data.overBudgetProjectCount} prefix={<WarningOutlined />} suffix="个项目" precision={0} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card><LineChart title="月度成本趋势" data={data.trendData || []} /></Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card><PieChart title="成本类型占比" data={data.typeDistribution || []} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card><BarChart title="部门成本对比" data={data.deptComparison || []} /></Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="项目预算执行">
            <Table
              dataSource={data.projectBudget || []}
              columns={projectColumns}
              rowKey="projectName"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Dashboard page with stat cards, line/pie/bar charts, and project budget table"
```

---

## Task 10: 成本统计分析页面 + 人力成本 + 项目成本

**Files:**
- Create: `library-frontend-main/src/components/FilterBar/index.tsx`
- Create: `library-frontend-main/src/api/baseData.ts`
- Create: `library-frontend-main/src/types/baseData.ts`
- Create: `library-frontend-main/src/pages/CostAnalysis/index.tsx`
- Create: `library-frontend-main/src/pages/LaborCost/index.tsx`
- Create: `library-frontend-main/src/pages/ProjectCost/index.tsx`

**Interfaces:**
- Consumes: `GET /api/report/analysis`, `GET /api/report/labor`, `GET /api/report/project`
- Consumes: `GET /api/base/departments`, `GET /api/base/projects`, `GET /api/base/business-lines`, `GET /api/base/employees`
- Produces: 成本分析页 — 筛选栏 + 表格 + 图表联动
- Produces: 人力成本页 — 按岗位类型统计
- Produces: 项目成本页 — 预算 vs 实际对比

- [ ] **Step 1: 创建 baseData API + 类型**

```typescript
// src/api/baseData.ts
import request from './request';
import { ApiResponse, PageResponse } from '../types/api';

export interface Department {
  id: number; name: string; code: string; parentId: number; status: number;
}
export interface Project {
  id: number; name: string; code: string; budget: number; deptId: number; bizLineId: number; status: number;
}
export interface BusinessLine {
  id: number; name: string; code: string; description: string; status: number;
}
export interface Employee {
  id: number; name: string; empNo: string; deptId: number; roleType: string; salary: number; status: number;
}

export const getDepartments = (): Promise<ApiResponse<Department[]>> =>
  request.get('/base/departments');
export const getProjects = (params?: { pageNum?: number; pageSize?: number }): Promise<ApiResponse<PageResponse<Project>>> =>
  request.get('/base/projects', { params: { pageNum: 1, pageSize: 1000, ...params } });
export const getBusinessLines = (): Promise<ApiResponse<BusinessLine[]>> =>
  request.get('/base/business-lines');
export const getEmployees = (params?: { deptId?: number; roleType?: string }): Promise<ApiResponse<Employee[]>> =>
  request.get('/base/employees', { params });
```

- [ ] **Step 2: 创建 FilterBar 通用筛选组件**

```tsx
// src/components/FilterBar/index.tsx
import React, { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Button, Space, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getDepartments, getProjects, getBusinessLines, Department, Project, BusinessLine } from '../../api/baseData';
import { COST_TYPES, ROLE_TYPES } from '../../utils/constants';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface FilterBarProps {
  onSearch: (values: any) => void;
  showCostType?: boolean;
  showRoleType?: boolean;
  showGroupBy?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ onSearch, showCostType, showRoleType, showGroupBy }) => {
  const [form] = Form.useForm();
  const [depts, setDepts] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bizLines, setBizLines] = useState<BusinessLine[]>([]);

  useEffect(() => {
    getDepartments().then(r => setDepts(r.data));
    getProjects().then(r => setProjects(r.data.list));
    getBusinessLines().then(r => setBizLines(r.data));
  }, []);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params: any = { ...values };
    if (values.periodRange) {
      params.periodStart = values.periodRange[0].format('YYYY-MM');
      params.periodEnd = values.periodRange[1].format('YYYY-MM');
      delete params.periodRange;
    }
    onSearch(params);
  };

  const handleReset = () => {
    form.resetFields();
    handleSearch();
  };

  return (
    <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
      <Form.Item name="deptId" label="部门">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={depts.map(d => ({ label: d.name, value: d.id }))} />
      </Form.Item>
      <Form.Item name="projectId" label="项目">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={projects.map(p => ({ label: p.name, value: p.id }))} />
      </Form.Item>
      <Form.Item name="bizLineId" label="业务线">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={bizLines.map(b => ({ label: b.name, value: b.id }))} />
      </Form.Item>
      {showCostType && (
        <Form.Item name="costType" label="成本类型">
          <Select allowClear style={{ width: 120 }} options={COST_TYPES} />
        </Form.Item>
      )}
      {showRoleType && (
        <Form.Item name="roleType" label="岗位">
          <Select allowClear style={{ width: 120 }} options={ROLE_TYPES} />
        </Form.Item>
      )}
      {showGroupBy && (
        <Form.Item name="groupBy" label="分组维度">
          <Select style={{ width: 120 }} defaultValue="dept" options={[
            { label: '部门', value: 'dept' }, { label: '项目', value: 'project' },
            { label: '业务线', value: 'bizLine' }, { label: '人员', value: 'employee' },
            { label: '岗位', value: 'roleType' }, { label: '月份', value: 'month' },
          ]} />
        </Form.Item>
      )}
      <Form.Item name="periodRange" label="期间">
        <RangePicker picker="month" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FilterBar;
```

- [ ] **Step 3: 创建 CostAnalysis 页面**

```tsx
// src/pages/CostAnalysis/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col } from 'antd';
import FilterBar from '../../components/FilterBar';
import BarChart from '../../components/Charts/BarChart';
import { getAnalysis, AnalysisParams } from '../../api/report';
import { formatMoney } from '../../utils/format';

const CostAnalysis: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = (params: AnalysisParams) => {
    setLoading(true);
    getAnalysis({ groupBy: 'dept', ...params })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData({}); }, []);

  const columns = [
    { title: '分组', dataIndex: 'groupName', key: 'groupName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v), sorter: (a: any, b: any) => a.amount - b.amount },
    { title: '记录数', dataIndex: 'recordCount', key: 'recordCount' },
  ];

  const chartData = data.map(d => ({ deptName: d.groupName, amount: d.amount }));

  return (
    <div>
      <FilterBar onSearch={fetchData} showCostType showGroupBy />
      <Row gutter={16}>
        <Col span={14}>
          <Card title="统计结果">
            <Table dataSource={data} columns={columns} rowKey="groupId" loading={loading} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card><BarChart title="成本分布" data={chartData} /></Card>
        </Col>
      </Row>
    </div>
  );
};

export default CostAnalysis;
```

- [ ] **Step 4: 创建 LaborCost 页面**

```tsx
// src/pages/LaborCost/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col } from 'antd';
import FilterBar from '../../components/FilterBar';
import PieChart from '../../components/Charts/PieChart';
import { getLaborCost } from '../../api/report';
import { formatMoney, roleTypeLabel } from '../../utils/format';
import dayjs from 'dayjs';

const LaborCost: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = (params: any) => {
    setLoading(true);
    const periodStart = params.periodStart || dayjs().startOf('year').format('YYYY-MM');
    const periodEnd = params.periodEnd || dayjs().format('YYYY-MM');
    getLaborCost({ periodStart, periodEnd })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData({}); }, []);

  const columns = [
    { title: '岗位类型', dataIndex: 'roleType', key: 'roleType', render: (v: string) => roleTypeLabel[v] || v },
    { title: '人力成本', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v) },
    { title: '人数', dataIndex: 'headCount', key: 'headCount' },
  ];

  const pieData = data.map(d => ({ costType: d.roleType, amount: d.amount }));

  return (
    <div>
      <FilterBar onSearch={fetchData} showRoleType />
      <Row gutter={16}>
        <Col span={14}>
          <Card title="人力成本统计">
            <Table dataSource={data} columns={columns} rowKey="roleType" loading={loading} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card><PieChart title="岗位成本占比" data={pieData} /></Card>
        </Col>
      </Row>
    </div>
  );
};

export default LaborCost;
```

- [ ] **Step 5: 创建 ProjectCost 页面**

```tsx
// src/pages/ProjectCost/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Tag } from 'antd';
import { getProjectCost } from '../../api/report';
import { formatMoney } from '../../utils/format';

const ProjectCost: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProjectCost()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '预算', dataIndex: 'budget', key: 'budget', render: (v: number) => formatMoney(v) },
    { title: '实际消耗', dataIndex: 'actual', key: 'actual', render: (v: number) => formatMoney(v) },
    {
      title: '预算占比', dataIndex: 'rate', key: 'rate',
      render: (v: number) => (
        <Progress percent={Math.min(v, 100)} status={v > 100 ? 'exception' : 'active'} size="small" style={{ width: 150 }} />
      ),
    },
    {
      title: '预计超支', key: 'overBudget',
      render: (_: any, record: any) => {
        const over = record.actual - record.budget;
        return over > 0
          ? <Tag color="red">{formatMoney(over)}</Tag>
          : <Tag color="green">未超支</Tag>;
      },
    },
  ];

  return (
    <Card title="项目成本统计">
      <Table dataSource={data} columns={columns} rowKey="projectName" loading={loading} pagination={false} />
    </Card>
  );
};

export default ProjectCost;
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add CostAnalysis, LaborCost, and ProjectCost pages with filter and charts"
```

---

## Task 11: 数据录入 + 数据导入 + 报表导出页面

**Files:**
- Create: `library-frontend-main/src/api/cost.ts`
- Create: `library-frontend-main/src/types/cost.ts`
- Create: `library-frontend-main/src/pages/DataEntry/index.tsx`
- Create: `library-frontend-main/src/pages/DataImport/index.tsx`
- Create: `library-frontend-main/src/pages/ReportExport/index.tsx`
- Create: `library-frontend-main/src/components/ExportButton/index.tsx`

**Interfaces:**
- Consumes: `POST /api/cost/entry`, `POST /api/cost/import`, `GET /api/cost/import/template`, `POST /api/report/export`
- Produces: 数据录入表单页（选择维度 + 输入金额）
- Produces: 数据导入页（模板下载 + 文件上传 + 结果展示）
- Produces: 报表导出页（选择条件 + 导出 Excel）

- [ ] **Step 1: 创建 cost API + 类型**

```typescript
// src/api/cost.ts
import request from './request';
import { ApiResponse, PageResponse } from '../types/api';

export interface CostEntryRequest {
  deptId: number;
  projectId?: number;
  bizLineId?: number;
  employeeId?: number;
  roleType?: string;
  costType: string;
  amount: number;
  period: string;
  remark?: string;
}

export interface CostRecord {
  id: number;
  deptId: number;
  projectId: number;
  bizLineId: number;
  employeeId: number;
  roleType: string;
  costType: string;
  amount: number;
  period: string;
  source: string;
  remark: string;
  createdAt: string;
}

export interface ImportResult {
  totalCount: number;
  successCount: number;
  failCount: number;
  failDetails: Array<{ rowNum: number; reason: string }>;
}

export const createCostEntry = (data: CostEntryRequest): Promise<ApiResponse<CostRecord>> =>
  request.post('/cost/entry', data);

export const batchCostEntry = (data: CostEntryRequest[]): Promise<ApiResponse<CostRecord[]>> =>
  request.post('/cost/batch-entry', data);

export const getCostRecords = (params: { pageNum?: number; pageSize?: number; deptId?: number; period?: string }): Promise<ApiResponse<PageResponse<CostRecord>>> =>
  request.get('/cost/records', { params });

export const downloadImportTemplate = (): Promise<Blob> =>
  request.get('/cost/import/template', { responseType: 'blob' });

export const importCostExcel = (file: File): Promise<ApiResponse<ImportResult>> => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/cost/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

```typescript
// src/types/cost.ts
export type { CostEntryRequest, CostRecord, ImportResult } from '../api/cost';
```

- [ ] **Step 2: 创建 DataEntry 页面**

```tsx
// src/pages/DataEntry/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Select, InputNumber, DatePicker, Input, Button, message, Table } from 'antd';
import { getDepartments, getProjects, getBusinessLines, getEmployees, Department, Project, BusinessLine, Employee } from '../../api/baseData';
import { createCostEntry, getCostRecords, CostRecord } from '../../api/cost';
import { COST_TYPES, ROLE_TYPES } from '../../utils/constants';
import { formatMoney, costTypeLabel } from '../../utils/format';
import dayjs from 'dayjs';

const DataEntry: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [depts, setDepts] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bizLines, setBizLines] = useState<BusinessLine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    getDepartments().then(r => setDepts(r.data));
    getProjects().then(r => setProjects(r.data.list));
    getBusinessLines().then(r => setBizLines(r.data));
    getEmployees().then(r => setEmployees(r.data));
    fetchRecords(1);
  }, []);

  const fetchRecords = (pageNum: number) => {
    getCostRecords({ pageNum, pageSize: 10 }).then(res => {
      setRecords(res.data.list);
      setTotal(res.data.total);
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createCostEntry({
        ...values,
        period: values.period.format('YYYY-MM'),
      });
      message.success('录入成功');
      form.resetFields();
      fetchRecords(1);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  };

  const columns = [
    { title: '期间', dataIndex: 'period', key: 'period' },
    { title: '成本类型', dataIndex: 'costType', key: 'costType', render: (v: string) => costTypeLabel[v] || v },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v) },
    { title: '来源', dataIndex: 'source', key: 'source' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div>
      <Card title="成本数据录入" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleSubmit} style={{ flexWrap: 'wrap', gap: 8 }}>
          <Form.Item name="deptId" label="部门" rules={[{ required: true }]}>
            <Select style={{ width: 150 }} showSearch optionFilterProp="label"
              options={depts.map(d => ({ label: d.name, value: d.id }))} />
          </Form.Item>
          <Form.Item name="projectId" label="项目">
            <Select allowClear style={{ width: 150 }} showSearch optionFilterProp="label"
              options={projects.map(p => ({ label: p.name, value: p.id }))} />
          </Form.Item>
          <Form.Item name="bizLineId" label="业务线">
            <Select allowClear style={{ width: 150 }} showSearch optionFilterProp="label"
              options={bizLines.map(b => ({ label: b.name, value: b.id }))} />
          </Form.Item>
          <Form.Item name="employeeId" label="人员">
            <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
              options={employees.map(e => ({ label: `${e.name}(${e.empNo})`, value: e.id }))} />
          </Form.Item>
          <Form.Item name="roleType" label="岗位">
            <Select allowClear style={{ width: 100 }} options={ROLE_TYPES} />
          </Form.Item>
          <Form.Item name="costType" label="成本类型" rules={[{ required: true }]}>
            <Select style={{ width: 120 }} options={COST_TYPES} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="period" label="期间" rules={[{ required: true }]}>
            <DatePicker picker="month" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="最近录入记录">
        <Table dataSource={records} columns={columns} rowKey="id" size="small"
          pagination={{ total, pageSize: 10, onChange: fetchRecords }} />
      </Card>
    </div>
  );
};

export default DataEntry;
```

- [ ] **Step 3: 创建 DataImport 页面**

```tsx
// src/pages/DataImport/index.tsx
import React, { useState } from 'react';
import { Card, Upload, Button, Table, Alert, message, Space, Typography } from 'antd';
import { UploadOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { downloadImportTemplate, importCostExcel, ImportResult } from '../../api/cost';

const { Dragger } = Upload;
const { Text } = Typography;

const DataImport: React.FC = () => {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '成本导入模板.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { message.error('下载模板失败'); }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const res = await importCostExcel(file);
      setResult(res.data);
      message.success(`导入完成：成功 ${res.data.successCount} 条`);
    } catch { /* handled */ }
    finally { setLoading(false); }
    return false; // prevent default upload
  };

  const failColumns = [
    { title: '行号', dataIndex: 'rowNum', key: 'rowNum' },
    { title: '失败原因', dataIndex: 'reason', key: 'reason' },
  ];

  return (
    <div>
      <Card title="数据导入" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>下载导入模板</Button>
          <Dragger
            accept=".xlsx,.xls"
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={loading}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽 Excel 文件到此区域上传</p>
            <p className="ant-upload-hint">仅支持 .xlsx / .xls 格式</p>
          </Dragger>
        </Space>
      </Card>

      {result && (
        <Card title="导入结果">
          <Alert
            type={result.failCount === 0 ? 'success' : 'warning'}
            message={`总计 ${result.totalCount} 条，成功 ${result.successCount} 条，失败 ${result.failCount} 条`}
            style={{ marginBottom: 16 }}
          />
          {result.failDetails.length > 0 && (
            <Table
              dataSource={result.failDetails}
              columns={failColumns}
              rowKey="rowNum"
              size="small"
              pagination={false}
              title={() => <Text strong>失败明细</Text>}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default DataImport;
```

- [ ] **Step 4: 创建 ExportButton 组件 + ReportExport 页面**

```tsx
// src/components/ExportButton/index.tsx
import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportReport, AnalysisParams } from '../../api/report';

interface ExportButtonProps {
  params: AnalysisParams;
}

const ExportButton: React.FC<ExportButtonProps> = ({ params }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await exportReport(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '成本统计报表.xlsx'; a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={handleExport}>
      导出 Excel
    </Button>
  );
};

export default ExportButton;
```

```tsx
// src/pages/ReportExport/index.tsx
import React, { useState } from 'react';
import { Card, Space, Typography } from 'antd';
import FilterBar from '../../components/FilterBar';
import ExportButton from '../../components/ExportButton';
import { AnalysisParams } from '../../api/report';

const { Paragraph } = Typography;

const ReportExport: React.FC = () => {
  const [params, setParams] = useState<AnalysisParams>({});

  return (
    <Card title="报表导出">
      <Paragraph>选择筛选条件后，点击导出按钮生成 Excel 文件。导出内容包含：汇总、明细、项目成本、人力成本四个 Sheet。</Paragraph>
      <FilterBar onSearch={setParams} showCostType showRoleType />
      <Space style={{ marginTop: 16 }}>
        <ExportButton params={params} />
      </Space>
    </Card>
  );
};

export default ReportExport;
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add DataEntry, DataImport, and ReportExport pages"
```

---

## Task 12: 前后端联调验证 + 最终检查

**Files:**
- No new files — 验证已有代码的完整性和一致性

**Interfaces:**
- 验证所有跨库 API 契约对齐：前端请求参数/响应类型与后端 Controller 签名一致

- [ ] **Step 1: 后端全量编译**

Run: `cd library-backend-main && mvn compile`
Expected: BUILD SUCCESS（所有 6 个模块编译通过）

- [ ] **Step 2: 前端构建检查**

Run: `cd library-frontend-main && pnpm build`
Expected: 构建成功，无 TypeScript 类型错误

- [ ] **Step 3: 跨库 API 契约对齐检查**

逐项核对以下接口的前后端一致性：

| 接口 | 前端调用 | 后端 Controller | 状态 |
|------|---------|----------------|------|
| 登录 | `POST /api/auth/login` → `LoginParams` | `AuthController.login(LoginRequest)` | ✅ |
| Dashboard | `GET /api/report/dashboard` → `DashboardData` | `DashboardController.getDashboard()` | ✅ |
| 成本分析 | `GET /api/report/analysis` → `AnalysisParams` | `AnalysisController.analyze(AnalysisQuery)` | ✅ |
| 人力成本 | `GET /api/report/labor` → `{periodStart, periodEnd}` | `AnalysisController.labor(periodStart, periodEnd)` | ✅ |
| 项目成本 | `GET /api/report/project` | `AnalysisController.project()` | ✅ |
| 数据录入 | `POST /api/cost/entry` → `CostEntryRequest` | `CostEntryController.entry(CostEntryRequest)` | ✅ |
| 数据导入 | `POST /api/cost/import` → `FormData` | `CostImportController.importExcel(MultipartFile)` | ✅ |
| 报表导出 | `POST /api/report/export` → `AnalysisParams` | `ExportController.export(AnalysisQuery)` | ✅ |
| 部门列表 | `GET /api/base/departments` | `DepartmentController.list(tree)` | ✅ |
| 项目列表 | `GET /api/base/projects` | `ProjectController.list(pageNum, pageSize, deptId)` | ✅ |

- [ ] **Step 4: 数据库脚本完整性检查**

确认 `sql/init.sql` 包含所有 10 张表的 DDL + 初始数据：
- department ✅
- business_line ✅
- project ✅
- employee ✅
- cost_record ✅
- sys_user ✅
- sys_role ✅
- sys_user_role ✅
- sys_permission ✅
- sys_role_permission ✅

- [ ] **Step 5: 最终 Commit**

```bash
# library-backend-main
git add -A
git commit -m "chore: final integration verification and cleanup"

# library-frontend-main
git add -A
git commit -m "chore: final integration verification and cleanup"
```

---

## 跨仓对齐点总结

| 对齐点 | 前端 (library-frontend) | 后端 (library-backend) | 契约 |
|--------|------------------------|----------------------|------|
| 认证 | `src/api/auth.ts` → `POST /api/auth/login` | `auth-service` → `AuthController` | `{username, password}` → `{token, username, name, roles}` |
| Dashboard | `src/api/report.ts` → `GET /api/report/dashboard` | `report-service` → `DashboardController` | → `DashboardDTO` |
| 成本分析 | `src/api/report.ts` → `GET /api/report/analysis` | `report-service` → `AnalysisController` | `AnalysisQuery` → `List<Map>` |
| 人力成本 | `src/api/report.ts` → `GET /api/report/labor` | `report-service` → `AnalysisController` | `{periodStart, periodEnd}` → `List<Map>` |
| 项目成本 | `src/api/report.ts` → `GET /api/report/project` | `report-service` → `AnalysisController` | → `List<Map>` |
| 数据录入 | `src/api/cost.ts` → `POST /api/cost/entry` | `cost-core-service` → `CostEntryController` | `CostEntryRequest` → `CostRecord` |
| 数据导入 | `src/api/cost.ts` → `POST /api/cost/import` | `cost-core-service` → `CostImportController` | `FormData` → `ImportResultDTO` |
| 报表导出 | `src/api/report.ts` → `POST /api/report/export` | `report-service` → `ExportController` | `AnalysisQuery` → `.xlsx` Blob |
| 基础数据 | `src/api/baseData.ts` → `GET /api/base/*` | `base-data-service` → 4 个 Controller | CRUD 标准 REST |
| JWT 鉴权 | `src/api/request.ts` 拦截器附加 `Authorization` | `gateway` → `JwtAuthGlobalFilter` 校验 + 透传 `X-User-Id` | Bearer Token |

---

## 开发顺序建议

```
Task 1 (后端脚手架 + DB) → Task 2 (Gateway) → Task 3 (Auth)
    ↓
Task 4 (Base Data) → Task 5 (Cost Core) → Task 6 (Report)
    ↓
Task 7 (前端脚手架) → Task 8 (布局 + 登录)
    ↓
Task 9 (Dashboard) → Task 10 (分析页面) → Task 11 (录入/导入/导出)
    ↓
Task 12 (联调验证)
```

每个 Task 完成后独立可测，产出可运行的增量交付物。
