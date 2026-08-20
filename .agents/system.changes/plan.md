# 成本统计报表（Cost Report）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为企业提供成本统计报表：前端 Dashboard 与成本统计分析页面按 部门/项目/业务线/人员/月份/季度/年度 维度统计 人力成本（开发/测试/产品/运维）与 项目成本（预算/实际消耗/预算占比/预计超支金额），并支持 Excel/CSV 报表导出。

**Architecture:** 前后端分离。后端（library-backend）Spring Boot 3 + MyBatis-Plus 提供 `/api/cost/*` 统计与导出接口，内置 H2 种子数据保证可独立运行与测试；前端（library-frontend）React + Vite + Ant Design + ECharts 提供 `/`（Dashboard）与 `/cost-analysis`（统计分析）两个独立路由页面，通过 Vite dev proxy 联调。统计聚合在 Service 层用 Java 完成（维度键分组 + 指标计算），跨仓以统一 JSON 契约对齐。

**Tech Stack:** React 18.3 + TypeScript 5 + Vite 5 + Ant Design 5 + ECharts 5 + axios + Vitest；Java 17 + Spring Boot 3.2 + MyBatis-Plus 3.5 + H2（测试/演示）+ Apache POI 5.2（Excel 导出） + JUnit 5/MockMvc。

## Global Constraints

以下为全计划硬性约束（来自需求描述与既有设计文档 dima.md，逐条执行，不再重复）：

- 统计维度枚举（后端校验值、前端下拉选项值完全一致）：`department`（部门）、`project`（项目）、`business_line`（业务线）、`employee`（人员）、`month`（月份）、`quarter`（季度）、`year`（年度）。
- 岗位角色枚举：`DEV`（开发）、`TEST`（测试）、`PM`（产品）、`OPS`（运维）。
- 指标口径：
  - 人力成本 = 人力成本事实表 `labor_cost` 按角色/维度汇总；
  - 项目预算 = `project.budget_amount`（年度总额，不按时间分摊）；
  - 实际消耗 = `project_cost` 事实表汇总；
  - 预算占比 = 实际消耗 ÷ 项目预算 × 100（百分比，保留 2 位小数，预算为 0 时记 0.00%）；
  - 预计超支金额 = 实际消耗 − 项目预算（超支为正，未超支为负/0）。
- 时间维度口径：`quarter` 键为 `YYYY-Qn`，`month` 键为 `YYYY-MM`，`year` 键为 `YYYY`；月度/季度/年度的「项目预算」口径为当期有成本发生的去重项目预算合计（每项目每键只计一次），「实际消耗」为当期逐月实际合计。
- 角色筛选作用域：全报表（人力成本与项目成本归属同时受角色过滤影响；被过滤角色的人员不出现在 `employee` 维度）。
- API 契约：统一前缀 `/api`；统一响应体 `{ "code": 0, "message": "ok", "data": ... }`，错误时 code 非 0（400 参数错误 / 500 内部错误）。
- 金额精度：数据库 `DECIMAL(12,2)`，前端统一 `Intl.NumberFormat('zh-CN', CNY, 2位小数)` 展示；JSON 中金额为 number。
- 日期/时间格式：年份 `YYYY`，月份 `YYYY-MM`，季度 `Q1`~`Q4`。
- 数据来源：两仓均为空骨架且无外部数据源输入，故采用内置种子数据（backend `schema.sql` + `data.sql`，H2 内存库），接口契约预留（不引入额外依赖），后续可替换为真实数据源。
- 导出格式：`xlsx`（Apache POI）与 `csv` 两种；`GET /api/cost/export` 通过 `format` 参数选择。
- 页面形态：独立路由 —— `/` = Dashboard（成本总览），`/cost-analysis` = 成本统计分析（维度筛选 + 表格 + 图表 + 导出）。
- 前端技术栈以兼容性为准使用 React 18.3（如需升级 React 19 须额外引入 `@ant-design/v5-patch-for-react-19`，本计划不采用）。
- 提交规范：每个任务的 Commit 步骤必须附加 trailer（空行之后）：
  ```
  Co-authored-by: DTCoder <noreply@dtcoder.local>
  ```
- 禁止引入本计划未声明的第三方依赖；禁止修改 `main` 分支提交历史（仅 `git add/commit` 当前任务分支）。

---

## 跨仓接口契约（前后端对齐基准）

本节为双向对齐点，后端实现与前端类型/调用必须与此完全一致：

| 接口 | 方法/路径 | 请求参数 | 响应 `data` |
|---|---|---|---|
| 总览 | `GET /api/cost/summary` | `year=YYYY`（缺省取当前年） | `CostSummaryDTO`：`{totalCost, laborCost, projectCost, laborRatio, projectRatio, overBudgetCount, monthlyTrend:[{month,laborCost,projectCost,totalCost}]}` |
| 统计分析 | `GET /api/cost/analysis` | `dimension`（必填，7 枚举之一）、`year`、`month`（YYYY-MM）、`quarter`（Q1-Q4）、`role`（DEV/TEST/PM/OPS） | `{records:[CostAnalysisItem], total}`；`CostAnalysisItem = {name, laborCost, projectBudget, projectActual, budgetRatio, overBudgetAmount}` |
| 导出 | `GET /api/cost/export` | `dimension`、`year`、`month`、`quarter`、`role`、`format=xlsx\|csv` | 文件流（Content-Disposition attachment；xlsx: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`；csv: `text/csv;charset=UTF-8`） |

- 前端 axios baseURL `/api`；请求以 query 参数传递，参数名与后端 `AnalysisQuery` 字段名一致（camelCase）。
- 金额字段在 JSON 中为 number；百分比字段为 number（如 66.25 表示 66.25%）。

---

## 后端任务（library-backend）

### Task 1: 后端脚手架与统一响应

**Files:**
- Create: `library-backend/pom.xml`
- Create: `library-backend/src/main/resources/application.yml`
- Create: `library-backend/src/main/java/com/library/cost/CostApplication.java`
- Create: `library-backend/src/main/java/com/library/cost/common/ApiResponse.java`
- Create: `library-backend/src/main/java/com/library/cost/common/GlobalExceptionHandler.java`
- Test: `library-backend/src/test/java/com/library/cost/CostApplicationTests.java`

**Interfaces:**
- Produces: `ApiResponse<T>`（record `ApiResponse(int code, String message, T data)`，静态方法 `ok(T)` / `fail(int,String)`），后续所有 Controller 返回类型。

- [ ] **Step 1: 创建 `pom.xml`**

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
  <version>0.0.1-SNAPSHOT</version>
  <name>library-backend</name>
  <description>成本统计报表后端</description>
  <properties>
    <java.version>17</java.version>
    <mybatis-plus.version>3.5.5</mybatis-plus.version>
    <poi.version>5.2.5</poi.version>
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
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>com.mysql</groupId>
      <artifactId>mysql-connector-j</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.apache.poi</groupId>
      <artifactId>poi-ooxml</artifactId>
      <version>${poi.version}</version>
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

- [ ] **Step 2: 创建 `application.yml`**

```yaml
server:
  port: 8080

spring:
  application:
    name: library-backend
  datasource:
    url: jdbc:h2:mem:costdb;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE
    driver-class-name: org.h2.Driver
    username: sa
    password: ""
  sql:
    init:
      mode: always
      schema-locations: classpath:schema.sql
      data-locations: classpath:data.sql
  h2:
    console:
      enabled: true

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
```

> 说明：默认使用 H2 内存库（含种子数据），保证无外部依赖可运行；`mysql-connector-j` 仅保留运行时依赖，切换 MySQL 时替换 datasource 配置即可（本计划不切换）。

- [ ] **Step 3: 创建启动类 `CostApplication.java`**

```java
package com.library.cost;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.library.cost.mapper")
public class CostApplication {

    public static void main(String[] args) {
        SpringApplication.run(CostApplication.class, args);
    }
}
```

- [ ] **Step 4: 创建统一响应 `common/ApiResponse.java`**

```java
package com.library.cost.common;

public record ApiResponse<T>(int code, String message, T data) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(0, "ok", data);
    }

    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
```

- [ ] **Step 5: 创建异常处理器 `common/GlobalExceptionHandler.java`**

```java
package com.library.cost.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return ApiResponse.fail(400, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleOther(Exception ex) {
        return ApiResponse.fail(500, "服务器内部错误: " + ex.getMessage());
    }
}
```

- [ ] **Step 6: 编写上下文加载测试 `CostApplicationTests.java`**

```java
package com.library.cost;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CostApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

- [ ] **Step 7: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；`Tests run: 1, Failures: 0`（contextLoads 通过；若 schema.sql/data.sql 尚不存在，本任务临时用空文件占位，Task 2 填充）。

> 注：若 `spring.sql.init` 找不到 classpath 上的 schema.sql/data.sql 会启动失败。本任务先创建两个空资源文件 `src/main/resources/schema.sql` 与 `src/main/resources/data.sql`（各含一行 SQL 注释 `-- placeholder`），Task 2 覆盖为真实内容。

- [ ] **Step 8: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add pom.xml src
git commit -m "feat: 初始化 Spring Boot 脚手架与统一响应体

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

### Task 2: 数据模型、表结构与种子数据

**Files:**
- Create: `library-backend/src/main/resources/schema.sql`（覆盖 Task 1 占位文件）
- Create: `library-backend/src/main/resources/data.sql`（覆盖 Task 1 占位文件）
- Create: `library-backend/src/main/java/com/library/cost/entity/Department.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/BusinessLine.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/Project.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/Employee.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/LaborCost.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/ProjectCost.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/DepartmentMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/BusinessLineMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/ProjectMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/EmployeeMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/LaborCostMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/ProjectCostMapper.java`
- Test: `library-backend/src/test/java/com/library/cost/SeedDataMapperTest.java`

**Interfaces:**
- Produces: 6 张表与 6 个 `BaseMapper<T>`；实体字段与表列一一对应（下划线↔驼峰）。

- [ ] **Step 1: 创建 `schema.sql`**

```sql
DROP TABLE IF EXISTS labor_cost;
DROP TABLE IF EXISTS project_cost;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS business_line;

CREATE TABLE department (
  id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64)  NOT NULL,
  code VARCHAR(32)  NOT NULL UNIQUE
);

CREATE TABLE business_line (
  id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64)  NOT NULL,
  code VARCHAR(32)  NOT NULL UNIQUE
);

CREATE TABLE project (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(32)  NOT NULL UNIQUE,
  business_line_id BIGINT      NOT NULL,
  department_id   BIGINT       NOT NULL,
  budget_amount   DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE employee (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(64) NOT NULL,
  employee_no   VARCHAR(32) NOT NULL UNIQUE,
  department_id BIGINT      NOT NULL,
  role          VARCHAR(16) NOT NULL
);

CREATE TABLE labor_cost (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT       NOT NULL,
  project_id  BIGINT       NOT NULL,
  month       VARCHAR(7)   NOT NULL,
  amount      DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE project_cost (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id   BIGINT       NOT NULL,
  month        VARCHAR(7)   NOT NULL,
  actual_amount DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_labor_month ON labor_cost(month);
CREATE INDEX idx_project_cost_month ON project_cost(month);
```

- [ ] **Step 2: 创建 `data.sql`（种子数据，含验收基准数值）**

```sql
INSERT INTO department (id, name, code) VALUES
  (1, '研发部', 'DEV-DEPT'),
  (2, '产品部', 'PM-DEPT');

INSERT INTO business_line (id, name, code) VALUES
  (1, '金融科技线', 'FINTECH'),
  (2, '数字企业线', 'DIGITAL');

INSERT INTO project (id, name, code, business_line_id, department_id, budget_amount) VALUES
  (1, '核心交易系统', 'TRADE',   1, 1, 1000000.00),
  (2, '数据中台',     'DATAPLT', 1, 1,  400000.00),
  (3, '客户门户',     'PORTAL',  2, 2,  600000.00),
  (4, '运维支撑平台', 'OPSPLT',  2, 1,  400000.00);

INSERT INTO employee (id, name, employee_no, department_id, role) VALUES
  (1, '张三', 'P001', 1, 'DEV'),
  (2, '李四', 'P002', 1, 'TEST'),
  (3, '王五', 'P003', 2, 'PM'),
  (4, '赵六', 'P004', 1, 'OPS');

INSERT INTO labor_cost (employee_id, project_id, month, amount) VALUES
  (1, 1, '2025-01', 20000.00), (2, 1, '2025-01', 15000.00), (3, 3, '2025-01', 18000.00), (4, 4, '2025-01', 16000.00),
  (1, 1, '2025-02', 20000.00), (2, 1, '2025-02', 15000.00), (3, 3, '2025-02', 18000.00), (4, 4, '2025-02', 16000.00),
  (1, 1, '2025-03', 20000.00), (2, 1, '2025-03', 15000.00), (3, 3, '2025-03', 18000.00), (4, 4, '2025-03', 16000.00),
  (1, 1, '2025-04', 20000.00), (2, 1, '2025-04', 15000.00), (3, 3, '2025-04', 18000.00), (4, 4, '2025-04', 16000.00),
  (1, 1, '2025-05', 20000.00), (2, 1, '2025-05', 15000.00), (3, 3, '2025-05', 18000.00), (4, 4, '2025-05', 16000.00),
  (1, 1, '2025-06', 20000.00), (2, 1, '2025-06', 15000.00), (3, 3, '2025-06', 18000.00), (4, 4, '2025-06', 16000.00);

INSERT INTO project_cost (project_id, month, actual_amount) VALUES
  (1, '2025-01', 100000.00), (2, '2025-01', 80000.00), (3, '2025-01', 50000.00), (4, '2025-01', 35000.00),
  (1, '2025-02', 100000.00), (2, '2025-02', 80000.00), (3, '2025-02', 50000.00), (4, '2025-02', 35000.00),
  (1, '2025-03', 100000.00), (2, '2025-03', 80000.00), (3, '2025-03', 50000.00), (4, '2025-03', 35000.00),
  (1, '2025-04', 100000.00), (2, '2025-04', 80000.00), (3, '2025-04', 50000.00), (4, '2025-04', 35000.00),
  (1, '2025-05', 100000.00), (2, '2025-05', 80000.00), (3, '2025-05', 50000.00), (4, '2025-05', 35000.00),
  (1, '2025-06', 100000.00), (2, '2025-06', 80000.00), (3, '2025-06', 50000.00), (4, '2025-06', 35000.00);
```

> 基准数值（Task 3/4 测试断言依据，2025 全年）：人力成本 414000.00；项目实际 1590000.00；总成本 2004000.00；人力占比 20.66%；项目占比 79.34%；预算合计 2400000.00；超支项目数 1（数据中台：实际 480000 > 预算 400000，超支 80000.00）；研发部（dept 1）人力 306000.00/预算 1800000.00/实际 1290000.00/占比 71.67%；产品部（dept 2）人力 108000.00/预算 600000.00/实际 300000.00/占比 50.00%。

- [ ] **Step 3: 创建 6 个实体类（B 站模式：@Data + @TableName）**

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("department")
public class Department {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("business_line")
public class BusinessLine {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("project")
public class Project {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private Long businessLineId;
    private Long departmentId;
    private BigDecimal budgetAmount;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("employee")
public class Employee {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String employeeNo;
    private Long departmentId;
    private String role;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("labor_cost")
public class LaborCost {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long employeeId;
    private Long projectId;
    private String month;
    private BigDecimal amount;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("project_cost")
public class ProjectCost {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private String month;
    private BigDecimal actualAmount;
}
```

- [ ] **Step 4: 创建 6 个 Mapper（BaseMapper 模板）**

以 `DepartmentMapper` 为例，其余 5 个仅类名/实体类型不同：

```java
package com.library.cost.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.cost.entity.Department;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DepartmentMapper extends BaseMapper<Department> {
}
```

其余 5 个文件：
- `BusinessLineMapper extends BaseMapper<BusinessLine>`
- `ProjectMapper extends BaseMapper<Project>`
- `EmployeeMapper extends BaseMapper<Employee>`
- `LaborCostMapper extends BaseMapper<LaborCost>`
- `ProjectCostMapper extends BaseMapper<ProjectCost>`
- 每个文件与上述完全同构（`@Mapper` + `extends BaseMapper<对应实体>`），以 `BusinessLine` 建立各文件。

- [ ] **Step 5: 编写种子数据验证测试 `SeedDataMapperTest.java`**

```java
package com.library.cost;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.library.cost.entity.Department;
import com.library.cost.entity.LaborCost;
import com.library.cost.entity.ProjectCost;
import com.library.cost.mapper.DepartmentMapper;
import com.library.cost.mapper.LaborCostMapper;
import com.library.cost.mapper.ProjectCostMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class SeedDataMapperTest {

    @Autowired
    private DepartmentMapper departmentMapper;
    @Autowired
    private LaborCostMapper laborCostMapper;
    @Autowired
    private ProjectCostMapper projectCostMapper;

    @Test
    void seedDataLoaded() {
        assertThat(departmentMapper.selectList(null)).hasSize(2);
        List<LaborCost> laborCosts = laborCostMapper.selectList(new QueryWrapper<>());
        assertThat(laborCosts).hasSize(24);
        BigDecimal totalLabor = laborCosts.stream()
                .map(LaborCost::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalLabor).isEqualByComparingTo("414000.00");

        List<ProjectCost> projectCosts = projectCostMapper.selectList(new QueryWrapper<>());
        assertThat(projectCosts).hasSize(24);
        BigDecimal totalActual = projectCosts.stream()
                .map(ProjectCost::getActualAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalActual).isEqualByComparingTo("1590000.00");
    }
}
```

- [ ] **Step 6: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；新增测试 2 项全过（schema/data 正确加载、聚合基准数值匹配）。

- [ ] **Step 7: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add src/main/resources/schema.sql src/main/resources/data.sql src/main/java/com/library/cost/entity src/main/java/com/library/cost/mapper src/test/java/com/library/cost/SeedDataMapperTest.java
git commit -m "feat: 建成本统计表结构、种子数据与实体/Mapper

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

### Task 3: 统计服务（聚合引擎）

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/dto/LaborCostRow.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/ProjectCostRow.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/MonthlyTrendItem.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/CostSummaryDTO.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/CostAnalysisItem.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/AnalysisResponse.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/AnalysisQuery.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/CostReportMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/service/CostService.java`
- Create: `library-backend/src/main/java/com/library/cost/service/CostServiceImpl.java`
- Test: `library-backend/src/test/java/com/library/cost/CostServiceImplTest.java`

**Interfaces:**
- Consumes: Task 2 的 6 个 `BaseMapper`、`LaborCostRow`/`ProjectCostRow`（由 `CostReportMapper` 的 `@Select` 返回）。
- Produces:
  - `CostService.summary(String year) → CostSummaryDTO`
  - `CostService.analysis(AnalysisQuery) → AnalysisResponse`
  - `CostService.queryItems(AnalysisQuery) → List<CostAnalysisItem>`

- [ ] **Step 1: 创建行 DTO（report mapper 返回类型，record）**

```java
package com.library.cost.dto;

import java.math.BigDecimal;

public record LaborCostRow(Long projectId, String month, BigDecimal amount,
                           String role, Long departmentId, Long businessLineId,
                           Long employeeId) {
}
```

```java
package com.library.cost.dto;

import java.math.BigDecimal;

public record ProjectCostRow(Long projectId, String month, BigDecimal actualAmount,
                             Long departmentId, Long businessLineId,
                             BigDecimal budgetAmount) {
}
```

- [ ] **Step 2: 创建结果 DTO**

```java
package com.library.cost.dto;

import java.math.BigDecimal;
import java.util.List;

public record MonthlyTrendItem(String month, BigDecimal laborCost,
                               BigDecimal projectCost, BigDecimal totalCost) {
}
```

```java
package com.library.cost.dto;

import java.math.BigDecimal;
import java.util.List;

public record CostSummaryDTO(BigDecimal totalCost, BigDecimal laborCost,
                             BigDecimal projectCost, double laborRatio,
                             double projectRatio, int overBudgetCount,
                             List<MonthlyTrendItem> monthlyTrend) {
}
```

```java
package com.library.cost.dto;

import java.math.BigDecimal;

public record CostAnalysisItem(String name, BigDecimal laborCost,
                               BigDecimal projectBudget, BigDecimal projectActual,
                               double budgetRatio, BigDecimal overBudgetAmount) {
}
```

```java
package com.library.cost.dto;

import java.util.List;

public record AnalysisResponse(List<CostAnalysisItem> records, long total) {
}
```

```java
package com.library.cost.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisQuery {
    private String dimension;
    private String year;
    private String month;
    private String quarter;
    private String role;
}
```

- [ ] **Step 3: 创建 `CostReportMapper`（两张聚合事实查询）**

```java
package com.library.cost.mapper;

import com.library.cost.dto.LaborCostRow;
import com.library.cost.dto.ProjectCostRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CostReportMapper {

    @Select("""
            SELECT lc.project_id AS projectId, lc.month AS month, lc.amount AS amount,
                   e.role AS role, e.department_id AS departmentId,
                   p.business_line_id AS businessLineId, lc.employee_id AS employeeId
            FROM labor_cost lc
            JOIN employee e ON lc.employee_id = e.id
            JOIN project p ON lc.project_id = p.id
            WHERE lc.month LIKE CONCAT(#{year}, '%')
            """)
    List<LaborCostRow> selectLaborRows(@Param("year") String year);

    @Select("""
            SELECT pc.project_id AS projectId, pc.month AS month,
                   pc.actual_amount AS actualAmount,
                   p.department_id AS departmentId,
                   p.business_line_id AS businessLineId,
                   p.budget_amount AS budgetAmount
            FROM project_cost pc
            JOIN project p ON pc.project_id = p.id
            WHERE pc.month LIKE CONCAT(#{year}, '%')
            """)
    List<ProjectCostRow> selectProjectCostRows(@Param("year") String year);
}
```

- [ ] **Step 4: 创建 `CostService` 接口**

```java
package com.library.cost.service;

import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.AnalysisResponse;
import com.library.cost.dto.CostAnalysisItem;
import com.library.cost.dto.CostSummaryDTO;

import java.util.List;

public interface CostService {

    CostSummaryDTO summary(String year);

    AnalysisResponse analysis(AnalysisQuery query);

    List<CostAnalysisItem> queryItems(AnalysisQuery query);
}
```

- [ ] **Step 5: 创建 `CostServiceImpl`（核心聚合实现）**

```java
package com.library.cost.service;

import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.AnalysisResponse;
import com.library.cost.dto.CostAnalysisItem;
import com.library.cost.dto.CostSummaryDTO;
import com.library.cost.dto.LaborCostRow;
import com.library.cost.dto.MonthlyTrendItem;
import com.library.cost.dto.ProjectCostRow;
import com.library.cost.entity.Project;
import com.library.cost.mapper.BusinessLineMapper;
import com.library.cost.mapper.CostReportMapper;
import com.library.cost.mapper.DepartmentMapper;
import com.library.cost.mapper.EmployeeMapper;
import com.library.cost.mapper.ProjectMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
public class CostServiceImpl implements CostService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final Set<String> DIMENSIONS = Set.of(
            "department", "project", "business_line", "employee", "month", "quarter", "year");
    private static final Set<String> ROLES = Set.of("DEV", "TEST", "PM", "OPS");

    private final CostReportMapper costReportMapper;
    private final DepartmentMapper departmentMapper;
    private final BusinessLineMapper businessLineMapper;
    private final EmployeeMapper employeeMapper;
    private final ProjectMapper projectMapper;

    public CostServiceImpl(CostReportMapper costReportMapper, DepartmentMapper departmentMapper,
                           BusinessLineMapper businessLineMapper, EmployeeMapper employeeMapper,
                           ProjectMapper projectMapper) {
        this.costReportMapper = costReportMapper;
        this.departmentMapper = departmentMapper;
        this.businessLineMapper = businessLineMapper;
        this.employeeMapper = employeeMapper;
        this.projectMapper = projectMapper;
    }

    @Override
    public CostSummaryDTO summary(String year) {
        String resolvedYear = resolveYear(year);
        List<LaborCostRow> laborRows = costReportMapper.selectLaborRows(resolvedYear);
        List<ProjectCostRow> costRows = costReportMapper.selectProjectCostRows(resolvedYear);

        BigDecimal laborCost = sumAmounts(laborRows.stream().map(LaborCostRow::amount).toList());
        BigDecimal projectCost = sumAmounts(costRows.stream().map(ProjectCostRow::actualAmount).toList());
        BigDecimal totalCost = laborCost.add(projectCost);

        Set<String> months = new TreeSet<>();
        laborRows.forEach(r -> months.add(r.month()));
        costRows.forEach(r -> months.add(r.month()));
        List<MonthlyTrendItem> trend = new ArrayList<>();
        for (String month : months) {
            BigDecimal ml = sumAmounts(laborRows.stream()
                    .filter(r -> r.month().equals(month)).map(LaborCostRow::amount).toList());
            BigDecimal mp = sumAmounts(costRows.stream()
                    .filter(r -> r.month().equals(month)).map(ProjectCostRow::actualAmount).toList());
            trend.add(new MonthlyTrendItem(month, ml, mp, ml.add(mp)));
        }

        Map<Long, ProjectTotals> byProject = buildProjectTotals(costRows);
        long overBudget = byProject.values().stream()
                .filter(t -> t.actual.compareTo(t.budget) > 0)
                .count();

        return new CostSummaryDTO(
                totalCost, laborCost, projectCost,
                ratio(laborCost, totalCost), ratio(projectCost, totalCost),
                (int) overBudget, trend);
    }

    @Override
    public AnalysisResponse analysis(AnalysisQuery query) {
        List<CostAnalysisItem> items = queryItems(query);
        return new AnalysisResponse(items, items.size());
    }

    @Override
    public List<CostAnalysisItem> queryItems(AnalysisQuery query) {
        String dimension = requireDimension(query.getDimension());
        String resolvedYear = resolveYear(query.getYear());
        String month = blankToNull(query.getMonth());
        String quarter = blankToNull(query.getQuarter());
        String role = blankToNull(query.getRole());
        validatePeriod(month, quarter);
        if (role != null && !ROLES.contains(role.toUpperCase())) {
            throw new IllegalArgumentException("不支持的岗位角色: " + role);
        }

        List<LaborCostRow> laborRows = costReportMapper.selectLaborRows(resolvedYear).stream()
                .filter(r -> matchesPeriod(r.month(), month, quarter))
                .filter(r -> role == null || r.role().equalsIgnoreCase(role))
                .toList();
        List<ProjectCostRow> costRows = costReportMapper.selectProjectCostRows(resolvedYear).stream()
                .filter(r -> matchesPeriod(r.month(), month, quarter))
                .toList();

        Map<Long, Project> projectsById = projectMapper.selectList(null).stream()
                .collect(Collectors.toMap(Project::getId, p -> p));

        Map<String, BigDecimal> laborByKey = new LinkedHashMap<>();
        for (LaborCostRow r : laborRows) {
            laborByKey.merge(laborDimKey(r, dimension, resolvedYear), r.amount(), BigDecimal::add);
        }

        // 员工 → 参与项目 映射（用于 employee 维度与角色过滤联动）
        Map<Long, Set<Long>> projectEmployeeIds = new HashMap<>();
        for (LaborCostRow r : laborRows) {
            projectEmployeeIds.computeIfAbsent(r.projectId(), k -> new HashSet<>()).add(r.employeeId());
        }

        Map<String, CostAgg> aggByKey = new LinkedHashMap<>();
        Set<String> projectBudgetKeys = new HashSet<>();
        for (ProjectCostRow row : costRows) {
            Project project = projectsById.get(row.projectId());
            if (project == null) {
                continue;
            }
            List<String> keys = isTimeDimension(dimension)
                    ? List.of(timeKey(row.month(), dimension, resolvedYear))
                    : entityDimKeys(project, dimension, projectEmployeeIds.getOrDefault(row.projectId(), Set.of()));
            for (String key : keys) {
                CostAgg agg = aggByKey.computeIfAbsent(key, k -> new CostAgg());
                agg.projectActual = agg.projectActual.add(row.actualAmount());
                String budgetKey = key + "#" + row.projectId();
                if (projectBudgetKeys.add(budgetKey)) {
                    agg.projectBudget = agg.projectBudget.add(row.budgetAmount());
                }
            }
        }
        for (Map.Entry<String, BigDecimal> e : laborByKey.entrySet()) {
            aggByKey.computeIfAbsent(e.getKey(), k -> new CostAgg()).laborCost = e.getValue();
        }

        Map<String, String> names = dimNames(dimension, projectsById);
        List<CostAnalysisItem> items = new ArrayList<>();
        for (Map.Entry<String, CostAgg> e : aggByKey.entrySet()) {
            CostAgg a = e.getValue();
            String label = isTimeDimension(dimension) ? e.getKey() : names.getOrDefault(e.getKey(), e.getKey());
            items.add(new CostAnalysisItem(
                    label,
                    a.laborCost,
                    a.projectBudget,
                    a.projectActual,
                    ratio(a.projectActual, a.projectBudget),
                    a.projectActual.subtract(a.projectBudget)));
        }
        items.sort(Comparator.comparing(CostAnalysisItem::laborCost).reversed()
                .thenComparing(CostAnalysisItem::name));
        return items;
    }

    // ---------- helpers ----------

    private String requireDimension(String dimension) {
        if (dimension == null || !DIMENSIONS.contains(dimension)) {
            throw new IllegalArgumentException("不支持的统计维度: " + dimension);
        }
        return dimension;
    }

    private String resolveYear(String year) {
        String y = blankToNull(year);
        if (y == null) {
            return String.valueOf(LocalDate.now().getYear());
        }
        if (!y.matches("\\d{4}")) {
            throw new IllegalArgumentException("年份格式应为 YYYY: " + year);
        }
        return y;
    }

    private void validatePeriod(String month, String quarter) {
        if (month != null && !month.matches("\\d{4}-(0[1-9]|1[0-2])")) {
            throw new IllegalArgumentException("月份格式应为 YYYY-MM: " + month);
        }
        if (quarter != null && !quarter.matches("Q[1-4]")) {
            throw new IllegalArgumentException("季度格式应为 Q1-Q4: " + quarter);
        }
    }

    private boolean matchesPeriod(String rowMonth, String month, String quarter) {
        if (month != null && !rowMonth.equals(month)) {
            return false;
        }
        return quarter == null || quarterOf(rowMonth).equals(quarter);
    }

    private boolean isTimeDimension(String dimension) {
        return "month".equals(dimension) || "quarter".equals(dimension) || "year".equals(dimension);
    }

    private String timeKey(String month, String dimension, String year) {
        return switch (dimension) {
            case "month" -> month;
            case "quarter" -> year + "-" + quarterOf(month);
            case "year" -> year;
            default -> "";
        };
    }

    private String laborDimKey(LaborCostRow row, String dimension, String year) {
        return switch (dimension) {
            case "department" -> String.valueOf(row.departmentId());
            case "project" -> String.valueOf(row.projectId());
            case "business_line" -> String.valueOf(row.businessLineId());
            case "employee" -> String.valueOf(row.employeeId());
            case "month" -> row.month();
            case "quarter" -> year + "-" + quarterOf(row.month());
            case "year" -> year;
            default -> throw new IllegalArgumentException("不支持的统计维度: " + dimension);
        };
    }

    private List<String> entityDimKeys(Project project, String dimension, Set<Long> employeeIds) {
        return switch (dimension) {
            case "department" -> List.of(String.valueOf(project.getDepartmentId()));
            case "project" -> List.of(String.valueOf(project.getId()));
            case "business_line" -> List.of(String.valueOf(project.getBusinessLineId()));
            case "employee" -> employeeIds.stream().map(String::valueOf).distinct().toList();
            default -> List.of();
        };
    }

    private Map<String, String> dimNames(String dimension, Map<Long, Project> projectsById) {
        Map<String, String> names = new HashMap<>();
        switch (dimension) {
            case "department" -> departmentMapper.selectList(null)
                    .forEach(d -> names.put(String.valueOf(d.getId()), d.getName()));
            case "project" -> projectsById.forEach((id, p) -> names.put(String.valueOf(id), p.getName()));
            case "business_line" -> businessLineMapper.selectList(null)
                    .forEach(b -> names.put(String.valueOf(b.getId()), b.getName()));
            case "employee" -> employeeMapper.selectList(null)
                    .forEach(e -> names.put(String.valueOf(e.getId()), e.getName()));
            default -> { }
        }
        return names;
    }

    private Map<Long, ProjectTotals> buildProjectTotals(List<ProjectCostRow> rows) {
        Map<Long, ProjectTotals> map = new LinkedHashMap<>();
        for (ProjectCostRow row : rows) {
            ProjectTotals t = map.computeIfAbsent(row.projectId(), k -> new ProjectTotals());
            t.actual = t.actual.add(row.actualAmount());
            t.budget = row.budgetAmount();
        }
        return map;
    }

    private BigDecimal sumAmounts(List<BigDecimal> amounts) {
        return amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private double ratio(BigDecimal part, BigDecimal whole) {
        if (whole == null || whole.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return part.multiply(HUNDRED).divide(whole, 2, RoundingMode.HALF_UP).doubleValue();
    }

    private String quarterOf(String month) {
        int m = Integer.parseInt(month.substring(5, 7));
        return "Q" + ((m - 1) / 3 + 1);
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static class CostAgg {
        BigDecimal laborCost = BigDecimal.ZERO;
        BigDecimal projectBudget = BigDecimal.ZERO;
        BigDecimal projectActual = BigDecimal.ZERO;
    }

    private static class ProjectTotals {
        BigDecimal actual = BigDecimal.ZERO;
        BigDecimal budget = BigDecimal.ZERO;
    }
}
```

- [ ] **Step 6: 编写单元测试 `CostServiceImplTest.java`**

```java
package com.library.cost;

import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.CostAnalysisItem;
import com.library.cost.dto.CostSummaryDTO;
import com.library.cost.dto.LaborCostRow;
import com.library.cost.dto.ProjectCostRow;
import com.library.cost.entity.Department;
import com.library.cost.entity.Employee;
import com.library.cost.entity.Project;
import com.library.cost.mapper.BusinessLineMapper;
import com.library.cost.mapper.CostReportMapper;
import com.library.cost.mapper.DepartmentMapper;
import com.library.cost.mapper.EmployeeMapper;
import com.library.cost.mapper.ProjectMapper;
import com.library.cost.service.CostServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CostServiceImplTest {

    private CostServiceImpl service;
    private CostReportMapper reportMapper;

    @BeforeEach
    void setUp() {
        reportMapper = mock(CostReportMapper.class);
        DepartmentMapper departmentMapper = mock(DepartmentMapper.class);
        BusinessLineMapper businessLineMapper = mock(BusinessLineMapper.class);
        EmployeeMapper employeeMapper = mock(EmployeeMapper.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);

        when(departmentMapper.selectList(any())).thenReturn(List.of(
                dept(1L, "研发部"), dept(2L, "产品部")));
        when(employeeMapper.selectList(any())).thenReturn(List.of(
                emp(1L, "张三"), emp(2L, "李四")));
        when(projectMapper.selectList(any())).thenReturn(List.of(
                proj(1L, "核心交易系统", 1L, 1L, new BigDecimal("1000000.00"))));

        when(reportMapper.selectLaborRows("2025")).thenReturn(List.of(
                new LaborCostRow(1L, "2025-01", new BigDecimal("20000.00"), "DEV", 1L, 1L, 1L),
                new LaborCostRow(1L, "2025-02", new BigDecimal("20000.00"), "DEV", 1L, 1L, 1L),
                new LaborCostRow(1L, "2025-01", new BigDecimal("15000.00"), "TEST", 1L, 1L, 2L)));
        when(reportMapper.selectProjectCostRows("2025")).thenReturn(List.of(
                new ProjectCostRow(1L, "2025-01", new BigDecimal("50000.00"), 1L, 1L, new BigDecimal("1000000.00")),
                new ProjectCostRow(1L, "2025-02", new BigDecimal("50000.00"), 1L, 1L, new BigDecimal("1000000.00"))));

        service = new CostServiceImpl(reportMapper, departmentMapper, businessLineMapper,
                employeeMapper, projectMapper);
    }

    private Department dept(Long id, String name) {
        Department d = new Department();
        d.setId(id);
        d.setName(name);
        d.setCode("C" + id);
        return d;
    }

    private Employee emp(Long id, String name) {
        Employee e = new Employee();
        e.setId(id);
        e.setName(name);
        e.setEmployeeNo("P" + id);
        return e;
    }

    private Project proj(Long id, String name, Long lineId, Long deptId, BigDecimal budget) {
        Project p = new Project();
        p.setId(id);
        p.setName(name);
        p.setCode("CODE" + id);
        p.setBusinessLineId(lineId);
        p.setDepartmentId(deptId);
        p.setBudgetAmount(budget);
        return p;
    }

    @Test
    void summaryAggregatesTotalsAndTrend() {
        CostSummaryDTO s = service.summary("2025");
        assertThat(s.totalCost()).isEqualByComparingTo("155000.00");
        assertThat(s.laborCost()).isEqualByComparingTo("55000.00");
        assertThat(s.projectCost()).isEqualByComparingTo("100000.00");
        assertThat(s.laborRatio()).isEqualTo(35.48);
        assertThat(s.projectRatio()).isEqualTo(64.52);
        assertThat(s.monthlyTrend()).hasSize(2);
        assertThat(s.monthlyTrend().get(0).month()).isEqualTo("2025-01");
    }

    @Test
    void departmentDimensionGroupsByDepartment() {
        AnalysisQuery query = new AnalysisQuery("department", "2025", null, null, null);
        List<CostAnalysisItem> items = service.queryItems(query);
        assertThat(items).hasSize(1);
        CostAnalysisItem item = items.get(0);
        assertThat(item.name()).isEqualTo("研发部");
        assertThat(item.laborCost()).isEqualByComparingTo("55000.00");
        assertThat(item.projectBudget()).isEqualByComparingTo("1000000.00");
        assertThat(item.projectActual()).isEqualByComparingTo("100000.00");
        assertThat(item.budgetRatio()).isEqualTo(10.00);
    }

    @Test
    void roleFilterRestrictsLaborRows() {
        AnalysisQuery query = new AnalysisQuery("employee", "2025", null, null, "DEV");
        List<CostAnalysisItem> items = service.queryItems(query);
        assertThat(items).hasSize(1);
        assertThat(items.get(0).laborCost()).isEqualByComparingTo("40000.00");
    }

    @Test
    void invalidDimensionRejected() {
        AnalysisQuery query = new AnalysisQuery("bad", "2025", null, null, null);
        try {
            service.queryItems(query);
            assertThat(false).isTrue();
        } catch (IllegalArgumentException ex) {
            assertThat(ex.getMessage()).contains("不支持的统计维度");
        }
    }
}
```

- [ ] **Step 7: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；`CostServiceImplTest` 4 项全过（汇总、部门分组、角色过滤、非法维度）。

> 数值核对（Step 6 用例数据）：人力 55000.00（张三 20000×2月 + 李四 15000×1月）、项目实际 100000.00（项目1 50000×2月）、预算 1000000.00 → 总成本 155000.00、laborRatio 35.48、projectRatio 64.52、预算占比 10.00、role=DEV 时人力 40000.00（张三 20000×2月）。Step 6 代码块内断言即按此编写。

- [ ] **Step 8: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add src/main/java/com/library/cost/dto src/main/java/com/library/cost/mapper/CostReportMapper.java src/main/java/com/library/cost/service src/test/java/com/library/cost/CostServiceImplTest.java
git commit -m "feat: 实现成本统计聚合服务与单元测试

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

### Task 4: 总览与统计分析接口

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/controller/CostController.java`
- Test: `library-backend/src/test/java/com/library/cost/CostApiIntegrationTest.java`

**Interfaces:**
- Consumes: Task 3 的 `CostService`；Task 1 的 `ApiResponse`。
- Produces: `GET /api/cost/summary`、`GET /api/cost/analysis`（契约见上文「跨仓接口契约」）。

- [ ] **Step 1: 创建 `CostController.java`**

```java
package com.library.cost.controller;

import com.library.cost.common.ApiResponse;
import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.AnalysisResponse;
import com.library.cost.dto.CostSummaryDTO;
import com.library.cost.service.CostService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cost")
public class CostController {

    private final CostService costService;

    public CostController(CostService costService) {
        this.costService = costService;
    }

    @GetMapping("/summary")
    public ApiResponse<CostSummaryDTO> summary(@RequestParam(defaultValue = "") String year) {
        return ApiResponse.ok(costService.summary(year));
    }

    @GetMapping("/analysis")
    public ApiResponse<AnalysisResponse> analysis(AnalysisQuery query) {
        return ApiResponse.ok(costService.analysis(query));
    }
}
```

- [ ] **Step 2: 编写集成测试 `CostApiIntegrationTest.java`**

```java
package com.library.cost;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CostApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void summaryReturnsSeedBasedTotals() throws Exception {
        String body = mockMvc.perform(get("/api/cost/summary").param("year", "2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).path("data");
        assertThat(data.path("totalCost").decimalValue()).isEqualByComparingTo("2004000.00");
        assertThat(data.path("laborCost").decimalValue()).isEqualByComparingTo("414000.00");
        assertThat(data.path("projectCost").decimalValue()).isEqualByComparingTo("1590000.00");
        assertThat(data.path("laborRatio").doubleValue()).isEqualTo(20.66);
        assertThat(data.path("projectRatio").doubleValue()).isEqualTo(79.34);
        assertThat(data.path("overBudgetCount").asInt()).isEqualTo(1);
        assertThat(data.path("monthlyTrend")).hasSize(6);
    }

    @Test
    void analysisProjectDimensionShowsOverBudgetProject() throws Exception {
        String body = mockMvc.perform(get("/api/cost/analysis")
                        .param("dimension", "project")
                        .param("year", "2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn().getResponse().getContentAsString();

        JsonNode records = objectMapper.readTree(body).path("data").path("records");
        assertThat(records).hasSize(4);
        JsonNode dataPlatform = null;
        for (JsonNode r : records) {
            if ("数据中台".equals(r.path("name").asText())) {
                dataPlatform = r;
            }
        }
        assertThat(dataPlatform).isNotNull();
        assertThat(dataPlatform.path("budgetRatio").doubleValue()).isEqualTo(120.00);
        assertThat(dataPlatform.path("overBudgetAmount").decimalValue())
                .isEqualByComparingTo("80000.00");
    }

    @Test
    void analysisDepartmentDimensionGroupsByDepartment() throws Exception {
        String body = mockMvc.perform(get("/api/cost/analysis")
                        .param("dimension", "department")
                        .param("year", "2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn().getResponse().getContentAsString();

        JsonNode records = objectMapper.readTree(body).path("data").path("records");
        assertThat(records).hasSize(2);
        assertThat(records.get(0).path("name").asText()).isEqualTo("研发部");
        assertThat(records.get(0).path("laborCost").decimalValue())
                .isEqualByComparingTo("306000.00");
        assertThat(records.get(0).path("budgetRatio").doubleValue()).isEqualTo(71.67);
    }

    @Test
    void analysisRejectsInvalidDimension() throws Exception {
        mockMvc.perform(get("/api/cost/analysis")
                        .param("dimension", "unknown")
                        .param("year", "2025"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void analysisQuarterFilterWorks() throws Exception {
        String body = mockMvc.perform(get("/api/cost/analysis")
                        .param("dimension", "quarter")
                        .param("year", "2025"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode records = objectMapper.readTree(body).path("data").path("records");
        assertThat(records).hasSize(2);
        assertThat(records.get(0).path("name").asText()).isEqualTo("2025-Q1");
        assertThat(records.get(0).path("projectActual").decimalValue())
                .isEqualByComparingTo("795000.00");
    }
}
```

> 说明：`records.get(0)` 依赖实现中的排序（laborCost 降序）。2025-Q1 与 2025-Q2 人力成本均为 207000.00，`thenComparing(name)` 使 "2025-Q1" < "2025-Q2"（字典序），故 get(0) 为 Q1；断言据此编写。

- [ ] **Step 3: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；`CostApiIntegrationTest` 5 项全过。

- [ ] **Step 4: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add src/main/java/com/library/cost/controller/CostController.java src/test/java/com/library/cost/CostApiIntegrationTest.java
git commit -m "feat: 提供成本总览与统计分析接口及集成测试

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

### Task 5: 报表导出接口（Excel / CSV）

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/exporter/CostExporter.java`
- Modify: `library-backend/src/main/java/com/library/cost/controller/CostController.java`（追加 `export` 端点）
- Test: `library-backend/src/test/java/com/library/cost/ExportApiIntegrationTest.java`

**Interfaces:**
- Consumes: Task 3 的 `CostService.queryItems(AnalysisQuery)` 与 `CostAnalysisItem`；Task 4 的 `CostController`。
- Produces: `GET /api/cost/export?dimension=...&format=xlsx|csv`（文件流，见契约表）。

- [ ] **Step 1: 创建 `CostExporter.java`**

```java
package com.library.cost.exporter;

import com.library.cost.dto.CostAnalysisItem;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class CostExporter {

    private static final String[] HEADERS = {"名称", "人力成本", "项目预算", "实际消耗", "预算占比", "预计超支金额"};

    public byte[] toXlsx(List<CostAnalysisItem> items) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("成本统计报表");
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                header.createCell(i).setCellValue(HEADERS[i]);
            }
            int r = 1;
            for (CostAnalysisItem it : items) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(it.name());
                row.createCell(1).setCellValue(it.laborCost().doubleValue());
                row.createCell(2).setCellValue(it.projectBudget().doubleValue());
                row.createCell(3).setCellValue(it.projectActual().doubleValue());
                row.createCell(4).setCellValue(it.budgetRatio());
                row.createCell(5).setCellValue(it.overBudgetAmount().doubleValue());
            }
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] toCsv(List<CostAnalysisItem> items) {
        StringBuilder sb = new StringBuilder(String.join(",", HEADERS)).append("\r\n");
        for (CostAnalysisItem it : items) {
            sb.append(csv(it.name())).append(',')
              .append(it.laborCost()).append(',')
              .append(it.projectBudget()).append(',')
              .append(it.projectActual()).append(',')
              .append(String.format("%.2f", it.budgetRatio())).append(',')
              .append(it.overBudgetAmount()).append("\r\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csv(String value) {
        if (value == null) {
            return "\"\"";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
```

- [ ] **Step 2: 改写 `CostController.java`（追加 export 端点，整体内容如下）**

```java
package com.library.cost.controller;

import com.library.cost.common.ApiResponse;
import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.AnalysisResponse;
import com.library.cost.dto.CostAnalysisItem;
import com.library.cost.dto.CostSummaryDTO;
import com.library.cost.exporter.CostExporter;
import com.library.cost.service.CostService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/cost")
public class CostController {

    private final CostService costService;
    private final CostExporter costExporter;

    public CostController(CostService costService, CostExporter costExporter) {
        this.costService = costService;
        this.costExporter = costExporter;
    }

    @GetMapping("/summary")
    public ApiResponse<CostSummaryDTO> summary(@RequestParam(defaultValue = "") String year) {
        return ApiResponse.ok(costService.summary(year));
    }

    @GetMapping("/analysis")
    public ApiResponse<AnalysisResponse> analysis(AnalysisQuery query) {
        return ApiResponse.ok(costService.analysis(query));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(AnalysisQuery query,
                                         @RequestParam(defaultValue = "xlsx") String format) throws IOException {
        List<CostAnalysisItem> items = costService.queryItems(query);
        String ext = "csv".equalsIgnoreCase(format) ? "csv" : "xlsx";
        String year = (query.getYear() == null || query.getYear().isBlank()) ? "all" : query.getYear();

        byte[] body;
        String contentType;
        if ("csv".equalsIgnoreCase(format)) {
            body = costExporter.toCsv(items);
            contentType = "text/csv;charset=UTF-8";
        } else {
            body = costExporter.toXlsx(items);
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"cost-report-" + year + "." + ext + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(body);
    }
}
```

> 说明：Task 4 创建的 controller 仅含 summary/analysis 并只注入 `CostService`；本任务需同步新增 `costExporter` 字段与构造参数。

- [ ] **Step 3: 编写导出集成测试 `ExportApiIntegrationTest.java`**

```java
package com.library.cost;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ExportApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void exportCsvContainsHeaderAndRows() throws Exception {
        String body = mockMvc.perform(get("/api/cost/export")
                        .param("dimension", "department")
                        .param("year", "2025")
                        .param("format", "csv"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andReturn().getResponse().getContentAsString();

        assertThat(body).startsWith("名称,");
        assertThat(body).contains("研发部");
        assertThat(body).contains("306000.00");
    }

    @Test
    void exportXlsxReturnsSpreadsheetBytes() throws Exception {
        byte[] bytes = mockMvc.perform(get("/api/cost/export")
                        .param("dimension", "project")
                        .param("year", "2025")
                        .param("format", "xlsx"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(bytes.length).isGreaterThan(1000);
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；`ExportApiIntegrationTest` 2 项全过（同时确保 Task 1-4 旧测试仍全过，回归为 13 项）。

- [ ] **Step 5: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add src/main/java/com/library/cost/controller/CostController.java src/main/java/com/library/cost/exporter src/test/java/com/library/cost/ExportApiIntegrationTest.java
git commit -m "feat: 支持成本报表 Excel/CSV 导出

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

---

## 前端任务（library-frontend）

### Task 6: 前端脚手架（Vite + React + TS + 测试）

**Files:**
- Create: `library-frontend/package.json`
- Create: `library-frontend/tsconfig.json`
- Create: `library-frontend/vite.config.ts`
- Create: `library-frontend/index.html`
- Create: `library-frontend/src/index.css`
- Create: `library-frontend/src/main.tsx`
- Create: `library-frontend/src/App.tsx`
- Create: `library-frontend/src/test/setup.ts`
- Test: `library-frontend/src/App.test.tsx`

**Interfaces:**
- Produces: `npm run dev`（端口 5173，`/api` 代理到 `http://localhost:8080`）、`npm test`（Vitest + jsdom）、`npm run build`（tsc + vite）。

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "library-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "antd": "^5.16.5",
    "axios": "^1.6.8",
    "dayjs": "^1.11.10",
    "echarts": "^5.5.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.2",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "jsdom": "^24.0.0",
    "typescript": "^5.4.3",
    "vite": "^5.2.6",
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 2: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false
  }
})
```

- [ ] **Step 4: 创建 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>成本统计报表</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 `src/index.css` 与 `src/test/setup.ts`**

```css
body { margin: 0; }
#root { min-height: 100vh; }
```

```ts
import '@testing-library/jest-dom'

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })) as unknown as typeof window.matchMedia
}
```

- [ ] **Step 6: 创建 `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
)
```

- [ ] **Step 7: 创建应用外壳 `src/App.tsx`（Task 9 会扩充为完整路由）**

```tsx
import { Typography } from 'antd'

export default function App() {
  return (
    <div style={{ padding: 24 }} data-testid="app-shell">
      <Typography.Title level={3}>成本统计报表</Typography.Title>
      <Typography.Paragraph>Dashboard 与成本统计分析页面将在后续任务接入。</Typography.Paragraph>
    </div>
  )
}
```

- [ ] **Step 8: 编写冒烟测试 `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

it('渲染应用外壳标题', () => {
  render(<App />)
  expect(screen.getByTestId('app-shell')).toBeInTheDocument()
  expect(screen.getByText('成本统计报表')).toBeInTheDocument()
})
```

- [ ] **Step 9: 安装依赖并运行测试/构建**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
npm install
npm test
npm run build
```
Expected: `npm test` → 1 pass；`npm run build` → tsc 无错误 + vite build 打包成功。

- [ ] **Step 10: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src
git commit -m "feat: 初始化 Vite+React+TS 前端脚手架与测试环境

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

### Task 7: 前端 API 客户端、类型与格式化工具

**Files:**
- Create: `library-frontend/src/api/types.ts`
- Create: `library-frontend/src/api/client.ts`
- Create: `library-frontend/src/api/cost.ts`
- Create: `library-frontend/src/utils/format.ts`
- Test: `library-frontend/src/utils/format.test.ts`
- Test: `library-frontend/src/api/cost.test.ts`

**Interfaces:**
- Consumes: 无（纯前端）。
- Produces:
  - `fetchSummary(year: string): Promise<CostSummary>`
  - `fetchAnalysis(query: AnalysisQuery): Promise<AnalysisResponse>`
  - `buildExportUrl(query: AnalysisQuery, format: 'xlsx'|'csv'): string`
  - `formatMoney(value): string`、`formatPercent(value): string`
  - 类型 `Dimension`、`ROLE_LABELS`、`DIMENSION_LABELS` 等（Task 8/9 使用）。

- [ ] **Step 1: 创建 `src/api/types.ts`**

```ts
export type Dimension =
  | 'department'
  | 'project'
  | 'business_line'
  | 'employee'
  | 'month'
  | 'quarter'
  | 'year'

export const DIMENSION_LABELS: Record<Dimension, string> = {
  department: '部门',
  project: '项目',
  business_line: '业务线',
  employee: '人员',
  month: '月份',
  quarter: '季度',
  year: '年度'
}

export const ROLES = ['DEV', 'TEST', 'PM', 'OPS'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  DEV: '开发',
  TEST: '测试',
  PM: '产品',
  OPS: '运维'
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface MonthlyTrendItem {
  month: string
  laborCost: number
  projectCost: number
  totalCost: number
}

export interface CostSummary {
  totalCost: number
  laborCost: number
  projectCost: number
  laborRatio: number
  projectRatio: number
  overBudgetCount: number
  monthlyTrend: MonthlyTrendItem[]
}

export interface CostAnalysisItem {
  name: string
  laborCost: number
  projectBudget: number
  projectActual: number
  budgetRatio: number
  overBudgetAmount: number
}

export interface AnalysisResponse {
  records: CostAnalysisItem[]
  total: number
}

export interface AnalysisQuery {
  dimension: Dimension
  year?: string
  month?: string
  quarter?: string
  role?: string
}
```

- [ ] **Step 2: 创建 `src/api/client.ts`**

```ts
import axios from 'axios'
import type { ApiResponse } from './types'

export const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

http.interceptors.response.use(
  (resp) => {
    const body = resp.data as ApiResponse<unknown> | undefined
    if (body && typeof body.code === 'number' && body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return resp
  },
  (error) => Promise.reject(error)
)

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const resp = await promise
  return resp.data.data
}
```

- [ ] **Step 3: 创建 `src/api/cost.ts`**

```ts
import { http, unwrap } from './client'
import type { AnalysisQuery, AnalysisResponse, CostSummary } from './types'

export function fetchSummary(year: string): Promise<CostSummary> {
  return unwrap<CostSummary>(http.get('/cost/summary', { params: { year } }))
}

export function fetchAnalysis(query: AnalysisQuery): Promise<AnalysisResponse> {
  return unwrap<AnalysisResponse>(http.get('/cost/analysis', { params: query }))
}

export function buildExportUrl(
  query: AnalysisQuery,
  format: 'xlsx' | 'csv' = 'xlsx'
): string {
  const params = new URLSearchParams()
  params.set('dimension', query.dimension)
  if (query.year) params.set('year', query.year)
  if (query.month) params.set('month', query.month)
  if (query.quarter) params.set('quarter', query.quarter)
  if (query.role) params.set('role', query.role)
  params.set('format', format)
  return `/api/cost/export?${params.toString()}`
}
```

- [ ] **Step 4: 创建 `src/utils/format.ts`**

```ts
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-'
  }
  return `${value.toFixed(2)}%`
}
```

- [ ] **Step 5: 编写 `src/utils/format.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { formatMoney, formatPercent } from './format'

describe('formatMoney', () => {
  it('格式化金额为人民币两位小数', () => {
    expect(formatMoney(2004000)).toBe('¥2,004,000.00')
    expect(formatMoney(80000)).toBe('¥80,000.00')
  })

  it('空值与 NaN 显示占位符', () => {
    expect(formatMoney(null)).toBe('-')
    expect(formatMoney(undefined)).toBe('-')
    expect(formatMoney(Number.NaN)).toBe('-')
  })
})

describe('formatPercent', () => {
  it('保留两位小数的百分比', () => {
    expect(formatPercent(66.25)).toBe('66.25%')
    expect(formatPercent(10)).toBe('10.00%')
  })

  it('空值显示占位符', () => {
    expect(formatPercent(undefined)).toBe('-')
  })
})
```

- [ ] **Step 6: 编写 `src/api/cost.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest'
import { buildExportUrl, fetchAnalysis, fetchSummary } from './cost'
import { http } from './client'

vi.mock('./client', async () => {
  const get = vi.fn()
  return {
    http: { get },
    unwrap: async <T,>(p: Promise<{ data: { data: T } }>): Promise<T> => (await p).data.data
  }
})

describe('fetchSummary', () => {
  it('调用 /cost/summary 并解包 data', async () => {
    const get = http.get as ReturnType<typeof vi.fn>
    get.mockResolvedValue({ data: { code: 0, message: 'ok', data: { totalCost: 2004000 } } })
    const result = await fetchSummary('2025')
    expect(get).toHaveBeenCalledWith('/cost/summary', { params: { year: '2025' } })
    expect(result.totalCost).toBe(2004000)
  })
})

describe('fetchAnalysis', () => {
  it('透传维度查询参数', async () => {
    const get = http.get as ReturnType<typeof vi.fn>
    get.mockResolvedValue({ data: { code: 0, message: 'ok', data: { records: [], total: 0 } } })
    await fetchAnalysis({ dimension: 'department', year: '2025' })
    expect(get).toHaveBeenCalledWith('/cost/analysis', { params: { dimension: 'department', year: '2025' } })
  })
})

describe('buildExportUrl', () => {
  it('生成带查询参数与格式的导出地址', () => {
    const url = buildExportUrl({ dimension: 'department', year: '2025', role: 'DEV' }, 'xlsx')
    expect(url).toBe('/api/cost/export?dimension=department&year=2025&role=DEV&format=xlsx')
  })
})
```

- [ ] **Step 7: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main && npm test`
Expected: 新增 6 项全过（format 4 + cost 3 + App 1 = 8 项总过）。

- [ ] **Step 8: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add src/api src/utils src/App.test.tsx
git commit -m "feat: 前端成本 API 客户端、类型与格式化工具

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

### Task 8: Dashboard 总览页（指标卡 + 趋势图）

**Files:**
- Create: `library-frontend/src/components/EChart.tsx`
- Create: `library-frontend/src/components/StatCard.tsx`
- Create: `library-frontend/src/pages/Dashboard.tsx`
- Test: `library-frontend/src/pages/Dashboard.test.tsx`

**Interfaces:**
- Consumes: Task 7 的 `fetchSummary`、`CostSummary`、`formatMoney`、`formatPercent`。
- Produces: `Dashboard` 组件（`/` 路由渲染，Task 9 接入路由）；`EChart`、`StatCard` 复用组件。

- [ ] **Step 1: 创建通用图表组件 `src/components/EChart.tsx`**

```tsx
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useEffect, useRef } from 'react'

export default function EChart({
  option,
  height = 320,
  testId = 'echart'
}: {
  option: EChartsOption
  height?: number
  testId?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    chart.setOption(option)
    return () => chart.dispose()
  }, [option])

  return <div ref={ref} style={{ height }} data-testid={testId} />
}
```

- [ ] **Step 2: 创建指标卡组件 `src/components/StatCard.tsx`**

```tsx
import { Card, Statistic } from 'antd'

export default function StatCard({
  title,
  value,
  extra
}: {
  title: string
  value: string
  extra?: string
}) {
  return (
    <Card data-testid={`stat-${title}`}>
      <Statistic title={title} value={value} />
      {extra ? <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginTop: 8 }}>{extra}</div> : null}
    </Card>
  )
}
```

- [ ] **Step 3: 创建 `src/pages/Dashboard.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Card, Col, Row, Select, Space, Spin, Typography } from 'antd'
import type { EChartsOption } from 'echarts'
import { fetchSummary } from '../api/cost'
import type { CostSummary } from '../api/types'
import EChart from '../components/EChart'
import StatCard from '../components/StatCard'
import { formatMoney, formatPercent } from '../utils/format'

export default function Dashboard() {
  const [year, setYear] = useState('2025')
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchSummary(year)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [year])

  const trendOption: EChartsOption | null = summary
    ? {
        tooltip: { trigger: 'axis' },
        legend: { data: ['人力成本', '项目成本'] },
        xAxis: { type: 'category', data: summary.monthlyTrend.map((m) => m.month) },
        yAxis: { type: 'value' },
        series: [
          { name: '人力成本', type: 'bar', data: summary.monthlyTrend.map((m) => m.laborCost) },
          { name: '项目成本', type: 'bar', data: summary.monthlyTrend.map((m) => m.projectCost) }
        ]
      }
    : null

  return (
    <div data-testid="dashboard">
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          成本总览 Dashboard
        </Typography.Title>
        <Select
          aria-label="年份"
          value={year}
          onChange={setYear}
          options={[
            { value: '2024', label: '2024年' },
            { value: '2025', label: '2025年' }
          ]}
          style={{ width: 120 }}
        />
      </Space>
      {loading ? <Spin data-testid="dashboard-loading" /> : null}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {summary ? (
        <>
          <Row gutter={16}>
            <Col span={6}>
              <StatCard title="总成本" value={formatMoney(summary.totalCost)} />
            </Col>
            <Col span={6}>
              <StatCard
                title="人力成本"
                value={formatMoney(summary.laborCost)}
                extra={`占比 ${formatPercent(summary.laborRatio)}`}
              />
            </Col>
            <Col span={6}>
              <StatCard
                title="项目成本"
                value={formatMoney(summary.projectCost)}
                extra={`占比 ${formatPercent(summary.projectRatio)}`}
              />
            </Col>
            <Col span={6}>
              <StatCard title="超支项目数" value={String(summary.overBudgetCount)} />
            </Col>
          </Row>
          <Card title="月度成本趋势" style={{ marginTop: 16 }}>
            {trendOption ? <EChart option={trendOption} testId="cost-trend-chart" /> : null}
          </Card>
        </>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 4: 编写 `src/pages/Dashboard.test.tsx`**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { fetchSummary } from '../api/cost'
import Dashboard from '../pages/Dashboard'

vi.mock('../api/cost', () => ({ fetchSummary: vi.fn() }))
vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn() }))
}))

const summary = {
  totalCost: 2004000,
  laborCost: 414000,
  projectCost: 1590000,
  laborRatio: 20.66,
  projectRatio: 79.34,
  overBudgetCount: 1,
  monthlyTrend: [
    { month: '2025-01', laborCost: 69000, projectCost: 265000, totalCost: 334000 },
    { month: '2025-02', laborCost: 69000, projectCost: 265000, totalCost: 334000 }
  ]
}

describe('Dashboard', () => {
  it('加载后展示总览指标与趋势图', async () => {
    ;(fetchSummary as ReturnType<typeof vi.fn>).mockResolvedValue(summary)
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByText('¥2,004,000.00')).toBeInTheDocument())
    expect(screen.getByText('超支项目数')).toBeInTheDocument()
    expect(screen.getByTestId('cost-trend-chart')).toBeInTheDocument()
  })

  it('接口失败时展示错误信息', async () => {
    ;(fetchSummary as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('网络错误'))
    render(<Dashboard />)
    await waitFor(() => expect(screen.getByText('网络错误')).toBeInTheDocument())
  })
})
```

- [ ] **Step 5: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main && npm test && npm run build`
Expected: Dashboard 2 项测试通过；构建成功（类型无错误）。

- [ ] **Step 6: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add src/components src/pages/Dashboard.tsx src/pages/Dashboard.test.tsx
git commit -m "feat: Dashboard 成本总览页（指标卡与月度趋势图）

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

### Task 9: 成本统计分析页（多维筛选 + 表格 + 图表 + 导出）与路由接入

**Files:**
- Create: `library-frontend/src/pages/CostAnalysis.tsx`
- Test: `library-frontend/src/pages/CostAnalysis.test.tsx`
- Modify: `library-frontend/src/App.tsx`（替换 Task 6 外壳为完整 Layout 路由）
- Modify: `library-frontend/src/App.test.tsx`（替换为路由级冒烟测试）

**Interfaces:**
- Consumes: Task 7 的 `fetchAnalysis`、`buildExportUrl`、`DIMENSION_LABELS`、`ROLES`、`ROLE_LABELS`、`CostAnalysisItem`、`AnalysisQuery`、`Dimension`；Task 8 的 `EChart`。
- Produces: `/` 与 `/cost-analysis` 两个路由页面；导出链接直连 `GET /api/cost/export`。

- [ ] **Step 1: 创建 `src/pages/CostAnalysis.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { Button, Select, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { buildExportUrl, fetchAnalysis } from '../api/cost'
import { DIMENSION_LABELS, ROLES, ROLE_LABELS } from '../api/types'
import type { AnalysisQuery, CostAnalysisItem, Dimension } from '../api/types'
import EChart from '../components/EChart'
import { formatMoney, formatPercent } from '../utils/format'

export default function CostAnalysis() {
  const [dimension, setDimension] = useState<Dimension>('department')
  const [year, setYear] = useState('2025')
  const [role, setRole] = useState<string | undefined>(undefined)
  const [rows, setRows] = useState<CostAnalysisItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const query: AnalysisQuery = { dimension, year, role }

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchAnalysis(query)
      .then((resp) => setRows(resp.records))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension, year, role])

  useEffect(() => {
    load()
  }, [load])

  const columns: ColumnsType<CostAnalysisItem> = [
    { title: DIMENSION_LABELS[dimension], dataIndex: 'name', key: 'name' },
    {
      title: '人力成本',
      dataIndex: 'laborCost',
      key: 'laborCost',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '项目预算',
      dataIndex: 'projectBudget',
      key: 'projectBudget',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '实际消耗',
      dataIndex: 'projectActual',
      key: 'projectActual',
      render: (v: number) => formatMoney(v)
    },
    {
      title: '预算占比',
      dataIndex: 'budgetRatio',
      key: 'budgetRatio',
      render: (v: number) => formatPercent(v)
    },
    {
      title: '预计超支金额',
      dataIndex: 'overBudgetAmount',
      key: 'overBudgetAmount',
      render: (v: number) => formatMoney(v)
    }
  ]

  const chartOption =
    rows.length > 0
      ? {
          tooltip: { trigger: 'axis' },
          legend: { data: ['人力成本', '实际消耗'] },
          xAxis: { type: 'category', data: rows.slice(0, 10).map((r) => r.name) },
          yAxis: { type: 'value' },
          series: [
            { name: '人力成本', type: 'bar', data: rows.slice(0, 10).map((r) => r.laborCost) },
            { name: '实际消耗', type: 'bar', data: rows.slice(0, 10).map((r) => r.projectActual) }
          ]
        }
      : null

  return (
    <div data-testid="cost-analysis">
      <Space style={{ marginBottom: 16 }} wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          成本统计分析
        </Typography.Title>
        <Select
          aria-label="维度"
          value={dimension}
          onChange={(v: Dimension) => setDimension(v)}
          options={Object.entries(DIMENSION_LABELS).map(([value, label]) => ({ value, label }))}
          style={{ width: 120 }}
        />
        <Select
          aria-label="年份"
          value={year}
          onChange={setYear}
          options={[
            { value: '2024', label: '2024年' },
            { value: '2025', label: '2025年' }
          ]}
          style={{ width: 120 }}
        />
        <Select
          aria-label="岗位角色"
          value={role}
          onChange={setRole}
          allowClear
          placeholder="全部角色"
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          style={{ width: 140 }}
        />
        <Button type="primary" onClick={load}>
          查询
        </Button>
        <Button>
          <a href={buildExportUrl(query, 'xlsx')} download>
            导出 Excel
          </a>
        </Button>
        <Button>
          <a href={buildExportUrl(query, 'csv')} download>
            导出 CSV
          </a>
        </Button>
      </Space>
      {loading ? <Spin data-testid="analysis-loading" /> : null}
      {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}
      {chartOption ? <EChart option={chartOption} testId="analysis-chart" /> : null}
      <Table
        rowKey={(r) => r.name}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        style={{ marginTop: 16 }}
      />
    </div>
  )
}
```

- [ ] **Step 2: 编写 `src/pages/CostAnalysis.test.tsx`**

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { fetchAnalysis } from '../api/cost'
import CostAnalysis from '../pages/CostAnalysis'

vi.mock('../api/cost', () => ({
  fetchAnalysis: vi.fn(),
  buildExportUrl: vi.fn((_q: unknown, format: string) => `/api/cost/export?format=${format}`)
}))
vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn() }))
}))

const records = [
  {
    name: '研发部',
    laborCost: 306000,
    projectBudget: 1800000,
    projectActual: 1290000,
    budgetRatio: 71.67,
    overBudgetAmount: -510000
  },
  {
    name: '产品部',
    laborCost: 108000,
    projectBudget: 600000,
    projectActual: 300000,
    budgetRatio: 50,
    overBudgetAmount: -300000
  }
]

describe('CostAnalysis', () => {
  it('默认按部门维度加载并渲染表格与导出入口', async () => {
    ;(fetchAnalysis as ReturnType<typeof vi.fn>).mockResolvedValue({ records, total: 2 })
    render(<CostAnalysis />)
    await waitFor(() => expect(screen.getByText('研发部')).toBeInTheDocument())
    expect(screen.getByText('¥1,290,000.00')).toBeInTheDocument()
    expect(screen.getByText('导出 Excel')).toBeInTheDocument()
    expect(screen.getByText('导出 CSV')).toBeInTheDocument()
  })

  it('查询失败展示错误', async () => {
    ;(fetchAnalysis as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('接口异常'))
    render(<CostAnalysis />)
    await waitFor(() => expect(screen.getByText('接口异常')).toBeInTheDocument())
  })

  it('切换维度为项目后按新维度重新查询', async () => {
    ;(fetchAnalysis as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ records, total: 2 })
      .mockResolvedValueOnce({
        records: [
          {
            name: '数据中台',
            laborCost: 0,
            projectBudget: 400000,
            projectActual: 480000,
            budgetRatio: 120,
            overBudgetAmount: 80000
          }
        ],
        total: 1
      })
    render(<CostAnalysis />)
    await waitFor(() => expect(screen.getByText('研发部')).toBeInTheDocument())

    fireEvent.mouseDown(screen.getByLabelText('维度').closest('.ant-select-selector')!)
    await screen.findByTitle('项目')
    fireEvent.click(screen.getByTitle('项目'))

    await waitFor(() => expect(screen.getByText('数据中台')).toBeInTheDocument())
    expect(fetchAnalysis).toHaveBeenLastCalledWith({
      dimension: 'project',
      year: '2025',
      role: undefined
    })
  })
})
```

- [ ] **Step 3: 改写 `src/App.tsx` 为完整路由**

```tsx
import { Layout, Menu } from 'antd'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import CostAnalysis from './pages/CostAnalysis'
import Dashboard from './pages/Dashboard'

const menuItems = [
  { key: '/', label: <Link to="/">Dashboard</Link> },
  { key: '/cost-analysis', label: <Link to="/cost-analysis">成本统计分析</Link> }
]

export default function App() {
  const location = useLocation()
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider>
        <div style={{ color: '#fff', padding: 16, fontWeight: 600 }}>成本统计报表</div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Layout.Sider>
      <Layout.Content style={{ padding: 24, background: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cost-analysis" element={<CostAnalysis />} />
        </Routes>
      </Layout.Content>
    </Layout>
  )
}
```

- [ ] **Step 4: 改写 `src/App.test.tsx` 为路由级冒烟测试**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from './App'

vi.mock('./api/cost', () => ({
  fetchSummary: vi.fn(() =>
    Promise.resolve({
      totalCost: 0,
      laborCost: 0,
      projectCost: 0,
      laborRatio: 0,
      projectRatio: 0,
      overBudgetCount: 0,
      monthlyTrend: []
    })
  ),
  fetchAnalysis: vi.fn(() => Promise.resolve({ records: [], total: 0 }))
}))
vi.mock('echarts', () => ({
  init: vi.fn(() => ({ setOption: vi.fn(), dispose: vi.fn() }))
}))

it('渲染侧边菜单与默认 Dashboard 路由', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByText('成本统计报表')).toBeInTheDocument()
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
  expect(await screen.findByTestId('dashboard')).toBeInTheDocument()
})
```

- [ ] **Step 5: 运行测试与构建**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main && npm test && npm run build`
Expected: CostAnalysis 3 项 + App 1 项通过（总约 12 项）；构建成功。

- [ ] **Step 6: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add src/pages/CostAnalysis.tsx src/pages/CostAnalysis.test.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: 成本统计分析页（多维筛选/表格/图表/导出）与路由接入

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

### Task 10: 跨仓联调、验收清单与运行文档

**Files:**
- Modify: `library-backend/README.md`（补充运行与接口说明）
- Modify: `library-frontend/README.md`（补充运行与页面说明）

**Interfaces:**
- 验证基准：本计划「Global Constraints」与「跨仓接口契约」全部条目。

- [ ] **Step 1: 启动后端并做接口冒烟（curl 验收）**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
mvn -q spring-boot:run   # 后台运行，确认端口 8080 启动成功、无日志异常
```

```bash
curl -s 'http://localhost:8080/api/cost/summary?year=2025'
# 期望 code=0 且 data.totalCost=2004000.00、overBudgetCount=1

curl -s 'http://localhost:8080/api/cost/analysis?dimension=project&year=2025'
# 期望 records 含 数据中台：budgetRatio=120.0、overBudgetAmount=80000.00

curl -sI 'http://localhost:8080/api/cost/export?dimension=department&year=2025&format=csv'
# 期望 200 且 Content-Type: text/csv;charset=UTF-8、Content-Disposition: attachment
```

- [ ] **Step 2: 启动前端并做页面验收（浏览器手测清单）**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
npm run dev   # http://localhost:5173
```

浏览器验收清单（逐项勾选）：
- [ ] `http://localhost:5173/` Dashboard 展示：总成本 ¥2,004,000.00、人力成本 ¥414,000.00（占比 20.66%）、项目成本 ¥1,590,000.00（占比 79.34%）、超支项目数 1；月度成本趋势柱状图 6 个月。
- [ ] 切到 `/cost-analysis`：默认「部门」维度展示 研发部/产品部 两行，研发部占比 71.67%。
- [ ] 维度切换为「项目」：出现 核心交易系统/数据中台/客户门户/运维支撑平台；数据中台 预算占比 120.00%、预计超支金额 ¥80,000.00。
- [ ] 维度「季度」：展示 2025-Q1、2025-Q2；岗位角色选「开发」：人力成本降为 ¥120,000.00（仅张三，employee 维度）。
- [ ] 点击「导出 Excel」下载 xlsx；点击「导出 CSV」下载 csv，均可用 WPS/Excel 打开，表头为 名称/人力成本/项目预算/实际消耗/预算占比/预计超支金额。

> 降级协议：若 `mvn spring-boot:run`（Step 1）连续 2 次失败或单次超过 120s，停止联调，转入静态审查：核对本计划全部 10 个任务的代码与契约一致（字段名、类型、维度/角色枚举、URL、Content-Type），以 `[降级说明]` 记录原因；前端 `npm run dev` 同理。

- [ ] **Step 3: 更新 `library-backend/README.md`**

```markdown
# library-backend
图书管理系统后端 —— 成本统计报表服务

## 运行
- 启动: `mvn spring-boot:run`（默认端口 8080；H2 内存库自动建表并载入种子数据）
- 测试: `mvn test`

## 接口（前缀 /api，响应体 {code,message,data}）
- GET /api/cost/summary                   成本总览（年）
- GET /api/cost/analysis                  多维度统计分析（department/project/business_line/employee/month/quarter/year）
- GET /api/cost/export                    报表导出（format=xlsx|csv）
```

- [ ] **Step 4: 更新 `library-frontend/README.md`**

```markdown
# library-frontend
图书管理系统前端 —— 成本统计报表

## 运行
- 依赖: `npm install`
- 开发: `npm run dev`（端口 5173，/api 代理到 http://localhost:8080）
- 测试: `npm test`
- 构建: `npm run build`

## 页面
- `/`             成本总览 Dashboard（指标卡 + 月度趋势）
- `/cost-analysis` 成本统计分析（部门/项目/业务线/人员/月份/季度/年度 + 角色筛选，Excel/CSV 导出）
```

- [ ] **Step 5: 双端全量回归**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main && npm test && npm run build
```
Expected: 后端全部测试通过（contextLoads + SeedData 2 + Service 4 + API 5 + Export 2 ≈ 13 项）；前端全部测试通过且构建成功。

- [ ] **Step 6: Commit（双仓）**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add README.md
git commit -m "docs: 补充成本统计服务运行与接口说明

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main
git add README.md
git commit -m "docs: 补充成本统计前端运行与页面说明

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

---

## Self-Review（自审）

**1. Spec 覆盖核对（对照需求描述逐项）：**

| 需求点 | 落点 |
|---|---|
| 前端新建成本统计分析页面 | Task 9 `CostAnalysis`（/cost-analysis） |
| 前端 Dashboard | Task 8 `Dashboard`（/） |
| 维度：部门/项目/业务线/人员/月份/季度/年度 | Task 3 `DIMENSIONS` + 前端 `DIMENSION_LABELS`；Task 9 维度下拉 |
| 人力成本（开发/测试/产品/运维） | Task 2 `employee.role` + Task 3 角色过滤；Task 7 `ROLE_LABELS` |
| 项目成本：项目预算/实际消耗/预算占比/预计超支金额 | Task 3 `CostAnalysisItem` 四指标 + 契约表 |
| 报表导出 | Task 5 后端 xlsx/csv + Task 9 前端导出链接 |

**2. Placeholder 扫描：** 每个 Step 均含完整代码与精确命令；无 TBD/TODO/「类似 Task N」类描述；跨任务引用的函数、类型、字段名全部在本计划中定义。

**3. 类型/命名一致性核对：**
- 维度枚举值 7 项在 后端 `CostServiceImpl.DIMENSIONS`、前端 `types.ts` 完全一致。
- 角色枚举 `DEV/TEST/PM/OPS` 在 后端 `ROLES`、前端 `ROLES`/`ROLE_LABELS` 一致。
- DTO JSON 字段（`totalCost/laborCost/projectCost/laborRatio/projectRatio/overBudgetCount/monthlyTrend`、`name/laborCost/projectBudget/projectActual/budgetRatio/overBudgetAmount`）在 后端 record、前端 interface、测试断言三处一致。
- `AnalysisQuery` 参数名（dimension/year/month/quarter/role）在 后端 `@ModelAttribute` 绑定、前端 `buildExportUrl`、`fetchAnalysis` 一致。
- 种子数据基准值（2004000.00 / 414000.00 / 1590000.00 / 120.00% / 80000.00）在后端集成测试（Task 4/5）、前端测试（Task 8/9）、联调验收（Task 10）三处一致。
- 排序规则统一：分析结果按 laborCost 降序、名称升序（后端 Comparator；前端测试依赖的第一行断言与之一致）。

**缺口说明（诚实声明）：** 需求未提供真实数据源与既有代码，因此数据以种子数据闭环验证；真实数据接入时仅需替换 `CostReportMapper` 查询与数据源配置，接口契约不变。导出仅覆盖分析维度视图，未包含 Dashboard 汇总导出（需求未要求）。

---

## Execution Handoff（执行交接）

计划已完整保存。执行阶段采用 **Subagent-Driven（推荐）**：每个任务派发独立实现 Agent，任务间由主 Agent 按各任务「Interface + 测试期望」做两阶段审查（代码审查 + 运行测试），发现不一致立即回退该任务。执行 Agent 无需再等待确认，按 Task 1 → Task 10 顺序推进；任何一任务触发降级协议（同模块构建连续 2 次失败 / 跨仓环境问题 / 单次构建 >120s / 单仓构建命令已执行 1 次）时，停止构建并以 `[降级说明]` 开头输出原因，转为跨仓契约静态审查。

> 验证总耗时上限 5 分钟；若触发全局时间约束，输出 `## ⚠️ 时间约束降级报告` 后终止。