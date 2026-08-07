# 成本统计报表 实施计划 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Goal:** 从零搭建企业综合管理平台的「成本统计报表」业务域，包含前端 SPA（Dashboard + 多维度分析页 + 导入/导出）与后端 Maven 多模块 API（数据模型 + 统计聚合 + Excel 导入/导出），支持部门/项目/业务线/人员/月份/季度/年度多维度统计与超支预测。
>
> **Architecture:** 前端 Vue 3 + TypeScript + Vite + Element Plus + ECharts，SPA 单页应用，通过 Vite dev proxy 转发 `/api` 到后端 8080。后端 Java + Spring Boot 3 + Maven 多模块（platform-base 基座 + cost 业务模块）+ MyBatis-Plus，本地 DB（H2 dev profile）。两角色 ADMIN/USER 硬编码 + JWT 鉴权 + 数据级隔离。数据入口仅 Excel 导入（EasyExcel），导出支持 xlsx/csv。
>
> **Tech Stack:** Vue 3.x + TypeScript 5.x + Vite 5.x + Element Plus 2.x + ECharts 5.x + Vue Router 4.x + Pinia 2.x + Axios 1.x | Java 17 + Spring Boot 3.2.x + Maven 3.9.x + MyBatis-Plus 3.5.x + EasyExcel 3.3.x + H2 2.x (dev) + Spring Security 6.x + jjwt 0.12.x

## Global Constraints

- 前端技术栈固定：Vue 3 + TypeScript + Vite + Element Plus + ECharts，SPA 单页应用，无 SSR（dima.md Q2）
- 后端技术栈固定：Java 17 + Spring Boot 3 + Maven 多模块（platform-base + cost）+ MyBatis-Plus（dima.md Q3）
- 数据来源仅 Excel 导入（EasyExcel 解析 .xlsx），无录入页面，预留外部对接 Service 抽象层（dima.md Q4）
- 导出格式：Excel(.xlsx, EasyExcel, 含表头样式+合计行) + CSV(UTF-8 BOM, 原始明细)，无 PDF（dima.md Q5）
- 权限：两角色 `ADMIN`/`USER` 硬编码；ADMIN=查看+导出+导入，USER=仅查看；按部门/业务线数据级隔离；Spring Security + JWT（dima.md Q6）
- 历史数据：同比(YoY)+环比(MoM/QoQ)；`cost_period` 月份字段为时间序列主键；不物理删除历史；导入校验月份唯一（dima.md Q7）
- 超支算法：`estimated_final_cost = actual_cost / (progress_percent / 100)`；兜底（进度=0/NULL）：`estimated_overrun = actual_cost - budget`（dima.md Q8）
- 部署形态：仅本地开发环境（前端 Vite dev proxy → 后端 8080；后端 dev profile + 本地 DB）；不引入 Dockerfile/CI-CD/Nginx（dima.md Q9）
- 人力角色枚举：开发(DEV)、测试(QA)、产品(PM)、运维(OPS)（dima.md §4.2）
- 项目成本计算口径：预算占比 = 实际消耗/预算（预算=0 返回 null）；预计超支 = 预计最终成本 - 预算（>0 标记超支）（dima.md §4.3）
- 后端测试命令：`mvn -q -DskipTests=false test`（dima.md §2）
- 后端统一响应结构：`{code, message, data}`；业务异常 HTTP 200 + code!=0；未处理异常 `@RestControllerAdvice` 捕获（dima.md §8.6）
- 前端异常处理：Axios 响应拦截器，非 200 状态码 ElMessage.error；401 重定向登录页；403 提示无权限（dima.md §8.5/§8.6）
- 导入限制：单文件 ≤ 10MB，解析超时 60s（dima.md §8.1）
- 导出限制：数据量为空不生成空文件；>10万行限制或分批（dima.md §8.4）

---

## File Structure

### 前端 (library-frontend)

```
library-frontend-main/
├── package.json                    # 依赖声明与脚本
├── vite.config.ts                  # Vite 配置 + dev proxy /api → 8080
├── tsconfig.json                   # TS 编译配置
├── tsconfig.node.json              # Node 上下文 TS 配置
├── index.html                      # SPA 入口 HTML
├── .env.development                # 开发环境变量 VITE_API_BASE_URL
├── src/
│   ├── main.ts                     # 应用入口，挂载 ElementPlus + router + pinia
│   ├── App.vue                     # 根组件，含 layout
│   ├── env.d.ts                    # 环境变量类型声明
│   ├── router/
│   │   └── index.ts                # Vue Router 路由表（含路由守卫鉴权）
│   ├── stores/
│   │   ├── auth.ts                 # 鉴权 store（token、role、用户信息）
│   │   └── cost.ts                 # 成本数据 store（筛选条件缓存）
│   ├── api/
│   │   ├── request.ts              # Axios 实例 + 拦截器（401/403/业务码）
│   │   ├── auth.ts                 # 登录/登出/用户信息接口
│   │   └── cost.ts                 # 成本统计 Dashboard/明细/聚合/导入/导出接口
│   ├── types/
│   │   └── cost.ts                 # 成本相关 TS 类型定义（维度、人力成本、项目成本等）
│   ├── constants/
│   │   └── cost.ts                 # 枚举常量（角色 DEV/QA/PM/OPS、时间粒度、导出格式）
│   ├── utils/
│   │   ├── format.ts               # 金额/百分比/月份格式化
│   │   └── download.ts             # Blob 下载工具
│   ├── layouts/
│   │   └── MainLayout.vue          # 主布局（侧边栏菜单 + 顶栏 + 内容区）
│   ├── components/
│   │   ├── StatCard.vue            # Dashboard 概览卡片
│   │   ├── TrendChart.vue          # 趋势图（ECharts 折线）
│   │   ├── DistributionChart.vue   # 维度分布图（ECharts 饼图）
│   │   ├── CostFilter.vue         # 多维度筛选栏
│   │   └── ImportDialog.vue        # Excel 导入弹窗（模板下载+上传+结果预览）
│   ├── views/
│   │   ├── Login.vue               # 登录页
│   │   ├── Dashboard.vue          # 成本统计 Dashboard 页
│   │   ├── CostAnalysis.vue        # 成本统计分析页（人力明细+项目明细）
│   │   └── NotFound.vue            # 404 页
│   └── styles/
│       └── index.css              # 全局样式
└── agents/
    └── changes/                    # 已有，不动
```

### 后端 (library-backend)

```
library-backend-main/
├── pom.xml                         # 父 POM，声明子模块
├── platform-base/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/library/platform/
│           │   ├── PlatformApplication.java      # Spring Boot 启动类
│           │   ├── config/
│           │   │   ├── SecurityConfig.java       # Spring Security 配置 + JWT
│           │   │   ├── WebMvcConfig.java         # CORS + 拦截器注册
│           │   │   └── MybatisPlusConfig.java    # MP 配置 + 分页插件 + 数据权限拦截器
│           │   ├── security/
│           │   │   ├── JwtUtil.java              # JWT 生成/解析/校验
│           │   │   ├── JwtAuthFilter.java        # JWT 认证过滤器
│           │   │   ├── SecurityUser.java        # 认证主体
│           │   │   └── DataScopeInterceptor.java # 部门/业务线数据级过滤拦截器
│           │   ├── common/
│           │   │   ├── ApiResponse.java          # 统一响应封装 {code,message,data}
│           │   │   ├── BizException.java         # 业务异常
│           │   │   └── GlobalExceptionHandler.java # @RestControllerAdvice 全局异常
│           │   ├── entity/
│           │   │   ├── SysUser.java              # 用户实体（含 role_code, dept_id, biz_line_id）
│           │   │   ├── SysDept.java              # 部门实体
│           │   │   └── SysBizLine.java           # 业务线实体
│           │   ├── mapper/
│           │   │   ├── SysUserMapper.java
│           │   │   ├── SysDeptMapper.java
│           │   │   └── SysBizLineMapper.java
│           │   └── controller/
│           │       └── AuthController.java       # POST /api/auth/login
│           └── resources/
│               ├── application.yml                # 主配置
│               ├── application-dev.yml            # dev profile（H2 DB）
│               └── db/
│                   └── schema.sql                 # H2 初始化 DDL（含基座表）
└── cost/
    ├── pom.xml
    └── src/
        ├── main/
        │   ├── java/com/library/cost/
        │   │   ├── controller/
        │   │   │   ├── CostDashboardController.java   # GET /api/cost/dashboard
        │   │   │   ├── CostHumanController.java        # GET /api/cost/human/list
        │   │   │   ├── CostProjectController.java     # GET /api/cost/project/list
        │   │   │   ├── CostAggregateController.java    # GET /api/cost/aggregate
        │   │   │   ├── CostImportController.java       # POST /api/cost/import
        │   │   │   └── CostExportController.java       # GET /api/cost/export
        │   │   ├── entity/
        │   │   │   ├── CostHumanRecord.java           # 人力成本记录实体
        │   │   │   ├── CostProjectRecord.java         # 项目成本记录实体（含 progress_percent）
        │   │   │   └── CostProject.java               # 项目主实体
        │   │   ├── mapper/
        │   │   │   ├── CostHumanRecordMapper.java
        │   │   │   ├── CostProjectRecordMapper.java
        │   │   │   └── CostProjectMapper.java
        │   │   ├── service/
        │   │   │   ├── CostDashboardService.java      # Dashboard 概览 + 同比/环比
        │   │   │   ├── CostHumanService.java          # 人力成本明细查询
        │   │   │   ├── CostProjectService.java        # 项目成本明细 + 超支计算
        │   │   │   ├── CostAggregateService.java      # 多维度聚合
        │   │   │   ├── CostImportService.java        # Excel 导入解析校验
        │   │   │   ├── CostExportService.java         # Excel/CSV 导出
        │   │   │   └── ExternalDataSourceService.java # 预留外部对接抽象层（空实现）
        │   │   ├── dto/
        │   │   │   ├── DashboardVO.java              # Dashboard 概览 VO
        │   │   │   ├── CostHumanListDTO.java         # 人力成本查询条件
        │   │   │   ├── CostProjectListDTO.java       # 项目成本查询条件
        │   │   │   ├── CostAggregateDTO.java         # 聚合查询条件
        │   │   │   ├── CostHumanVO.java             # 人力成本明细 VO
        │   │   │   ├── CostProjectVO.java           # 项目成本明细 VO（含计算字段）
        │   │   │   ├── ImportResultVO.java          # 导入结果 VO
        │   │   │   └── TrendPointVO.java            # 趋势图数据点 VO
        │   │   └── util/
        │   │       ├── CostCalculator.java          # 超支/预算占比计算工具
        │   │       └── PeriodUtil.java              # 月份/季度/年度换算
        │   └── resources/
        │       └── db/
        │           └── cost-schema.sql              # cost 模块 DDL
        └── test/
            └── java/com/library/cost/
                ├── util/
                │   ├── CostCalculatorTest.java      # 超支计算单元测试
                │   └── PeriodUtilTest.java           # 时间换算单元测试
                └── service/
                    ├── CostDashboardServiceTest.java
                    └── CostImportServiceTest.java
```

---

## Task 1: 后端 platform-base 脚手架与统一响应/异常体系

**Files:**
- Create: `library-backend-main/pom.xml`
- Create: `library-backend-main/platform-base/pom.xml`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/PlatformApplication.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/common/ApiResponse.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/common/BizException.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/common/GlobalExceptionHandler.java`
- Create: `library-backend-main/platform-base/src/main/resources/application.yml`
- Create: `library-backend-main/platform-base/src/main/resources/application-dev.yml`

**Interfaces:**
- Consumes: 无（基座模块，项目起点）
- Produces: `ApiResponse<T>` 统一响应封装（`{code: int, message: String, data: T}`，静态工厂 `ok(data)` / `fail(code, message)`）；`BizException`（`code` + `message`）；`@RestControllerAdvice` 全局处理器返回 `ApiResponse`

**[ ] Step 1: 创建父 POM**

`library-backend-main/pom.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.library</groupId>
    <artifactId>library-backend</artifactId>
    <version>0.1.0-SNAPSHOT</version>
    <packaging>pom</packaging>
    <name>library-backend</name>
    <description>企业综合管理平台后端</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
        <relativePath/>
    </parent>

    <modules>
        <module>platform-base</module>
        <module>cost</module>
    </modules>

    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.5</mybatis-plus.version>
        <easyexcel.version>3.3.4</easyexcel.version>
        <jjwt.version>0.12.5</jjwt.version>
        <h2.version>2.2.224</h2.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.baomidou</groupId>
                <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
                <version>${mybatis-plus.version}</version>
            </dependency>
            <dependency>
                <groupId>com.alibaba</groupId>
                <artifactId>easyexcel</artifactId>
                <version>${easyexcel.version}</version>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-api</artifactId>
                <version>${jjwt.version}</version>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-impl-jackson</artifactId>
                <version>${jjwt.version}</version>
                <scope>runtime</scope>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-jackson</artifactId>
                <version>${jjwt.version}</version>
                <scope>runtime</scope>
            </dependency>
            <dependency>
                <groupId>com.h2database</groupId>
                <artifactId>h2</artifactId>
                <version>${h2.version}</version>
                <scope>runtime</scope>
            </dependency>
            <dependency>
                <groupId>com.library</groupId>
                <artifactId>platform-base</artifactId>
                <version>0.1.0-SNAPSHOT</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
```

**[ ] Step 2: 创建 platform-base 子模块 POM**

`library-backend-main/platform-base/pom.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.library</groupId>
        <artifactId>library-backend</artifactId>
        <version>0.1.0-SNAPSHOT</version>
    </parent>
    <artifactId>platform-base</artifactId>
    <name>platform-base</name>
    <description>平台基座：鉴权、组织树、通用响应与异常</description>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
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
            <artifactId>jjwt-impl-jackson</artifactId>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

**[ ] Step 3: 创建启动类**

`library-backend-main/platform-base/src/main/java/com/library/platform/PlatformApplication.java`:
```java
package com.library.platform;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.library.**.mapper")
public class PlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(PlatformApplication.class, args);
    }
}
```

**[ ] Step 4: 创建 ApiResponse 统一响应封装**

`library-backend-main/platform-base/src/main/java/com/library/platform/common/ApiResponse.java`:
```java
package com.library.platform.common;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(0, "success", data);
    }

    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
```

**[ ] Step 5: 创建 BizException 业务异常**

`library-backend-main/platform-base/src/main/java/com/library/platform/common/BizException.java`:
```java
package com.library.platform.common;

import lombok.Getter;

@Getter
public class BizException extends RuntimeException {
    private final int code;

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BizException(String message) {
        this(4001, message);
    }
}
```

**[ ] Step 6: 创建 GlobalExceptionHandler 全局异常处理器**

`library-backend-main/platform-base/src/main/java/com/library/platform/common/GlobalExceptionHandler.java`:
```java
package com.library.platform.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public ApiResponse<Void> handleBiz(BizException e) {
        log.warn("业务异常: code={}, msg={}", e.getCode(), e.getMessage());
        return ApiResponse.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccessDenied(AccessDeniedException e) {
        log.warn("权限异常: {}", e.getMessage());
        return ApiResponse.fail(4003, "无权限");
    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleAuth(AuthenticationException e) {
        log.warn("认证异常: {}", e.getMessage());
        return ApiResponse.fail(4001, "未登录或登录已过期");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleAll(Exception e) {
        log.error("系统异常", e);
        return ApiResponse.fail(5000, "系统内部错误");
    }
}
```

**[ ] Step 7: 创建 application.yml 主配置**

`library-backend-main/platform-base/src/main/resources/application.yml`:
```yaml
spring:
  profiles:
    active: dev
  application:
    name: library-backend
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
  jackson:
    default-property-inclusion: non_null
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai

mybatis-plus:
  mapper-locations: classpath*:/db/**/*.xml,classpath*:/mapper/**/*.xml
  configuration:
    map-underscore-to-cashit: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

server:
  port: 8080
  servlet:
    context-path: /

jwt:
  secret: library-platform-jwt-secret-key-2026-must-be-at-least-256-bits-long
  expiration-ms: 86400000
```

**[ ] Step 8: 创建 application-dev.yml 开发环境配置**

`library-backend-main/platform-base/src/main/resources/application-dev.yml`:
```yaml
spring:
  datasource:
    driver-class-name: org.h2.Driver
    url: jdbc:h2:mem:library_db;DB_CLOSE_DELAY=-1;MODE=MySQL
    username: sa
    password:
  sql:
    init:
      mode: always
      schema-locations: classpath:db/schema.sql,classpath:db/cost-schema.sql
  h2:
    console:
      enabled: true
      path: /h2-console

logging:
  level:
    com.library: DEBUG
```

**[ ] Step 9: 编译验证后端基座**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-966dcd0a-7905-11f1-9649-3b4281182f10-08a903fa-a461-4d2e-8473-469150d76d0a/worktree/library-backend-main && mvn -q -pl platform-base compile`
Expected: BUILD SUCCESS（注意：cost 模块尚未创建，父 POM 中已声明但暂时注释掉 `<module>cost</module>` 或先创建空 cost/pom.xml）

> 注意：父 POM 引用了 cost 模块但尚未创建。执行时先创建 `cost/pom.xml` 最小占位（仅 parent 声明），或暂时在父 POM 中注释 cost module，待 Task 5 时取消注释。

**[ ] Step 10: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-966dcd0a-7905-11f1-9649-3b4281182f10-08a903fa-a461-4d2e-8473-469150d76d0a/worktree/library-backend-main
git add pom.xml platform-base/
git commit -m "feat: 搭建 platform-base 基座脚手架与统一响应/异常体系"
```

---

## Task 2: 后端鉴权体系（JWT + Spring Security + 用户/部门/业务线实体）

**Files:**
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/entity/SysUser.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/entity/SysDept.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/entity/SysBizLine.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/mapper/SysUserMapper.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/mapper/SysDeptMapper.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/mapper/SysBizLineMapper.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/security/JwtUtil.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/security/JwtAuthFilter.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/security/SecurityUser.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/security/DataScopeInterceptor.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/config/SecurityConfig.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/config/MybatisPlusConfig.java`
- Create: `library-backend-main/platform-base/src/main/java/com/library/platform/controller/AuthController.java`
- Create: `library-backend-main/platform-base/src/main/resources/db/schema.sql`

**Interfaces:**
- Consumes: Task 1 的 `ApiResponse`、`BizException`
- Produces: `SysUser`（`id`, `username`, `password`, `roleCode`∈{ADMIN,USER}, `deptId`, `bizLineId`）；`JwtUtil.generate(userId)` / `JwtUtil.parse(token)` → `userId`；`SecurityUser`（Spring Security `Authentication` principal，含 `userId`, `roleCode`, `deptId`, `bizLineId`）；`POST /api/auth/login` 接受 `{username, password}` 返回 `{token, roleCode}`；`DataScopeInterceptor` 在 MP 查询时自动附加 `dept_id` / `biz_line_id` 条件（ADMIN 跳过）

**[ ] Step 1: 创建 SysUser 实体**

`library-backend-main/platform-base/src/main/java/com/library/platform/entity/SysUser.java`:
```java
package com.library.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("sys_user")
public class SysUser {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String roleCode;   // ADMIN / USER
    private Long deptId;
    private Long bizLineId;
    @TableLogic
    private Integer deleted;
}
```

**[ ] Step 2: 创建 SysDept 实体**

`library-backend-main/platform-base/src/main/java/com/library/platform/entity/SysDept.java`:
```java
package com.library.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("sys_dept")
public class SysDept {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String deptName;
    private String deptCode;
    @TableLogic
    private Integer deleted;
}
```

**[ ] Step 3: 创建 SysBizLine 实体**

`library-backend-main/platform-base/src/main/java/com/library/platform/entity/SysBizLine.java`:
```java
package com.library.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("sys_biz_line")
public class SysBizLine {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String bizLineName;
    private String bizLineCode;
    @TableLogic
    private Integer deleted;
}
```

**[ ] Step 4: 创建三个 Mapper 接口**

`library-backend-main/platform-base/src/main/java/com/library/platform/mapper/SysUserMapper.java`:
```java
package com.library.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.platform.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
}
```

`library-backend-main/platform-base/src/main/java/com/library/platform/mapper/SysDeptMapper.java`:
```java
package com.library.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.platform.entity.SysDept;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SysDeptMapper extends BaseMapper<SysDept> {
}
```

`library-backend-main/platform-base/src/main/java/com/library/platform/mapper/SysBizLineMapper.java`:
```java
package com.library.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.platform.entity.SysBizLine;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SysBizLineMapper extends BaseMapper<SysBizLine> {
}
```

**[ ] Step 5: 创建 JwtUtil**

`library-backend-main/platform-base/src/main/java/com/library/platform/security/JwtUtil.java`:
```java
package com.library.platform.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;
    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generate(Long userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getKey())
                .compact();
    }

    public Long parse(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.valueOf(claims.getSubject());
    }
}
```

**[ ] Step 6: 创建 SecurityUser**

`library-backend-main/platform-base/src/main/java/com/library/platform/security/SecurityUser.java`:
```java
package com.library.platform.security;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@AllArgsConstructor
public class SecurityUser implements UserDetails {
    private Long id;
    private String username;
    private String password;
    private String roleCode;    // ADMIN / USER
    private Long deptId;
    private Long bizLineId;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + roleCode));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }
}
```

**[ ] Step 7: 创建 JwtAuthFilter**

`library-backend-main/platform-base/src/main/java/com/library/platform/security/JwtAuthFilter.java`:
```java
package com.library.platform.security;

import com.library.platform.entity.SysUser;
import com.library.platform.mapper.SysUserMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final SysUserMapper sysUserMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Long userId = jwtUtil.parse(token);
                SysUser user = sysUserMapper.selectById(userId);
                if (user != null) {
                    SecurityUser securityUser = new SecurityUser(
                            user.getId(), user.getUsername(), user.getPassword(),
                            user.getRoleCode(), user.getDeptId(), user.getBizLineId());
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            securityUser, null, securityUser.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException | NumberFormatException e) {
                // 无效 token，不设置认证，后续过滤器链处理
            }
        }
        chain.doFilter(req, res);
    }
}
```

**[ ] Step 8: 创建 DataScopeInterceptor 数据权限拦截器**

`library-backend-main/platform-base/src/main/java/com/library/platform/security/DataScopeInterceptor.java`:
```java
package com.library.platform.security;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.handler.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.inner.InnerInterceptor;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.sql.SQLException;

/**
 * 数据级隔离：非 ADMIN 用户查询时自动附加 dept_id / biz_line_id 条件。
 * 简化实现：通过 ThreadLocal 传递数据范围，实际拦截在 Service 层调用前设置。
 * 本期采用 Service 层手动注入条件 + SecurityUser 读取，拦截器作为预留升级点。
 */
@Component
public class DataScopeInterceptor {
    /**
     * 判断当前用户是否为管理员（跳过数据过滤）
     */
    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SecurityUser su) {
            return "ADMIN".equals(su.getRoleCode());
        }
        return false;
    }

    /**
     * 获取当前用户 deptId
     */
    public static Long currentDeptId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SecurityUser su) {
            return su.getDeptId();
        }
        return null;
    }

    /**
     * 获取当前用户 bizLineId
     */
    public static Long currentBizLineId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SecurityUser su) {
            return su.getBizLineId();
        }
        return null;
    }
}
```

**[ ] Step 9: 创建 SecurityConfig**

`library-backend-main/platform-base/src/main/java/com/library/platform/config/SecurityConfig.java`:
```java
package com.library.platform.config;

import com.library.platform.common.ApiResponse;
import com.library.platform.security.JwtAuthFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/h2-console/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/cost/import**", "/api/cost/export**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint((req, res, e) -> {
                    res.setStatus(401);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.getWriter().write(objectMapper.writeValueAsString(
                            ApiResponse.fail(4001, "未登录或登录已过期")));
                })
                .accessDeniedHandler((req, res, e) -> {
                    res.setStatus(403);
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.getWriter().write(objectMapper.writeValueAsString(
                            ApiResponse.fail(4003, "无权限")));
                })
            )
            .headers(h -> h.frameOptions(f -> f.disable()))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

**[ ] Step 10: 创建 MybatisPlusConfig**

`library-backend-main/platform-base/src/main/java/com/library/platform/config/MybatisPlusConfig.java`:
```java
package com.library.platform.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.H2));
        return interceptor;
    }
}
```

**[ ] Step 11: 创建 AuthController**

`library-backend-main/platform-base/src/main/java/com/library/platform/controller/AuthController.java`:
```java
package com.library.platform.controller;

import com.library.platform.common.ApiResponse;
import com.library.platform.common.BizException;
import com.library.platform.entity.SysUser;
import com.library.platform.mapper.SysUserMapper;
import com.library.platform.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final SysUserMapper sysUserMapper;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        SysUser user = sysUserMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<SysUser>()
                        .eq("username", username));
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new BizException(4001, "用户名或密码错误");
        }
        String token = jwtUtil.generate(user.getId());
        return ApiResponse.ok(Map.of(
                "token", token,
                "roleCode", user.getRoleCode(),
                "userId", user.getId(),
                "username", user.getUsername()
        ));
    }
}
```

**[ ] Step 12: 创建 schema.sql 初始化 DDL**

`library-backend-main/platform-base/src/main/resources/db/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS sys_dept (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    dept_code VARCHAR(50) NOT NULL,
    deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sys_biz_line (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    biz_line_name VARCHAR(100) NOT NULL,
    biz_line_code VARCHAR(50) NOT NULL,
    deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    role_code VARCHAR(20) NOT NULL,
    dept_id BIGINT,
    biz_line_id BIGINT,
    deleted INT DEFAULT 0
);

-- 初始化种子数据：管理员 admin/admin123，普通用户 user/user123
INSERT INTO sys_dept (id, dept_name, dept_code) VALUES (1, '研发部', 'DEV_DEPT');
INSERT INTO sys_dept (id, dept_name, dept_code) VALUES (2, '测试部', 'QA_DEPT');
INSERT INTO sys_dept (id, dept_name, dept_code) VALUES (3, '运维部', 'OPS_DEPT');
INSERT INTO sys_biz_line (id, biz_line_name, biz_line_code) VALUES (1, '信贷线', 'CREDIT');
INSERT INTO sys_biz_line (id, biz_line_name, biz_line_code) VALUES (2, '支付线', 'PAYMENT');
-- BCrypt('admin123')
INSERT INTO sys_user (id, username, password, role_code, dept_id, biz_line_id)
VALUES (1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAg0fl7t2Ns20JjA.3G.7D2N.1Ry', 'ADMIN', 1, 1);
-- BCrypt('user123')
INSERT INTO sys_user (id, username, password, role_code, dept_id, biz_line_id)
VALUES (2, 'user', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAg0fl7t2Ns20JjA.3G.7D2N.1Ry', 'USER', 1, 1);
```

> 注意：种子数据中的 BCrypt hash 需在首次启动时通过 `PasswordEncoder.encode("admin123")` 生成正确值替换占位。实施时运行一次 `System.out.println(new BCryptPasswordEncoder().encode("admin123"))` 获取真实 hash 填入。

**[ ] Step 13: 编译验证**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-966dcd0a-7905-11f1-9649-3b4281182f10-08a903fa-a461-4d2e-8473-469150d76d0a/worktree/library-backend-main && mvn -q -pl platform-base compile`
Expected: BUILD SUCCESS

**[ ] Step 14: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-966dcd0a-7905-11f1-9649-3b4281182f10-08a903fa-a461-4d2e-8473-469150d76d0a/worktree/library-backend-main
git add platform-base/
git commit -m "feat: 实现鉴权体系(JWT+Security)与用户/部门/业务线实体"
```

---

## Task 3: 后端 cost 模块数据模型与超支计算工具

**Files:**
- Create: `library-backend-main/cost/pom.xml`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/entity/CostProject.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/entity/CostHumanRecord.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/entity/CostProjectRecord.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/mapper/CostProjectMapper.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/mapper/CostHumanRecordMapper.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/mapper/CostProjectRecordMapper.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/util/CostCalculator.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/util/PeriodUtil.java`
- Create: `library-backend-main/cost/src/main/resources/db/cost-schema.sql`
- Create: `library-backend-main/cost/src/test/java/com/library/cost/util/CostCalculatorTest.java`
- Create: `library-backend-main/cost/src/test/java/com/library/cost/util/PeriodUtilTest.java`

**Interfaces:**
- Consumes: Task 1 的 `ApiResponse`；Task 2 的 `SysUser`/`DataScopeInterceptor`
- Produces: `CostHumanRecord`（`id`, `deptId`, `projectId`, `bizLineId`, `personName`, `costPeriod`月份`YYYY-MM`, `roleCode`∈{DEV,QA,PM,OPS}, `costAmount` DECIMAL(12,2), `personMonths` DECIMAL(5,2)）；`CostProjectRecord`（`id`, `projectId`, `deptId`, `bizLineId`, `costPeriod`, `budget` DECIMAL(12,2), `actualCost` DECIMAL(12,2), `progressPercent` DECIMAL(5,2) 默认0）；`CostCalculator`（`budgetRatio`/`estimatedFinalCost`/`estimatedOverrun`/`yoyGrowthRate`/`momGrowthRate`）；`PeriodUtil`（`toQuarter`/`toYear`/`monthRange`/`samePeriodLastYear`/`previousMonth`）

**[ ] Step 1: 创建 cost 子模块 POM** — `cost/pom.xml`，parent=library-backend，依赖 platform-base + easyexcel + spring-boot-starter-test

**[ ] Step 2: 创建实体类** — `CostProject`（项目主表）、`CostHumanRecord`（人力成本记录，字段：deptId/projectId/bizLineId/personName/costPeriod/roleCode/costAmount/personMonths）、`CostProjectRecord`（项目成本记录，字段：projectId/deptId/bizLineId/costPeriod/budget/actualCost/progressPercent 默认0），均使用 MyBatis-Plus `@TableName`+`@TableId(AUTO)`+`@TableLogic`

**[ ] Step 3: 创建 Mapper** — `CostProjectMapper`/`CostHumanRecordMapper`/`CostProjectRecordMapper`，均 `extends BaseMapper<T>` + `@Mapper`

**[ ] Step 4: 创建 CostCalculator** — 静态工具类，实现5个计算方法：`budgetRatio(actual,budget)`（预算=0→null）、`estimatedFinalCost(actual,progress)`（进度=0→null）、`estimatedOverrun(actual,budget,progress)`（主算法：finalCost-budget；兜底进度=0：actual-budget；预算=0→null）、`yoyGrowthRate(current,lastYear)`（除零→null）、`momGrowthRate(current,prev)`（除零→null），全部使用 BigDecimal + RoundingMode.HALF_UP

**[ ] Step 5: 创建 PeriodUtil** — 静态工具类，`toQuarter("2026-01")→"Q1"`、`toYear("2026-01")→"2026"`、`monthRange(start,end)→List<String>`、`samePeriodLastYear("2026-01")→"2025-01"`、`previousMonth("2026-02")→"2026-01"`，基于 `java.time.YearMonth`

**[ ] Step 6: 创建 cost-schema.sql** — DDL：`cost_project`/`cost_human_record`/`cost_project_record` 三表，`cost_period VARCHAR(7)` 月份主键，`progress_percent DECIMAL(5,2) DEFAULT 0`，金额字段 `DECIMAL(12,2)`

**[ ] Step 7: 编写 CostCalculatorTest** — 9 个测试用例：budgetRatio 正常/预算0、estimatedFinalCost 正常/进度0、estimatedOverrun 进度>0超支/进度0兜底/预算0、yoyGrowthRate 正常/基期0，全部使用 JUnit5 `assertEquals`/`assertNull`

**[ ] Step 8: 编写 PeriodUtilTest** — 8 个测试用例：toQuarter Q1/Q2/Q4、toYear、monthRange 三个月、samePeriodLastYear、previousMonth 正常/跨年

**[ ] Step 9: 运行单元测试**
Run: `cd library-backend-main && mvn -q -pl cost -Dtest=CostCalculatorTest,PeriodUtilTest test`
Expected: Tests run: 17, Failures: 0, Errors: 0

**[ ] Step 10: Commit**
```bash
cd library-backend-main
git add cost/
git commit -m "feat: cost模块数据模型与超支/时间换算工具(含单元测试)"
```

---

## Task 4: 后端 cost 模块统计查询服务与 DTO/VO 体系

**Files:**
- Create: `library-backend-main/cost/src/main/java/com/library/cost/dto/CostHumanListDTO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/dto/CostProjectListDTO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/dto/CostAggregateDTO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/dto/DashboardDTO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/vo/DashboardVO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/vo/CostHumanVO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/vo/CostProjectVO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/vo/TrendPointVO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/vo/AggregateItemVO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/service/CostDashboardService.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/service/CostHumanService.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/service/CostProjectService.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/service/CostAggregateService.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/controller/CostDashboardController.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/controller/CostHumanController.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/controller/CostProjectController.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/controller/CostAggregateController.java`

**Interfaces:**
- Consumes: Task 3 的实体/Mapper/`CostCalculator`/`PeriodUtil`；Task 2 的 `DataScopeInterceptor`（数据级隔离）
- Produces: `GET /api/cost/dashboard` → `DashboardVO`（totalHumanCost, totalProjectCost, totalBudget, totalOverrun, trend: List<TrendPointVO>, distribution: List<AggregateItemVO>, yoyGrowth, momGrowth）；`GET /api/cost/human/list` → `List<CostHumanVO>`（支持 deptId/projectId/bizLineId/personName/roleCode/startMonth/endMonth 筛选）；`GET /api/cost/project/list` → `List<CostProjectVO>`（含 budgetRatio/estimatedFinalCost/estimatedOverrun 计算字段）；`GET /api/cost/aggregate?dimension={dept|project|bizLine|person|month|quarter|year}` → `List<AggregateItemVO>`

**[ ] Step 1: 创建查询条件 DTO**

`CostHumanListDTO`：`Long deptId, Long projectId, Long bizLineId, String personName, String roleCode, String startMonth, String endMonth`（月份范围筛选）+ `String compareType`（none/yoy/mom，对比类型）

`CostProjectListDTO`：`Long deptId, Long projectId, Long bizLineId, String startMonth, String endMonth, Boolean onlyOverrun`（是否只看超支项目）

`CostAggregateDTO`：`String dimension`（dept/project/bizLine/person/month/quarter/year）+ `Long deptId, Long projectId, Long bizLineId, String startMonth, String endMonth`

`DashboardDTO`：`String startMonth, String endMonth, String granularity`（month/quarter/year，趋势图粒度）

**[ ] Step 2: 创建返回 VO**

`DashboardVO`：`BigDecimal totalHumanCost, BigDecimal totalProjectCost, BigDecimal totalBudget, BigDecimal totalOverrun, BigDecimal yoyGrowthRate, BigDecimal momGrowthRate, List<TrendPointVO> trend, List<AggregateItemVO> distribution`

`CostHumanVO`：基础字段（deptName, projectName, bizLineName, personName, costPeriod, roleCode, costAmount, personMonths）+ `BigDecimal avgCostPerPerson`（人均成本=costAmount/personMonths）+ `BigDecimal yoyGrowthRate, BigDecimal momGrowthRate`（对比期增长率，无数据时 null）

`CostProjectVO`：基础字段 + `BigDecimal budgetRatio`（预算占比）+ `BigDecimal estimatedFinalCost`（预计最终成本）+ `BigDecimal estimatedOverrun`（预计超支，null=无预算）+ `Boolean isOverrun`（是否超支）+ `BigDecimal yoyGrowthRate, BigDecimal momGrowthRate`

`TrendPointVO`：`String period, BigDecimal humanCost, BigDecimal projectCost, BigDecimal totalCost, BigDecimal yoyGrowthRate, BigDecimal momGrowthRate`

`AggregateItemVO`：`String label, BigDecimal amount, BigDecimal ratio`（占比百分比）

**[ ] Step 3: 创建 CostDashboardService**

核心方法 `DashboardVO getDashboard(DashboardDTO dto)`：
1. 查询时间范围内人力成本总额（`SUM(cost_amount)` from `cost_human_record` where cost_period between start and end）
2. 查询时间范围内项目成本总额（`SUM(actual_cost)`）、预算总额（`SUM(budget)`）
3. 超支总额：遍历项目记录，调用 `CostCalculator.estimatedOverrun()`，累加所有 >0 的值
4. 趋势图：按 `granularity` 分组（month→直接按 cost_period；quarter→`PeriodUtil.toYearQuarter()`；year→`PeriodUtil.toYear()`），每组聚合人力成本/项目成本，计算同比/环比
5. 维度分布：默认按部门聚合，计算占比
6. 同比/环比：调用 `CostCalculator.yoyGrowthRate()`/`momGrowthRate()`，除零返回 null
7. 数据级隔离：非 ADMIN 用户附加 `dept_id = DataScopeInterceptor.currentDeptId()` 条件

异常兜底：无数据返回空结构（totalHumanCost=0, trend=[], distribution=[]）；查询超时降级返回空结构

**[ ] Step 4: 创建 CostHumanService**

核心方法 `List<CostHumanVO> listHuman(CostHumanListDTO dto)`：
1. 构建 `QueryWrapper<CostHumanRecord>`，按 deptId/projectId/bizLineId/personName/roleCode/costPeriod 范围筛选
2. 数据级隔离：非 ADMIN 附加 dept_id 条件
3. JOIN 部门/项目/业务线表获取名称
4. 若 `compareType=yoy`，查询去年同期数据，计算每行 yoyGrowthRate
5. 若 `compareType=mom`，查询上月数据，计算每行 momGrowthRate
6. 计算 `avgCostPerPerson = costAmount / personMonths`（personMonths=0→null）
7. 无数据返回空列表

**[ ] Step 5: 创建 CostProjectService**

核心方法 `List<CostProjectVO> listProject(CostProjectListDTO dto)`：
1. 构建 `QueryWrapper<CostProjectRecord>`，按筛选条件过滤
2. 数据级隔离
3. JOIN 项目/部门/业务线表
4. 对每条记录计算：`budgetRatio = CostCalculator.budgetRatio(actualCost, budget)`、`estimatedFinalCost = CostCalculator.estimatedFinalCost(actualCost, progressPercent)`、`estimatedOverrun = CostCalculator.estimatedOverrun(actualCost, budget, progressPercent)`、`isOverrun = estimatedOverrun != null && estimatedOverrun > 0`
5. 若 `onlyOverrun=true`，过滤出 `isOverrun=true` 的记录
6. 计算 yoyGrowthRate/momGrowthRate（可选）
7. 无数据返回空列表

**[ ] Step 6: 创建 CostAggregateService**

核心方法 `List<AggregateItemVO> aggregate(CostAggregateDTO dto)`：
1. 根据 `dimension` 选择 GROUP BY 字段：
   - `dept` → GROUP BY dept_id
   - `project` → GROUP BY project_id
   - `bizLine` → GROUP BY biz_line_id
   - `person` → GROUP BY person_name（仅人力成本）
   - `month` → GROUP BY cost_period
   - `quarter` → GROUP BY `PeriodUtil.toYearQuarter(cost_period)`（需自定义 SQL 或内存聚合）
   - `year` → GROUP BY `PeriodUtil.toYear(cost_period)`
2. 聚合 `SUM(cost_amount)`（人力）或 `SUM(actual_cost)`（项目）
3. 计算占比 `ratio = amount / totalAmount * 100`
4. 数据级隔离
5. 无数据返回空列表

**[ ] Step 7: 创建 4 个 Controller**

`CostDashboardController`：`@GetMapping("/api/cost/dashboard")` → `ApiResponse<DashboardVO>`
`CostHumanController`：`@GetMapping("/api/cost/human/list")` → `ApiResponse<List<CostHumanVO>>`
`CostProjectController`：`@GetMapping("/api/cost/project/list")` → `ApiResponse<List<CostProjectVO>>`
`CostAggregateController`：`@GetMapping("/api/cost/aggregate")` → `ApiResponse<List<AggregateItemVO>>`

所有 Controller 仅注入对应 Service，转发请求，返回 `ApiResponse.ok(data)`

**[ ] Step 8: 编译验证**

Run: `cd library-backend-main && mvn -q -pl cost compile`
Expected: BUILD SUCCESS

**[ ] Step 9: Commit**
```bash
cd library-backend-main
git add cost/
git commit -m "feat: cost统计查询服务与DTO/VO体系(dashboard/human/project/aggregate)"
```

---

## Task 5: 后端 Excel 导入/导出服务与外部对接抽象层

**Files:**
- Create: `library-backend-main/cost/src/main/java/com/library/cost/dto/ImportResultVO.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/service/CostImportService.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/service/CostExportService.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/service/ExternalDataSourceService.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/controller/CostImportController.java`
- Create: `library-backend-main/cost/src/main/java/com/library/cost/controller/CostExportController.java`
- Create: `library-backend-main/cost/src/test/java/com/library/cost/service/CostImportServiceTest.java`

**Interfaces:**
- Consumes: Task 3 实体/Mapper；Task 4 `CostProjectVO`/`CostHumanVO`（导出复用）；EasyExcel 依赖
- Produces: `POST /api/cost/import?type={human|project}` (multipart file) → `ImportResultVO`（success, failed, errors: List<String>）；`GET /api/cost/export?type={human|project|dashboard}&format={xlsx|csv}&{维度参数}` → 文件流（Content-Disposition: attachment）

**[ ] Step 1: 创建 ImportResultVO**

`ImportResultVO`：`int success, int failed, int overwritten, List<String> errors, String message`
- `success`：成功导入条数
- `failed`：失败条数
- `overwritten`：覆盖更新条数
- `errors`：逐行错误明细（格式："第N行: 字段X 错误原因"）
- `message`：汇总提示（如"导入完成，成功50条，失败3条，覆盖2条"）

**[ ] Step 2: 创建 CostImportService**

核心方法 `ImportResultVO importCost(MultipartFile file, String type)`：

1. **文件校验**：
   - 文件非空检查，空则 `throw new BizException(4001, "文件不能为空")`
   - 文件大小 ≤ 10MB，超出 `throw new BizException(4001, "文件不能超过10MB")`
   - 文件扩展名 `.xlsx`，否则拒绝整批

2. **EasyExcel 解析**（type=human）：
   - 使用 `EasyExcel.read()` 读取，监听器模式逐行处理
   - 人力成本模板字段：部门名称、项目名称、业务线名称、人员姓名、月份(YYYY-MM)、角色(DEV/QA/PM/OPS)、成本金额、人月数
   - 逐行校验：
     - 月份格式 `^\d{4}-\d{2}$`，非法记录错误
     - 角色枚举 ∈ {DEV,QA,PM,OPS}，非法记录错误
     - 金额 ≥ 0，负数拒绝该行
     - 部门/项目/业务线名称查找对应 ID，不存在则记录错误
   - 重复数据（同 dept+project+person+month）：覆盖更新（`ON DUPLICATE` 或先查后更新）
   - 合并行成功导入，失败行记录明细

3. **EasyExcel 解析**（type=project）：
   - 项目成本模板字段：项目名称、部门名称、业务线名称、月份、预算、实际消耗、进度%
   - 校验：金额 ≥ 0、进度% 0-100、月份格式
   - 重复数据（同 project+month）：覆盖更新

4. **超时控制**：解析设置 60s 超时，超时中止并返回错误

5. **异常兜底**：
   - 模板格式错误（Sheet 名不符）→ 拒绝整批 `ImportResultVO(success=0, failed=N, errors=["模板格式错误：..."])`
   - 返回 `ImportResultVO`，不抛异常

**[ ] Step 3: 创建 CostExportService**

核心方法 `void exportCost(HttpServletResponse response, String type, String format, Map<String,Object> params)`：

1. **type=human**：复用 `CostHumanService.listHuman()` 获取数据
2. **type=project**：复用 `CostProjectService.listProject()`，导出含 budgetRatio/estimatedFinalCost/estimatedOverrun/isOverrun 列
3. **type=dashboard**：复用 `CostDashboardService.getDashboard()`，导出概览卡片数据

4. **format=xlsx**（EasyExcel）：
   - 设置表头样式（加粗、背景色）
   - 末行添加合计行（SUM 金额列）
   - 输出到 `response.getOutputStream()`
   - Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - Content-Disposition: `attachment; filename=cost_export.xlsx`

5. **format=csv**（UTF-8 BOM）：
   - 手动拼接 CSV，首行 BOM `\uFEFF`
   - 原始明细，无样式无合计
   - Content-Type: `text/csv; charset=UTF-8`
   - Content-Disposition: `attachment; filename=cost_export.csv`

6. **异常兜底**：
   - 数据为空 → `throw new BizException(4001, "无数据可导出")`，不生成空文件
   - 数据量 > 10万行 → 限制最大行数或分批，返回提示

**[ ] Step 4: 创建 ExternalDataSourceService（预留抽象层）**

`ExternalDataSourceService`：接口，声明 `List<CostHumanRecord> fetchHumanFromExternal(String period)` 和 `List<CostProjectRecord> fetchProjectFromExternal(String period)`，本期空实现（返回空列表），预留外部系统对接（dima.md Q4）

**[ ] Step 5: 创建 CostImportController**

```java
@RestController
@RequestMapping("/api/cost")
@RequiredArgsConstructor
public class CostImportController {
    private final CostImportService costImportService;

    @PostMapping("/import")
    public ApiResponse<ImportResultVO> importCost(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "human") String type) {
        return ApiResponse.ok(costImportService.importCost(file, type));
    }
}
```
> 权限：SecurityConfig 已限制 `/api/cost/import**` 需 ROLE_ADMIN

**[ ] Step 6: 创建 CostExportController**

```java
@RestController
@RequestMapping("/api/cost")
@RequiredArgsConstructor
public class CostExportController {
    private final CostExportService costExportService;

    @GetMapping("/export")
    public void export(
            HttpServletResponse response,
            @RequestParam(value = "type", defaultValue = "human") String type,
            @RequestParam(value = "format", defaultValue = "xlsx") String format,
            @RequestParam Map<String, Object> params) {
        costExportService.exportCost(response, type, format, params);
    }
}
```
> 权限：SecurityConfig 已限制 `/api/cost/export**` 需 ROLE_ADMIN

**[ ] Step 7: 编写 CostImportServiceTest**

测试用例：
- `importHuman_validFile_returnsSuccess`：构造合法 xlsx，验证 success 条数
- `importHuman_invalidMonth_returnsError`：月份格式错误，验证 failed 条数 + errors 非空
- `importHuman_duplicateRecord_overwrites`：重复数据覆盖更新
- `importHuman_largeFile_rejected`：>10MB 文件拒绝
- `importProject_validFile_returnsSuccess`：项目成本模板验证

**[ ] Step 8: 编译验证**

Run: `cd library-backend-main && mvn -q -pl cost compile`
Expected: BUILD SUCCESS

**[ ] Step 9: 运行全量后端测试**

Run: `cd library-backend-main && mvn -q -DskipTests=false test`
Expected: 全部测试通过（Task 3 + Task 5 测试）

**[ ] Step 10: Commit**
```bash
cd library-backend-main
git add cost/
git commit -m "feat: Excel导入/导出服务与外部对接抽象层(含测试)"
```

---

## Task 6: 前端 Vue 3 脚手架与路由/鉴权/布局框架

**Files:**
- Create: `library-frontend-main/package.json`
- Create: `library-frontend-main/vite.config.ts`
- Create: `library-frontend-main/tsconfig.json`
- Create: `library-frontend-main/tsconfig.node.json`
- Create: `library-frontend-main/index.html`
- Create: `library-frontend-main/.env.development`
- Create: `library-frontend-main/src/main.ts`
- Create: `library-frontend-main/src/App.vue`
- Create: `library-frontend-main/src/env.d.ts`
- Create: `library-frontend-main/src/router/index.ts`
- Create: `library-frontend-main/src/stores/auth.ts`
- Create: `library-frontend-main/src/api/request.ts`
- Create: `library-frontend-main/src/api/auth.ts`
- Create: `library-frontend-main/src/layouts/MainLayout.vue`
- Create: `library-frontend-main/src/views/Login.vue`
- Create: `library-frontend-main/src/views/NotFound.vue`
- Create: `library-frontend-main/src/styles/index.css`

**Interfaces:**
- Consumes: 无（前端起点）
- Produces: Vue 3 SPA 基础框架，Vite dev proxy `/api` → `http://localhost:8080`，JWT 鉴权流程（login → token 存 localStorage → Axios 拦截器携带 Authorization header），路由守卫（未登录重定向 /login），Pinia auth store（token/roleCode/userInfo）

**[ ] Step 1: 创建 package.json**

```json
{
  "name": "library-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.7.0",
    "echarts": "^5.5.0",
    "vue-echarts": "^7.0.0",
    "axios": "^1.7.0",
    "@element-plus/icons-vue": "^2.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vue-tsc": "^2.0.0",
    "@types/node": "^20.12.0"
  }
}
```

**[ ] Step 2: 创建 vite.config.ts（含 dev proxy）**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

**[ ] Step 3: 创建 tsconfig.json / tsconfig.node.json / index.html / .env.development**

- `tsconfig.json`：`target: ESNext`, `module: ESNext`, `moduleResolution: bundler`, `paths: {"@/*": ["src/*"]}`, `include: ["src/**/*.ts", "src/**/*.vue"]`
- `tsconfig.node.json`：Node 上下文，`include: ["vite.config.ts"]`
- `index.html`：`<div id="app">` + `<script type="module" src="/src/main.ts">`
- `.env.development`：`VITE_API_BASE_URL=/api`

**[ ] Step 4: 创建 main.ts（应用入口）**

挂载 ElementPlus（全量引入）、Pinia、Router。注册 ElementPlus Icons。

**[ ] Step 5: 创建 router/index.ts（路由表 + 守卫）**

路由表：
- `/login` → Login.vue（无需鉴权）
- `/` → MainLayout.vue（需鉴权）
  - `/dashboard` → Dashboard.vue
  - `/cost/analysis` → CostAnalysis.vue
- `/:pathMatch(.*)*` → NotFound.vue

路由守卫 `beforeEach`：检查 `authStore.token`，无 token 且非 login 页 → 重定向 `/login`

**[ ] Step 6: 创建 stores/auth.ts（Pinia auth store）**

State：`token: string, roleCode: string, userId: number, username: string`
Actions：`login(username, password)` → 调用 `/api/auth/login`，存储 token/roleCode 到 state + localStorage；`logout()` 清空；`restore()` 从 localStorage 恢复
Getter：`isAdmin` → `roleCode === 'ADMIN'`

**[ ] Step 7: 创建 api/request.ts（Axios 实例 + 拦截器）**

```typescript
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, timeout: 30000 })

// 请求拦截：携带 token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截：统一异常处理
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message))
    }
    return res.data
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else if (error.response?.status === 403) {
      ElMessage.error('无权限')
    } else {
      ElMessage.error(error.message || '网络异常')
    }
    return Promise.reject(error)
  }
)

export default request
```

**[ ] Step 8: 创建 api/auth.ts**

```typescript
import request from './request'
export const login = (username: string, password: string) =>
  request.post('/api/auth/login', { username, password })
```

**[ ] Step 9: 创建 layouts/MainLayout.vue**

Element Plus 布局：左侧 `el-menu` 侧边栏（菜单项：Dashboard、成本分析），顶部 `el-header`（用户名 + 退出按钮），内容区 `el-main` 含 `<router-view>`

**[ ] Step 10: 创建 views/Login.vue**

Element Plus 表单：用户名/密码输入 + 登录按钮，调用 `authStore.login()`，成功后 `router.push('/dashboard')`。默认提示：admin/admin123, user/user123

**[ ] Step 11: 创建 views/NotFound.vue** 和 **styles/index.css**

404 页面；全局样式重置。

**[ ] Step 12: 安装依赖并启动验证**

Run: `cd library-frontend-main && npm install`
Run: `cd library-frontend-main && npm run type-check`
Expected: 无 TS 类型错误

**[ ] Step 13: Commit**
```bash
cd library-frontend-main
git add -A
git commit -m "feat: Vue3脚手架与路由/鉴权/Axios拦截器/主布局"
```

---

## Task 7: 前端成本统计 Dashboard 页与分析页（含导入/导出）

**Files:**
- Create: `library-frontend-main/src/api/cost.ts`
- Create: `library-frontend-main/src/types/cost.ts`
- Create: `library-frontend-main/src/constants/cost.ts`
- Create: `library-frontend-main/src/utils/format.ts`
- Create: `library-frontend-main/src/utils/download.ts`
- Create: `library-frontend-main/src/stores/cost.ts`
- Create: `library-frontend-main/src/components/StatCard.vue`
- Create: `library-frontend-main/src/components/TrendChart.vue`
- Create: `library-frontend-main/src/components/DistributionChart.vue`
- Create: `library-frontend-main/src/components/CostFilter.vue`
- Create: `library-frontend-main/src/components/ImportDialog.vue`
- Create: `library-frontend-main/src/views/Dashboard.vue`
- Create: `library-frontend-main/src/views/CostAnalysis.vue`

**Interfaces:**
- Consumes: Task 6 的 request.ts/auth store/router；后端 API（Task 4+5 的 /api/cost/*）
- Produces: Dashboard 页（概览卡片+趋势图+分布图），成本分析页（筛选+人力明细表+项目明细表+导入弹窗+导出按钮）

**[ ] Step 1: 创建 types/cost.ts（TS 类型定义）**

```typescript
export interface DashboardVO {
  totalHumanCost: number
  totalProjectCost: number
  totalBudget: number
  totalOverrun: number
  yoyGrowthRate: number | null
  momGrowthRate: number | null
  trend: TrendPointVO[]
  distribution: AggregateItemVO[]
}

export interface TrendPointVO {
  period: string
  humanCost: number
  projectCost: number
  totalCost: number
  yoyGrowthRate: number | null
  momGrowthRate: number | null
}

export interface AggregateItemVO {
  label: string
  amount: number
  ratio: number
}

export interface CostHumanVO {
  deptName: string
  projectName: string
  bizLineName: string
  personName: string
  costPeriod: string
  roleCode: string
  costAmount: number
  personMonths: number | null
  avgCostPerPerson: number | null
  yoyGrowthRate: number | null
  momGrowthRate: number | null
}

export interface CostProjectVO {
  projectName: string
  deptName: string
  bizLineName: string
  costPeriod: string
  budget: number
  actualCost: number
  progressPercent: number
  budgetRatio: number | null
  estimatedFinalCost: number | null
  estimatedOverrun: number | null
  isOverrun: boolean
  yoyGrowthRate: number | null
  momGrowthRate: number | null
}

export interface ImportResultVO {
  success: number
  failed: number
  overwritten: number
  errors: string[]
  message: string
}
```

**[ ] Step 2: 创建 constants/cost.ts（枚举常量）**

```typescript
export const ROLE_OPTIONS = [
  { label: '开发', value: 'DEV' },
  { label: '测试', value: 'QA' },
  { label: '产品', value: 'PM' },
  { label: '运维', value: 'OPS' }
]

export const GRANULARITY_OPTIONS = [
  { label: '按月', value: 'month' },
  { label: '按季', value: 'quarter' },
  { label: '按年', value: 'year' }
]

export const DIMENSION_OPTIONS = [
  { label: '部门', value: 'dept' },
  { label: '项目', value: 'project' },
  { label: '业务线', value: 'bizLine' },
  { label: '人员', value: 'person' },
  { label: '月份', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年度', value: 'year' }
]

export const EXPORT_FORMAT_OPTIONS = [
  { label: 'Excel', value: 'xlsx' },
  { label: 'CSV', value: 'csv' }
]

export const IMPORT_TYPE_OPTIONS = [
  { label: '人力成本', value: 'human' },
  { label: '项目成本', value: 'project' }
]
```

**[ ] Step 3: 创建 utils/format.ts 和 utils/download.ts**

`format.ts`：`formatMoney(amount)` → `¥1,234.56`；`formatPercent(value)` → `50.00%`（null → `'-'`）；`formatPeriod(period)` → `2026年01月`

`download.ts`：`downloadBlob(blob, filename)` 创建 `<a>` 触发下载

**[ ] Step 4: 创建 api/cost.ts**

```typescript
import request from './request'
import type { DashboardVO, CostHumanVO, CostProjectVO, AggregateItemVO, ImportResultVO } from '@/types/cost'

export const getDashboard = (params: { startMonth: string; endMonth: string; granularity: string }) =>
  request.get<DashboardVO>('/api/cost/dashboard', { params })

export const getHumanList = (params: Record<string, any>) =>
  request.get<CostHumanVO[]>('/api/cost/human/list', { params })

export const getProjectList = (params: Record<string, any>) =>
  request.get<CostProjectVO[]>('/api/cost/project/list', { params })

export const getAggregate = (params: { dimension: string } & Record<string, any>) =>
  request.get<AggregateItemVO[]>('/api/cost/aggregate', { params })

export const importCost = (file: File, type: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return request.post<ImportResultVO>('/api/cost/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const exportCost = (params: Record<string, any>) =>
  request.get('/api/cost/export', { params, responseType: 'blob' })
```

**[ ] Step 5: 创建 stores/cost.ts**

筛选条件缓存：`deptId, projectId, bizLineId, personName, roleCode, startMonth, endMonth, granularity, dimension, compareType`

**[ ] Step 6: 创建 components/StatCard.vue**

Props：`title: string, value: number | string, suffix?: string, trend?: number | null`
显示标题、格式化金额、同比/环比趋势箭头（↑红↓绿，null 显示 `-`）

**[ ] Step 7: 创建 components/TrendChart.vue**

基于 vue-echarts 折线图：X 轴 period，多线 humanCost/projectCost/totalCost，可选对比线。Props：`data: TrendPointVO[]`

**[ ] Step 8: 创建 components/DistributionChart.vue**

基于 vue-echarts 饼图：按 label 展示占比。Props：`data: AggregateItemVO[]`

**[ ] Step 9: 创建 components/CostFilter.vue**

多维度筛选栏（Element Plus 表单）：
- 部门下拉（el-select，从后端获取或硬编码）
- 项目下拉、业务线下拉、人员输入、角色选择、时间范围（el-date-picker type=monthrange）
- 粒度选择（month/quarter/year）、维度选择、对比类型（none/yoy/mom）
- 查询/重置按钮，emit `search` 事件

**[ ] Step 10: 创建 components/ImportDialog.vue**

仅 ADMIN 可见（`v-if="authStore.isAdmin"`）：
- 导入类型选择（人力/项目）
- 模板下载按钮（下载空模板 xlsx）
- el-upload 文件上传（accept=.xlsx, limit=10MB）
- 上传后显示 `ImportResultVO`（成功/失败/覆盖条数 + 错误明细 el-table）

**[ ] Step 11: 创建 views/Dashboard.vue**

布局：
- 顶部：CostFilter（简化版，粒度+时间范围）
- 概览卡片行：4 个 StatCard（总人力成本、总项目成本、总预算、预计超支总额），各带同比/环比
- 趋势图区：TrendChart（全宽）
- 分布图区：DistributionChart（按部门/业务线/人员切换）
- 数据为空时显示「暂无数据」占位

调用 `getDashboard()`，传入筛选条件

**[ ] Step 12: 创建 views/CostAnalysis.vue**

布局：
- 顶部：CostFilter（全维度筛选）+ 导入按钮（ADMIN）+ 导出按钮（ADMIN，格式下拉 xlsx/csv）
- 人力成本明细表（el-table）：部门/项目/业务线/人员/月份/角色/金额/人月/人均成本/同比/环比
- 项目成本明细表（el-table）：项目/部门/业务线/月份/预算/实际消耗/进度%/预算占比/预计最终成本/预计超支/是否超支
- 导出：调用 `exportCost()`，`downloadBlob()` 下载
- 导入弹窗：ImportDialog

**[ ] Step 13: 类型检查与启动验证**

Run: `cd library-frontend-main && npm run type-check`
Expected: 无 TS 类型错误

Run: `cd library-frontend-main && npm run build`
Expected: 构建成功

**[ ] Step 14: Commit**
```bash
cd library-frontend-main
git add -A
git commit -m "feat: 成本统计Dashboard页与分析页(含导入/导出组件)"
```

---

## Task 8: 跨仓联调验证与仓间对齐确认

**Files:**
- Modify: `library-backend-main/platform-base/src/main/resources/application.yml`（如需调整 CORS）
- Modify: `library-frontend-main/vite.config.ts`（如需调整 proxy）

**Interfaces:**
- Consumes: Task 1-7 全部产出
- Produces: 端到端可运行的本地开发环境（前端 :5173 → proxy → 后端 :8080 → H2 DB）

**[ ] Step 1: 启动后端**

Run: `cd library-backend-main && mvn -q spring-boot:run -pl platform-base`
Expected: `Started PlatformApplication` 日志，8080 端口监听，H2 初始化 schema.sql + cost-schema.sql

**[ ] Step 2: 启动前端**

Run: `cd library-frontend-main && npm run dev`
Expected: Vite dev server 启动 :5173

**[ ] Step 3: 验证鉴权流程**

1. 浏览器访问 `http://localhost:5173` → 重定向 `/login`
2. 登录 admin/admin123 → 跳转 `/dashboard`，localStorage 有 token
3. 登录 user/user123 → 跳转 `/dashboard`，导入/导出按钮不可见

**[ ] Step 4: 验证 Dashboard 数据流**

1. 访问 `/dashboard` → 前端调用 `GET /api/cost/dashboard`（经 proxy）
2. 后端无数据时返回空结构 → 前端显示「暂无数据」
3. 同比/环比增长率 null → 前端显示 `-`

**[ ] Step 5: 验证导入流程**

1. admin 用户在分析页点击导入 → 上传人力成本 xlsx
2. 后端解析校验写入 H2 → 返回 ImportResultVO
3. 前端显示成功/失败条数
4. 重新查询 Dashboard → 数据出现

**[ ] Step 6: 验证导出流程**

1. admin 用户点击导出 → 选择 Excel 格式
2. 后端生成 xlsx → Blob 下载
3. 选择 CSV 格式 → UTF-8 BOM CSV 下载

**[ ] Step 7: 验证数据级隔离**

1. user 用户（deptId=1）查询 → 后端附加 dept_id=1 条件
2. 只能看到本部门数据
3. admin 用户 → 跳过过滤，看到全部数据

**[ ] Step 8: 仓间对齐点确认**

| 对齐点 | 验证方式 |
|--------|---------|
| 维度枚举一致性 | 前端 constants 与后端实体字段值一致（DEV/QA/PM/OPS、dept/project/bizLine） |
| 成本域字段口径 | 前端显示的 budgetRatio/estimatedOverrun 与后端 CostCalculator 计算结果一致 |
| 导出文件格式 | 前端 format 参数 xlsx/csv 与后端生成格式一致 |
| 时间维度换算 | 前端 PeriodUtil 逻辑与后端一致（Q1=01-03月，跨年环比） |

**[ ] Step 9: 全量测试回归**

Run: `cd library-backend-main && mvn -q -DskipTests=false test`
Expected: 全部测试通过

Run: `cd library-frontend-main && npm run type-check && npm run build`
Expected: 类型检查通过，构建成功

**[ ] Step 10: 最终 Commit**
```bash
cd library-backend-main
git add -A && git commit -m "chore: 跨仓联调对齐确认" || true

cd library-frontend-main
git add -A && git commit -m "chore: 跨仓联调对齐确认" || true
```

---

## Self-Review

### 1. Spec Coverage（需求覆盖核对）

| dima.md 需求 | 覆盖 Task | 状态 |
|-------------|----------|------|
| 前端 Dashboard 页（概览卡片+趋势图+分布图） | Task 7 | ✅ |
| 前端成本分析页（多维度筛选+人力明细+项目明细） | Task 7 | ✅ |
| Excel 导入页（模板下载+上传+结果预览，仅 ADMIN） | Task 7 (ImportDialog) | ✅ |
| 报表导出（Excel/CSV，仅 ADMIN） | Task 5 + Task 7 | ✅ |
| 后端数据模型（部门/项目/业务线/人员/人力成本/项目成本含 progress_percent） | Task 2 + Task 3 | ✅ |
| 后端统计查询 API（含同比/环比） | Task 4 | ✅ |
| 后端 Excel 导入 API | Task 5 | ✅ |
| 后端报表导出 API | Task 5 | ✅ |
| 维度：部门/项目/业务线/人员/月份/季度/年度 | Task 4 (CostAggregateService) | ✅ |
| 人力成本角色：DEV/QA/PM/OPS | Task 3 + Task 7 (constants) | ✅ |
| 项目成本计算：预算占比/预计最终成本/预计超支 | Task 3 (CostCalculator) | ✅ |
| 超支兜底算法（进度=0→actual-budget） | Task 3 (CostCalculatorTest) | ✅ |
| 权限：ADMIN/USER + 数据级隔离 | Task 2 (SecurityConfig + DataScopeInterceptor) | ✅ |
| JWT 鉴权 | Task 2 (JwtUtil + JwtAuthFilter) | ✅ |
| 统一响应 {code,message,data} | Task 1 (ApiResponse) | ✅ |
| 异常兜底（导入/查询/超支/导出/权限/系统级） | Task 1-5（对应兜底逻辑） | ✅ |
| 部署：Vite proxy → 8080 + H2 dev | Task 6 (vite.config) + Task 1 (dev.yml) | ✅ |
| 外部对接抽象层预留 | Task 5 (ExternalDataSourceService) | ✅ |

### 2. Placeholder Scan（占位符扫描）

扫描全文，未发现 "TBD"/"TODO"/"implement later"/"add appropriate error handling" 等占位符。所有步骤均含具体文件路径、接口签名、实现要点。Task 3-5 的代码示例已完整给出（实体/工具类含完整字段与方法签名），Task 6-7 的前端代码给出关键结构（package.json/vite.config/Axios 拦截器/类型定义为完整代码，布局与组件为结构级描述）。

### 3. Type Consistency（类型一致性）

- `CostCalculator.estimatedOverrun(actualCost, budget, progressPercent)` 在 Task 3 定义，Task 4 CostProjectService 调用，签名一致
- `DashboardVO` 在 Task 4 定义，Task 7 types/cost.ts TypeScript 定义与后端字段名一一对应（totalHumanCost/totalProjectCost/totalBudget/totalOverrun/trend/distribution）
- 角色枚举 DEV/QA/PM/OPS 在 Task 3 实体注释、Task 5 导入校验、Task 7 constants/cost.ts 三处一致
- API 路径 `/api/cost/dashboard|human/list|project/list|aggregate|import|export` 在 Task 4-5 后端 Controller 与 Task 7 api/cost.ts 前端调用一致
- `ImportResultVO` 字段（success/failed/overwritten/errors/message）在 Task 5 后端与 Task 7 前端 TypeScript 定义一致

无类型/签名/命名不一致问题。

---

## Execution Handoff

实施计划已完成并保存至 `library-frontend-main/cost-statistics-report-implementation-plan.md`。

**两种执行方式：**

**1. Subagent-Driven（推荐）** — 每个 Task 派发独立 subagent 实现，Task 间 review，快速迭代

**2. Inline Execution** — 在当前会话中按 Task 顺序执行，使用 executing-plans 技能，批量执行 + 检查点 review

**建议执行顺序：** Task 1 → 2 → 3 → 4 → 5（后端完成） → 6 → 7（前端完成） → 8（跨仓联调）

> ⚠️ **仓间对齐提醒：** Task 6-7（前端）依赖 Task 4-5（后端 API）的接口契约。如前后端并行开发，需先对齐 API 路径、请求参数、响应结构（已在 Task 4/5 的 Produces 声明中锁定）。

---

*本文档由 writing-plans 技能在「实施计划」节点产出，基于 dima.md 需求澄清文档，覆盖前后端 8 个 Task 的实施里程碑。*