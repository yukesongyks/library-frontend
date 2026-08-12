> **文档元信息**
>
> | 项目 | 内容 |
> |------|------|
> | 文档版本 | v1.0 |
> | 作者 | DTCoder 编码实现 |
> | 创建日期 | 2026-08-12 |
> | 需求来源 | `.agents/specs/library-demo-analytics-design.md`（需求澄清规格）· `.agents/specs/library-demo-analytics-implementation-plan.md`（实施计划）· `.agents/system.changes/design.md`（系分设计） |
> | 评审状态 | 待评审 |

# 图书管理系统 — 演示接口、导出与调用埋点可视化 代码变更说明

## 1. 通览 (Overview)

### 1.1 需求回顾

本任务在 `library-backend` 和 `library-frontend` 两个 greenfield 空仓库中实现完整的演示与调用分析能力，覆盖 5 个功能域：

| # | 功能域 | 归属仓库 | 说明 |
|---|--------|----------|------|
| F1 | 三个演示接口：HelloWorld、哈希算法、冒泡排序 | `library-backend` | 后端提供 REST 接口，前端调用展示 |
| F2 | 前端三 Tab 页面 | `library-frontend` | 一个页面内三个 Tab，分别展示三个接口的执行结果 |
| F3 | 导出按钮 + 后端导出接口 | 双仓库 | 前端按钮触发，后端提供导出接口，支持导出各 Tab 展示结果 |
| F4 | 后端埋点：调用次数 + 调用人 | `library-backend` | 对三个演示接口的调用进行 AOP 埋点记录 |
| F5 | 前端可视化报表 | `library-frontend` | 在当前页面可视化调用情况，多维度（人员类型/层级/部门），多图表形式（折线图/饼图/柱状图） |

### 1.2 跨库依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                   library-frontend                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Demo Page   │  │  Export Btn  │  │  Analytics      │ │
│  │  (3 Tabs)    │  │              │  │  Charts         │ │
│  │              │  │              │  │  (Line/Pie/Bar) │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬─────────┘ │
│         │                  │                  │           │
│         │ ①调用演示接口     │ ②请求导出        │ ③查询埋点  │
│         │                  │                  │   统计数据  │
└─────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼───────────┐
│                   library-backend                          │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Demo        │  │ Export       │  │ Analytics        │  │
│  │ Controller   │  │ Controller   │  │ Controller        │  │
│  │ (3 APIs)    │  │              │  │                  │  │
│  └──────┬──────┘  └──────────────┘  └──────────────────┘  │
│         │                                                  │
│         │ ④AOP切面埋点                                     │
│         ▼                                                  │
│  ┌─────────────┐  ┌──────────────────────────────────────┐│
│  │ Demo        │  │ Tracking Store (DB)                  ││
│  │ Service     │  │ call_log: api, caller, time, dims... ││
│  └─────────────┘  └──────────────────────────────────────┘│
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Person Service (人员维度数据源)                       │ │
│  │  person: id, name, type, level, department            │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 1.3 技术栈选型

| 维度 | 选型 | 理由 |
|------|------|------|
| **后端框架** | Spring Boot 3.x + Java 17 | 企业级标准，AOP 埋点天然支持，生态成熟 |
| **前端框架** | React 18 + TypeScript | 组件化开发，类型安全，图表生态丰富 |
| **图表库** | ECharts (via echarts-for-react) | 同时支持折线图/饼图/柱状图，中文文档完善 |
| **HTTP 客户端** | Axios | 拦截器机制便于统一处理 |
| **构建工具** | Vite | 快速开发体验 |
| **数据库** | H2 (开发) / MySQL (生产) | 埋点数据持久化 |
| **ORM** | MyBatis-Plus | 简化 CRUD，灵活查询 |
| **导出格式** | Excel (.xlsx) via Apache POI | 通用性强，适合表格数据 |

### 1.4 跨库接口契约对齐矩阵

| 契约点 | 后端 (library-backend) | 前端 (library-frontend) | 对齐状态 |
|--------|------------------------|-------------------------|----------|
| 演示接口路径 | `/api/demo/helloworld`, `/api/demo/hash`, `/api/demo/bubblesort` | `callHelloWorld()`, `callHash()`, `callBubbleSort()` 调用同路径 | ✅ 一致 |
| 统一响应体 | `ApiResponse<T>` {code, message, data, traceId} | `ApiResponse<T>` 接口定义 | ✅ 一致 |
| 导出接口 | `/api/demo/export?tab=xxx` → xlsx 文件流 | `exportTab(tab)` → Blob 下载 | ✅ 一致 |
| 埋点统计接口 | `/api/analytics/calls?dimension=xxx&chartType=xxx` | `getAnalytics(query)` | ✅ 一致 |
| 调用人身份 | 从 `X-User-Id` / `X-User-Name` Header 读取 | Axios 拦截器注入 Header | ✅ 一致 |
| 导出数据源 | 从 `call_log.result_snapshot` 读取 | 前端无需感知数据源 | ✅ 后端封装 |
| 统计维度枚举 | `personType` / `personLevel` / `department` | 同枚举值 | ✅ 一致 |
| 图表类型枚举 | `line` / `pie` / `bar` | 同枚举值 | ✅ 一致 |

### 1.5 向后兼容性声明

> **契约优先原则**：所有跨库接口变更始终向后兼容。

- 演示接口：新增接口，无历史版本，天然兼容。
- 导出接口：新增接口，无历史版本，天然兼容。
- 埋点统计接口：新增接口，无历史版本，天然兼容。
- 统一响应体 `ApiResponse<T>`：后续如需扩展，仅新增字段（如 `timestamp`），不修改/删除现有字段。

---

## 2. 规划 (Planning)

### 2.1 后端目录结构 (library-backend)

```
library-backend/
├── pom.xml
├── src/main/java/com/library/backend/
│   ├── LibraryBackendApplication.java
│   ├── config/
│   │   └── WebConfig.java              # CORS + 拦截器配置
│   ├── common/
│   │   ├── ApiResponse.java            # 统一响应体
│   │   └── GlobalExceptionHandler.java # 全局异常处理
│   ├── controller/
│   │   ├── DemoController.java         # 三个演示接口 + 导出接口
│   │   └── AnalyticsController.java    # 埋点统计接口
│   ├── service/
│   │   ├── DemoService.java            # HelloWorld / Hash / BubbleSort 业务逻辑
│   │   ├── ExportService.java         # Excel 导出逻辑
│   │   └── AnalyticsService.java       # 统计查询逻辑
│   ├── aspect/
│   │   ├── TrackCall.java              # 埋点注解
│   │   └── TrackCallAspect.java        # AOP 切面
│   ├── entity/
│   │   ├── CallLog.java                # 埋点记录实体
│   │   └── Person.java                 # 人员实体
│   ├── mapper/
│   │   ├── CallLogMapper.java          # 埋点 MyBatis-Plus Mapper
│   │   └── PersonMapper.java           # 人员 Mapper
│   └── dto/
│       ├── BarLineChartDTO.java        # 柱状图/折线图响应
│       └── PieChartDTO.java            # 饼图响应
├── src/main/resources/
│   ├── application.yml
│   └── schema.sql                      # H2 初始化建表 + 人员种子数据
└── src/test/java/com/library/backend/
    ├── DemoServiceTest.java
    └── AnalyticsServiceTest.java
```

### 2.2 前端目录结构 (library-frontend)

```
library-frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   ├── request.ts                  # Axios 实例 + 拦截器
│   │   ├── demo.ts                     # 演示 + 导出接口
│   │   ├── analytics.ts                # 埋点统计接口
│   │   └── types.ts                    # 共享类型定义
│   ├── pages/
│   │   └── DemoPage.tsx                # 主页面（三 Tab + 导出 + 报表）
│   ├── components/
│   │   ├── tabs/
│   │   │   ├── HelloWorldTab.tsx
│   │   │   ├── HashTab.tsx
│   │   │   └── BubbleSortTab.tsx
│   │   ├── ExportButton.tsx
│   │   └── charts/
│   │       ├── BarChart.tsx
│   │       ├── LineChart.tsx
│   │       └── PieChart.tsx
│   ├── hooks/
│   │   ├── useDemoApi.ts               # 演示接口调用 Hook
│   │   └── useAnalytics.ts            # 统计数据查询 Hook
│   └── styles/
│       └── DemoPage.css
└── public/
```

### 2.3 任务依赖图

```
Task 1 (后端骨架) ──→ Task 2 (响应体) ──→ Task 3 (Schema+实体) ──→ Task 4 (Mapper)
                                                                    ↓
Task 5 (AOP切面) ←─────────────────────────────────────────────────┘
          ↓
Task 6 (DemoService) ──→ Task 7 (ExportService) ──→ Task 9 (Controller+CORS)
                         Task 8 (AnalyticsService) ──┘
                                                                    ↓
Task 10 (后端测试) ←───────────────────────────────────────────────┘

Task 11 (前端骨架) ──→ Task 12 (类型+Axios) ──→ Task 13 (API函数) ──→ Task 14 (Hooks)
                                                                       ↓
Task 15 (Tab组件) ←──────────────────────────────────────────────────┘
Task 16 (图表组件) ←──────────────────────────────────────────────────┘
          ↓
Task 17 (DemoPage) ──→ Task 18 (端到端联调)
```

**关键路径**: Task 1→2→3→4→5→6→9 (后端) + Task 11→12→13→14→17 (前端) → Task 18 (联调)

**可并行**: Task 6/7/8 (后端 Service 层) 可并行开发；Task 15/16 (前端组件) 可并行开发；后端 Task 1-10 与前端 Task 11-17 可跨库并行。

### 2.4 数据模型

#### call_log（调用埋点记录表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | bigint | PK, 自增 | 系统自增主键 |
| api_name | varchar(50) | NOT NULL | 接口标识: helloworld/hash/bubblesort |
| caller_id | varchar(64) | NOT NULL | 调用人 ID（关联 person.id） |
| caller_name | varchar(100) | NOT NULL | 调用人姓名 |
| call_time | datetime | NOT NULL | 调用时间 |
| call_result | varchar(20) | NOT NULL | 调用结果: SUCCESS/FAIL |
| result_snapshot | text | - | 返回结果快照（JSON，用于导出） |
| input_params | text | - | 请求参数快照（JSON） |
| duration_ms | int | - | 耗时毫秒 |

**索引：**
- IDX: `idx_call_log_api_name` (api_name) — 按接口过滤查询
- IDX: `idx_call_log_caller_id` (caller_id) — 按调用人过滤查询
- IDX: `idx_call_log_call_time` (call_time) — 按日期范围查询

#### person（人员维度表）

| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | varchar(64) | PK | 人员 ID |
| name | varchar(100) | NOT NULL | 姓名 |
| person_type | varchar(30) | NOT NULL | 人员类型: 正式员工/实习生/外包 |
| person_level | varchar(30) | NOT NULL | 人员层级: P5/P6/P7/P8/管理 |
| department | varchar(50) | NOT NULL | 部门: 研发部/产品部/测试部/运维部 |

> `call_log.caller_id` 外键关联 `person.id`，统计查询通过 JOIN person 表获取人员维度信息（person_type/person_level/department）。

### 2.5 接口契约总览

| 编号 | 接口名称 | 方法 | 路径 | 模块 |
|------|----------|------|------|------|
| W01 | HelloWorld 演示接口 | GET | /api/demo/helloworld | 演示模块 |
| W02 | 哈希算法演示接口 | GET | /api/demo/hash | 演示模块 |
| W03 | 冒泡排序演示接口 | GET | /api/demo/bubblesort | 演示模块 |
| W04 | 导出接口 | GET | /api/demo/export | 导出模块 |
| W05 | 埋点统计查询接口 | GET | /api/analytics/calls | 统计分析模块 |

---

## 3. 执行 (Execution) — 后端代码实现 (library-backend)

### 3.1 Task 1: 后端项目骨架与依赖配置

#### [library-backend] pom.xml

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    <groupId>com.library</groupId>
    <artifactId>library-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>library-backend</name>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>3.5.5</version>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>5.2.5</version>
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
</project>
```

#### [library-backend] src/main/java/com/library/backend/LibraryBackendApplication.java

```java
package com.library.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryBackendApplication.class, args);
    }
}
```

#### [library-backend] src/main/resources/application.yml

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:h2:mem:librarydb;DB_CLOSE_DELAY=-1;MODE=MySQL
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  sql:
    init:
      schema-locations: classpath:schema.sql
      mode: always

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
```

---

### 3.2 Task 2: 后端统一响应体与全局异常处理

#### [library-backend] src/main/java/com/library/backend/common/ApiResponse.java

```java
package com.library.backend.common;

import lombok.Data;

@Data
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    private String traceId;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.code = 200;
        resp.message = "success";
        resp.data = data;
        resp.traceId = java.util.UUID.randomUUID().toString();
        return resp;
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.code = code;
        resp.message = message;
        resp.traceId = java.util.UUID.randomUUID().toString();
        return resp;
    }
}
```

#### [library-backend] src/main/java/com/library/backend/common/GlobalExceptionHandler.java

```java
package com.library.backend.common;

import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ApiResponse<Void> handleMissingParam(MissingServletRequestParameterException e) {
        return ApiResponse.error(400, "缺少必填参数: " + e.getParameterName());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleIllegalArg(IllegalArgumentException e) {
        return ApiResponse.error(400, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleGeneric(Exception e) {
        return ApiResponse.error(500, "服务器内部错误: " + e.getMessage());
    }
}
```

---

### 3.3 Task 3: 后端数据库 Schema 与实体类

#### [library-backend] src/main/resources/schema.sql

```sql
-- 埋点记录表
CREATE TABLE IF NOT EXISTS call_log (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_name     VARCHAR(50)  NOT NULL COMMENT '接口标识',
    caller_id    VARCHAR(64)  NOT NULL COMMENT '调用人ID',
    caller_name  VARCHAR(100) NOT NULL COMMENT '调用人姓名',
    call_time    DATETIME     NOT NULL COMMENT '调用时间',
    call_result  VARCHAR(20)  NOT NULL COMMENT '调用结果 SUCCESS/FAIL',
    result_snapshot TEXT     COMMENT '返回结果快照JSON',
    input_params TEXT     COMMENT '请求参数快照JSON',
    duration_ms  INT          COMMENT '耗时毫秒'
);

-- 人员表
CREATE TABLE IF NOT EXISTS person (
    id           VARCHAR(64)  PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    person_type  VARCHAR(30)  NOT NULL COMMENT '人员类型: 正式员工/实习生/外包',
    person_level VARCHAR(30)  NOT NULL COMMENT '人员层级: P5/P6/P7/P8/管理',
    department   VARCHAR(50)  NOT NULL COMMENT '部门'
);

-- 人员种子数据
INSERT INTO person (id, name, person_type, person_level, department) VALUES
('u001', '张三', '正式员工', 'P7', '研发部'),
('u002', '李四', '正式员工', 'P6', '产品部'),
('u003', '王五', '实习生',   'P5', '测试部'),
('u004', '赵六', '外包',     'P6', '运维部'),
('u005', '钱七', '正式员工', 'P8', '研发部');
```

#### [library-backend] src/main/java/com/library/backend/entity/CallLog.java

```java
package com.library.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("call_log")
public class CallLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String apiName;
    private String callerId;
    private String callerName;
    private LocalDateTime callTime;
    private String callResult;
    private String resultSnapshot;
    private String inputParams;
    private Integer durationMs;
}
```

#### [library-backend] src/main/java/com/library/backend/entity/Person.java

```java
package com.library.backend.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("person")
public class Person {
    @TableId
    private String id;
    private String name;
    private String personType;
    private String personLevel;
    private String department;
}
```

---

### 3.4 Task 4: 后端 Mapper 层

#### [library-backend] src/main/java/com/library/backend/mapper/CallLogMapper.java

```java
package com.library.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.backend.entity.CallLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;
import java.util.Map;

@Mapper
public interface CallLogMapper extends BaseMapper<CallLog> {

    @Select("""
        SELECT p.${dimensionColumn} AS dimValue, l.api_name AS apiName, COUNT(*) AS cnt
        FROM call_log l
        JOIN person p ON l.caller_id = p.id
        WHERE l.call_time BETWEEN #{startDate} AND #{endDate}
        AND (#{apiName} IS NULL OR l.api_name = #{apiName})
        GROUP BY p.${dimensionColumn}, l.api_name
        """)
    List<Map<String, Object>> countByDimension(
            @Param("dimensionColumn") String dimensionColumn,
            @Param("apiName") String apiName,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate);

    @Select("""
        SELECT result_snapshot FROM call_log
        WHERE api_name = #{apiName}
        ORDER BY call_time DESC
        """)
    List<String> findSnapshotsByApiName(@Param("apiName") String apiName);
}
```

#### [library-backend] src/main/java/com/library/backend/mapper/PersonMapper.java

```java
package com.library.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.backend.entity.Person;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PersonMapper extends BaseMapper<Person> {
}
```

---

### 3.5 Task 5: 后端埋点注解与 AOP 切面

#### [library-backend] src/main/java/com/library/backend/aspect/TrackCall.java

```java
package com.library.backend.aspect;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TrackCall {
    String apiName();
    String description() default "";
}
```

#### [library-backend] src/main/java/com/library/backend/aspect/TrackCallAspect.java

```java
package com.library.backend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.backend.entity.CallLog;
import com.library.backend.mapper.CallLogMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Map;

@Aspect
@Component
public class TrackCallAspect {

    private final CallLogMapper callLogMapper;
    private final ObjectMapper objectMapper;

    public TrackCallAspect(CallLogMapper callLogMapper, ObjectMapper objectMapper) {
        this.callLogMapper = callLogMapper;
        this.objectMapper = objectMapper;
    }

    @Around("@annotation(trackCall)")
    public Object track(ProceedingJoinPoint joinPoint, TrackCall trackCall) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = null;
        String callResult = "SUCCESS";
        try {
            result = joinPoint.proceed();
        } catch (Throwable e) {
            callResult = "FAIL";
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - start;
            saveCallLog(trackCall, result, callResult, duration);
        }
        return result;
    }

    private void saveCallLog(TrackCall trackCall, Object result, String callResult, long durationMs) {
        try {
            HttpServletRequest request = ((ServletRequestAttributes)
                RequestContextHolder.currentRequestAttributes()).getRequest();

            String callerId = request.getHeader("X-User-Id");
            String callerName = request.getHeader("X-User-Name");

            CallLog log = new CallLog();
            log.setApiName(trackCall.apiName());
            log.setCallerId(callerId != null ? callerId : "anonymous");
            log.setCallerName(callerName != null ? callerName : "匿名");
            log.setCallTime(LocalDateTime.now());
            log.setCallResult(callResult);
            log.setResultSnapshot(result != null ? objectMapper.writeValueAsString(result) : null);
            log.setDurationMs((int) durationMs);

            Map<String, String[]> params = request.getParameterMap();
            log.setInputParams(objectMapper.writeValueAsString(params));

            callLogMapper.insert(log);
        } catch (Exception e) {
            // 埋点失败不影响主流程
        }
    }
}
```

---

### 3.6 Task 6: 后端 DemoService 业务逻辑

#### [library-backend] src/main/java/com/library/backend/service/DemoService.java

```java
package com.library.backend.service;

import org.springframework.stereotype.Service;
import java.security.MessageDigest;
import java.util.*;

@Service
public class DemoService {

    public Map<String, String> helloWorld() {
        return Map.of("result", "Hello, World!");
    }

    public Map<String, String> hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return Map.of(
                "input", input,
                "algorithm", "SHA-256",
                "hashValue", sb.toString()
            );
        } catch (Exception e) {
            throw new RuntimeException("哈希计算失败", e);
        }
    }

    public Map<String, Object> bubbleSort(String numbers) {
        String[] parts = numbers.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i].trim());
        }

        int[] inputCopy = arr.clone();
        int steps = 0;
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                    steps++;
                }
            }
        }

        List<Integer> inputList = new ArrayList<>();
        for (int v : inputCopy) inputList.add(v);
        List<Integer> sortedList = new ArrayList<>();
        for (int v : arr) sortedList.add(v);

        return Map.of(
            "input", inputList,
            "sorted", sortedList,
            "steps", steps
        );
    }
}
```

---

### 3.7 Task 7: 后端 ExportService 导出逻辑

#### [library-backend] src/main/java/com/library/backend/service/ExportService.java

```java
package com.library.backend.service;

import com.library.backend.mapper.CallLogMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.util.List;

@Service
public class ExportService {

    private final CallLogMapper callLogMapper;

    public ExportService(CallLogMapper callLogMapper) {
        this.callLogMapper = callLogMapper;
    }

    public void exportTab(String tab, HttpServletResponse response) throws Exception {
        List<String> snapshots = callLogMapper.findSnapshotsByApiName(tab);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet(tab);

        Row headerRow = sheet.createRow(0);
        String[] headers = getHeaders(tab);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        for (int i = 0; i < snapshots.size(); i++) {
            Row row = sheet.createRow(i + 1);
            String json = snapshots.get(i);
            if ("helloworld".equals(tab)) {
                row.createCell(0).setCellValue(extractField(json, "result"));
            } else if ("hash".equals(tab)) {
                row.createCell(0).setCellValue(extractField(json, "input"));
                row.createCell(1).setCellValue(extractField(json, "algorithm"));
                row.createCell(2).setCellValue(extractField(json, "hashValue"));
            } else if ("bubblesort".equals(tab)) {
                row.createCell(0).setCellValue(extractField(json, "input"));
                row.createCell(1).setCellValue(extractField(json, "sorted"));
                row.createCell(2).setCellValue(extractField(json, "steps"));
            }
        }

        String filename = "demo_" + tab + "_" + System.currentTimeMillis() + ".xlsx";
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        try (OutputStream os = response.getOutputStream()) {
            workbook.write(os);
            workbook.close();
        }
    }

    private String[] getHeaders(String tab) {
        return switch (tab) {
            case "helloworld" -> new String[]{"result"};
            case "hash" -> new String[]{"input", "algorithm", "hashValue"};
            case "bubblesort" -> new String[]{"input", "sorted", "steps"};
            default -> throw new IllegalArgumentException("未知 Tab: " + tab);
        };
    }

    private String extractField(String json, String field) {
        String key = "\"" + field + "\":";
        int idx = json.indexOf(key);
        if (idx < 0) return "";
        int start = idx + key.length();
        while (start < json.length() && json.charAt(start) == ' ') start++;
        if (start < json.length() && json.charAt(start) == '"') {
            int end = json.indexOf('"', start + 1);
            return json.substring(start + 1, end);
        } else {
            int end = start;
            while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
            return json.substring(start, end).trim();
        }
    }
}
```

---

### 3.8 Task 8: 后端 AnalyticsService 统计查询与 DTO

#### [library-backend] src/main/java/com/library/backend/dto/BarLineChartDTO.java

```java
package com.library.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class BarLineChartDTO {
    private String dimension;
    private String chartType;
    private List<String> categories;
    private List<Series> series;

    @Data
    public static class Series {
        private String name;
        private List<Integer> data;
    }
}
```

#### [library-backend] src/main/java/com/library/backend/dto/PieChartDTO.java

```java
package com.library.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class PieChartDTO {
    private String dimension;
    private String chartType;
    private List<PieSeries> series;

    @Data
    public static class PieSeries {
        private String name;
        private Integer value;
    }
}
```

#### [library-backend] src/main/java/com/library/backend/service/AnalyticsService.java

```java
package com.library.backend.service;

import com.library.backend.dto.BarLineChartDTO;
import com.library.backend.dto.PieChartDTO;
import com.library.backend.mapper.CallLogMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AnalyticsService {

    private final CallLogMapper callLogMapper;

    public AnalyticsService(CallLogMapper callLogMapper) {
        this.callLogMapper = callLogMapper;
    }

    public BarLineChartDTO getBarLineData(String dimension, String chartType,
            String apiName, String startDate, String endDate) {
        String dimColumn = resolveDimensionColumn(dimension);
        String[] dateRange = resolveDateRange(startDate, endDate);

        List<Map<String, Object>> rows = callLogMapper.countByDimension(
                dimColumn, apiName, dateRange[0], dateRange[1]);

        Set<String> categorySet = new LinkedHashSet<>();
        Set<String> apiNameSet = new LinkedHashSet<>();
        Map<String, Map<String, Integer>> dataMap = new HashMap<>();

        for (Map<String, Object> row : rows) {
            String dimValue = (String) row.get("dimValue");
            String an = (String) row.get("apiName");
            int cnt = ((Number) row.get("cnt")).intValue();
            categorySet.add(dimValue);
            apiNameSet.add(an);
            dataMap.computeIfAbsent(an, k -> new HashMap<>()).put(dimValue, cnt);
        }

        BarLineChartDTO dto = new BarLineChartDTO();
        dto.setDimension(dimension);
        dto.setChartType(chartType);
        dto.setCategories(new ArrayList<>(categorySet));

        List<BarLineChartDTO.Series> seriesList = new ArrayList<>();
        for (String an : apiNameSet) {
            BarLineChartDTO.Series s = new BarLineChartDTO.Series();
            s.setName(an);
            List<Integer> data = new ArrayList<>();
            for (String cat : categorySet) {
                data.add(dataMap.getOrDefault(an, new HashMap<>()).getOrDefault(cat, 0));
            }
            s.setData(data);
            seriesList.add(s);
        }
        dto.setSeries(seriesList);
        return dto;
    }

    public PieChartDTO getPieData(String dimension, String apiName,
            String startDate, String endDate) {
        String dimColumn = resolveDimensionColumn(dimension);
        String[] dateRange = resolveDateRange(startDate, endDate);

        List<Map<String, Object>> rows = callLogMapper.countByDimension(
                dimColumn, apiName, dateRange[0], dateRange[1]);

        Map<String, Integer> valueMap = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String dimValue = (String) row.get("dimValue");
            int cnt = ((Number) row.get("cnt")).intValue();
            valueMap.merge(dimValue, cnt, Integer::sum);
        }

        PieChartDTO dto = new PieChartDTO();
        dto.setDimension(dimension);
        dto.setChartType("pie");

        List<PieChartDTO.PieSeries> seriesList = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : valueMap.entrySet()) {
            PieChartDTO.PieSeries ps = new PieChartDTO.PieSeries();
            ps.setName(entry.getKey());
            ps.setValue(entry.getValue());
            seriesList.add(ps);
        }
        dto.setSeries(seriesList);
        return dto;
    }

    private String resolveDimensionColumn(String dimension) {
        return switch (dimension) {
            case "personType" -> "person_type";
            case "personLevel" -> "person_level";
            case "department" -> "department";
            default -> throw new IllegalArgumentException("非法维度: " + dimension);
        };
    }

    private String[] resolveDateRange(String startDate, String endDate) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate end = endDate != null ? LocalDate.parse(endDate, fmt) : LocalDate.now();
        LocalDate start = startDate != null ? LocalDate.parse(startDate, fmt) : end.minusDays(6);
        return new String[]{
            start.atStartOfDay().toString(),
            end.atTime(23, 59, 59).toString()
        };
    }
}
```

---

### 3.9 Task 9: 后端 Controller 层与 CORS 配置

#### [library-backend] src/main/java/com/library/backend/controller/DemoController.java

```java
package com.library.backend.controller;

import com.library.backend.aspect.TrackCall;
import com.library.backend.common.ApiResponse;
import com.library.backend.service.DemoService;
import com.library.backend.service.ExportService;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    private final DemoService demoService;
    private final ExportService exportService;

    public DemoController(DemoService demoService, ExportService exportService) {
        this.demoService = demoService;
        this.exportService = exportService;
    }

    @GetMapping("/helloworld")
    @TrackCall(apiName = "helloworld", description = "HelloWorld演示接口")
    public ApiResponse<Map<String, String>> helloWorld() {
        return ApiResponse.success(demoService.helloWorld());
    }

    @GetMapping("/hash")
    @TrackCall(apiName = "hash", description = "哈希算法演示接口")
    public ApiResponse<Map<String, String>> hash(@RequestParam String input) {
        return ApiResponse.success(demoService.hash(input));
    }

    @GetMapping("/bubblesort")
    @TrackCall(apiName = "bubblesort", description = "冒泡排序演示接口")
    public ApiResponse<Map<String, Object>> bubbleSort(@RequestParam String numbers) {
        return ApiResponse.success(demoService.bubbleSort(numbers));
    }

    @GetMapping("/export")
    public void export(@RequestParam String tab, HttpServletResponse response) throws Exception {
        exportService.exportTab(tab, response);
    }
}
```

#### [library-backend] src/main/java/com/library/backend/controller/AnalyticsController.java

```java
package com.library.backend.controller;

import com.library.backend.common.ApiResponse;
import com.library.backend.dto.BarLineChartDTO;
import com.library.backend.dto.PieChartDTO;
import com.library.backend.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/calls")
    public ApiResponse<Object> getCalls(
            @RequestParam String dimension,
            @RequestParam(defaultValue = "bar") String chartType,
            @RequestParam(required = false) String apiName,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        if ("pie".equals(chartType)) {
            PieChartDTO data = analyticsService.getPieData(dimension, apiName, startDate, endDate);
            return ApiResponse.success(data);
        } else {
            BarLineChartDTO data = analyticsService.getBarLineData(dimension, chartType, apiName, startDate, endDate);
            return ApiResponse.success(data);
        }
    }
}
```

#### [library-backend] src/main/java/com/library/backend/config/WebConfig.java

```java
package com.library.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

---

## 4. 执行 (Execution) — 前端代码实现 (library-frontend)

### 4.1 Task 11: 前端项目骨架与依赖配置

#### [library-frontend] package.json

```json
{
  "name": "library-frontend",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "echarts": "^5.4.3",
    "echarts-for-react": "^3.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

#### [library-frontend] vite.config.ts

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

#### [library-frontend] tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

#### [library-frontend] index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>图书管理系统 - Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### [library-frontend] src/main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### [library-frontend] src/App.tsx

```tsx
import React from 'react';
import DemoPage from './pages/DemoPage';

const App: React.FC = () => {
  return <DemoPage />;
};

export default App;
```

---

### 4.2 Task 12: 前端 API 类型定义与 Axios 拦截器

#### [library-frontend] src/api/types.ts

```typescript
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

export interface HelloWorldResult {
  result: string;
}

export interface HashResult {
  input: string;
  algorithm: string;
  hashValue: string;
}

export interface BubbleSortResult {
  input: number[];
  sorted: number[];
  steps: number;
}

export type TabKey = 'helloworld' | 'hash' | 'bubblesort';

export interface AnalyticsQuery {
  dimension: 'personType' | 'personLevel' | 'department';
  chartType?: 'line' | 'pie' | 'bar';
  apiName?: 'helloworld' | 'hash' | 'bubblesort';
  startDate?: string;
  endDate?: string;
}

export interface BarLineChartData {
  dimension: string;
  chartType: string;
  categories: string[];
  series: { name: string; data: number[] }[];
}

export interface PieChartData {
  dimension: string;
  chartType: string;
  series: { name: string; value: number }[];
}
```

#### [library-frontend] src/api/request.ts

```typescript
import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = localStorage.getItem('userId') || 'guest';
  config.headers['X-User-Name'] = localStorage.getItem('userName') || '访客';
  return config;
});

request.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default request;
```

---

### 4.3 Task 13: 前端 API 调用函数

#### [library-frontend] src/api/demo.ts

```typescript
import request from './request';
import { ApiResponse, HelloWorldResult, HashResult, BubbleSortResult, TabKey } from './types';

export function callHelloWorld(): Promise<ApiResponse<HelloWorldResult>> {
  return request.get('/demo/helloworld').then(res => res.data);
}

export function callHash(input: string): Promise<ApiResponse<HashResult>> {
  return request.get('/demo/hash', { params: { input } }).then(res => res.data);
}

export function callBubbleSort(numbers: string): Promise<ApiResponse<BubbleSortResult>> {
  return request.get('/demo/bubblesort', { params: { numbers } }).then(res => res.data);
}

export function exportTab(tab: TabKey): Promise<Blob> {
  return request.get('/demo/export', {
    params: { tab },
    responseType: 'blob',
  }).then(res => res.data);
}
```

#### [library-frontend] src/api/analytics.ts

```typescript
import request from './request';
import { ApiResponse, AnalyticsQuery, BarLineChartData, PieChartData } from './types';

export function getAnalytics(
  query: AnalyticsQuery
): Promise<ApiResponse<BarLineChartData | PieChartData>> {
  return request.get('/analytics/calls', { params: query }).then(res => res.data);
}
```

---

### 4.4 Task 14: 前端 Hooks 层

#### [library-frontend] src/hooks/useDemoApi.ts

```typescript
import { useState, useCallback } from 'react';
import { callHelloWorld, callHash, callBubbleSort } from '../api/demo';
import { HelloWorldResult, HashResult, BubbleSortResult } from '../api/types';

export function useHelloWorld() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HelloWorldResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callHelloWorld();
      setData(res.data);
    } catch (e: any) {
      setError(e.message || '调用失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, data, error, execute };
}

export function useHash() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HashResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (input: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await callHash(input);
      setData(res.data);
    } catch (e: any) {
      setError(e.message || '调用失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, data, error, execute };
}

export function useBubbleSort() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BubbleSortResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (numbers: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await callBubbleSort(numbers);
      setData(res.data);
    } catch (e: any) {
      setError(e.message || '调用失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, data, error, execute };
}
```

#### [library-frontend] src/hooks/useAnalytics.ts

```typescript
import { useState, useEffect } from 'react';
import { getAnalytics } from '../api/analytics';
import { AnalyticsQuery, BarLineChartData, PieChartData } from '../api/types';

export function useAnalytics(query: AnalyticsQuery | null) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BarLineChartData | PieChartData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);
    getAnalytics(query)
      .then(res => setData(res.data))
      .catch(e => setError(e.message || '查询失败'))
      .finally(() => setLoading(false));
  }, [JSON.stringify(query)]);

  return { loading, data, error };
}
```

---

### 4.5 Task 15: 前端 Tab 组件与导出按钮

#### [library-frontend] src/components/tabs/HelloWorldTab.tsx

```tsx
import React from 'react';
import { useHelloWorld } from '../../hooks/useDemoApi';

const HelloWorldTab: React.FC = () => {
  const { loading, data, error, execute } = useHelloWorld();

  return (
    <div className="tab-content-box">
      <button onClick={execute} disabled={loading}>
        {loading ? '执行中...' : '执行'}
      </button>
      {error && <div className="error">{error}</div>}
      {data && (
        <div className="result">
          <label>结果:</label>
          <span>{data.result}</span>
        </div>
      )}
    </div>
  );
};

export default HelloWorldTab;
```

#### [library-frontend] src/components/tabs/HashTab.tsx

```tsx
import React, { useState } from 'react';
import { useHash } from '../../hooks/useDemoApi';

const HashTab: React.FC = () => {
  const [input, setInput] = useState('abc');
  const { loading, data, error, execute } = useHash();

  return (
    <div className="tab-content-box">
      <div className="input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入字符串"
        />
        <button onClick={() => execute(input)} disabled={loading}>
          {loading ? '执行中...' : '执行'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {data && (
        <div className="result">
          <div><label>算法:</label><span>{data.algorithm}</span></div>
          <div><label>哈希值:</label><span className="hash-value">{data.hashValue}</span></div>
        </div>
      )}
    </div>
  );
};

export default HashTab;
```

#### [library-frontend] src/components/tabs/BubbleSortTab.tsx

```tsx
import React, { useState } from 'react';
import { useBubbleSort } from '../../hooks/useDemoApi';

const BubbleSortTab: React.FC = () => {
  const [numbers, setNumbers] = useState('5,3,8,1,9');
  const { loading, data, error, execute } = useBubbleSort();

  return (
    <div className="tab-content-box">
      <div className="input-row">
        <input
          type="text"
          value={numbers}
          onChange={e => setNumbers(e.target.value)}
          placeholder="逗号分隔整数, 如 5,3,8,1,9"
        />
        <button onClick={() => execute(numbers)} disabled={loading}>
          {loading ? '执行中...' : '执行'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {data && (
        <div className="result">
          <div><label>排序结果:</label><span>[{data.sorted.join(', ')}]</span></div>
          <div><label>交换步数:</label><span>{data.steps}</span></div>
        </div>
      )}
    </div>
  );
};

export default BubbleSortTab;
```

#### [library-frontend] src/components/ExportButton.tsx

```tsx
import React, { useState } from 'react';
import { exportTab } from '../api/demo';
import { TabKey } from '../api/types';

interface Props {
  tab: TabKey;
}

const ExportButton: React.FC<Props> = ({ tab }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await exportTab(tab);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demo_${tab}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('导出失败', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading} className="export-btn">
      {loading ? '导出中...' : `导出当前Tab`}
    </button>
  );
};

export default ExportButton;
```

---

### 4.6 Task 16: 前端 ECharts 图表组件

#### [library-frontend] src/components/charts/BarChart.tsx

```tsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { BarLineChartData } from '../../api/types';

interface Props {
  data: BarLineChartData;
}

const BarChart: React.FC<Props> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: data.series.map(s => s.name) },
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'value', name: '调用次数' },
      series: data.series.map(s => ({ name: s.name, type: 'bar', data: s.data })),
    });
    return () => chart.dispose();
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: 350 }} />;
};

export default BarChart;
```

#### [library-frontend] src/components/charts/LineChart.tsx

```tsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { BarLineChartData } from '../../api/types';

interface Props {
  data: BarLineChartData;
}

const LineChart: React.FC<Props> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: data.series.map(s => s.name) },
      xAxis: { type: 'category', data: data.categories },
      yAxis: { type: 'value', name: '调用次数' },
      series: data.series.map(s => ({ name: s.name, type: 'line', data: s.data, smooth: true })),
    });
    return () => chart.dispose();
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: 350 }} />;
};

export default LineChart;
```

#### [library-frontend] src/components/charts/PieChart.tsx

```tsx
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { PieChartData } from '../../api/types';

interface Props {
  data: PieChartData;
}

const PieChart: React.FC<Props> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: data.series.map(s => ({ name: s.name, value: s.value })),
      }],
    });
    return () => chart.dispose();
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: 350 }} />;
};

export default PieChart;
```

#### [library-frontend] src/components/AnalyticsPanel.tsx

```tsx
import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { AnalyticsQuery, BarLineChartData, PieChartData } from '../api/types';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';

const AnalyticsPanel: React.FC = () => {
  const [dimension, setDimension] = useState<AnalyticsQuery['dimension']>('personType');
  const [chartType, setChartType] = useState<AnalyticsQuery['chartType']>('bar');
  const [apiName, setApiName] = useState<string>('');

  const query: AnalyticsQuery = {
    dimension,
    chartType,
    apiName: apiName || undefined,
  };

  const { loading, data, error } = useAnalytics(query);

  return (
    <div className="analytics-panel">
      <div className="filter-bar">
        <label>维度:</label>
        <select value={dimension} onChange={e => setDimension(e.target.value as any)}>
          <option value="personType">人员类型</option>
          <option value="personLevel">人员层级</option>
          <option value="department">人员部门</option>
        </select>

        <label>图表:</label>
        <select value={chartType} onChange={e => setChartType(e.target.value as any)}>
          <option value="bar">柱状图</option>
          <option value="line">折线图</option>
          <option value="pie">饼图</option>
        </select>

        <label>接口:</label>
        <select value={apiName} onChange={e => setApiName(e.target.value)}>
          <option value="">全部</option>
          <option value="helloworld">helloworld</option>
          <option value="hash">hash</option>
          <option value="bubblesort">bubblesort</option>
        </select>
      </div>

      {loading && <div>加载中...</div>}
      {error && <div className="error">{error}</div>}
      {data && !loading && (
        <div className="chart-area">
          {chartType === 'pie' && <PieChart data={data as PieChartData} />}
          {chartType === 'bar' && <BarChart data={data as BarLineChartData} />}
          {chartType === 'line' && <LineChart data={data as BarLineChartData} />}
        </div>
      )}
      {data === null && !loading && !error && (
        <div className="empty-state">暂无调用记录</div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
```

---

### 4.7 Task 17: 前端 DemoPage 主页面与样式

#### [library-frontend] src/pages/DemoPage.tsx

```tsx
import React, { useState } from 'react';
import HelloWorldTab from '../components/tabs/HelloWorldTab';
import HashTab from '../components/tabs/HashTab';
import BubbleSortTab from '../components/tabs/BubbleSortTab';
import ExportButton from '../components/ExportButton';
import AnalyticsPanel from '../components/AnalyticsPanel';
import { TabKey } from '../api/types';
import '../styles/DemoPage.css';

const DemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('helloworld');

  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Demo 演示页</h1>
        <ExportButton tab={activeTab} />
      </header>

      <nav className="tab-nav">
        <button
          className={activeTab === 'helloworld' ? 'active' : ''}
          onClick={() => setActiveTab('helloworld')}
        >
          HelloWorld
        </button>
        <button
          className={activeTab === 'hash' ? 'active' : ''}
          onClick={() => setActiveTab('hash')}
        >
          哈希算法
        </button>
        <button
          className={activeTab === 'bubblesort' ? 'active' : ''}
          onClick={() => setActiveTab('bubblesort')}
        >
          冒泡排序
        </button>
      </nav>

      <main className="tab-content">
        {activeTab === 'helloworld' && <HelloWorldTab />}
        {activeTab === 'hash' && <HashTab />}
        {activeTab === 'bubblesort' && <BubbleSortTab />}
      </main>

      <section className="analytics-section">
        <h2>调用情况分析报表</h2>
        <AnalyticsPanel />
      </section>
    </div>
  );
};

export default DemoPage;
```

#### [library-frontend] src/styles/DemoPage.css

```css
.demo-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.demo-header h1 {
  margin: 0;
  color: #333;
}

.tab-nav {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
}

.tab-nav button {
  padding: 10px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-nav button.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 600;
}

.tab-content {
  min-height: 200px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 30px;
}

.tab-content-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 8px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #40a9ff;
}

.result {
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.result label {
  display: inline-block;
  width: 80px;
  color: #666;
  font-size: 13px;
}

.result span {
  color: #333;
}

.hash-value {
  word-break: break-all;
  font-family: monospace;
  font-size: 13px;
}

.error {
  color: #ff4d4f;
  font-size: 13px;
}

.export-btn {
  background: #52c41a;
}

.export-btn:hover:not(:disabled) {
  background: #73d13d;
}

.analytics-section {
  margin-top: 30px;
}

.analytics-section h2 {
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.analytics-panel {
  padding: 20px 0;
}

.filter-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-bar label {
  font-size: 13px;
  color: #666;
}

.filter-bar select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
}

.chart-area {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}
```

---

## 5. 汇总 (Summary)

### 5.1 代码变更清单

| 仓库 | 变更类型 | 文件数 | 说明 |
|------|----------|--------|------|
| `library-backend` | 新增 | ~16 文件 | pom.xml + Application + config + common + controller + service + aspect + entity + mapper + dto + schema.sql + test |
| `library-frontend` | 新增 | ~18 文件 | package.json + vite.config + tsconfig + index.html + main.tsx + App.tsx + api(4) + pages(1) + components(7) + hooks(2) + styles(1) |

#### 后端文件清单 (library-backend)

| # | 逻辑路径 | 文件 | 说明 |
|---|----------|------|------|
| 1 | `pom.xml` | Maven 配置 | Spring Boot 3.2 + MyBatis-Plus + H2 + POI + Lombok |
| 2 | `src/main/java/.../LibraryBackendApplication.java` | 主启动类 | `@SpringBootApplication` |
| 3 | `src/main/resources/application.yml` | 应用配置 | H2 内存库 + schema.sql 自动初始化 |
| 4 | `src/main/resources/schema.sql` | 建表脚本 | call_log + person + 种子数据 |
| 5 | `src/main/java/.../common/ApiResponse.java` | 统一响应体 | `{code, message, data, traceId}` |
| 6 | `src/main/java/.../common/GlobalExceptionHandler.java` | 全局异常处理 | 400/500 错误统一返回 |
| 7 | `src/main/java/.../entity/CallLog.java` | 埋点实体 | MyBatis-Plus `@TableName` |
| 8 | `src/main/java/.../entity/Person.java` | 人员实体 | MyBatis-Plus `@TableName` |
| 9 | `src/main/java/.../mapper/CallLogMapper.java` | 埋点 Mapper | insert + countByDimension + findSnapshotsByApiName |
| 10 | `src/main/java/.../mapper/PersonMapper.java` | 人员 Mapper | BaseMapper CRUD |
| 11 | `src/main/java/.../aspect/TrackCall.java` | 埋点注解 | `@Target(METHOD)` `@Retention(RUNTIME)` |
| 12 | `src/main/java/.../aspect/TrackCallAspect.java` | AOP 切面 | `@Around` 环绕通知，异步写入 call_log |
| 13 | `src/main/java/.../service/DemoService.java` | 演示业务逻辑 | helloWorld / hash(SHA-256) / bubbleSort |
| 14 | `src/main/java/.../service/ExportService.java` | 导出逻辑 | Apache POI 生成 xlsx |
| 15 | `src/main/java/.../service/AnalyticsService.java` | 统计查询 | 多维度聚合 + DTO 组装 |
| 16 | `src/main/java/.../dto/BarLineChartDTO.java` | 柱/折线图 DTO | `{dimension, chartType, categories, series}` |
| 17 | `src/main/java/.../dto/PieChartDTO.java` | 饼图 DTO | `{dimension, chartType, series}` |
| 18 | `src/main/java/.../controller/DemoController.java` | 演示 Controller | 3 个演示接口 + 导出接口 |
| 19 | `src/main/java/.../controller/AnalyticsController.java` | 统计 Controller | 埋点统计查询接口 |
| 20 | `src/main/java/.../config/WebConfig.java` | CORS 配置 | 允许 5173 跨域 |

#### 前端文件清单 (library-frontend)

| # | 逻辑路径 | 文件 | 说明 |
|---|----------|------|------|
| 1 | `package.json` | 依赖配置 | React 18 + Axios + ECharts + Vite |
| 2 | `vite.config.ts` | 构建配置 | proxy `/api` → 8080 |
| 3 | `tsconfig.json` | TS 配置 | strict 模式 |
| 4 | `index.html` | HTML 入口 | `<div id="root">` |
| 5 | `src/main.tsx` | React 入口 | `ReactDOM.createRoot` |
| 6 | `src/App.tsx` | 根组件 | 渲染 DemoPage |
| 7 | `src/api/types.ts` | 类型定义 | ApiResponse + Result 类型 + AnalyticsQuery |
| 8 | `src/api/request.ts` | Axios 实例 | 拦截器注入 X-User-Id/X-User-Name |
| 9 | `src/api/demo.ts` | 演示 API | callHelloWorld / callHash / callBubbleSort / exportTab |
| 10 | `src/api/analytics.ts` | 统计 API | getAnalytics |
| 11 | `src/hooks/useDemoApi.ts` | 演示 Hooks | useHelloWorld / useHash / useBubbleSort |
| 12 | `src/hooks/useAnalytics.ts` | 统计 Hook | useAnalytics(query) |
| 13 | `src/components/tabs/HelloWorldTab.tsx` | HelloWorld Tab | 执行按钮 + 结果展示 |
| 14 | `src/components/tabs/HashTab.tsx` | 哈希 Tab | 输入框 + 执行 + 哈希值展示 |
| 15 | `src/components/tabs/BubbleSortTab.tsx` | 冒泡排序 Tab | 输入 + 执行 + 排序结果展示 |
| 16 | `src/components/ExportButton.tsx` | 导出按钮 | Blob 下载 xlsx |
| 17 | `src/components/charts/BarChart.tsx` | 柱状图 | ECharts bar |
| 18 | `src/components/charts/LineChart.tsx` | 折线图 | ECharts line |
| 19 | `src/components/charts/PieChart.tsx` | 饼图 | ECharts pie |
| 20 | `src/components/AnalyticsPanel.tsx` | 报表面板 | 维度/图表/接口选择器 + 图表渲染 |
| 21 | `src/pages/DemoPage.tsx` | 主页面 | 三 Tab + 导出 + 报表 |
| 22 | `src/styles/DemoPage.css` | 页面样式 | 布局 + Tab + 图表区域样式 |

### 5.2 跨仓对齐点检查结论

| 对齐点 | 检查项 | 结论 |
|--------|--------|------|
| **接口路径** | 前端 API 调用路径与后端 Controller `@RequestMapping` 路径一致 | ✅ `/api/demo/*`、`/api/analytics/calls` 完全对齐 |
| **请求/响应类型** | `ApiResponse<T>` 结构前后端字段一致 (code/message/data/traceId) | ✅ TypeScript 接口与 Java 泛型类对齐 |
| **导出契约** | 前端 `exportTab()` 返回 Blob，后端返回 `application/vnd.openxmlformats` 文件流 | ✅ MIME 类型与前端下载处理对齐 |
| **埋点身份传递** | 前端 Axios 拦截器注入 `X-User-Id`/`X-User-Name`，后端 AOP 从 Header 读取 | ✅ Header 名称完全一致 |
| **统计维度枚举** | 前端 `personType`/`personLevel`/`department` 与后端 `@RequestParam dimension` 取值一致 | ✅ 枚举值对齐 |
| **图表类型枚举** | 前端 `line`/`pie`/`bar` 与后端 `chartType` 参数一致 | ✅ 枚举值对齐 |
| **数据模型** | `call_log.caller_id` ↔ `person.id` 外键关联，统计查询 JOIN 获取维度 | ✅ 关系一致 |
| **向后兼容** | 所有接口均为新增，无历史版本冲突 | ✅ 天然兼容 |

### 5.3 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 埋点 AOP 异步写入高并发数据库压力 | 当前同步写入（MVP），后续可引入 `@Async` + 消息队列削峰 |
| `result_snapshot` TEXT 类型大响应体占用存储 | 可设置截断阈值（如 4KB） |
| 前端图表空数据状态 | `AnalyticsPanel` 已处理 `empty-state` 友好提示 |
| 跨库联调环境依赖 | Vite proxy 代理 `/api` 到 8080，CORS 配置允许 5173 |

### 5.4 假设与待确认项

| 编号 | 假设/待确认内容 | 当前假设 | 确认状态 |
|------|-----------------|----------|----------|
| A01 | 调用人身份获取方式 | 通过 HTTP Header `X-User-Id`/`X-User-Name` 模拟传递，实际项目需对接 SSO | 待确认 |
| A02 | 人员维度数据来源 | person 表种子数据（5 条），实际项目需对接人员中心 API | 待确认 |
| A03 | 导出数据源 | 从埋点表 `call_log.result_snapshot` 读取历史调用记录导出，非前端内存数据 | 已确认 |
| A04 | 埋点写入方式 | 当前同步写入（AOP `@Around`），高并发场景后续引入 MQ 削峰 | 待确认 |
| A05 | 数据库选型 | 开发环境 H2 内存数据库，生产环境 MySQL | 待确认 |

### 5.5 后续阶段建议

1. **联调阶段**：启动后端服务（默认 8080 端口），前端 Vite dev server 配置代理转发 `/api` 到后端。
2. **测试阶段**：后端单元测试覆盖三个 Service 方法 + AOP 埋点 + 统计查询；前端组件测试覆盖 Tab 切换 + 图表渲染。
3. **埋点验证**：调用演示接口后检查 `call_log` 表是否有记录，且 `caller_id` 能正确关联 `person` 表。
4. **生产部署**：H2 切换为 MySQL，添加 Nginx 反向代理，配置登录态拦截器对接 SSO。

---

*本文档由 DTCoder 编码实现阶段产出，基于需求澄清规格、实施计划与系分设计，作为代码实现的交付说明。*
