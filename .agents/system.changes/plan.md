# 人员看板（Personnel Dashboard）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建项目人力管理看板系统，支持员工信息 CRUD、批量导入（Excel/CSV）、白名单管理、成本预算跟踪及数据看板展示。

**Architecture:** 前后端分离架构。前端使用 React 18 + Ant Design Pro 6 + UmiJS 构建 SPA；后端使用 Java 17 + Spring Boot 3 + MyBatis-Plus 提供 REST API；数据层使用 MySQL 8。前端通过 HTTP REST 调用后端接口，文件上传使用 multipart/form-data。

**Tech Stack:**
- 前端：React 18, Ant Design Pro 6, UmiJS 4, @ant-design/charts, axios
- 后端：Java 17, Spring Boot 3.2, MyBatis-Plus 3.5, Apache POI, OpenCSV
- 数据库：MySQL 8
- 部署：Docker + docker-compose

---

## Global Constraints

- Java 版本 ≥ 17，Spring Boot 版本 = 3.2.x
- Node.js 版本 ≥ 18，React 版本 = 18.x
- 所有 API 响应统一包装为 `{ code: number, message: string, data: T }` 格式
- 分页参数统一使用 `current`（页码，从1开始）和 `pageSize`（每页条数），响应包含 `total`
- 日期格式统一使用 `yyyy-MM-dd`，时间格式使用 `yyyy-MM-dd HH:mm:ss`
- 所有数据库表包含 `created_at` 和 `updated_at` 字段
- API 路径前缀统一为 `/api/v1`
- 前端路由使用 hash 模式
- 文件上传大小限制：单文件 ≤ 10MB

---

## 跨仓 API 契约（前后端对齐基准）

### 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 分页请求/响应
```
请求参数: ?current=1&pageSize=20&name=xxx&department=xxx
响应 data: { "records": [...], "total": 100, "current": 1, "pageSize": 20 }
```

### 核心接口清单

| # | 方法 | 路径 | 说明 |
|---|------|------|------|
| 1 | GET | `/api/v1/employees` | 员工分页列表（支持 name/department/status 筛选） |
| 2 | GET | `/api/v1/employees/{id}` | 员工详情 |
| 3 | POST | `/api/v1/employees` | 新增员工 |
| 4 | PUT | `/api/v1/employees/{id}` | 更新员工 |
| 5 | DELETE | `/api/v1/employees/{id}` | 删除员工 |
| 6 | POST | `/api/v1/employees/import` | 批量导入（multipart file + format 参数） |
| 7 | GET | `/api/v1/employees/export-template` | 下载导入模板 |
| 8 | GET | `/api/v1/projects` | 项目列表（分页） |
| 9 | POST | `/api/v1/projects` | 新增项目 |
| 10 | PUT | `/api/v1/projects/{id}` | 更新项目 |
| 11 | DELETE | `/api/v1/projects/{id}` | 删除项目 |
| 12 | GET | `/api/v1/whitelist` | 白名单列表（支持 projectId 筛选） |
| 13 | POST | `/api/v1/whitelist` | 添加白名单 |
| 14 | DELETE | `/api/v1/whitelist/{id}` | 移除白名单 |
| 15 | POST | `/api/v1/whitelist/batch` | 批量添加白名单 |
| 16 | GET | `/api/v1/budgets` | 预算列表（支持 projectId/department 筛选） |
| 17 | POST | `/api/v1/budgets` | 新增预算 |
| 18 | PUT | `/api/v1/budgets/{id}` | 更新预算 |
| 19 | GET | `/api/v1/dashboard/overview` | 看板-人员总览统计 |
| 20 | GET | `/api/v1/dashboard/budget-progress` | 看板-预算使用进度 |
| 21 | GET | `/api/v1/dashboard/project-distribution` | 看板-项目人员分布 |
| 22 | GET | `/api/v1/dashboard/expiring-alerts` | 看板-即将到期提醒 |
| 23 | GET | `/api/v1/suppliers` | 供应商列表 |
| 24 | POST | `/api/v1/suppliers` | 新增供应商 |

### 员工数据模型（API 传输格式）
```typescript
interface Employee {
  id: number;
  name: string;           // 姓名
  employeeNo: string;     // 工号
  phone: string;          // 手机号
  email: string;          // 邮箱
  department: string;     // 部门
  position: string;       // 职位
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';  // 状态
  supplierId: number;     // 供应商ID
  supplierName: string;   // 供应商名称（冗余展示）
  dailyRate: number;      // 日费率
  monthlySalary: number;  // 月薪
  costCenter: string;     // 成本中心
  contractNo: string;     // 合同编号
  contractStart: string;  // 合同开始日期
  contractEnd: string;    // 合同结束日期
  createdAt: string;
  updatedAt: string;
}
```

### 项目-人员关联（API 传输格式）
```typescript
interface ProjectEmployee {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  role: string;        // 项目角色
  entryDate: string;   // 入场时间
  exitDate: string;    // 离场时间
}
```

### 白名单（API 传输格式）
```typescript
interface WhitelistEntry {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: string;
  approvedAt: string;
  createdAt: string;
}
```

### 预算（API 传输格式）
```typescript
interface Budget {
  id: number;
  projectId: number;
  projectName: string;
  department: string;
  totalAmount: number;
  usedAmount: number;
  remainingAmount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}
```

### 看板数据结构
```typescript
interface DashboardOverview {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  totalSuppliers: number;
  whitelistCount: number;
}

interface BudgetProgress {
  department: string;
  totalAmount: number;
  usedAmount: number;
  usagePercent: number;
}

interface ProjectDistribution {
  projectName: string;
  employeeCount: number;
}

interface ExpiringAlert {
  employeeName: string;
  employeeNo: string;
  contractEnd: string;
  daysRemaining: number;
  projectName: string;
}
```

---

## 文件结构

### library-backend（后端）
```
library-backend/
├── pom.xml
├── Dockerfile
├── src/main/java/com/library/
│   ├── LibraryApplication.java
│   ├── config/
│   │   ├── CorsConfig.java
│   │   ├── MyBatisPlusConfig.java
│   │   └── WebMvcConfig.java
│   ├── common/
│   │   ├── Result.java              # 统一响应包装
│   │   ├── PageResult.java          # 分页响应
│   │   ├── BusinessException.java   # 业务异常
│   │   └── GlobalExceptionHandler.java
│   ├── entity/
│   │   ├── Employee.java
│   │   ├── Project.java
│   │   ├── ProjectEmployee.java
│   │   ├── Whitelist.java
│   │   ├── Budget.java
│   │   └── Supplier.java
│   ├── mapper/
│   │   ├── EmployeeMapper.java
│   │   ├── ProjectMapper.java
│   │   ├── ProjectEmployeeMapper.java
│   │   ├── WhitelistMapper.java
│   │   ├── BudgetMapper.java
│   │   └── SupplierMapper.java
│   ├── service/
│   │   ├── EmployeeService.java
│   │   ├── ProjectService.java
│   │   ├── WhitelistService.java
│   │   ├── BudgetService.java
│   │   ├── DashboardService.java
│   │   ├── SupplierService.java
│   │   └── impl/
│   │       ├── EmployeeServiceImpl.java
│   │       ├── ProjectServiceImpl.java
│   │       ├── WhitelistServiceImpl.java
│   │       ├── BudgetServiceImpl.java
│   │       ├── DashboardServiceImpl.java
│   │       └── SupplierServiceImpl.java
│   ├── controller/
│   │   ├── EmployeeController.java
│   │   ├── ProjectController.java
│   │   ├── WhitelistController.java
│   │   ├── BudgetController.java
│   │   ├── DashboardController.java
│   │   └── SupplierController.java
│   └── dto/
│       ├── EmployeeDTO.java
│       ├── EmployeeQueryDTO.java
│       ├── ProjectDTO.java
│       ├── WhitelistDTO.java
│       ├── BudgetDTO.java
│       └── ImportResultDTO.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── db/migration/
│       └── V1__init_schema.sql
└── src/test/java/com/library/
    ├── controller/
    │   └── EmployeeControllerTest.java
    └── service/
        └── EmployeeServiceTest.java
```

### library-frontend（前端）
```
library-frontend/
├── package.json
├── .umirc.ts
├── Dockerfile
├── nginx.conf
├── src/
│   ├── app.tsx                    # UmiJS 运行时配置
│   ├── services/
│   │   ├── api.ts                 # axios 实例 + 拦截器
│   │   ├── employee.ts            # 员工 API
│   │   ├── project.ts             # 项目 API
│   │   ├── whitelist.ts           # 白名单 API
│   │   ├── budget.ts              # 预算 API
│   │   ├── dashboard.ts           # 看板 API
│   │   └── supplier.ts            # 供应商 API
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   └── index.tsx          # 看板首页
│   │   ├── Employee/
│   │   │   ├── index.tsx          # 员工列表
│   │   │   ├── components/
│   │   │   │   ├── EmployeeForm.tsx    # 新增/编辑表单
│   │   │   │   └── ImportModal.tsx     # 导入弹窗
│   │   │   └── detail.tsx         # 员工详情
│   │   ├── Project/
│   │   │   └── index.tsx          # 项目管理
│   │   ├── Whitelist/
│   │   │   └── index.tsx          # 白名单管理
│   │   ├── Budget/
│   │   │   └── index.tsx          # 预算管理
│   │   └── Supplier/
│   │       └── index.tsx          # 供应商管理
│   ├── components/
│   │   └── StatisticCard/
│   │       └── index.tsx          # 统计卡片组件
│   └── typings/
│       └── index.d.ts             # 全局类型定义
└── mock/
    └── employee.ts                # Mock 数据（开发用）
```

---

## Task 1: 后端项目初始化与基础设施

**Files:**
- Create: `library-backend/pom.xml`
- Create: `library-backend/src/main/java/com/library/LibraryApplication.java`
- Create: `library-backend/src/main/resources/application.yml`
- Create: `library-backend/src/main/resources/application-dev.yml`
- Create: `library-backend/src/main/java/com/library/config/CorsConfig.java`
- Create: `library-backend/src/main/java/com/library/config/MyBatisPlusConfig.java`
- Create: `library-backend/src/main/java/com/library/common/Result.java`
- Create: `library-backend/src/main/java/com/library/common/PageResult.java`
- Create: `library-backend/src/main/java/com/library/common/BusinessException.java`
- Create: `library-backend/src/main/java/com/library/common/GlobalExceptionHandler.java`

**Interfaces:**
- Produces: `Result<T>` 统一响应类（code, message, data），所有 Controller 使用
- Produces: `PageResult<T>` 分页响应（records, total, current, pageSize）
- Produces: `BusinessException` 业务异常类，GlobalExceptionHandler 统一捕获

- [ ] **Step 1: 创建 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
        <relativePath/>
    </parent>
    <groupId>com.library</groupId>
    <artifactId>library-backend</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>library-backend</name>
    <description>人员看板后端服务</description>
    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.6</mybatis-plus.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>5.2.5</version>
        </dependency>
        <dependency>
            <groupId>com.opencsv</groupId>
            <artifactId>opencsv</artifactId>
            <version>5.9</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: 创建启动类**

```java
package com.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

- [ ] **Step 3: 创建 application.yml**

```yaml
server:
  port: 8080

spring:
  profiles:
    active: dev
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
```

- [ ] **Step 4: 创建 application-dev.yml**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/library?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: root123
    driver-class-name: com.mysql.cj.jdbc.Driver
```

- [ ] **Step 5: 创建统一响应类 Result.java**

```java
package com.library.common;

import lombok.Data;

@Data
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(int code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }

    public static <T> Result<T> error(String message) {
        return error(500, message);
    }
}
```

- [ ] **Step 6: 创建分页响应 PageResult.java**

```java
package com.library.common;

import lombok.Data;
import java.util.List;

@Data
public class PageResult<T> {
    private List<T> records;
    private long total;
    private long current;
    private long pageSize;

    public static <T> PageResult<T> of(List<T> records, long total, long current, long pageSize) {
        PageResult<T> result = new PageResult<>();
        result.setRecords(records);
        result.setTotal(total);
        result.setCurrent(current);
        result.setPageSize(pageSize);
        return result;
    }
}
```

- [ ] **Step 7: 创建业务异常和全局异常处理器**

```java
package com.library.common;

public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
```

```java
package com.library.common;

import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBusinessException(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return Result.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e) {
        return Result.error(500, "服务器内部错误: " + e.getMessage());
    }
}
```

- [ ] **Step 8: 创建 CORS 配置**

```java
package com.library.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

- [ ] **Step 9: 创建 MyBatis-Plus 配置**

```java
package com.library.config;

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

- [ ] **Step 10: 验证项目可编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: init backend project with Spring Boot 3.2 + MyBatis-Plus infrastructure"
```

---

## Task 2: 数据库 Schema 与实体类

**Files:**
- Create: `library-backend/src/main/resources/db/migration/V1__init_schema.sql`
- Create: `library-backend/src/main/java/com/library/entity/Employee.java`
- Create: `library-backend/src/main/java/com/library/entity/Project.java`
- Create: `library-backend/src/main/java/com/library/entity/ProjectEmployee.java`
- Create: `library-backend/src/main/java/com/library/entity/Whitelist.java`
- Create: `library-backend/src/main/java/com/library/entity/Budget.java`
- Create: `library-backend/src/main/java/com/library/entity/Supplier.java`

**Interfaces:**
- Consumes: `Result`, `PageResult` from Task 1
- Produces: 所有 Entity 类（使用 MyBatis-Plus 注解 @TableName, @TableId, @TableField）

- [ ] **Step 1: 创建数据库初始化 SQL**

```sql
-- V1__init_schema.sql
CREATE TABLE IF NOT EXISTS supplier (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '供应商名称',
    contact VARCHAR(50) COMMENT '联系人',
    phone VARCHAR(20) COMMENT '联系电话',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '供应商表';

CREATE TABLE IF NOT EXISTS employee (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    employee_no VARCHAR(30) NOT NULL UNIQUE COMMENT '工号',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    department VARCHAR(50) COMMENT '部门',
    position VARCHAR(50) COMMENT '职位',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/INACTIVE/ON_LEAVE',
    supplier_id BIGINT COMMENT '供应商ID',
    daily_rate DECIMAL(12,2) COMMENT '日费率',
    monthly_salary DECIMAL(12,2) COMMENT '月薪',
    cost_center VARCHAR(50) COMMENT '成本中心',
    contract_no VARCHAR(50) COMMENT '合同编号',
    contract_start DATE COMMENT '合同开始日期',
    contract_end DATE COMMENT '合同结束日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id)
) COMMENT '员工表';

CREATE TABLE IF NOT EXISTS project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '项目名称',
    code VARCHAR(30) NOT NULL UNIQUE COMMENT '项目编码',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/COMPLETED/SUSPENDED',
    start_date DATE COMMENT '项目开始日期',
    end_date DATE COMMENT '项目结束日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '项目表';

CREATE TABLE IF NOT EXISTS project_employee (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL COMMENT '项目ID',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    role VARCHAR(50) COMMENT '项目角色',
    entry_date DATE COMMENT '入场时间',
    exit_date DATE COMMENT '离场时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (employee_id) REFERENCES employee(id),
    UNIQUE KEY uk_project_employee (project_id, employee_id)
) COMMENT '项目-人员关联表';

CREATE TABLE IF NOT EXISTS whitelist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL COMMENT '项目ID',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态: PENDING/APPROVED/REJECTED',
    approved_by VARCHAR(50) COMMENT '审批人',
    approved_at DATETIME COMMENT '审批时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (employee_id) REFERENCES employee(id),
    UNIQUE KEY uk_whitelist (project_id, employee_id)
) COMMENT '白名单表';

CREATE TABLE IF NOT EXISTS budget (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL COMMENT '项目ID',
    department VARCHAR(50) NOT NULL COMMENT '部门',
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '预算总额',
    used_amount DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '已使用金额',
    remaining_amount DECIMAL(14,2) GENERATED ALWAYS AS (total_amount - used_amount) STORED COMMENT '剩余金额',
    start_date DATE COMMENT '预算开始日期',
    end_date DATE COMMENT '预算结束日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id)
) COMMENT '预算表';

CREATE INDEX idx_employee_department ON employee(department);
CREATE INDEX idx_employee_status ON employee(status);
CREATE INDEX idx_budget_project ON budget(project_id);
CREATE INDEX idx_whitelist_project ON whitelist(project_id);
```

- [ ] **Step 2: 创建 Supplier 实体**

```java
package com.library.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("supplier")
public class Supplier {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String contact;
    private String phone;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 3: 创建 Employee 实体**

```java
package com.library.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("employee")
public class Employee {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String employeeNo;
    private String phone;
    private String email;
    private String department;
    private String position;
    private String status;
    private Long supplierId;
    private BigDecimal dailyRate;
    private BigDecimal monthlySalary;
    private String costCenter;
    private String contractNo;
    private LocalDate contractStart;
    private LocalDate contractEnd;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 4: 创建 Project 实体**

```java
package com.library.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("project")
public class Project {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 5: 创建 ProjectEmployee 实体**

```java
package com.library.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("project_employee")
public class ProjectEmployee {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private Long employeeId;
    private String role;
    private LocalDate entryDate;
    private LocalDate exitDate;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 6: 创建 Whitelist 实体**

```java
package com.library.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("whitelist")
public class Whitelist {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private Long employeeId;
    private String status;
    private String approvedBy;
    private LocalDateTime approvedAt;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 7: 创建 Budget 实体**

```java
package com.library.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("budget")
public class Budget {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private String department;
    private BigDecimal totalAmount;
    private BigDecimal usedAmount;
    private BigDecimal remainingAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 8: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add database schema and entity classes"
```

---

## Task 3: 后端 Mapper 层与 DTO

**Files:**
- Create: `library-backend/src/main/java/com/library/mapper/EmployeeMapper.java`
- Create: `library-backend/src/main/java/com/library/mapper/ProjectMapper.java`
- Create: `library-backend/src/main/java/com/library/mapper/ProjectEmployeeMapper.java`
- Create: `library-backend/src/main/java/com/library/mapper/WhitelistMapper.java`
- Create: `library-backend/src/main/java/com/library/mapper/BudgetMapper.java`
- Create: `library-backend/src/main/java/com/library/mapper/SupplierMapper.java`
- Create: `library-backend/src/main/java/com/library/dto/EmployeeDTO.java`
- Create: `library-backend/src/main/java/com/library/dto/EmployeeQueryDTO.java`
- Create: `library-backend/src/main/java/com/library/dto/ProjectDTO.java`
- Create: `library-backend/src/main/java/com/library/dto/WhitelistDTO.java`
- Create: `library-backend/src/main/java/com/library/dto/BudgetDTO.java`
- Create: `library-backend/src/main/java/com/library/dto/ImportResultDTO.java`

**Interfaces:**
- Consumes: Entity classes from Task 2
- Produces: Mapper 接口（extends BaseMapper<T>），DTO 类供 Controller/Service 使用

- [ ] **Step 1: 创建所有 Mapper 接口**

```java
// EmployeeMapper.java
package com.library.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.entity.Employee;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EmployeeMapper extends BaseMapper<Employee> {
}
```

```java
// ProjectMapper.java
package com.library.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.entity.Project;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectMapper extends BaseMapper<Project> {
}
```

```java
// ProjectEmployeeMapper.java
package com.library.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.entity.ProjectEmployee;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProjectEmployeeMapper extends BaseMapper<ProjectEmployee> {
}
```

```java
// WhitelistMapper.java
package com.library.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.entity.Whitelist;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WhitelistMapper extends BaseMapper<Whitelist> {
}
```

```java
// BudgetMapper.java
package com.library.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.entity.Budget;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface BudgetMapper extends BaseMapper<Budget> {
}
```

```java
// SupplierMapper.java
package com.library.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.entity.Supplier;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SupplierMapper extends BaseMapper<Supplier> {
}
```

- [ ] **Step 2: 创建 DTO 类**

```java
// EmployeeDTO.java
package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EmployeeDTO {
    @NotBlank(message = "姓名不能为空")
    @Size(max = 50, message = "姓名长度不能超过50")
    private String name;

    @NotBlank(message = "工号不能为空")
    @Size(max = 30, message = "工号长度不能超过30")
    private String employeeNo;

    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String email;

    @Size(max = 50)
    private String department;

    @Size(max = 50)
    private String position;

    private String status;
    private Long supplierId;
    private BigDecimal dailyRate;
    private BigDecimal monthlySalary;
    private String costCenter;
    private String contractNo;
    private LocalDate contractStart;
    private LocalDate contractEnd;
}
```

```java
// EmployeeQueryDTO.java
package com.library.dto;

import lombok.Data;

@Data
public class EmployeeQueryDTO {
    private String name;
    private String department;
    private String status;
    private String employeeNo;
    private Integer current = 1;
    private Integer pageSize = 20;
}
```

```java
// ProjectDTO.java
package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProjectDTO {
    @NotBlank(message = "项目名称不能为空")
    private String name;

    @NotBlank(message = "项目编码不能为空")
    private String code;

    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
}
```

```java
// WhitelistDTO.java
package com.library.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WhitelistDTO {
    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    @NotNull(message = "员工ID不能为空")
    private Long employeeId;

    private String status;
}
```

```java
// BudgetDTO.java
package com.library.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BudgetDTO {
    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    @NotBlank(message = "部门不能为空")
    private String department;

    @NotNull(message = "预算总额不能为空")
    private BigDecimal totalAmount;

    private LocalDate startDate;
    private LocalDate endDate;
}
```

```java
// ImportResultDTO.java
package com.library.dto;

import lombok.Data;
import java.util.List;

@Data
public class ImportResultDTO {
    private int totalCount;
    private int successCount;
    private int failCount;
    private List<String> errors;
}
```

- [ ] **Step 3: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add mapper interfaces and DTO classes"
```

---

## Task 4: 后端员工 Service 与 Controller（CRUD + 导入）

**Files:**
- Create: `library-backend/src/main/java/com/library/service/EmployeeService.java`
- Create: `library-backend/src/main/java/com/library/service/impl/EmployeeServiceImpl.java`
- Create: `library-backend/src/main/java/com/library/controller/EmployeeController.java`
- Create: `library-backend/src/main/java/com/library/service/SupplierService.java`
- Create: `library-backend/src/main/java/com/library/service/impl/SupplierServiceImpl.java`
- Create: `library-backend/src/main/java/com/library/controller/SupplierController.java`

**Interfaces:**
- Consumes: EmployeeMapper, EmployeeDTO, EmployeeQueryDTO, ImportResultDTO from Task 3
- Produces: `EmployeeService` 接口（pageQuery, getById, create, update, delete, importEmployees, exportTemplate）
- Produces: `SupplierService` 接口（list, create）

- [ ] **Step 1: 创建 SupplierService 接口和实现**

```java
// SupplierService.java
package com.library.service;

import com.library.dto.SupplierDTO;
import com.library.entity.Supplier;
import java.util.List;

public interface SupplierService {
    List<Supplier> list();
    Supplier create(Supplier supplier);
}
```

```java
// SupplierServiceImpl.java
package com.library.service.impl;

import com.library.mapper.SupplierMapper;
import com.library.entity.Supplier;
import com.library.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    private final SupplierMapper supplierMapper;

    @Override
    public List<Supplier> list() {
        return supplierMapper.selectList(null);
    }

    @Override
    public Supplier create(Supplier supplier) {
        supplierMapper.insert(supplier);
        return supplier;
    }
}
```

```java
// SupplierController.java
package com.library.controller;

import com.library.common.Result;
import com.library.entity.Supplier;
import com.library.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierService supplierService;

    @GetMapping
    public Result<List<Supplier>> list() {
        return Result.success(supplierService.list());
    }

    @PostMapping
    public Result<Supplier> create(@RequestBody Supplier supplier) {
        return Result.success(supplierService.create(supplier));
    }
}
```

- [ ] **Step 2: 创建 EmployeeService 接口**

```java
package com.library.service;

import com.library.common.PageResult;
import com.library.dto.EmployeeDTO;
import com.library.dto.EmployeeQueryDTO;
import com.library.dto.ImportResultDTO;
import com.library.entity.Employee;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface EmployeeService {
    PageResult<Employee> pageQuery(EmployeeQueryDTO query);
    Employee getById(Long id);
    Employee create(EmployeeDTO dto);
    Employee update(Long id, EmployeeDTO dto);
    void delete(Long id);
    ImportResultDTO importEmployees(MultipartFile file, String format) throws IOException;
    byte[] exportTemplate(String format) throws IOException;
}
```

- [ ] **Step 3: 创建 EmployeeServiceImpl 实现**

```java
package com.library.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.EmployeeDTO;
import com.library.dto.EmployeeQueryDTO;
import com.library.dto.ImportResultDTO;
import com.library.entity.Employee;
import com.library.mapper.EmployeeMapper;
import com.library.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.opencsv.CSVReader;
import com.opencsv.CSVWriter;

import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
    private final EmployeeMapper employeeMapper;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final String[] TEMPLATE_HEADERS = {
        "姓名", "工号", "手机号", "邮箱", "部门", "职位",
        "日费率", "月薪", "成本中心", "合同编号", "合同开始日期", "合同结束日期"
    };

    @Override
    public PageResult<Employee> pageQuery(EmployeeQueryDTO query) {
        LambdaQueryWrapper<Employee> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(query.getName()), Employee::getName, query.getName())
               .eq(StringUtils.hasText(query.getDepartment()), Employee::getDepartment, query.getDepartment())
               .eq(StringUtils.hasText(query.getStatus()), Employee::getStatus, query.getStatus())
               .like(StringUtils.hasText(query.getEmployeeNo()), Employee::getEmployeeNo, query.getEmployeeNo())
               .orderByDesc(Employee::getCreatedAt);

        Page<Employee> page = new Page<>(query.getCurrent(), query.getPageSize());
        Page<Employee> result = employeeMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public Employee getById(Long id) {
        Employee employee = employeeMapper.selectById(id);
        if (employee == null) {
            throw new BusinessException("员工不存在");
        }
        return employee;
    }

    @Override
    public Employee create(EmployeeDTO dto) {
        // 检查工号唯一性
        LambdaQueryWrapper<Employee> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Employee::getEmployeeNo, dto.getEmployeeNo());
        if (employeeMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("工号已存在: " + dto.getEmployeeNo());
        }

        Employee employee = new Employee();
        copyFromDTO(employee, dto);
        employee.setStatus("ACTIVE");
        employeeMapper.insert(employee);
        return employee;
    }

    @Override
    public Employee update(Long id, EmployeeDTO dto) {
        Employee employee = getById(id);

        // 检查工号唯一性（排除自身）
        LambdaQueryWrapper<Employee> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Employee::getEmployeeNo, dto.getEmployeeNo())
               .ne(Employee::getId, id);
        if (employeeMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("工号已存在: " + dto.getEmployeeNo());
        }

        copyFromDTO(employee, dto);
        employeeMapper.updateById(employee);
        return employee;
    }

    @Override
    public void delete(Long id) {
        if (employeeMapper.selectById(id) == null) {
            throw new BusinessException("员工不存在");
        }
        employeeMapper.deleteById(id);
    }

    @Override
    public ImportResultDTO importEmployees(MultipartFile file, String format) throws IOException {
        List<String[]> rows;
        if ("csv".equalsIgnoreCase(format)) {
            rows = parseCSV(file.getInputStream());
        } else {
            rows = parseExcel(file.getInputStream());
        }

        ImportResultDTO result = new ImportResultDTO();
        result.setTotalCount(rows.size());
        result.setErrors(new ArrayList<>());
        int successCount = 0;

        for (int i = 0; i < rows.size(); i++) {
            String[] row = rows.get(i);
            try {
                Employee employee = parseRow(row);
                // 检查工号是否已存在
                LambdaQueryWrapper<Employee> wrapper = new LambdaQueryWrapper<>();
                wrapper.eq(Employee::getEmployeeNo, employee.getEmployeeNo());
                if (employeeMapper.selectCount(wrapper) > 0) {
                    result.getErrors().add("第" + (i + 2) + "行: 工号已存在 " + employee.getEmployeeNo());
                    continue;
                }
                employee.setStatus("ACTIVE");
                employeeMapper.insert(employee);
                successCount++;
            } catch (Exception e) {
                result.getErrors().add("第" + (i + 2) + "行: " + e.getMessage());
            }
        }

        result.setSuccessCount(successCount);
        result.setFailCount(result.getTotalCount() - successCount);
        return result;
    }

    @Override
    public byte[] exportTemplate(String format) throws IOException {
        if ("csv".equalsIgnoreCase(format)) {
            return generateCSVTemplate();
        }
        return generateExcelTemplate();
    }

    private void copyFromDTO(Employee employee, EmployeeDTO dto) {
        employee.setName(dto.getName());
        employee.setEmployeeNo(dto.getEmployeeNo());
        employee.setPhone(dto.getPhone());
        employee.setEmail(dto.getEmail());
        employee.setDepartment(dto.getDepartment());
        employee.setPosition(dto.getPosition());
        employee.setSupplierId(dto.getSupplierId());
        employee.setDailyRate(dto.getDailyRate());
        employee.setMonthlySalary(dto.getMonthlySalary());
        employee.setCostCenter(dto.getCostCenter());
        employee.setContractNo(dto.getContractNo());
        employee.setContractStart(dto.getContractStart());
        employee.setContractEnd(dto.getContractEnd());
    }

    private Employee parseRow(String[] row) {
        if (row.length < 2) {
            throw new RuntimeException("数据列数不足");
        }
        Employee emp = new Employee();
        emp.setName(row[0].trim());
        emp.setEmployeeNo(row[1].trim());
        if (row.length > 2 && StringUtils.hasText(row[2])) emp.setPhone(row[2].trim());
        if (row.length > 3 && StringUtils.hasText(row[3])) emp.setEmail(row[3].trim());
        if (row.length > 4 && StringUtils.hasText(row[4])) emp.setDepartment(row[4].trim());
        if (row.length > 5 && StringUtils.hasText(row[5])) emp.setPosition(row[5].trim());
        if (row.length > 6 && StringUtils.hasText(row[6])) emp.setDailyRate(new BigDecimal(row[6].trim()));
        if (row.length > 7 && StringUtils.hasText(row[7])) emp.setMonthlySalary(new BigDecimal(row[7].trim()));
        if (row.length > 8 && StringUtils.hasText(row[8])) emp.setCostCenter(row[8].trim());
        if (row.length > 9 && StringUtils.hasText(row[9])) emp.setContractNo(row[9].trim());
        if (row.length > 10 && StringUtils.hasText(row[10])) emp.setContractStart(LocalDate.parse(row[10].trim(), DATE_FMT));
        if (row.length > 11 && StringUtils.hasText(row[11])) emp.setContractEnd(LocalDate.parse(row[11].trim(), DATE_FMT));
        return emp;
    }

    private List<String[]> parseExcel(InputStream is) throws IOException {
        List<String[]> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) { // 跳过表头
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String[] values = new String[TEMPLATE_HEADERS.length];
                for (int j = 0; j < TEMPLATE_HEADERS.length; j++) {
                    Cell cell = row.getCell(j);
                    values[j] = cell != null ? getCellValue(cell) : "";
                }
                rows.add(values);
            }
        }
        return rows;
    }

    private String getCellValue(Cell cell) {
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private List<String[]> parseCSV(InputStream is) throws IOException {
        List<String[]> rows = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(is, "UTF-8"))) {
            reader.readNext(); // 跳过表头
            String[] line;
            while ((line = reader.readNext()) != null) {
                rows.add(line);
            }
        } catch (Exception e) {
            throw new IOException("CSV解析失败: " + e.getMessage());
        }
        return rows;
    }

    private byte[] generateExcelTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("员工导入模板");
            Row header = sheet.createRow(0);
            for (int i = 0; i < TEMPLATE_HEADERS.length; i++) {
                header.createCell(i).setCellValue(TEMPLATE_HEADERS[i]);
            }
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        }
    }

    private byte[] generateCSVTemplate() throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(bos, "UTF-8"))) {
            writer.writeNext(TEMPLATE_HEADERS);
        }
        return bos.toByteArray();
    }
}
```

- [ ] **Step 4: 创建 EmployeeController**

```java
package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.EmployeeDTO;
import com.library.dto.EmployeeQueryDTO;
import com.library.dto.ImportResultDTO;
import com.library.entity.Employee;
import com.library.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;

    @GetMapping
    public Result<PageResult<Employee>> list(EmployeeQueryDTO query) {
        return Result.success(employeeService.pageQuery(query));
    }

    @GetMapping("/{id}")
    public Result<Employee> getById(@PathVariable Long id) {
        return Result.success(employeeService.getById(id));
    }

    @PostMapping
    public Result<Employee> create(@Valid @RequestBody EmployeeDTO dto) {
        return Result.success(employeeService.create(dto));
    }

    @PutMapping("/{id}")
    public Result<Employee> update(@PathVariable Long id, @Valid @RequestBody EmployeeDTO dto) {
        return Result.success(employeeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return Result.success();
    }

    @PostMapping("/import")
    public Result<ImportResultDTO> importEmployees(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "format", defaultValue = "excel") String format) throws IOException {
        return Result.success(employeeService.importEmployees(file, format));
    }

    @GetMapping("/export-template")
    public ResponseEntity<byte[]> exportTemplate(
            @RequestParam(value = "format", defaultValue = "excel") String format) throws IOException {
        byte[] data = employeeService.exportTemplate(format);
        String filename = "excel".equalsIgnoreCase(format) ? "employee_template.xlsx" : "employee_template.csv";
        String contentType = "excel".equalsIgnoreCase(format)
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(contentType))
                .body(data);
    }
}
```

- [ ] **Step 5: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add employee CRUD, import/export and supplier APIs"
```

---

## Task 5: 后端项目、白名单、预算 Service 与 Controller

**Files:**
- Create: `library-backend/src/main/java/com/library/service/ProjectService.java`
- Create: `library-backend/src/main/java/com/library/service/impl/ProjectServiceImpl.java`
- Create: `library-backend/src/main/java/com/library/controller/ProjectController.java`
- Create: `library-backend/src/main/java/com/library/service/WhitelistService.java`
- Create: `library-backend/src/main/java/com/library/service/impl/WhitelistServiceImpl.java`
- Create: `library-backend/src/main/java/com/library/controller/WhitelistController.java`
- Create: `library-backend/src/main/java/com/library/service/BudgetService.java`
- Create: `library-backend/src/main/java/com/library/service/impl/BudgetServiceImpl.java`
- Create: `library-backend/src/main/java/com/library/controller/BudgetController.java`

**Interfaces:**
- Consumes: Mapper 和 DTO from Task 3
- Produces: ProjectService, WhitelistService, BudgetService 及其 Controller

- [ ] **Step 1: 创建 ProjectService 和实现**

```java
// ProjectService.java
package com.library.service;

import com.library.common.PageResult;
import com.library.dto.ProjectDTO;
import com.library.entity.Project;

public interface ProjectService {
    PageResult<Project> pageQuery(Integer current, Integer pageSize, String name);
    Project getById(Long id);
    Project create(ProjectDTO dto);
    Project update(Long id, ProjectDTO dto);
    void delete(Long id);
}
```

```java
// ProjectServiceImpl.java
package com.library.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.ProjectDTO;
import com.library.entity.Project;
import com.library.mapper.ProjectMapper;
import com.library.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {
    private final ProjectMapper projectMapper;

    @Override
    public PageResult<Project> pageQuery(Integer current, Integer pageSize, String name) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(name), Project::getName, name)
               .orderByDesc(Project::getCreatedAt);
        Page<Project> page = new Page<>(current, pageSize);
        Page<Project> result = projectMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public Project getById(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) throw new BusinessException("项目不存在");
        return project;
    }

    @Override
    public Project create(ProjectDTO dto) {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Project::getCode, dto.getCode());
        if (projectMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("项目编码已存在: " + dto.getCode());
        }
        Project project = new Project();
        project.setName(dto.getName());
        project.setCode(dto.getCode());
        project.setStatus("ACTIVE");
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        projectMapper.insert(project);
        return project;
    }

    @Override
    public Project update(Long id, ProjectDTO dto) {
        Project project = getById(id);
        project.setName(dto.getName());
        project.setStatus(dto.getStatus());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        projectMapper.updateById(project);
        return project;
    }

    @Override
    public void delete(Long id) {
        if (projectMapper.selectById(id) == null) {
            throw new BusinessException("项目不存在");
        }
        projectMapper.deleteById(id);
    }
}
```

```java
// ProjectController.java
package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.ProjectDTO;
import com.library.entity.Project;
import com.library.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @GetMapping
    public Result<PageResult<Project>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String name) {
        return Result.success(projectService.pageQuery(current, pageSize, name));
    }

    @PostMapping
    public Result<Project> create(@Valid @RequestBody ProjectDTO dto) {
        return Result.success(projectService.create(dto));
    }

    @PutMapping("/{id}")
    public Result<Project> update(@PathVariable Long id, @Valid @RequestBody ProjectDTO dto) {
        return Result.success(projectService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return Result.success();
    }
}
```

- [ ] **Step 2: 创建 WhitelistService 和实现**

```java
// WhitelistService.java
package com.library.service;

import com.library.common.PageResult;
import com.library.dto.WhitelistDTO;
import com.library.entity.Whitelist;
import java.util.List;

public interface WhitelistService {
    PageResult<Whitelist> pageQuery(Integer current, Integer pageSize, Long projectId);
    Whitelist create(WhitelistDTO dto);
    void delete(Long id);
    int batchCreate(List<WhitelistDTO> dtos);
}
```

```java
// WhitelistServiceImpl.java
package com.library.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.WhitelistDTO;
import com.library.entity.Whitelist;
import com.library.mapper.WhitelistMapper;
import com.library.service.WhitelistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WhitelistServiceImpl implements WhitelistService {
    private final WhitelistMapper whitelistMapper;

    @Override
    public PageResult<Whitelist> pageQuery(Integer current, Integer pageSize, Long projectId) {
        LambdaQueryWrapper<Whitelist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(projectId != null, Whitelist::getProjectId, projectId)
               .orderByDesc(Whitelist::getCreatedAt);
        Page<Whitelist> page = new Page<>(current, pageSize);
        Page<Whitelist> result = whitelistMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public Whitelist create(WhitelistDTO dto) {
        // 检查是否已存在
        LambdaQueryWrapper<Whitelist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Whitelist::getProjectId, dto.getProjectId())
               .eq(Whitelist::getEmployeeId, dto.getEmployeeId());
        if (whitelistMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("该员工已在白名单中");
        }

        Whitelist whitelist = new Whitelist();
        whitelist.setProjectId(dto.getProjectId());
        whitelist.setEmployeeId(dto.getEmployeeId());
        whitelist.setStatus("APPROVED");
        whitelistMapper.insert(whitelist);
        return whitelist;
    }

    @Override
    public void delete(Long id) {
        if (whitelistMapper.selectById(id) == null) {
            throw new BusinessException("白名单记录不存在");
        }
        whitelistMapper.deleteById(id);
    }

    @Override
    public int batchCreate(List<WhitelistDTO> dtos) {
        int count = 0;
        for (WhitelistDTO dto : dtos) {
            try {
                create(dto);
                count++;
            } catch (BusinessException ignored) {
                // 跳过重复记录
            }
        }
        return count;
    }
}
```

```java
// WhitelistController.java
package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.WhitelistDTO;
import com.library.entity.Whitelist;
import com.library.service.WhitelistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/whitelist")
@RequiredArgsConstructor
public class WhitelistController {
    private final WhitelistService whitelistService;

    @GetMapping
    public Result<PageResult<Whitelist>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Long projectId) {
        return Result.success(whitelistService.pageQuery(current, pageSize, projectId));
    }

    @PostMapping
    public Result<Whitelist> create(@Valid @RequestBody WhitelistDTO dto) {
        return Result.success(whitelistService.create(dto));
    }

    @PostMapping("/batch")
    public Result<Integer> batchCreate(@RequestBody List<WhitelistDTO> dtos) {
        return Result.success(whitelistService.batchCreate(dtos));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        whitelistService.delete(id);
        return Result.success();
    }
}
```

- [ ] **Step 3: 创建 BudgetService 和实现**

```java
// BudgetService.java
package com.library.service;

import com.library.common.PageResult;
import com.library.dto.BudgetDTO;
import com.library.entity.Budget;

public interface BudgetService {
    PageResult<Budget> pageQuery(Integer current, Integer pageSize, Long projectId, String department);
    Budget create(BudgetDTO dto);
    Budget update(Long id, BudgetDTO dto);
}
```

```java
// BudgetServiceImpl.java
package com.library.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.library.common.BusinessException;
import com.library.common.PageResult;
import com.library.dto.BudgetDTO;
import com.library.entity.Budget;
import com.library.mapper.BudgetMapper;
import com.library.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {
    private final BudgetMapper budgetMapper;

    @Override
    public PageResult<Budget> pageQuery(Integer current, Integer pageSize, Long projectId, String department) {
        LambdaQueryWrapper<Budget> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(projectId != null, Budget::getProjectId, projectId)
               .eq(StringUtils.hasText(department), Budget::getDepartment, department)
               .orderByDesc(Budget::getCreatedAt);
        Page<Budget> page = new Page<>(current, pageSize);
        Page<Budget> result = budgetMapper.selectPage(page, wrapper);
        return PageResult.of(result.getRecords(), result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public Budget create(BudgetDTO dto) {
        Budget budget = new Budget();
        budget.setProjectId(dto.getProjectId());
        budget.setDepartment(dto.getDepartment());
        budget.setTotalAmount(dto.getTotalAmount());
        budget.setUsedAmount(BigDecimal.ZERO);
        budget.setStartDate(dto.getStartDate());
        budget.setEndDate(dto.getEndDate());
        budgetMapper.insert(budget);
        return budget;
    }

    @Override
    public Budget update(Long id, BudgetDTO dto) {
        Budget budget = budgetMapper.selectById(id);
        if (budget == null) throw new BusinessException("预算记录不存在");
        budget.setDepartment(dto.getDepartment());
        budget.setTotalAmount(dto.getTotalAmount());
        budget.setStartDate(dto.getStartDate());
        budget.setEndDate(dto.getEndDate());
        budgetMapper.updateById(budget);
        return budget;
    }
}
```

```java
// BudgetController.java
package com.library.controller;

import com.library.common.PageResult;
import com.library.common.Result;
import com.library.dto.BudgetDTO;
import com.library.entity.Budget;
import com.library.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService budgetService;

    @GetMapping
    public Result<PageResult<Budget>> list(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String department) {
        return Result.success(budgetService.pageQuery(current, pageSize, projectId, department));
    }

    @PostMapping
    public Result<Budget> create(@Valid @RequestBody BudgetDTO dto) {
        return Result.success(budgetService.create(dto));
    }

    @PutMapping("/{id}")
    public Result<Budget> update(@PathVariable Long id, @Valid @RequestBody BudgetDTO dto) {
        return Result.success(budgetService.update(id, dto));
    }
}
```

- [ ] **Step 4: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add project, whitelist and budget CRUD APIs"
```

---

## Task 6: 后端看板 Dashboard Service 与 Controller

**Files:**
- Create: `library-backend/src/main/java/com/library/service/DashboardService.java`
- Create: `library-backend/src/main/java/com/library/service/impl/DashboardServiceImpl.java`
- Create: `library-backend/src/main/java/com/library/controller/DashboardController.java`

**Interfaces:**
- Consumes: 所有 Mapper from Task 3
- Produces: DashboardService（getOverview, getBudgetProgress, getProjectDistribution, getExpiringAlerts）

- [ ] **Step 1: 创建 DashboardService 接口和实现**

```java
// DashboardService.java
package com.library.service;

import java.util.List;
import java.util.Map;

public interface DashboardService {
    Map<String, Object> getOverview();
    List<Map<String, Object>> getBudgetProgress();
    List<Map<String, Object>> getProjectDistribution();
    List<Map<String, Object>> getExpiringAlerts();
}
```

```java
// DashboardServiceImpl.java
package com.library.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.entity.*;
import com.library.mapper.*;
import com.library.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private final EmployeeMapper employeeMapper;
    private final ProjectMapper projectMapper;
    private final SupplierMapper supplierMapper;
    private final WhitelistMapper whitelistMapper;
    private final BudgetMapper budgetMapper;
    private final ProjectEmployeeMapper projectEmployeeMapper;

    @Override
    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("totalEmployees", employeeMapper.selectCount(null));

        LambdaQueryWrapper<Employee> activeWrapper = new LambdaQueryWrapper<>();
        activeWrapper.eq(Employee::getStatus, "ACTIVE");
        overview.put("activeEmployees", employeeMapper.selectCount(activeWrapper));

        overview.put("totalProjects", projectMapper.selectCount(null));
        overview.put("totalSuppliers", supplierMapper.selectCount(null));
        overview.put("whitelistCount", whitelistMapper.selectCount(null));
        return overview;
    }

    @Override
    public List<Map<String, Object>> getBudgetProgress() {
        List<Budget> budgets = budgetMapper.selectList(null);
        return budgets.stream().map(b -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("department", b.getDepartment());
            item.put("totalAmount", b.getTotalAmount());
            item.put("usedAmount", b.getUsedAmount());
            double usagePercent = b.getTotalAmount().doubleValue() > 0
                    ? (b.getUsedAmount().doubleValue() / b.getTotalAmount().doubleValue()) * 100
                    : 0;
            item.put("usagePercent", Math.round(usagePercent * 100.0) / 100.0);
            return item;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getProjectDistribution() {
        List<Project> projects = projectMapper.selectList(null);
        return projects.stream().map(p -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("projectName", p.getName());
            LambdaQueryWrapper<ProjectEmployee> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ProjectEmployee::getProjectId, p.getId());
            item.put("employeeCount", projectEmployeeMapper.selectCount(wrapper));
            return item;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, Object>> getExpiringAlerts() {
        LocalDate threshold = LocalDate.now().plusDays(30);
        LambdaQueryWrapper<Employee> wrapper = new LambdaQueryWrapper<>();
        wrapper.isNotNull(Employee::getContractEnd)
               .le(Employee::getContractEnd, threshold)
               .ge(Employee::getContractEnd, LocalDate.now())
               .orderByAsc(Employee::getContractEnd);

        List<Employee> expiringEmployees = employeeMapper.selectList(wrapper);
        return expiringEmployees.stream().map(emp -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("employeeName", emp.getName());
            item.put("employeeNo", emp.getEmployeeNo());
            item.put("contractEnd", emp.getContractEnd().toString());
            item.put("daysRemaining", ChronoUnit.DAYS.between(LocalDate.now(), emp.getContractEnd()));

            // 查找关联项目
            LambdaQueryWrapper<ProjectEmployee> peWrapper = new LambdaQueryWrapper<>();
            peWrapper.eq(ProjectEmployee::getEmployeeId, emp.getId()).last("LIMIT 1");
            ProjectEmployee pe = projectEmployeeMapper.selectOne(peWrapper);
            if (pe != null) {
                Project project = projectMapper.selectById(pe.getProjectId());
                item.put("projectName", project != null ? project.getName() : "");
            } else {
                item.put("projectName", "");
            }
            return item;
        }).collect(Collectors.toList());
    }
}
```

```java
// DashboardController.java
package com.library.controller;

import com.library.common.Result;
import com.library.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        return Result.success(dashboardService.getOverview());
    }

    @GetMapping("/budget-progress")
    public Result<List<Map<String, Object>>> budgetProgress() {
        return Result.success(dashboardService.getBudgetProgress());
    }

    @GetMapping("/project-distribution")
    public Result<List<Map<String, Object>>> projectDistribution() {
        return Result.success(dashboardService.getProjectDistribution());
    }

    @GetMapping("/expiring-alerts")
    public Result<List<Map<String, Object>>> expiringAlerts() {
        return Result.success(dashboardService.getExpiringAlerts());
    }
}
```

- [ ] **Step 2: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add dashboard statistics APIs"
```

---

## Task 7: 后端 Dockerfile 与测试配置

**Files:**
- Create: `library-backend/Dockerfile`
- Create: `library-backend/src/test/resources/application-test.yml`

**Interfaces:**
- Consumes: 完整后端项目 from Task 1-6

- [ ] **Step 1: 创建 Dockerfile**

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 2: 创建测试配置**

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
    username: sa
    password:
  sql:
    init:
      mode: always
      schema-locations: classpath:db/migration/V1__init_schema.sql
```

- [ ] **Step 3: 验证完整构建**

Run: `cd library-backend && mvn package -DskipTests -q`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add Dockerfile and test configuration"
```

---

## Task 8: 前端项目初始化（Ant Design Pro + UmiJS）

**Files:**
- Create: `library-frontend/package.json`
- Create: `library-frontend/.umirc.ts`
- Create: `library-frontend/tsconfig.json`
- Create: `library-frontend/src/app.tsx`
- Create: `library-frontend/src/typings/index.d.ts`
- Create: `library-frontend/src/services/api.ts`

**Interfaces:**
- Produces: UmiJS 项目骨架，所有后续页面依赖此基础配置
- Produces: `request` 函数（axios 实例，统一拦截器处理 Result 格式）

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "library-frontend",
  "version": "1.0.0",
  "private": true,
  "description": "人员看板前端应用",
  "scripts": {
    "dev": "umi dev",
    "build": "umi build",
    "start": "umi dev",
    "lint": "eslint --ext .ts,.tsx src"
  },
  "dependencies": {
    "@ant-design/charts": "^2.0.0",
    "@ant-design/icons": "^5.3.0",
    "@ant-design/pro-components": "^2.6.0",
    "antd": "^5.15.0",
    "axios": "^1.6.8",
    "dayjs": "^1.11.10",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "umi": "^4.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: 创建 .umirc.ts**

```typescript
import { defineConfig } from 'umi';

export default defineConfig({
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/dashboard',
      name: '人员看板',
      icon: 'DashboardOutlined',
      component: './Dashboard',
    },
    {
      path: '/employees',
      name: '员工管理',
      icon: 'TeamOutlined',
      routes: [
        { path: '/employees', component: './Employee' },
        { path: '/employees/detail/:id', component: './Employee/detail' },
      ],
    },
    {
      path: '/projects',
      name: '项目管理',
      icon: 'ProjectOutlined',
      component: './Project',
    },
    {
      path: '/whitelist',
      name: '白名单管理',
      icon: 'SafetyCertificateOutlined',
      component: './Whitelist',
    },
    {
      path: '/budgets',
      name: '预算管理',
      icon: 'MoneyCollectOutlined',
      component: './Budget',
    },
    {
      path: '/suppliers',
      name: '供应商管理',
      icon: 'ShopOutlined',
      component: './Supplier',
    },
  ],
  npmClient: 'npm',
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
  title: '人员看板',
  hash: true,
  history: { type: 'hash' },
});
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", ".umirc.ts", "typings.d.ts"]
}
```

- [ ] **Step 4: 创建 app.tsx（运行时配置）**

```typescript
import type { RunTimeLayoutConfig } from 'umi';

export const layout: RunTimeLayoutConfig = () => {
  return {
    title: '人员看板',
    logo: undefined,
    menu: {
      locale: false,
    },
    layout: 'mix',
    fixSiderbar: true,
    fixedHeader: true,
  };
};
```

- [ ] **Step 5: 创建全局类型定义**

```typescript
// src/typings/index.d.ts
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  pageSize: number;
}

interface Employee {
  id: number;
  name: string;
  employeeNo: string;
  phone: string;
  email: string;
  department: string;
  position: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  supplierId: number;
  supplierName: string;
  dailyRate: number;
  monthlySalary: number;
  costCenter: string;
  contractNo: string;
  contractStart: string;
  contractEnd: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  code: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface WhitelistEntry {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: string;
  approvedAt: string;
  createdAt: string;
}

interface Budget {
  id: number;
  projectId: number;
  projectName: string;
  department: string;
  totalAmount: number;
  usedAmount: number;
  remainingAmount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
}

interface DashboardOverview {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  totalSuppliers: number;
  whitelistCount: number;
}

interface BudgetProgressItem {
  department: string;
  totalAmount: number;
  usedAmount: number;
  usagePercent: number;
}

interface ProjectDistributionItem {
  projectName: string;
  employeeCount: number;
}

interface ExpiringAlertItem {
  employeeName: string;
  employeeNo: string;
  contractEnd: string;
  daysRemaining: number;
  projectName: string;
}

interface ImportResult {
  totalCount: number;
  successCount: number;
  failCount: number;
  errors: string[];
}
```

- [ ] **Step 6: 创建 API 请求封装**

```typescript
// src/services/api.ts
import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message));
    }
    return res;
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络错误';
    message.error(msg);
    return Promise.reject(error);
  },
);

export default request;
```

- [ ] **Step 7: 安装依赖并验证**

Run: `cd library-frontend && npm install`
Expected: 无报错，node_modules 生成

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: init frontend project with Ant Design Pro + UmiJS"
```

---

## Task 9: 前端 API Service 层

**Files:**
- Create: `library-frontend/src/services/employee.ts`
- Create: `library-frontend/src/services/project.ts`
- Create: `library-frontend/src/services/whitelist.ts`
- Create: `library-frontend/src/services/budget.ts`
- Create: `library-frontend/src/services/dashboard.ts`
- Create: `library-frontend/src/services/supplier.ts`

**Interfaces:**
- Consumes: `request` from Task 8
- Produces: 各模块 API 调用函数，供页面组件使用

- [ ] **Step 1: 创建 employee.ts**

```typescript
import request from './api';

export async function getEmployees(params: {
  current?: number;
  pageSize?: number;
  name?: string;
  department?: string;
  status?: string;
}) {
  return request.get<ApiResponse<PageResult<Employee>>>('/employees', { params });
}

export async function getEmployee(id: number) {
  return request.get<ApiResponse<Employee>>(`/employees/${id}`);
}

export async function createEmployee(data: Partial<Employee>) {
  return request.post<ApiResponse<Employee>>('/employees', data);
}

export async function updateEmployee(id: number, data: Partial<Employee>) {
  return request.put<ApiResponse<Employee>>(`/employees/${id}`, data);
}

export async function deleteEmployee(id: number) {
  return request.delete<ApiResponse<void>>(`/employees/${id}`);
}

export async function importEmployees(file: File, format: string) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<ApiResponse<ImportResult>>('/employees/import', formData, {
    params: { format },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function exportTemplate(format: string) {
  return request.get('/employees/export-template', {
    params: { format },
    responseType: 'blob',
  });
}
```

- [ ] **Step 2: 创建 project.ts**

```typescript
import request from './api';

export async function getProjects(params: { current?: number; pageSize?: number; name?: string }) {
  return request.get<ApiResponse<PageResult<Project>>>('/projects', { params });
}

export async function createProject(data: Partial<Project>) {
  return request.post<ApiResponse<Project>>('/projects', data);
}

export async function updateProject(id: number, data: Partial<Project>) {
  return request.put<ApiResponse<Project>>(`/projects/${id}`, data);
}

export async function deleteProject(id: number) {
  return request.delete<ApiResponse<void>>(`/projects/${id}`);
}
```

- [ ] **Step 3: 创建 whitelist.ts**

```typescript
import request from './api';

export async function getWhitelist(params: { current?: number; pageSize?: number; projectId?: number }) {
  return request.get<ApiResponse<PageResult<WhitelistEntry>>>('/whitelist', { params });
}

export async function createWhitelist(data: { projectId: number; employeeId: number }) {
  return request.post<ApiResponse<WhitelistEntry>>('/whitelist', data);
}

export async function batchCreateWhitelist(data: { projectId: number; employeeId: number }[]) {
  return request.post<ApiResponse<number>>('/whitelist/batch', data);
}

export async function deleteWhitelist(id: number) {
  return request.delete<ApiResponse<void>>(`/whitelist/${id}`);
}
```

- [ ] **Step 4: 创建 budget.ts**

```typescript
import request from './api';

export async function getBudgets(params: {
  current?: number;
  pageSize?: number;
  projectId?: number;
  department?: string;
}) {
  return request.get<ApiResponse<PageResult<Budget>>>('/budgets', { params });
}

export async function createBudget(data: Partial<Budget>) {
  return request.post<ApiResponse<Budget>>('/budgets', data);
}

export async function updateBudget(id: number, data: Partial<Budget>) {
  return request.put<ApiResponse<Budget>>(`/budgets/${id}`, data);
}
```

- [ ] **Step 5: 创建 dashboard.ts**

```typescript
import request from './api';

export async function getDashboardOverview() {
  return request.get<ApiResponse<DashboardOverview>>('/dashboard/overview');
}

export async function getBudgetProgress() {
  return request.get<ApiResponse<BudgetProgressItem[]>>('/dashboard/budget-progress');
}

export async function getProjectDistribution() {
  return request.get<ApiResponse<ProjectDistributionItem[]>>('/dashboard/project-distribution');
}

export async function getExpiringAlerts() {
  return request.get<ApiResponse<ExpiringAlertItem[]>>('/dashboard/expiring-alerts');
}
```

- [ ] **Step 6: 创建 supplier.ts**

```typescript
import request from './api';

export async function getSuppliers() {
  return request.get<ApiResponse<Supplier[]>>('/suppliers');
}

export async function createSupplier(data: Partial<Supplier>) {
  return request.post<ApiResponse<Supplier>>('/suppliers', data);
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add frontend API service layer"
```

---

## Task 10: 前端看板 Dashboard 页面

**Files:**
- Create: `library-frontend/src/pages/Dashboard/index.tsx`
- Create: `library-frontend/src/components/StatisticCard/index.tsx`

**Interfaces:**
- Consumes: dashboard service from Task 9
- Produces: Dashboard 页面组件（人员总览卡片 + 预算进度条 + 项目分布饼图 + 到期提醒表格）

- [ ] **Step 1: 创建 StatisticCard 组件**

```tsx
import React from 'react';
import { Card, Statistic } from 'antd';
import type { StatisticProps } from 'antd';

interface StatisticCardProps {
  title: string;
  value: number;
  prefix?: StatisticProps['prefix'];
  suffix?: string;
  valueStyle?: React.CSSProperties;
}

const StatisticCard: React.FC<StatisticCardProps> = ({ title, value, prefix, suffix, valueStyle }) => (
  <Card hoverable>
    <Statistic title={title} value={value} prefix={prefix} suffix={suffix} valueStyle={valueStyle} />
  </Card>
);

export default StatisticCard;
```

- [ ] **Step 2: 创建 Dashboard 页面**

```tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Progress, Spin, Tag } from 'antd';
import {
  TeamOutlined,
  ProjectOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Pie, Column } from '@ant-design/charts';
import StatisticCard from '@/components/StatisticCard';
import {
  getDashboardOverview,
  getBudgetProgress,
  getProjectDistribution,
  getExpiringAlerts,
} from '@/services/dashboard';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetProgressItem[]>([]);
  const [projectData, setProjectData] = useState<ProjectDistributionItem[]>([]);
  const [alerts, setAlerts] = useState<ExpiringAlertItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, bpRes, pdRes, eaRes] = await Promise.all([
          getDashboardOverview(),
          getBudgetProgress(),
          getProjectDistribution(),
          getExpiringAlerts(),
        ]);
        setOverview(ovRes.data);
        setBudgetData(bpRes.data);
        setProjectData(pdRes.data);
        setAlerts(eaRes.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const alertColumns = [
    { title: '姓名', dataIndex: 'employeeName', key: 'employeeName' },
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo' },
    { title: '合同到期日', dataIndex: 'contractEnd', key: 'contractEnd' },
    {
      title: '剩余天数',
      dataIndex: 'daysRemaining',
      key: 'daysRemaining',
      render: (val: number) => (
        <Tag color={val <= 7 ? 'red' : val <= 14 ? 'orange' : 'blue'}>{val} 天</Tag>
      ),
    },
    { title: '所属项目', dataIndex: 'projectName', key: 'projectName' },
  ];

  const pieConfig = {
    data: projectData,
    angleField: 'employeeCount',
    colorField: 'projectName',
    radius: 0.8,
    label: { text: 'projectName', position: 'outside' as const },
    legend: { position: 'bottom' as const },
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="员工总数"
            value={overview?.totalEmployees ?? 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="在职员工"
            value={overview?.activeEmployees ?? 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="项目总数"
            value={overview?.totalProjects ?? 0}
            prefix={<ProjectOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="供应商数"
            value={overview?.totalSuppliers ?? 0}
            prefix={<ShopOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="预算使用进度">
            {budgetData.map((item) => (
              <div key={item.department} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{item.department}</span>
                  <span>
                    {item.usedAmount?.toLocaleString()} / {item.totalAmount?.toLocaleString()}
                  </span>
                </div>
                <Progress
                  percent={item.usagePercent}
                  status={item.usagePercent > 90 ? 'exception' : 'active'}
                />
              </div>
            ))}
            {budgetData.length === 0 && <div style={{ color: '#999' }}>暂无预算数据</div>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="项目人员分布">
            {projectData.length > 0 ? (
              <Pie {...pieConfig} height={300} />
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>暂无项目数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={
              <span>
                <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                即将到期提醒（30天内）
              </span>
            }
          >
            <Table
              dataSource={alerts}
              columns={alertColumns}
              rowKey="employeeNo"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无即将到期的合同' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add dashboard page with overview, budget progress, distribution and alerts"
```

---

## Task 11: 前端员工管理页面（CRUD + 导入）

**Files:**
- Create: `library-frontend/src/pages/Employee/index.tsx`
- Create: `library-frontend/src/pages/Employee/components/EmployeeForm.tsx`
- Create: `library-frontend/src/pages/Employee/components/ImportModal.tsx`
- Create: `library-frontend/src/pages/Employee/detail.tsx`

**Interfaces:**
- Consumes: employee service from Task 9, supplier service from Task 9
- Produces: 员工列表页（ProTable + 搜索 + 新增/编辑弹窗 + 导入弹窗 + 删除确认）

- [ ] **Step 1: 创建 EmployeeForm 组件**

```tsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber } from 'antd';
import type { Employee } from '@/typings/index.d';
import { getSuppliers } from '@/services/supplier';
import dayjs from 'dayjs';

interface EmployeeFormProps {
  visible: boolean;
  initialValues?: Employee | null;
  onCancel: () => void;
  onFinish: (values: any) => Promise<void>;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ visible, initialValues, onCancel, onFinish }) => {
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (visible) {
      getSuppliers().then((res) => setSuppliers(res.data));
    }
  }, [visible]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        contractStart: initialValues.contractStart ? dayjs(initialValues.contractStart) : undefined,
        contractEnd: initialValues.contractEnd ? dayjs(initialValues.contractEnd) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      contractStart: values.contractStart?.format('YYYY-MM-DD'),
      contractEnd: values.contractEnd?.format('YYYY-MM-DD'),
    };
    await onFinish(payload);
    form.resetFields();
  };

  return (
    <Modal
      title={initialValues ? '编辑员工' : '新增员工'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'ACTIVE' }}>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item name="employeeNo" label="工号" rules={[{ required: true, message: '请输入工号' }]}>
          <Input placeholder="请输入工号" disabled={!!initialValues} />
        </Form.Item>
        <Form.Item name="phone" label="手机号">
          <Input placeholder="请输入手机号" />
        </Form.Item>
        <Form.Item name="email" label="邮箱">
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item name="department" label="部门">
          <Input placeholder="请输入部门" />
        </Form.Item>
        <Form.Item name="position" label="职位">
          <Input placeholder="请输入职位" />
        </Form.Item>
        <Form.Item name="supplierId" label="供应商">
          <Select placeholder="请选择供应商" allowClear>
            {suppliers.map((s) => (
              <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="dailyRate" label="日费率">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入日费率" />
        </Form.Item>
        <Form.Item name="monthlySalary" label="月薪">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入月薪" />
        </Form.Item>
        <Form.Item name="costCenter" label="成本中心">
          <Input placeholder="请输入成本中心" />
        </Form.Item>
        <Form.Item name="contractNo" label="合同编号">
          <Input placeholder="请输入合同编号" />
        </Form.Item>
        <Form.Item name="contractStart" label="合同开始日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="contractEnd" label="合同结束日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmployeeForm;
```

- [ ] **Step 2: 创建 ImportModal 组件**

```tsx
import React, { useState } from 'react';
import { Modal, Upload, Button, Radio, message, Alert, List } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { importEmployees, exportTemplate } from '@/services/employee';

interface ImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ visible, onCancel, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>('excel');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!file) {
      message.warning('请先选择文件');
      return;
    }
    setLoading(true);
    try {
      const res = await importEmployees(file, format);
      setResult(res.data);
      if (res.data.failCount === 0) {
        message.success(`成功导入 ${res.data.successCount} 条记录`);
        onSuccess();
      } else {
        message.warning(`导入完成：成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`);
      }
    } catch (e) {
      message.error('导入失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await exportTemplate(format);
      const blob = new Blob([res.data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'excel' ? 'employee_template.xlsx' : 'employee_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('下载模板失败');
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onCancel();
  };

  return (
    <Modal
      title="批量导入员工"
      open={visible}
      onOk={handleImport}
      onCancel={handleClose}
      confirmLoading={loading}
      okText="开始导入"
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)}>
          <Radio.Button value="excel">Excel (.xlsx)</Radio.Button>
          <Radio.Button value="csv">CSV</Radio.Button>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
          下载导入模板
        </Button>
      </div>

      <Upload
        beforeUpload={(f) => { setFile(f); return false; }}
        maxCount={1}
        onRemove={() => setFile(null)}
      >
        <Button icon={<UploadOutlined />}>选择文件</Button>
      </Upload>

      {result && result.errors.length > 0 && (
        <Alert
          type="warning"
          message={`失败 ${result.failCount} 条`}
          description={
            <List
              size="small"
              dataSource={result.errors.slice(0, 10)}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          }
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  );
};

export default ImportModal;
```

- [ ] **Step 3: 创建员工列表页**

```tsx
import React, { useRef, useState } from 'react';
import { Button, Space, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/services/employee';
import EmployeeForm from './components/EmployeeForm';
import ImportModal from './components/ImportModal';

const statusMap: Record<string, { color: string; text: string }> = {
  ACTIVE: { color: 'green', text: '在职' },
  INACTIVE: { color: 'red', text: '离职' },
  ON_LEAVE: { color: 'orange', text: '休假' },
};

const EmployeeList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [formVisible, setFormVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<Employee | null>(null);

  const columns: ProColumns<Employee>[] = [
    { title: '工号', dataIndex: 'employeeNo', width: 100 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '部门', dataIndex: 'department', width: 100 },
    { title: '职位', dataIndex: 'position', width: 100, search: false },
    { title: '手机号', dataIndex: 'phone', width: 120, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: { ACTIVE: '在职', INACTIVE: '离职', ON_LEAVE: '休假' },
      render: (_, record) => {
        const s = statusMap[record.status];
        return s ? <Tag color={s.color}>{s.text}</Tag> : record.status;
      },
    },
    { title: '合同到期', dataIndex: 'contractEnd', width: 120, search: false },
    {
      title: '操作',
      width: 160,
      search: false,
      render: (_, record) => (
        <Space>
          <a onClick={() => { setCurrentRow(record); setFormVisible(true); }}>编辑</a>
          <Popconfirm title="确认删除该员工？" onConfirm={async () => {
            await deleteEmployee(record.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}>
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<Employee>
        headerTitle="员工列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getEmployees({
            current: params.current,
            pageSize: params.pageSize,
            name: params.name,
            department: params.department,
            status: params.status,
          });
          return {
            data: res.data.records,
            total: res.data.total,
            success: true,
          };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentRow(null); setFormVisible(true); }}>
            新增员工
          </Button>,
          <Button key="import" icon={<UploadOutlined />} onClick={() => setImportVisible(true)}>
            批量导入
          </Button>,
        ]}
      />
      <EmployeeForm
        visible={formVisible}
        initialValues={currentRow}
        onCancel={() => setFormVisible(false)}
        onFinish={async (values) => {
          if (currentRow) {
            await updateEmployee(currentRow.id, values);
            message.success('更新成功');
          } else {
            await createEmployee(values);
            message.success('创建成功');
          }
          setFormVisible(false);
          actionRef.current?.reload();
        }}
      />
      <ImportModal
        visible={importVisible}
        onCancel={() => setImportVisible(false)}
        onSuccess={() => {
          setImportVisible(false);
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default EmployeeList;
```

- [ ] **Step 4: 创建员工详情页**

```tsx
import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Spin, Tag, Button } from 'antd';
import { useParams, history } from 'umi';
import { getEmployee } from '@/services/employee';

const statusMap: Record<string, { color: string; text: string }> = {
  ACTIVE: { color: 'green', text: '在职' },
  INACTIVE: { color: 'red', text: '离职' },
  ON_LEAVE: { color: 'orange', text: '休假' },
};

const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (id) {
      getEmployee(Number(id))
        .then((res) => setEmployee(res.data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!employee) return <div>员工不存在</div>;

  const s = statusMap[employee.status];

  return (
    <Card
      title="员工详情"
      extra={<Button onClick={() => history.back()}>返回</Button>}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="姓名">{employee.name}</Descriptions.Item>
        <Descriptions.Item label="工号">{employee.employeeNo}</Descriptions.Item>
        <Descriptions.Item label="手机号">{employee.phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{employee.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="部门">{employee.department || '-'}</Descriptions.Item>
        <Descriptions.Item label="职位">{employee.position || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">
          {s ? <Tag color={s.color}>{s.text}</Tag> : employee.status}
        </Descriptions.Item>
        <Descriptions.Item label="日费率">{employee.dailyRate ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="月薪">{employee.monthlySalary ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="成本中心">{employee.costCenter || '-'}</Descriptions.Item>
        <Descriptions.Item label="合同编号">{employee.contractNo || '-'}</Descriptions.Item>
        <Descriptions.Item label="合同期限">
          {employee.contractStart || '-'} ~ {employee.contractEnd || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default EmployeeDetail;
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add employee list, form, import modal and detail page"
```

---

## Task 12: 前端项目管理、白名单、预算、供应商页面

**Files:**
- Create: `library-frontend/src/pages/Project/index.tsx`
- Create: `library-frontend/src/pages/Whitelist/index.tsx`
- Create: `library-frontend/src/pages/Budget/index.tsx`
- Create: `library-frontend/src/pages/Supplier/index.tsx`

**Interfaces:**
- Consumes: project/whitelist/budget/supplier services from Task 9
- Produces: 各管理页面组件

- [ ] **Step 1: 创建项目管理页面**

```tsx
import React, { useRef, useState } from 'react';
import { Button, Modal, Form, Input, DatePicker, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getProjects, createProject, updateProject, deleteProject } from '@/services/project';

const ProjectPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<Project | null>(null);
  const [form] = Form.useForm();

  const columns: ProColumns<Project>[] = [
    { title: '项目编码', dataIndex: 'code', width: 120 },
    { title: '项目名称', dataIndex: 'name', width: 200 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (_, r) => <Tag color={r.status === 'ACTIVE' ? 'green' : 'default'}>{r.status}</Tag>,
    },
    { title: '开始日期', dataIndex: 'startDate', width: 120, search: false },
    { title: '结束日期', dataIndex: 'endDate', width: 120, search: false },
    {
      title: '操作', width: 160, search: false,
      render: (_, record) => (
        <span>
          <a onClick={() => { setCurrentRow(record); form.setFieldsValue(record); setModalVisible(true); }} style={{ marginRight: 12 }}>编辑</a>
          <Popconfirm title="确认删除？" onConfirm={async () => { await deleteProject(record.id); message.success('删除成功'); actionRef.current?.reload(); }}>
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </span>
      ),
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startDate: values.startDate?.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
    };
    if (currentRow) {
      await updateProject(currentRow.id, payload);
      message.success('更新成功');
    } else {
      await createProject(payload);
      message.success('创建成功');
    }
    setModalVisible(false);
    form.resetFields();
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<Project>
        headerTitle="项目列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getProjects({ current: params.current, pageSize: params.pageSize, name: params.name });
          return { data: res.data.records, total: res.data.total, success: true };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentRow(null); form.resetFields(); setModalVisible(true); }}>
            新增项目
          </Button>,
        ]}
      />
      <Modal title={currentRow ? '编辑项目' : '新增项目'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="项目编码" rules={[{ required: true }]}><Input disabled={!!currentRow} /></Form.Item>
          <Form.Item name="startDate" label="开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="endDate" label="结束日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProjectPage;
```

- [ ] **Step 2: 创建白名单管理页面**

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { Button, Modal, Form, Select, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getWhitelist, createWhitelist, deleteWhitelist } from '@/services/whitelist';
import { getProjects } from '@/services/project';
import { getEmployees } from '@/services/employee';

const WhitelistPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    getProjects({ current: 1, pageSize: 100 }).then((res) => setProjects(res.data.records));
    getEmployees({ current: 1, pageSize: 500 }).then((res) => setEmployees(res.data.records));
  }, []);

  const columns: ProColumns<WhitelistEntry>[] = [
    { title: '项目', dataIndex: 'projectName', width: 200, search: false },
    { title: '员工', dataIndex: 'employeeName', width: 150, search: false },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (_, r) => <Tag color={r.status === 'APPROVED' ? 'green' : 'orange'}>{r.status}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, search: false },
    {
      title: '操作', width: 100, search: false,
      render: (_, record) => (
        <Popconfirm title="确认移除？" onConfirm={async () => { await deleteWhitelist(record.id); message.success('移除成功'); actionRef.current?.reload(); }}>
          <a style={{ color: 'red' }}>移除</a>
        </Popconfirm>
      ),
    },
  ];

  const handleAdd = async () => {
    const values = await form.validateFields();
    await createWhitelist(values);
    message.success('添加成功');
    setModalVisible(false);
    form.resetFields();
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<WhitelistEntry>
        headerTitle="白名单管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getWhitelist({ current: params.current, pageSize: params.pageSize, projectId: params.projectId ? Number(params.projectId) : undefined });
          return { data: res.data.records, total: res.data.total, success: true };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加白名单
          </Button>,
        ]}
      />
      <Modal title="添加白名单" open={modalVisible} onOk={handleAdd} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="项目" rules={[{ required: true }]}>
            <Select placeholder="选择项目">
              {projects.map((p) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="employeeId" label="员工" rules={[{ required: true }]}>
            <Select placeholder="选择员工" showSearch optionFilterProp="children">
              {employees.map((e) => <Select.Option key={e.id} value={e.id}>{e.name} ({e.employeeNo})</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default WhitelistPage;
```

- [ ] **Step 3: 创建预算管理页面**

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Progress } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getBudgets, createBudget, updateBudget } from '@/services/budget';
import { getProjects } from '@/services/project';

const BudgetPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<Budget | null>(null);
  const [form] = Form.useForm();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    getProjects({ current: 1, pageSize: 100 }).then((res) => setProjects(res.data.records));
  }, []);

  const columns: ProColumns<Budget>[] = [
    { title: '项目', dataIndex: 'projectName', width: 200, search: false },
    { title: '部门', dataIndex: 'department', width: 120 },
    { title: '预算总额', dataIndex: 'totalAmount', width: 120, search: false, render: (_, r) => r.totalAmount?.toLocaleString() },
    { title: '已使用', dataIndex: 'usedAmount', width: 120, search: false, render: (_, r) => r.usedAmount?.toLocaleString() },
    {
      title: '使用率', width: 150, search: false,
      render: (_, r) => {
        const pct = r.totalAmount > 0 ? Math.round((r.usedAmount / r.totalAmount) * 100) : 0;
        return <Progress percent={pct} size="small" status={pct > 90 ? 'exception' : 'active'} />;
      },
    },
    { title: '起止日期', width: 200, search: false, render: (_, r) => `${r.startDate || '-'} ~ ${r.endDate || '-'}` },
    {
      title: '操作', width: 100, search: false,
      render: (_, record) => (
        <a onClick={() => { setCurrentRow(record); form.setFieldsValue(record); setModalVisible(true); }}>编辑</a>
      ),
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startDate: values.startDate?.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
    };
    if (currentRow) {
      await updateBudget(currentRow.id, payload);
      message.success('更新成功');
    } else {
      await createBudget(payload);
      message.success('创建成功');
    }
    setModalVisible(false);
    form.resetFields();
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<Budget>
        headerTitle="预算管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getBudgets({ current: params.current, pageSize: params.pageSize, department: params.department });
          return { data: res.data.records, total: res.data.total, success: true };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentRow(null); form.resetFields(); setModalVisible(true); }}>
            新增预算
          </Button>,
        ]}
      />
      <Modal title={currentRow ? '编辑预算' : '新增预算'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="项目" rules={[{ required: true }]}>
            <Select placeholder="选择项目" disabled={!!currentRow}>
              {projects.map((p) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="department" label="部门" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="totalAmount" label="预算总额" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="startDate" label="开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="endDate" label="结束日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default BudgetPage;
```

- [ ] **Step 4: 创建供应商管理页面**

```tsx
import React, { useRef, useState } from 'react';
import { Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getSuppliers, createSupplier } from '@/services/supplier';

const SupplierPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const columns: ProColumns<Supplier>[] = [
    { title: '供应商名称', dataIndex: 'name', width: 200 },
    { title: '联系人', dataIndex: 'contact', width: 120, search: false },
    { title: '联系电话', dataIndex: 'phone', width: 150, search: false },
  ];

  const handleAdd = async () => {
    const values = await form.validateFields();
    await createSupplier(values);
    message.success('创建成功');
    setModalVisible(false);
    form.resetFields();
    actionRef.current?.reload();
  };

  return (
    <>
      <ProTable<Supplier>
        headerTitle="供应商列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const res = await getSuppliers();
          return { data: res.data, total: res.data.length, success: true };
        }}
        search={false}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新增供应商
          </Button>,
        ]}
      />
      <Modal title="新增供应商" open={modalVisible} onOk={handleAdd} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contact" label="联系人"><Input /></Form.Item>
          <Form.Item name="phone" label="联系电话"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SupplierPage;
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add project, whitelist, budget and supplier management pages"
```

---

## Task 13: 前端 Dockerfile 与 Nginx 配置

**Files:**
- Create: `library-frontend/Dockerfile`
- Create: `library-frontend/nginx.conf`

**Interfaces:**
- Consumes: 完整前端项目 from Task 8-12

- [ ] **Step 1: 创建 nginx.conf**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 10m;
    }
}
```

- [ ] **Step 2: 创建 Dockerfile**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: add Dockerfile and nginx configuration"
```

---

## Task 14: Docker Compose 编排

**Files:**
- Create: `library-backend/docker-compose.yml`（放在后端仓库根目录）

**Interfaces:**
- Consumes: 前后端 Dockerfile from Task 7 和 Task 13

- [ ] **Step 1: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: library-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: library
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: library-backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/library?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root123
    depends_on:
      mysql:
        condition: service_healthy

  frontend:
    build:
      context: ../library-frontend
      dockerfile: Dockerfile
    container_name: library-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql-data:
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: add docker-compose for full stack deployment"
```

---

## 跨仓对齐检查清单

| 检查项 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| API 路径前缀 `/api/v1` | `.umirc.ts` proxy + `services/api.ts` baseURL | Controller `@RequestMapping` | ✅ 对齐 |
| 分页参数 `current`/`pageSize` | ProTable request params | MyBatis-Plus Page 参数 | ✅ 对齐 |
| 响应格式 `{code, message, data}` | axios 拦截器解包 `res.data` | `Result<T>` 包装 | ✅ 对齐 |
| 日期格式 `yyyy-MM-dd` | dayjs format('YYYY-MM-DD') | LocalDate 序列化 | ✅ 对齐 |
| 文件上传 multipart/form-data | FormData + Content-Type | `@RequestParam MultipartFile` | ✅ 对齐 |
| 员工字段驼峰命名 | TypeScript interface | Java Entity (mapUnderscoreToCamelCase) | ✅ 对齐 |
| 导入接口参数 file + format | FormData append | `@RequestParam` | ✅ 对齐 |

---

## 执行顺序依赖图

```
Task 1 (后端基础) ──→ Task 2 (实体) ──→ Task 3 (Mapper/DTO) ──→ Task 4 (员工API)
                                                              ──→ Task 5 (项目/白名单/预算API)
                                                              ──→ Task 6 (看板API)
                                                              ──→ Task 7 (Docker/测试)

Task 8 (前端基础) ──→ Task 9 (Service层) ──→ Task 10 (Dashboard页)
                                          ──→ Task 11 (员工管理页)
                                          ──→ Task 12 (其他管理页)
                                          ──→ Task 13 (Docker/Nginx)

Task 7 + Task 13 ──→ Task 14 (Docker Compose)
```

前端 Task 8-13 与后端 Task 1-7 可并行开发（通过 API 契约对齐）。
", "file_path": "/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-029ed802-0776-4d82-9b3a-69faba53c3d6/worktree/library-frontend-main/.agents/system.changes/plan.md"}