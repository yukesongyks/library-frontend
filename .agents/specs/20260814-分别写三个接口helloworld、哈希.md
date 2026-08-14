# 多功能演示页面 + 埋点报表系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在图书管理系统中新增「功能演示」模块，包含 HelloWorld / 哈希算法 / 冒泡排序三个后端接口，前端 Tab 页面展示结果并支持导出，后端 AOP 埋点记录调用日志，前端可视化报表（折线图/饼图/柱状图）展示调用统计。

**Architecture:** 后端 Spring Boot 提供 REST API，AOP 切面自动埋点写入 MySQL，Apache POI 导出 Excel；前端 React + TypeScript + Ant Design 构建 Tab 页面，ECharts 渲染图表。前后端通过统一 `{ code, message, data }` 响应结构通信。

**Tech Stack:**
- 后端: Spring Boot 3.x, MyBatis-Plus 3.5.x, MySQL 8.x, Apache POI 5.x, Lombok
- 前端: React 18.x, TypeScript 5.x, Ant Design 5.x, ECharts 5.x, echarts-for-react 3.x, Axios 1.x

**涉及仓库:**
- `library-backend` — 后端 Spring Boot 项目
- `library-frontend` — 前端 React 项目

---

## Global Constraints

- 统一响应结构: `{ code: number, message: string, data: T }`，后端使用 `DemoResponse<T>` 包装
- API 基础路径: `/api/demo/*`
- 接口类型枚举值: `HELLOWORLD`, `HASH`, `BUBBLE_SORT`（前后端一致）
- 统计维度枚举值: `PERSON_TYPE`, `PERSON_LEVEL`, `DEPARTMENT`, `DATE`（前后端一致）
- 时间格式: 日期 `yyyy-MM-dd`，时间戳 ISO 8601
- 导出格式: `.xlsx`，响应 Content-Type `application/octet-stream`
- 埋点异步写入，不阻塞主接口响应
- 所有后端接口需编写单元测试
- 前端组件使用函数式组件 + Hooks

---

## File Structure

### library-backend（后端）

```
library-backend/
├── pom.xml                                          # Maven 依赖配置
├── src/main/java/com/library/demo/
│   ├── DemoApplication.java                         # Spring Boot 启动类
│   ├── config/
│   │   └── AsyncConfig.java                         # 异步线程池配置
│   ├── controller/
│   │   ├── DemoController.java                      # 三个演示接口 + 导出
│   │   └── AnalyticsController.java                 # 统计查询接口
│   ├── service/
│   │   ├── HelloWorldService.java                   # HelloWorld 业务
│   │   ├── HashService.java                         # 哈希算法业务
│   │   ├── BubbleSortService.java                   # 冒泡排序业务
│   │   ├── ExportService.java                       # 导出业务
│   │   └── AnalyticsService.java                    # 统计分析业务
│   ├── mapper/
│   │   └── DemoCallLogMapper.java                   # MyBatis-Plus Mapper
│   ├── entity/
│   │   └── DemoCallLog.java                         # 调用记录实体
│   ├── dto/
│   │   ├── request/
│   │   │   ├── HelloWorldRequest.java
│   │   │   ├── HashRequest.java
│   │   │   ├── BubbleSortRequest.java
│   │   │   ├── ExportRequest.java
│   │   │   └── AnalyticsQuery.java
│   │   └── response/
│   │       ├── DemoResponse.java                    # 统一响应包装
│   │       ├── HelloWorldResult.java
│   │       ├── HashResult.java
│   │       ├── BubbleSortResult.java
│   │       ├── AnalyticsSummary.java
│   │       └── AnalyticsTrend.java
│   ├── aspect/
│   │   └── CallLogAspect.java                       # AOP 埋点切面
│   ├── annotation/
│   │   └── CallLog.java                             # 自定义埋点注解
│   ├── enums/
│   │   ├── ApiType.java
│   │   ├── HashAlgorithm.java
│   │   ├── SortOrder.java
│   │   └── AnalyticsDimension.java
│   └── util/
│       └── ExcelUtil.java                           # Excel 工具类
├── src/main/resources/
│   ├── application.yml                              # 应用配置
│   └── db/migration/
│       └── V1__create_demo_call_log.sql             # 建表 SQL
└── src/test/java/com/library/demo/
    ├── service/
    │   ├── HelloWorldServiceTest.java
    │   ├── HashServiceTest.java
    │   └── BubbleSortServiceTest.java
    └── controller/
        └── DemoControllerTest.java
```

### library-frontend（前端）

```
library-frontend/
├── package.json                                     # 依赖配置
├── tsconfig.json                                    # TypeScript 配置
├── vite.config.ts                                   # Vite 构建配置
├── index.html                                       # 入口 HTML
└── src/
    ├── main.tsx                                     # 应用入口
    ├── App.tsx                                      # 根组件（路由）
    ├── pages/
    │   └── Demo/
    │       ├── index.tsx                            # 主页面（Tabs 容器）
    │       ├── components/
    │       │   ├── HelloWorldTab.tsx                # HelloWorld Tab
    │       │   ├── HashTab.tsx                      # 哈希算法 Tab
    │       │   ├── BubbleSortTab.tsx                # 冒泡排序 Tab
    │       │   ├── AnalyticsTab.tsx                 # 调用统计 Tab
    │       │   ├── ResultTable.tsx                  # 通用结果表格
    │       │   ├── ExportButton.tsx                 # 导出按钮组件
    │       │   └── charts/
    │       │       ├── LineChart.tsx                # 折线图组件
    │       │       ├── PieChart.tsx                 # 饼图组件
    │       │       └── BarChart.tsx                 # 柱状图组件
    │       ├── services/
    │       │   └── demoApi.ts                       # API 请求封装
    │       └── types/
    │           └── demo.ts                          # TypeScript 类型定义
    └── utils/
        └── request.ts                               # Axios 实例封装
```

---

## Task 1: 后端项目脚手架搭建

**Files:**
- Create: `library-backend/pom.xml`
- Create: `library-backend/src/main/java/com/library/demo/DemoApplication.java`
- Create: `library-backend/src/main/resources/application.yml`
- Create: `library-backend/src/main/resources/db/migration/V1__create_demo_call_log.sql`
- Create: `library-backend/src/main/java/com/library/demo/config/AsyncConfig.java`

**Interfaces:**
- Consumes: 无（首个 Task）
- Produces: Spring Boot 可启动项目骨架，后续所有 Task 依赖此基础结构

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
        <version>3.2.2</version>
        <relativePath/>
    </parent>

    <groupId>com.library</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>library-demo</name>
    <description>Demo module for library system</description>

    <properties>
        <java.version>17</java.version>
        <mybatis-plus.version>3.5.5</mybatis-plus.version>
        <poi.version>5.2.5</poi.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Boot AOP -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>

        <!-- MyBatis-Plus -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>

        <!-- MySQL Driver -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Apache POI for Excel -->
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>${poi.version}</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- H2 for testing -->
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

- [ ] **Step 2: 创建 Spring Boot 启动类**

```java
package com.library.demo;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@MapperScan("com.library.demo.mapper")
@EnableAsync
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

- [ ] **Step 3: 创建 application.yml**

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/library_demo?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl

logging:
  level:
    com.library.demo: DEBUG
```

- [ ] **Step 4: 创建建表 SQL**

```sql
CREATE TABLE IF NOT EXISTS demo_call_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_type        VARCHAR(32) NOT NULL COMMENT '接口类型: HELLOWORLD/HASH/BUBBLE_SORT',
    caller_id       VARCHAR(64) NOT NULL COMMENT '调用者ID',
    caller_name     VARCHAR(128) COMMENT '调用者姓名',
    person_type     VARCHAR(32) COMMENT '人员类型: 正式/实习/外包',
    person_level    VARCHAR(32) COMMENT '人员层级: P5/P6/P7/P8...',
    department      VARCHAR(128) COMMENT '所属部门',
    request_params  TEXT COMMENT '请求参数(JSON)',
    response_data   TEXT COMMENT '响应结果(JSON)',
    execution_time_ms INT COMMENT '执行耗时(ms)',
    call_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '调用时间',
    INDEX idx_api_type (api_type),
    INDEX idx_caller_id (caller_id),
    INDEX idx_call_time (call_time),
    INDEX idx_department (department),
    INDEX idx_person_type (person_type),
    INDEX idx_person_level (person_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='功能演示接口调用记录';
```

- [ ] **Step 5: 创建异步配置类**

```java
package com.library.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class AsyncConfig {

    @Bean("callLogExecutor")
    public Executor callLogExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("call-log-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

- [ ] **Step 6: 验证项目可编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize backend project scaffold with Spring Boot 3.x"
```

---

## Task 2: 后端枚举与基础 DTO

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/enums/ApiType.java`
- Create: `library-backend/src/main/java/com/library/demo/enums/HashAlgorithm.java`
- Create: `library-backend/src/main/java/com/library/demo/enums/SortOrder.java`
- Create: `library-backend/src/main/java/com/library/demo/enums/AnalyticsDimension.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/response/DemoResponse.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/request/HelloWorldRequest.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/request/HashRequest.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/request/BubbleSortRequest.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/request/ExportRequest.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/request/AnalyticsQuery.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/response/HelloWorldResult.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/response/HashResult.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/response/BubbleSortResult.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/response/AnalyticsSummary.java`
- Create: `library-backend/src/main/java/com/library/demo/dto/response/AnalyticsTrend.java`

**Interfaces:**
- Consumes: Task 1 项目骨架
- Produces: 所有枚举和 DTO 类，后续 Task 3/4/5/6 均依赖这些类型定义

- [ ] **Step 1: 创建枚举类**

```java
// ApiType.java
package com.library.demo.enums;

public enum ApiType {
    HELLOWORLD,
    HASH,
    BUBBLE_SORT
}
```

```java
// HashAlgorithm.java
package com.library.demo.enums;

public enum HashAlgorithm {
    MD5("MD5"),
    SHA1("SHA-1"),
    SHA256("SHA-256"),
    SHA512("SHA-512");

    private final String javaName;

    HashAlgorithm(String javaName) {
        this.javaName = javaName;
    }

    public String getJavaName() {
        return javaName;
    }
}
```

```java
// SortOrder.java
package com.library.demo.enums;

public enum SortOrder {
    ASC,
    DESC
}
```

```java
// AnalyticsDimension.java
package com.library.demo.enums;

public enum AnalyticsDimension {
    PERSON_TYPE,
    PERSON_LEVEL,
    DEPARTMENT,
    DATE
}
```

- [ ] **Step 2: 创建统一响应包装类**

```java
// DemoResponse.java
package com.library.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemoResponse<T> {
    private int code;
    private String message;
    private T data;

    public static <T> DemoResponse<T> success(T data) {
        return new DemoResponse<>(200, "success", data);
    }

    public static <T> DemoResponse<T> error(int code, String message) {
        return new DemoResponse<>(code, message, null);
    }
}
```

- [ ] **Step 3: 创建请求 DTO**

```java
// HelloWorldRequest.java
package com.library.demo.dto.request;

import lombok.Data;

@Data
public class HelloWorldRequest {
    private String name;
}
```

```java
// HashRequest.java
package com.library.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HashRequest {
    @NotBlank(message = "input is required")
    private String input;
    private String algorithm; // MD5|SHA1|SHA256|SHA512, default SHA256
}
```

```java
// BubbleSortRequest.java
package com.library.demo.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BubbleSortRequest {
    @NotEmpty(message = "numbers is required")
    private List<Integer> numbers;
    private String order; // ASC|DESC, default ASC
}
```

```java
// ExportRequest.java
package com.library.demo.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ExportRequest {
    @NotNull(message = "type is required")
    private String type; // HELLOWORLD|HASH|BUBBLE_SORT
    private List<Long> recordIds;
}
```

```java
// AnalyticsQuery.java
package com.library.demo.dto.request;

import lombok.Data;

@Data
public class AnalyticsQuery {
    private String dimension; // PERSON_TYPE|PERSON_LEVEL|DEPARTMENT|DATE
    private String apiType;   // HELLOWORLD|HASH|BUBBLE_SORT (optional)
    private String startDate; // yyyy-MM-dd
    private String endDate;   // yyyy-MM-dd
    private String granularity; // DAY|WEEK|MONTH (for trend)
}
```

- [ ] **Step 4: 创建响应 DTO**

```java
// HelloWorldResult.java
package com.library.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HelloWorldResult {
    private String result;
    private String timestamp;
    private long executionTimeMs;
}
```

```java
// HashResult.java
package com.library.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HashResult {
    private String input;
    private String algorithm;
    private String hashResult;
    private String timestamp;
    private long executionTimeMs;
}
```

```java
// BubbleSortResult.java
package com.library.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BubbleSortResult {
    private List<Integer> original;
    private List<Integer> sorted;
    private String order;
    private int swapCount;
    private String timestamp;
    private long executionTimeMs;
}
```

```java
// AnalyticsSummary.java
package com.library.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSummary {
    private String dimension;
    private List<SummaryItem> items;
    private long totalCount;
    private DateRange dateRange;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryItem {
        private String label;
        private long count;
        private double percentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateRange {
        private String start;
        private String end;
    }
}
```

```java
// AnalyticsTrend.java
package com.library.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsTrend {
    private String granularity;
    private List<Series> series;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Series {
        private String apiType;
        private List<Point> points;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Point {
        private String date;
        private long count;
    }
}
```

- [ ] **Step 5: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add enums and DTOs for demo module"
```

---

## Task 3: 后端三个演示接口实现

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/service/HelloWorldService.java`
- Create: `library-backend/src/main/java/com/library/demo/service/HashService.java`
- Create: `library-backend/src/main/java/com/library/demo/service/BubbleSortService.java`
- Create: `library-backend/src/main/java/com/library/demo/controller/DemoController.java`
- Create: `library-backend/src/test/java/com/library/demo/service/HelloWorldServiceTest.java`
- Create: `library-backend/src/test/java/com/library/demo/service/HashServiceTest.java`
- Create: `library-backend/src/test/java/com/library/demo/service/BubbleSortServiceTest.java`

**Interfaces:**
- Consumes: Task 2 的枚举和 DTO（`HelloWorldRequest`, `HashRequest`, `BubbleSortRequest`, `HelloWorldResult`, `HashResult`, `BubbleSortResult`, `DemoResponse`, `ApiType`, `HashAlgorithm`, `SortOrder`）
- Produces: `DemoController` 提供 `POST /api/demo/helloworld`, `POST /api/demo/hash`, `POST /api/demo/bubble-sort` 三个端点

- [ ] **Step 1: 编写 HelloWorldService 单元测试**

```java
package com.library.demo.service;

import com.library.demo.dto.request.HelloWorldRequest;
import com.library.demo.dto.response.HelloWorldResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HelloWorldServiceTest {

    private final HelloWorldService service = new HelloWorldService();

    @Test
    void shouldReturnGreetingWithName() {
        HelloWorldRequest request = new HelloWorldRequest();
        request.setName("Alice");
        HelloWorldResult result = service.greet(request);
        assertEquals("Hello, Alice!", result.getResult());
        assertNotNull(result.getTimestamp());
        assertTrue(result.getExecutionTimeMs() >= 0);
    }

    @Test
    void shouldReturnGreetingWithDefaultName() {
        HelloWorldRequest request = new HelloWorldRequest();
        HelloWorldResult result = service.greet(request);
        assertEquals("Hello, World!", result.getResult());
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd library-backend && mvn test -pl . -Dtest=HelloWorldServiceTest -q`
Expected: FAIL — HelloWorldService 类不存在

- [ ] **Step 3: 实现 HelloWorldService**

```java
package com.library.demo.service;

import com.library.demo.dto.request.HelloWorldRequest;
import com.library.demo.dto.response.HelloWorldResult;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class HelloWorldService {

    public HelloWorldResult greet(HelloWorldRequest request) {
        long start = System.currentTimeMillis();
        String name = (request.getName() != null && !request.getName().isBlank())
                ? request.getName() : "World";
        String result = "Hello, " + name + "!";
        long elapsed = System.currentTimeMillis() - start;
        return new HelloWorldResult(result, Instant.now().toString(), elapsed);
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `cd library-backend && mvn test -pl . -Dtest=HelloWorldServiceTest -q`
Expected: PASS

- [ ] **Step 5: 编写 HashService 单元测试**

```java
package com.library.demo.service;

import com.library.demo.dto.request.HashRequest;
import com.library.demo.dto.response.HashResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HashServiceTest {

    private final HashService service = new HashService();

    @Test
    void shouldHashWithSHA256ByDefault() {
        HashRequest request = new HashRequest();
        request.setInput("hello");
        HashResult result = service.hash(request);
        assertEquals("hello", result.getInput());
        assertEquals("SHA256", result.getAlgorithm());
        assertNotNull(result.getHashResult());
        assertFalse(result.getHashResult().isEmpty());
    }

    @Test
    void shouldHashWithMD5() {
        HashRequest request = new HashRequest();
        request.setInput("hello");
        request.setAlgorithm("MD5");
        HashResult result = service.hash(request);
        assertEquals("MD5", result.getAlgorithm());
        assertEquals("5d41402abc4b2a76b9719d911017c592", result.getHashResult());
    }

    @Test
    void shouldHashWithSHA1() {
        HashRequest request = new HashRequest();
        request.setInput("hello");
        request.setAlgorithm("SHA1");
        HashResult result = service.hash(request);
        assertEquals("SHA1", result.getAlgorithm());
        assertEquals("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d", result.getHashResult());
    }
}
```

- [ ] **Step 6: 运行测试确认失败**

Run: `cd library-backend && mvn test -pl . -Dtest=HashServiceTest -q`
Expected: FAIL — HashService 类不存在

- [ ] **Step 7: 实现 HashService**

```java
package com.library.demo.service;

import com.library.demo.dto.request.HashRequest;
import com.library.demo.dto.response.HashResult;
import com.library.demo.enums.HashAlgorithm;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

@Service
public class HashService {

    public HashResult hash(HashRequest request) {
        long start = System.currentTimeMillis();

        String algorithmStr = (request.getAlgorithm() != null && !request.getAlgorithm().isBlank())
                ? request.getAlgorithm() : "SHA256";
        HashAlgorithm algorithm = HashAlgorithm.valueOf(algorithmStr);

        String hashValue = computeHash(request.getInput(), algorithm);
        long elapsed = System.currentTimeMillis() - start;

        return new HashResult(
                request.getInput(),
                algorithmStr,
                hashValue,
                Instant.now().toString(),
                elapsed
        );
    }

    private String computeHash(String input, HashAlgorithm algorithm) {
        try {
            MessageDigest digest = MessageDigest.getInstance(algorithm.getJavaName());
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Unsupported algorithm: " + algorithm, e);
        }
    }
}
```

- [ ] **Step 8: 运行测试确认通过**

Run: `cd library-backend && mvn test -pl . -Dtest=HashServiceTest -q`
Expected: PASS

- [ ] **Step 9: 编写 BubbleSortService 单元测试**

```java
package com.library.demo.service;

import com.library.demo.dto.request.BubbleSortRequest;
import com.library.demo.dto.response.BubbleSortResult;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BubbleSortServiceTest {

    private final BubbleSortService service = new BubbleSortService();

    @Test
    void shouldSortAscendingByDefault() {
        BubbleSortRequest request = new BubbleSortRequest();
        request.setNumbers(Arrays.asList(5, 3, 8, 1, 9, 2));
        BubbleSortResult result = service.sort(request);
        assertEquals(Arrays.asList(1, 2, 3, 5, 8, 9), result.getSorted());
        assertEquals("ASC", result.getOrder());
        assertTrue(result.getSwapCount() > 0);
    }

    @Test
    void shouldSortDescending() {
        BubbleSortRequest request = new BubbleSortRequest();
        request.setNumbers(Arrays.asList(5, 3, 8, 1));
        request.setOrder("DESC");
        BubbleSortResult result = service.sort(request);
        assertEquals(Arrays.asList(8, 5, 3, 1), result.getSorted());
        assertEquals("DESC", result.getOrder());
    }

    @Test
    void shouldHandleAlreadySortedArray() {
        BubbleSortRequest request = new BubbleSortRequest();
        request.setNumbers(Arrays.asList(1, 2, 3));
        BubbleSortResult result = service.sort(request);
        assertEquals(Arrays.asList(1, 2, 3), result.getSorted());
        assertEquals(0, result.getSwapCount());
    }
}
```

- [ ] **Step 10: 运行测试确认失败**

Run: `cd library-backend && mvn test -pl . -Dtest=BubbleSortServiceTest -q`
Expected: FAIL — BubbleSortService 类不存在

- [ ] **Step 11: 实现 BubbleSortService**

```java
package com.library.demo.service;

import com.library.demo.dto.request.BubbleSortRequest;
import com.library.demo.dto.response.BubbleSortResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class BubbleSortService {

    public BubbleSortResult sort(BubbleSortRequest request) {
        long start = System.currentTimeMillis();

        String order = (request.getOrder() != null && !request.getOrder().isBlank())
                ? request.getOrder() : "ASC";
        boolean ascending = "ASC".equalsIgnoreCase(order);

        List<Integer> original = new ArrayList<>(request.getNumbers());
        List<Integer> arr = new ArrayList<>(request.getNumbers());
        int swapCount = bubbleSort(arr, ascending);

        long elapsed = System.currentTimeMillis() - start;

        return new BubbleSortResult(
                original,
                arr,
                order,
                swapCount,
                Instant.now().toString(),
                elapsed
        );
    }

    private int bubbleSort(List<Integer> arr, boolean ascending) {
        int n = arr.size();
        int swapCount = 0;
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - 1 - i; j++) {
                boolean shouldSwap = ascending
                        ? arr.get(j) > arr.get(j + 1)
                        : arr.get(j) < arr.get(j + 1);
                if (shouldSwap) {
                    int temp = arr.get(j);
                    arr.set(j, arr.get(j + 1));
                    arr.set(j + 1, temp);
                    swapCount++;
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
        return swapCount;
    }
}
```

- [ ] **Step 12: 运行测试确认通过**

Run: `cd library-backend && mvn test -pl . -Dtest=BubbleSortServiceTest -q`
Expected: PASS

- [ ] **Step 13: 创建 DemoController**

```java
package com.library.demo.controller;

import com.library.demo.dto.request.BubbleSortRequest;
import com.library.demo.dto.request.HashRequest;
import com.library.demo.dto.request.HelloWorldRequest;
import com.library.demo.dto.response.*;
import com.library.demo.service.BubbleSortService;
import com.library.demo.service.HashService;
import com.library.demo.service.HelloWorldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/demo")
@RequiredArgsConstructor
public class DemoController {

    private final HelloWorldService helloWorldService;
    private final HashService hashService;
    private final BubbleSortService bubbleSortService;

    @PostMapping("/helloworld")
    public DemoResponse<HelloWorldResult> helloWorld(@RequestBody HelloWorldRequest request) {
        return DemoResponse.success(helloWorldService.greet(request));
    }

    @PostMapping("/hash")
    public DemoResponse<HashResult> hash(@Valid @RequestBody HashRequest request) {
        return DemoResponse.success(hashService.hash(request));
    }

    @PostMapping("/bubble-sort")
    public DemoResponse<BubbleSortResult> bubbleSort(@Valid @RequestBody BubbleSortRequest request) {
        return DemoResponse.success(bubbleSortService.sort(request));
    }
}
```

- [ ] **Step 14: 运行全部测试**

Run: `cd library-backend && mvn test -q`
Expected: ALL PASS

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: implement helloworld, hash, and bubble-sort APIs with tests"
```

---

## Task 4: 后端实体、Mapper 与 AOP 埋点切面

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/entity/DemoCallLog.java`
- Create: `library-backend/src/main/java/com/library/demo/mapper/DemoCallLogMapper.java`
- Create: `library-backend/src/main/java/com/library/demo/annotation/CallLog.java`
- Create: `library-backend/src/main/java/com/library/demo/aspect/CallLogAspect.java`

**Interfaces:**
- Consumes: Task 2 的 `ApiType` 枚举；Task 3 的 `DemoController` 方法签名
- Produces: `@CallLog` 注解 + `CallLogAspect` 切面，自动拦截带注解的方法并异步写入 `demo_call_log` 表

- [ ] **Step 1: 创建实体类**

```java
package com.library.demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("demo_call_log")
public class DemoCallLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String apiType;

    private String callerId;

    private String callerName;

    private String personType;

    private String personLevel;

    private String department;

    private String requestParams;

    private String responseData;

    private Integer executionTimeMs;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime callTime;
}
```

- [ ] **Step 2: 创建 Mapper**

```java
package com.library.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.demo.entity.DemoCallLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DemoCallLogMapper extends BaseMapper<DemoCallLog> {
}
```

- [ ] **Step 3: 创建自定义注解**

```java
package com.library.demo.annotation;

import com.library.demo.enums.ApiType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CallLog {
    ApiType apiType();
}
```

- [ ] **Step 4: 创建 AOP 切面**

```java
package com.library.demo.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.demo.annotation.CallLog;
import com.library.demo.entity.DemoCallLog;
import com.library.demo.mapper.DemoCallLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class CallLogAspect {

    private final DemoCallLogMapper callLogMapper;
    private final ObjectMapper objectMapper;

    @Around("@annotation(callLog)")
    public Object logApiCall(ProceedingJoinPoint joinPoint, CallLog callLog) throws Throwable {
        long startTime = System.currentTimeMillis();

        Object result = joinPoint.proceed();

        long executionTime = System.currentTimeMillis() - startTime;

        try {
            Object[] args = joinPoint.getArgs();
            String requestParams = objectMapper.writeValueAsString(args);
            String responseData = objectMapper.writeValueAsString(result);

            saveCallLogAsync(
                    callLog.apiType().name(),
                    requestParams,
                    responseData,
                    (int) executionTime
            );
        } catch (Exception e) {
            log.error("Failed to save call log", e);
        }

        return result;
    }

    @Async("callLogExecutor")
    public void saveCallLogAsync(String apiType, String requestParams,
                                  String responseData, int executionTimeMs) {
        try {
            DemoCallLog logEntry = new DemoCallLog();
            logEntry.setApiType(apiType);
            // 兜底方案：从请求头获取模拟用户信息，实际项目中应从 SecurityContext 获取
            logEntry.setCallerId("mock-user-001");
            logEntry.setCallerName("Mock User");
            logEntry.setPersonType("正式");
            logEntry.setPersonLevel("P6");
            logEntry.setDepartment("技术部");
            logEntry.setRequestParams(requestParams);
            logEntry.setResponseData(responseData);
            logEntry.setExecutionTimeMs(executionTimeMs);
            logEntry.setCallTime(LocalDateTime.now());

            callLogMapper.insert(logEntry);
        } catch (Exception e) {
            log.error("Async save call log failed", e);
        }
    }
}
```

- [ ] **Step 5: 在 DemoController 方法上添加 @CallLog 注解**

修改 `DemoController.java`，在三个方法上分别添加注解：

```java
@CallLog(apiType = ApiType.HELLOWORLD)
@PostMapping("/helloworld")
public DemoResponse<HelloWorldResult> helloWorld(@RequestBody HelloWorldRequest request) {
    return DemoResponse.success(helloWorldService.greet(request));
}

@CallLog(apiType = ApiType.HASH)
@PostMapping("/hash")
public DemoResponse<HashResult> hash(@Valid @RequestBody HashRequest request) {
    return DemoResponse.success(hashService.hash(request));
}

@CallLog(apiType = ApiType.BUBBLE_SORT)
@PostMapping("/bubble-sort")
public DemoResponse<BubbleSortResult> bubbleSort(@Valid @RequestBody BubbleSortRequest request) {
    return DemoResponse.success(bubbleSortService.sort(request));
}
```

需要在文件头部添加 import：
```java
import com.library.demo.annotation.CallLog;
import com.library.demo.enums.ApiType;
```

- [ ] **Step 6: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add AOP call log aspect with async persistence"
```

---

## Task 5: 后端导出接口

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/util/ExcelUtil.java`
- Create: `library-backend/src/main/java/com/library/demo/service/ExportService.java`

**Interfaces:**
- Consumes: Task 2 的 `ExportRequest`；Task 4 的 `DemoCallLogMapper` 和 `DemoCallLog` 实体
- Produces: `POST /api/demo/export` 端点（在 DemoController 中添加），返回 `.xlsx` 文件流

- [ ] **Step 1: 创建 ExcelUtil 工具类**

```java
package com.library.demo.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

public class ExcelUtil {

    public static byte[] generateExcel(String sheetName, String[] headers,
                                        List<List<String>> rows) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(sheetName);

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Write headers
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Write data rows
            for (int i = 0; i < rows.size(); i++) {
                Row row = sheet.createRow(i + 1);
                List<String> rowData = rows.get(i);
                for (int j = 0; j < rowData.size(); j++) {
                    row.createCell(j).setCellValue(rowData.get(j));
                }
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        }
    }
}
```

- [ ] **Step 2: 创建 ExportService**

```java
package com.library.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.demo.dto.request.ExportRequest;
import com.library.demo.entity.DemoCallLog;
import com.library.demo.enums.ApiType;
import com.library.demo.mapper.DemoCallLogMapper;
import com.library.demo.util.ExcelUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final DemoCallLogMapper callLogMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] export(ExportRequest request) throws IOException {
        ApiType apiType = ApiType.valueOf(request.getType());

        LambdaQueryWrapper<DemoCallLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DemoCallLog::getApiType, apiType.name());
        wrapper.orderByDesc(DemoCallLog::getCallTime);
        wrapper.last("LIMIT 10000");

        if (request.getRecordIds() != null && !request.getRecordIds().isEmpty()) {
            wrapper.in(DemoCallLog::getId, request.getRecordIds());
        }

        List<DemoCallLog> logs = callLogMapper.selectList(wrapper);

        String[] headers;
        List<List<String>> rows = new ArrayList<>();

        switch (apiType) {
            case HELLOWORLD:
                headers = new String[]{"序号", "输入名称", "返回结果", "调用时间", "耗时(ms)"};
                break;
            case HASH:
                headers = new String[]{"序号", "原始文本", "算法类型", "哈希结果", "调用时间", "耗时(ms)"};
                break;
            case BUBBLE_SORT:
                headers = new String[]{"序号", "原始数组", "排序结果", "排序方向", "交换次数", "调用时间", "耗时(ms)"};
                break;
            default:
                throw new IllegalArgumentException("Unknown api type: " + apiType);
        }

        for (int i = 0; i < logs.size(); i++) {
            DemoCallLog log = logs.get(i);
            List<String> row = new ArrayList<>();
            row.add(String.valueOf(i + 1));
            row.add(log.getRequestParams() != null ? log.getRequestParams() : "");
            row.add(log.getResponseData() != null ? log.getResponseData() : "");
            row.add(log.getCallTime() != null ? log.getCallTime().format(FMT) : "");
            row.add(log.getExecutionTimeMs() != null ? String.valueOf(log.getExecutionTimeMs()) : "0");

            if (apiType == ApiType.BUBBLE_SORT) {
                row.add(2, ""); // 排序结果占位
                row.add(3, ""); // 排序方向占位
                row.add(4, "0"); // 交换次数占位
            }

            rows.add(row);
        }

        return ExcelUtil.generateExcel(apiType.name() + "_export", headers, rows);
    }
}
```

- [ ] **Step 3: 在 DemoController 中添加导出端点**

在 `DemoController.java` 中添加：

```java
private final ExportService exportService;

@PostMapping("/export")
public void export(@Valid @RequestBody ExportRequest request,
                   HttpServletResponse response) throws IOException {
    byte[] data = exportService.export(request);
    response.setContentType("application/octet-stream");
    response.setHeader("Content-Disposition",
            "attachment; filename=" + request.getType() + "_export.xlsx");
    response.setContentLength(data.length);
    response.getOutputStream().write(data);
    response.getOutputStream().flush();
}
```

需要添加 import：
```java
import com.library.demo.dto.request.ExportRequest;
import com.library.demo.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
```

- [ ] **Step 4: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add export API with Apache POI Excel generation"
```

---

## Task 6: 后端统计接口

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/service/AnalyticsService.java`
- Create: `library-backend/src/main/java/com/library/demo/controller/AnalyticsController.java`

**Interfaces:**
- Consumes: Task 2 的 `AnalyticsQuery`, `AnalyticsSummary`, `AnalyticsTrend`；Task 4 的 `DemoCallLogMapper`
- Produces: `GET /api/demo/analytics/summary` 和 `GET /api/demo/analytics/trend` 两个端点

- [ ] **Step 1: 创建 AnalyticsService**

```java
package com.library.demo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.library.demo.dto.request.AnalyticsQuery;
import com.library.demo.dto.response.AnalyticsSummary;
import com.library.demo.dto.response.AnalyticsTrend;
import com.library.demo.entity.DemoCallLog;
import com.library.demo.mapper.DemoCallLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final DemoCallLogMapper callLogMapper;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public AnalyticsSummary getSummary(AnalyticsQuery query) {
        LambdaQueryWrapper<DemoCallLog> wrapper = buildBaseQuery(query);

        List<DemoCallLog> logs = callLogMapper.selectList(wrapper);

        String dimension = query.getDimension() != null ? query.getDimension() : "DEPARTMENT";
        Map<String, Long> grouped;

        switch (dimension) {
            case "PERSON_TYPE":
                grouped = logs.stream()
                        .filter(l -> l.getPersonType() != null)
                        .collect(Collectors.groupingBy(DemoCallLog::getPersonType, Collectors.counting()));
                break;
            case "PERSON_LEVEL":
                grouped = logs.stream()
                        .filter(l -> l.getPersonLevel() != null)
                        .collect(Collectors.groupingBy(DemoCallLog::getPersonLevel, Collectors.counting()));
                break;
            case "DATE":
                grouped = logs.stream()
                        .collect(Collectors.groupingBy(
                                l -> l.getCallTime().toLocalDate().format(DATE_FMT),
                                Collectors.counting()));
                break;
            case "DEPARTMENT":
            default:
                grouped = logs.stream()
                        .filter(l -> l.getDepartment() != null)
                        .collect(Collectors.groupingBy(DemoCallLog::getDepartment, Collectors.counting()));
                break;
        }

        long totalCount = grouped.values().stream().mapToLong(Long::longValue).sum();
        List<AnalyticsSummary.SummaryItem> items = grouped.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new AnalyticsSummary.SummaryItem(
                        e.getKey(),
                        e.getValue(),
                        totalCount > 0 ? Math.round(e.getValue() * 1000.0 / totalCount) / 10.0 : 0.0
                ))
                .collect(Collectors.toList());

        AnalyticsSummary summary = new AnalyticsSummary();
        summary.setDimension(dimension);
        summary.setItems(items);
        summary.setTotalCount(totalCount);
        summary.setDateRange(new AnalyticsSummary.DateRange(
                query.getStartDate() != null ? query.getStartDate() : LocalDate.now().minusMonths(1).format(DATE_FMT),
                query.getEndDate() != null ? query.getEndDate() : LocalDate.now().format(DATE_FMT)
        ));

        return summary;
    }

    public AnalyticsTrend getTrend(AnalyticsQuery query) {
        LambdaQueryWrapper<DemoCallLog> wrapper = buildBaseQuery(query);
        List<DemoCallLog> logs = callLogMapper.selectList(wrapper);

        String granularity = query.getGranularity() != null ? query.getGranularity() : "DAY";

        // Group by apiType then by date
        Map<String, Map<String, Long>> byApiAndDate = logs.stream()
                .collect(Collectors.groupingBy(
                        DemoCallLog::getApiType,
                        Collectors.groupingBy(
                                l -> l.getCallTime().toLocalDate().format(DATE_FMT),
                                Collectors.counting()
                        )
                ));

        List<AnalyticsTrend.Series> seriesList = byApiAndDate.entrySet().stream()
                .map(entry -> {
                    List<AnalyticsTrend.Point> points = entry.getValue().entrySet().stream()
                            .sorted(Map.Entry.comparingByKey())
                            .map(e -> new AnalyticsTrend.Point(e.getKey(), e.getValue()))
                            .collect(Collectors.toList());
                    return new AnalyticsTrend.Series(entry.getKey(), points);
                })
                .collect(Collectors.toList());

        AnalyticsTrend trend = new AnalyticsTrend();
        trend.setGranularity(granularity);
        trend.setSeries(seriesList);
        return trend;
    }

    private LambdaQueryWrapper<DemoCallLog> buildBaseQuery(AnalyticsQuery query) {
        LambdaQueryWrapper<DemoCallLog> wrapper = new LambdaQueryWrapper<>();

        if (query.getApiType() != null && !query.getApiType().isBlank()) {
            wrapper.eq(DemoCallLog::getApiType, query.getApiType());
        }

        if (query.getStartDate() != null && !query.getStartDate().isBlank()) {
            LocalDateTime startDateTime = LocalDate.parse(query.getStartDate(), DATE_FMT).atStartOfDay();
            wrapper.ge(DemoCallLog::getCallTime, startDateTime);
        }

        if (query.getEndDate() != null && !query.getEndDate().isBlank()) {
            LocalDateTime endDateTime = LocalDate.parse(query.getEndDate(), DATE_FMT).atTime(LocalTime.MAX);
            wrapper.le(DemoCallLog::getCallTime, endDateTime);
        }

        return wrapper;
    }
}
```

- [ ] **Step 2: 创建 AnalyticsController**

```java
package com.library.demo.controller;

import com.library.demo.dto.request.AnalyticsQuery;
import com.library.demo.dto.response.AnalyticsSummary;
import com.library.demo.dto.response.AnalyticsTrend;
import com.library.demo.dto.response.DemoResponse;
import com.library.demo.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public DemoResponse<AnalyticsSummary> getSummary(AnalyticsQuery query) {
        return DemoResponse.success(analyticsService.getSummary(query));
    }

    @GetMapping("/trend")
    public DemoResponse<AnalyticsTrend> getTrend(AnalyticsQuery query) {
        return DemoResponse.success(analyticsService.getTrend(query));
    }
}
```

- [ ] **Step 3: 验证编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 4: 运行全部测试**

Run: `cd library-backend && mvn test -q`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add analytics summary and trend APIs"
```

---

## Task 7: 前端项目脚手架搭建

**Files:**
- Create: `library-frontend/package.json`
- Create: `library-frontend/tsconfig.json`
- Create: `library-frontend/vite.config.ts`
- Create: `library-frontend/index.html`
- Create: `library-frontend/src/main.tsx`
- Create: `library-frontend/src/App.tsx`
- Create: `library-frontend/src/utils/request.ts`

**Interfaces:**
- Consumes: 无（前端首个 Task）
- Produces: 可运行的 React + TypeScript + Vite 项目骨架，后续 Task 依赖此基础结构

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "library-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "antd": "^5.12.0",
    "axios": "^1.6.0",
    "echarts": "^5.4.3",
    "echarts-for-react": "^3.0.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0"
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

- [ ] **Step 2: 创建 tsconfig.json**

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
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Library Demo System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建入口文件**

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DemoPage from './pages/Demo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/demo" element={<DemoPage />} />
        <Route path="*" element={<Navigate to="/demo" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 6: 创建 Axios 请求封装**

```typescript
// src/utils/request.ts
import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return data;
  },
  (error) => {
    message.error(error.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request;
```

- [ ] **Step 7: 安装依赖并验证**

Run: `cd library-frontend && npm install`
Expected: 安装成功，无报错

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize frontend project with React + TypeScript + Vite"
```

---

## Task 8: 前端类型定义与 API 服务层

**Files:**
- Create: `library-frontend/src/pages/Demo/types/demo.ts`
- Create: `library-frontend/src/pages/Demo/services/demoApi.ts`

**Interfaces:**
- Consumes: Task 7 的 `request` 工具；与后端 Task 2 的 DTO 结构对齐
- Produces: 前端类型定义和 API 调用函数，后续 Task 9/10/11 均依赖

- [ ] **Step 1: 创建 TypeScript 类型定义**

```typescript
// src/pages/Demo/types/demo.ts

// === 通用响应 ===
export interface DemoResponse<T> {
  code: number;
  message: string;
  data: T;
}

// === HelloWorld ===
export interface HelloWorldRequest {
  name?: string;
}

export interface HelloWorldResult {
  result: string;
  timestamp: string;
  executionTimeMs: number;
}

// === Hash ===
export interface HashRequest {
  input: string;
  algorithm?: 'MD5' | 'SHA1' | 'SHA256' | 'SHA512';
}

export interface HashResult {
  input: string;
  algorithm: string;
  hashResult: string;
  timestamp: string;
  executionTimeMs: number;
}

// === Bubble Sort ===
export interface BubbleSortRequest {
  numbers: number[];
  order?: 'ASC' | 'DESC';
}

export interface BubbleSortResult {
  original: number[];
  sorted: number[];
  order: string;
  swapCount: number;
  timestamp: string;
  executionTimeMs: number;
}

// === Export ===
export interface ExportRequest {
  type: 'HELLOWORLD' | 'HASH' | 'BUBBLE_SORT';
  recordIds?: string[];
}

// === Analytics ===
export type AnalyticsDimension = 'PERSON_TYPE' | 'PERSON_LEVEL' | 'DEPARTMENT' | 'DATE';
export type ApiType = 'HELLOWORLD' | 'HASH' | 'BUBBLE_SORT';
export type Granularity = 'DAY' | 'WEEK' | 'MONTH';

export interface AnalyticsQuery {
  dimension?: AnalyticsDimension;
  apiType?: ApiType;
  startDate?: string;
  endDate?: string;
  granularity?: Granularity;
}

export interface SummaryItem {
  label: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummaryData {
  dimension: string;
  items: SummaryItem[];
  totalCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendSeries {
  apiType: string;
  points: TrendPoint[];
}

export interface AnalyticsTrendData {
  granularity: string;
  series: TrendSeries[];
}
```

- [ ] **Step 2: 创建 API 服务层**

```typescript
// src/pages/Demo/services/demoApi.ts
import request from '@/utils/request';
import type {
  DemoResponse,
  HelloWorldRequest,
  HelloWorldResult,
  HashRequest,
  HashResult,
  BubbleSortRequest,
  BubbleSortResult,
  ExportRequest,
  AnalyticsQuery,
  AnalyticsSummaryData,
  AnalyticsTrendData,
} from '../types/demo';

// === 演示接口 ===
export function callHelloWorld(params: HelloWorldRequest) {
  return request.post<unknown, DemoResponse<HelloWorldResult>>('/demo/helloworld', params);
}

export function callHash(params: HashRequest) {
  return request.post<unknown, DemoResponse<HashResult>>('/demo/hash', params);
}

export function callBubbleSort(params: BubbleSortRequest) {
  return request.post<unknown, DemoResponse<BubbleSortResult>>('/demo/bubble-sort', params);
}

// === 导出接口 ===
export function exportData(params: ExportRequest): Promise<Blob> {
  return request.post('/demo/export', params, {
    responseType: 'blob',
  }) as unknown as Promise<Blob>;
}

// === 统计接口 ===
export function getAnalyticsSummary(params: AnalyticsQuery) {
  return request.get<unknown, DemoResponse<AnalyticsSummaryData>>('/demo/analytics/summary', {
    params,
  });
}

export function getAnalyticsTrend(params: AnalyticsQuery) {
  return request.get<unknown, DemoResponse<AnalyticsTrendData>>('/demo/analytics/trend', {
    params,
  });
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add TypeScript types and API service layer for demo module"
```

---

## Task 9: 前端三个 Tab 页面 + 导出功能

**Files:**
- Create: `library-frontend/src/pages/Demo/index.tsx`
- Create: `library-frontend/src/pages/Demo/components/ResultTable.tsx`
- Create: `library-frontend/src/pages/Demo/components/ExportButton.tsx`
- Create: `library-frontend/src/pages/Demo/components/HelloWorldTab.tsx`
- Create: `library-frontend/src/pages/Demo/components/HashTab.tsx`
- Create: `library-frontend/src/pages/Demo/components/BubbleSortTab.tsx`

**Interfaces:**
- Consumes: Task 8 的类型定义和 API 函数（`callHelloWorld`, `callHash`, `callBubbleSort`, `exportData`）
- Produces: 完整的三个功能 Tab 页面，包含输入表单、结果表格、导出按钮

- [ ] **Step 1: 创建通用 ResultTable 组件**

```tsx
// src/pages/Demo/components/ResultTable.tsx
import React from 'react';
import { Table, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface ResultTableProps<T> {
  columns: ColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  rowKey?: string;
}

function ResultTable<T extends Record<string, unknown>>({
  columns,
  dataSource,
  loading = false,
  rowKey = 'timestamp',
}: ResultTableProps<T>) {
  if (!dataSource.length && !loading) {
    return <Empty description="暂无数据，请先执行接口调用" />;
  }

  return (
    <Table<T>
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey={rowKey}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      size="middle"
      scroll={{ x: 'max-content' }}
    />
  );
}

export default ResultTable;
```

- [ ] **Step 2: 创建 ExportButton 组件**

```tsx
// src/pages/Demo/components/ExportButton.tsx
import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportData } from '../services/demoApi';
import type { ApiType } from '../types/demo';

interface ExportButtonProps {
  apiType: ApiType;
  recordIds?: string[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ apiType, recordIds }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await exportData({ type: apiType, recordIds });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${apiType}_export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      loading={loading}
      onClick={handleExport}
    >
      导出 Excel
    </Button>
  );
};

export default ExportButton;
```

- [ ] **Step 3: 创建 HelloWorldTab 组件**

```tsx
// src/pages/Demo/components/HelloWorldTab.tsx
import React, { useState } from 'react';
import { Input, Button, Space, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callHelloWorld } from '../services/demoApi';
import type { HelloWorldResult } from '../types/demo';
import ResultTable from './ResultTable';
import ExportButton from './ExportButton';
import type { ColumnsType } from 'antd/es/table';

const HelloWorldTab: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HelloWorldResult[]>([]);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await callHelloWorld({ name: name || undefined });
      setResults((prev) => [res.data, ...prev]);
      message.success('执行成功');
    } catch {
      message.error('执行失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<HelloWorldResult> = [
    { title: '返回结果', dataIndex: 'result', key: 'result' },
    { title: '调用时间', dataIndex: 'timestamp', key: 'timestamp' },
    { title: '耗时(ms)', dataIndex: 'executionTimeMs', key: 'executionTimeMs', width: 100 },
  ];

  return (
    <div>
      <Card title="HelloWorld 接口" style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="输入名称（可选，默认 World）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleExecute}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleExecute}
          >
            执行
          </Button>
        </Space>
      </Card>

      <Card
        title="执行结果"
        extra={<ExportButton apiType="HELLOWORLD" />}
      >
        <ResultTable columns={columns} dataSource={results} loading={loading} />
      </Card>
    </div>
  );
};

export default HelloWorldTab;
```

- [ ] **Step 4: 创建 HashTab 组件**

```tsx
// src/pages/Demo/components/HashTab.tsx
import React, { useState } from 'react';
import { Input, Select, Button, Space, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callHash } from '../services/demoApi';
import type { HashResult } from '../types/demo';
import ResultTable from './ResultTable';
import ExportButton from './ExportButton';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

const HashTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<string>('SHA256');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HashResult[]>([]);

  const handleExecute = async () => {
    if (!input.trim()) {
      message.warning('请输入原始文本');
      return;
    }
    setLoading(true);
    try {
      const res = await callHash({
        input,
        algorithm: algorithm as 'MD5' | 'SHA1' | 'SHA256' | 'SHA512',
      });
      setResults((prev) => [res.data, ...prev]);
      message.success('执行成功');
    } catch {
      message.error('执行失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<HashResult> = [
    { title: '原始文本', dataIndex: 'input', key: 'input', ellipsis: true },
    { title: '算法', dataIndex: 'algorithm', key: 'algorithm', width: 100 },
    { title: '哈希结果', dataIndex: 'hashResult', key: 'hashResult', ellipsis: true },
    { title: '调用时间', dataIndex: 'timestamp', key: 'timestamp' },
    { title: '耗时(ms)', dataIndex: 'executionTimeMs', key: 'executionTimeMs', width: 100 },
  ];

  return (
    <div>
      <Card title="哈希算法接口" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            placeholder="请输入待哈希的原始文本"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
          />
          <Space>
            <Select
              value={algorithm}
              onChange={setAlgorithm}
              style={{ width: 150 }}
              options={[
                { label: 'MD5', value: 'MD5' },
                { label: 'SHA1', value: 'SHA1' },
                { label: 'SHA256', value: 'SHA256' },
                { label: 'SHA512', value: 'SHA512' },
              ]}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={handleExecute}
            >
              执行
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        title="执行结果"
        extra={<ExportButton apiType="HASH" />}
      >
        <ResultTable columns={columns} dataSource={results} loading={loading} />
      </Card>
    </div>
  );
};

export default HashTab;
```

- [ ] **Step 5: 创建 BubbleSortTab 组件**

```tsx
// src/pages/Demo/components/BubbleSortTab.tsx
import React, { useState } from 'react';
import { Input, Select, Button, Space, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callBubbleSort } from '../services/demoApi';
import type { BubbleSortResult } from '../types/demo';
import ResultTable from './ResultTable';
import ExportButton from './ExportButton';
import type { ColumnsType } from 'antd/es/table';

const BubbleSortTab: React.FC = () => {
  const [numbersInput, setNumbersInput] = useState('');
  const [order, setOrder] = useState<string>('ASC');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BubbleSortResult[]>([]);

  const handleExecute = async () => {
    const nums = numbersInput
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map(Number);

    if (nums.length === 0 || nums.some(isNaN)) {
      message.warning('请输入有效的数字数组（逗号分隔）');
      return;
    }

    setLoading(true);
    try {
      const res = await callBubbleSort({
        numbers: nums,
        order: order as 'ASC' | 'DESC',
      });
      setResults((prev) => [res.data, ...prev]);
      message.success('执行成功');
    } catch {
      message.error('执行失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<BubbleSortResult> = [
    {
      title: '原始数组',
      dataIndex: 'original',
      key: 'original',
      render: (val: number[]) => `[${val.join(', ')}]`,
    },
    {
      title: '排序结果',
      dataIndex: 'sorted',
      key: 'sorted',
      render: (val: number[]) => `[${val.join(', ')}]`,
    },
    { title: '方向', dataIndex: 'order', key: 'order', width: 80 },
    { title: '交换次数', dataIndex: 'swapCount', key: 'swapCount', width: 100 },
    { title: '调用时间', dataIndex: 'timestamp', key: 'timestamp' },
    { title: '耗时(ms)', dataIndex: 'executionTimeMs', key: 'executionTimeMs', width: 100 },
  ];

  return (
    <div>
      <Card title="冒泡排序接口" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="输入数字，逗号分隔，如: 5, 3, 8, 1, 9, 2"
            value={numbersInput}
            onChange={(e) => setNumbersInput(e.target.value)}
            onPressEnter={handleExecute}
          />
          <Space>
            <Select
              value={order}
              onChange={setOrder}
              style={{ width: 120 }}
              options={[
                { label: '升序 (ASC)', value: 'ASC' },
                { label: '降序 (DESC)', value: 'DESC' },
              ]}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={handleExecute}
            >
              执行
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        title="执行结果"
        extra={<ExportButton apiType="BUBBLE_SORT" />}
      >
        <ResultTable columns={columns} dataSource={results} loading={loading} />
      </Card>
    </div>
  );
};

export default BubbleSortTab;
```

- [ ] **Step 6: 创建主页面 Tabs 容器**

```tsx
// src/pages/Demo/index.tsx
import React from 'react';
import { Tabs, Typography } from 'antd';
import {
  CodeOutlined,
  LockOutlined,
  SortAscendingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import HelloWorldTab from './components/HelloWorldTab';
import HashTab from './components/HashTab';
import BubbleSortTab from './components/BubbleSortTab';

const { Title } = Typography;

const DemoPage: React.FC = () => {
  const tabItems = [
    {
      key: 'helloworld',
      label: (
        <span>
          <CodeOutlined /> HelloWorld
        </span>
      ),
      children: <HelloWorldTab />,
    },
    {
      key: 'hash',
      label: (
        <span>
          <LockOutlined /> 哈希算法
        </span>
      ),
      children: <HashTab />,
    },
    {
      key: 'bubble-sort',
      label: (
        <span>
          <SortAscendingOutlined /> 冒泡排序
        </span>
      ),
      children: <BubbleSortTab />,
    },
    {
      key: 'analytics',
      label: (
        <span>
          <BarChartOutlined /> 调用统计
        </span>
      ),
      children: <div>调用统计（Task 10 实现）</div>,
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>功能演示</Title>
      <Tabs defaultActiveKey="helloworld" items={tabItems} size="large" />
    </div>
  );
};

export default DemoPage;
```

- [ ] **Step 7: 验证 TypeScript 编译**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: implement three demo tabs with export functionality"
```

---

## Task 10: 前端图表可视化（调用统计 Tab）

**Files:**
- Create: `library-frontend/src/pages/Demo/components/charts/LineChart.tsx`
- Create: `library-frontend/src/pages/Demo/components/charts/PieChart.tsx`
- Create: `library-frontend/src/pages/Demo/components/charts/BarChart.tsx`
- Create: `library-frontend/src/pages/Demo/components/AnalyticsTab.tsx`
- Modify: `library-frontend/src/pages/Demo/index.tsx`（替换占位内容为 AnalyticsTab）

**Interfaces:**
- Consumes: Task 8 的 `getAnalyticsSummary`, `getAnalyticsTrend` API 函数和类型定义
- Produces: 完整的调用统计 Tab，包含折线图/饼图/柱状图三种展示形式和维度筛选

- [ ] **Step 1: 创建折线图组件**

```tsx
// src/pages/Demo/components/charts/LineChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { TrendSeries } from '../../types/demo';

interface LineChartProps {
  series: TrendSeries[];
}

const API_LABELS: Record<string, string> = {
  HELLOWORLD: 'HelloWorld',
  HASH: '哈希算法',
  BUBBLE_SORT: '冒泡排序',
};

const LineChart: React.FC<LineChartProps> = ({ series }) => {
  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: {
      data: series.map((s) => API_LABELS[s.apiType] || s.apiType),
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: series[0]?.points.map((p) => p.date) || [],
    },
    yAxis: { type: 'value' as const, name: '调用次数' },
    series: series.map((s) => ({
      name: API_LABELS[s.apiType] || s.apiType,
      type: 'line',
      smooth: true,
      data: s.points.map((p) => p.count),
    })),
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default LineChart;
```

- [ ] **Step 2: 创建饼图组件**

```tsx
// src/pages/Demo/components/charts/PieChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { SummaryItem } from '../../types/demo';

interface PieChartProps {
  items: SummaryItem[];
  title?: string;
}

const PieChart: React.FC<PieChartProps> = ({ items, title = '调用分布' }) => {
  const option = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} ({d}%)',
    },
    legend: { orient: 'vertical' as const, left: 'left' },
    title: { text: title, left: 'center' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: items.map((item) => ({
          name: item.label,
          value: item.count,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default PieChart;
```

- [ ] **Step 3: 创建柱状图组件**

```tsx
// src/pages/Demo/components/charts/BarChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { SummaryItem } from '../../types/demo';

interface BarChartProps {
  items: SummaryItem[];
  title?: string;
}

const BarChart: React.FC<BarChartProps> = ({ items, title = '调用次数对比' }) => {
  const option = {
    tooltip: { trigger: 'axis' as const },
    title: { text: title, left: 'center' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: items.map((item) => item.label),
      axisLabel: { rotate: items.length > 5 ? 30 : 0 },
    },
    yAxis: { type: 'value' as const, name: '调用次数' },
    series: [
      {
        type: 'bar',
        data: items.map((item) => item.count),
        itemStyle: {
          color: '#1890ff',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default BarChart;
```

- [ ] **Step 4: 创建 AnalyticsTab 组件**

```tsx
// src/pages/Demo/components/AnalyticsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Select, DatePicker, Space, Row, Col, Statistic, Segmented, Spin, Empty } from 'antd';
import {
  TeamOutlined,
  ApiOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { getAnalyticsSummary, getAnalyticsTrend } from '../services/demoApi';
import type {
  AnalyticsDimension,
  ApiType,
  Granularity,
  AnalyticsSummaryData,
  AnalyticsTrendData,
} from '../types/demo';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import BarChart from './charts/BarChart';

const { RangePicker } = DatePicker;

type ChartType = 'line' | 'pie' | 'bar';

const AnalyticsTab: React.FC = () => {
  const [dimension, setDimension] = useState<AnalyticsDimension>('DEPARTMENT');
  const [apiType, setApiType] = useState<ApiType | ''>('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [granularity, setGranularity] = useState<Granularity>('DAY');
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [trend, setTrend] = useState<AnalyticsTrendData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, trendRes] = await Promise.all([
        getAnalyticsSummary({
          dimension,
          apiType: apiType || undefined,
        }),
        getAnalyticsTrend({
          apiType: apiType || undefined,
          granularity,
        }),
      ]);
      setSummary(summaryRes.data);
      setTrend(trendRes.data);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [dimension, apiType, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Spin spinning={loading}>
      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Space>
            <span>维度：</span>
            <Select
              value={dimension}
              onChange={setDimension}
              style={{ width: 140 }}
              options={[
                { label: '人员类型', value: 'PERSON_TYPE' },
                { label: '人员层级', value: 'PERSON_LEVEL' },
                { label: '人员部门', value: 'DEPARTMENT' },
                { label: '日期', value: 'DATE' },
              ]}
            />
          </Space>
          <Space>
            <span>接口：</span>
            <Select
              value={apiType}
              onChange={setApiType}
              style={{ width: 140 }}
              options={[
                { label: '全部', value: '' },
                { label: 'HelloWorld', value: 'HELLOWORLD' },
                { label: '哈希算法', value: 'HASH' },
                { label: '冒泡排序', value: 'BUBBLE_SORT' },
              ]}
            />
          </Space>
          <Space>
            <span>粒度：</span>
            <Select
              value={granularity}
              onChange={setGranularity}
              style={{ width: 100 }}
              options={[
                { label: '日', value: 'DAY' },
                { label: '周', value: 'WEEK' },
                { label: '月', value: 'MONTH' },
              ]}
            />
          </Space>
          <RangePicker />
        </Space>
      </Card>

      {/* 汇总卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总调用次数"
              value={summary?.totalCount ?? 0}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="维度分类数"
              value={summary?.items?.length ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最活跃分类"
              value={summary?.items?.[0]?.label ?? '-'}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据范围"
              value={summary?.dateRange ? `${summary.dateRange.start} ~ ${summary.dateRange.end}` : '-'}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表展示区 */}
      <Card
        title="数据可视化"
        extra={
          <Segmented
            value={chartType}
            onChange={(val) => setChartType(val as ChartType)}
            options={[
              { label: '📈 折线图', value: 'line' },
              { label: '🥧 饼图', value: 'pie' },
              { label: '📊 柱状图', value: 'bar' },
            ]}
          />
        }
      >
        {chartType === 'line' && trend && trend.series.length > 0 && (
          <LineChart series={trend.series} />
        )}
        {chartType === 'pie' && summary && summary.items.length > 0 && (
          <PieChart items={summary.items} title={`按${dimension === 'DEPARTMENT' ? '部门' : dimension === 'PERSON_TYPE' ? '人员类型' : dimension === 'PERSON_LEVEL' ? '层级' : '日期'}分布`} />
        )}
        {chartType === 'bar' && summary && summary.items.length > 0 && (
          <BarChart items={summary.items} title={`按${dimension === 'DEPARTMENT' ? '部门' : dimension === 'PERSON_TYPE' ? '人员类型' : dimension === 'PERSON_LEVEL' ? '层级' : '日期'}调用次数`} />
        )}
        {((chartType === 'line' && (!trend || trend.series.length === 0)) ||
          ((chartType === 'pie' || chartType === 'bar') && (!summary || summary.items.length === 0))) && (
          <Empty description="暂无统计数据" />
        )}
      </Card>
    </Spin>
  );
};

export default AnalyticsTab;
```

- [ ] **Step 5: 更新主页面引入 AnalyticsTab**

修改 `library-frontend/src/pages/Demo/index.tsx`，将占位内容替换为 `<AnalyticsTab />`：

添加 import：
```typescript
import AnalyticsTab from './components/AnalyticsTab';
```

将 analytics tab 的 children 从 `<div>调用统计（Task 10 实现）</div>` 改为 `<AnalyticsTab />`。

- [ ] **Step 6: 验证 TypeScript 编译**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 7: 验证前端构建**

Run: `cd library-frontend && npm run build`
Expected: 构建成功

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: implement analytics tab with line/pie/bar charts"
```

---

## 跨仓对齐点检查清单

| # | 对齐点 | 前端位置 | 后端位置 | 验证方式 |
|---|--------|---------|---------|---------|
| 1 | API 基础路径 `/api/demo/*` | `services/demoApi.ts` | `DemoController @RequestMapping("/api/demo")` | 路径字符串一致 |
| 2 | 接口类型枚举 `HELLOWORLD/HASH/BUBBLE_SORT` | `types/demo.ts` ApiType | `enums/ApiType.java` | 枚举值一致 |
| 3 | 统计维度枚举 `PERSON_TYPE/PERSON_LEVEL/DEPARTMENT/DATE` | `types/demo.ts` AnalyticsDimension | `enums/AnalyticsDimension.java` | 枚举值一致 |
| 4 | 哈希算法枚举 `MD5/SHA1/SHA256/SHA512` | `types/demo.ts` HashRequest.algorithm | `enums/HashAlgorithm.java` | 枚举值一致 |
| 5 | 排序方向 `ASC/DESC` | `types/demo.ts` BubbleSortRequest.order | `enums/SortOrder.java` | 枚举值一致 |
| 6 | 统一响应结构 `{ code, message, data }` | `types/demo.ts` DemoResponse | `dto/response/DemoResponse.java` | 字段名一致 |
| 7 | 时间格式 `yyyy-MM-dd` / ISO 8601 | 前端 DatePicker 输出 | `@DateTimeFormat` | 格式一致 |
| 8 | 导出 Content-Type `application/octet-stream` | `demoApi.ts` responseType: 'blob' | `DemoController export()` | 协议一致 |
| 9 | 统计汇总响应结构 | `types/demo.ts` AnalyticsSummaryData | `dto/response/AnalyticsSummary.java` | 字段名和嵌套结构一致 |
| 10 | 趋势数据响应结构 | `types/demo.ts` AnalyticsTrendData | `dto/response/AnalyticsTrend.java` | 字段名和嵌套结构一致 |

---

## 开发顺序总结

```
Phase 1 (Task 1-3): 后端项目骨架 + 三个演示接口 + 单元测试
Phase 2 (Task 4):    后端 AOP 埋点切面
Phase 3 (Task 5):    后端导出接口
Phase 4 (Task 6):    后端统计接口
Phase 5 (Task 7-8):  前端项目骨架 + 类型/API 层
Phase 6 (Task 9):    前端三个 Tab + 导出
Phase 7 (Task 10):   前端图表可视化
```

每个 Task 完成后均可独立编译/测试验证，确保增量可交付。
