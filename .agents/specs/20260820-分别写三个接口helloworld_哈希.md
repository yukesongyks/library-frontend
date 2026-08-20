# 多功能演示页面（HelloWorld / 哈希算法 / 冒泡排序）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在图书管理系统中新增「功能演示」页面，包含三个后端接口（HelloWorld、哈希算法、冒泡排序）、前端四 Tab 页面展示、导出功能、调用埋点及可视化统计报表。

**Architecture:** 后端采用 Spring Boot 3.x + Java 17 提供 RESTful API，通过 AOP 切面实现接口调用埋点，数据写入 H2/MySQL；前端采用 React 18 + TypeScript + Ant Design 5.x 构建四 Tab 页面，使用 ECharts 实现多维度多图表的调用统计可视化。前后端通过统一 JSON 响应格式 + 自定义请求头传递用户信息进行协作。

**Tech Stack:**
- 后端: Java 17, Spring Boot 3.x, Spring Data JPA, H2 (dev) / MySQL (prod), Apache POI
- 前端: React 18, TypeScript, Ant Design 5.x, echarts-for-react (ECharts 5.x), axios
- API 风格: RESTful JSON, 统一 `{code, message, data}` 响应体

---

## Global Constraints

- 统一响应格式: `{"code": 200, "message": "success", "data": {...}}`，错误码 400/500
- 请求头必传: `X-User-Id`, `X-User-Name`, `X-User-Type`, `X-User-Level`, `X-User-Dept`
- 冒泡排序数组长度上限: 1000，超出返回 400
- 单次导出上限: 10000 条记录
- 埋点写入必须异步，不阻塞主接口响应
- 接口响应时间 < 500ms（不含排序超大数组）
- 前端兼容: Chrome 90+ / Edge 90+ / Firefox 88+
- 后端包路径: `com.library.demo`
- 前端页面路径: `src/pages/demo/`

---

## 文件结构总览

### 后端 (library-backend)

```
library-backend/
├── pom.xml
├── src/main/java/com/library/demo/
│   ├── DemoApplication.java                          # Spring Boot 启动类
│   ├── controller/
│   │   ├── DemoController.java                       # HelloWorld / Hash / BubbleSort 接口
│   │   ├── ExportController.java                     # 导出 Excel 接口
│   │   └── AnalyticsController.java                  # 调用统计查询接口
│   ├── service/
│   │   ├── HelloWorldService.java                    # HelloWorld 业务逻辑
│   │   ├── HashService.java                          # 哈希算法业务逻辑
│   │   ├── BubbleSortService.java                    # 冒泡排序业务逻辑（含步骤记录）
│   │   ├── ExportService.java                        # Excel 导出逻辑 (Apache POI)
│   │   └── AnalyticsService.java                     # 统计聚合查询逻辑
│   ├── model/
│   │   ├── request/
│   │   │   ├── HelloWorldRequest.java                # {name?: string}
│   │   │   ├── HashRequest.java                      # {input: string, algorithm?: MD5|SHA-1|SHA-256}
│   │   │   ├── BubbleSortRequest.java                # {numbers: int[], order?: ASC|DESC}
│   │   │   └── ExportRequest.java                    # {type: string, recordIds?: string[]}
│   │   ├── response/
│   │   │   ├── ApiResponse.java                      # 统一响应包装 {code, message, data}
│   │   │   ├── HelloWorldResponse.java               # {result, timestamp}
│   │   │   ├── HashResponse.java                     # {input, algorithm, hashValue, timestamp}
│   │   │   ├── BubbleSortResponse.java               # {original, sorted, order, steps, timestamp}
│   │   │   └── AnalyticsResponse.java                # {dimension, apiType, totalCalls, groups, timeSeries}
│   │   └── entity/
│   │       └── ApiCallLog.java                       # JPA 实体，映射 api_call_log 表
│   ├── repository/
│   │   └── ApiCallLogRepository.java                 # Spring Data JPA Repository + 自定义统计查询
│   ├── aspect/
│   │   └── ApiCallLogAspect.java                     # AOP 切面，拦截 /api/demo/** 记录埋点
│   └── config/
│       └── WebConfig.java                            # CORS 配置
├── src/main/resources/
│   ├── application.yml                               # 数据源、JPA、端口配置
│   └── schema.sql                                    # DDL: api_call_log 表 + 索引
└── src/test/java/com/library/demo/
    ├── service/
    │   ├── HelloWorldServiceTest.java
    │   ├── HashServiceTest.java
    │   └── BubbleSortServiceTest.java
    └── controller/
        └── DemoControllerTest.java
```

### 前端 (library-frontend)

```
library-frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts                                    # Vite 构建配置 + 代理
├── index.html
├── src/
│   ├── main.tsx                                      # 入口
│   ├── App.tsx                                       # 根组件 + 路由
│   ├── pages/
│   │   └── demo/
│   │       ├── index.tsx                             # 主页面（Tabs 容器）
│   │       ├── HelloWorldTab.tsx                     # Tab1: HelloWorld
│   │       ├── HashTab.tsx                           # Tab2: 哈希算法
│   │       ├── BubbleSortTab.tsx                     # Tab3: 冒泡排序
│   │       ├── AnalyticsTab.tsx                      # Tab4: 调用统计报表
│   │       └── components/
│   │           ├── ExportButton.tsx                  # 通用导出按钮组件
│   │           ├── ChartPanel.tsx                    # 图表渲染面板（折线/饼/柱状）
│   │           └── StatsCard.tsx                     # 统计卡片组件
│   ├── services/
│   │   └── demoApi.ts                                # API 调用封装（axios 实例 + 请求头注入）
│   └── types/
│       └── demo.d.ts                                 # TypeScript 类型定义
```

---

## Task 1: 后端项目脚手架搭建

**Files:**
- Create: `library-backend/pom.xml`
- Create: `library-backend/src/main/java/com/library/demo/DemoApplication.java`
- Create: `library-backend/src/main/resources/application.yml`
- Create: `library-backend/src/main/resources/schema.sql`
- Create: `library-backend/src/main/java/com/library/demo/config/WebConfig.java`

**Interfaces:**
- Consumes: 无（首个 Task）
- Produces: Spring Boot 可运行骨架，端口 8080，H2 内存数据库已配置，CORS 已开放

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
    <artifactId>library-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>library-backend</name>
    <description>Library Management System Backend</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Spring AOP -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- H2 Database (dev) -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Apache POI for Excel export -->
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>5.2.5</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Test -->
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

- [ ] **Step 2: 创建 DemoApplication.java**

```java
package com.library.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
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
    url: jdbc:h2:mem:librarydb
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
    properties:
      hibernate:
        format_sql: true
  sql:
    init:
      mode: always
      schema-locations: classpath:schema.sql

logging:
  level:
    com.library.demo: DEBUG
```

- [ ] **Step 4: 创建 schema.sql**

```sql
CREATE TABLE IF NOT EXISTS api_call_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_type VARCHAR(32) NOT NULL,
    user_id VARCHAR(64),
    user_name VARCHAR(128),
    personnel_type VARCHAR(32),
    personnel_level VARCHAR(32),
    department VARCHAR(128),
    request_payload TEXT,
    response_payload TEXT,
    duration_ms BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_type ON api_call_log(api_type);
CREATE INDEX IF NOT EXISTS idx_department ON api_call_log(department);
CREATE INDEX IF NOT EXISTS idx_personnel_type ON api_call_log(personnel_type);
CREATE INDEX IF NOT EXISTS idx_personnel_level ON api_call_log(personnel_level);
CREATE INDEX IF NOT EXISTS idx_created_at ON api_call_log(created_at);
```

- [ ] **Step 5: 创建 WebConfig.java (CORS 配置)**

```java
package com.library.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class WebConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

- [ ] **Step 6: 验证项目可编译**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Spring Boot project with H2, JPA, AOP, POI dependencies"
```

---

## Task 2: 后端统一响应模型 + 三个核心接口

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/model/response/ApiResponse.java`
- Create: `library-backend/src/main/java/com/library/demo/model/request/HelloWorldRequest.java`
- Create: `library-backend/src/main/java/com/library/demo/model/request/HashRequest.java`
- Create: `library-backend/src/main/java/com/library/demo/model/request/BubbleSortRequest.java`
- Create: `library-backend/src/main/java/com/library/demo/model/response/HelloWorldResponse.java`
- Create: `library-backend/src/main/java/com/library/demo/model/response/HashResponse.java`
- Create: `library-backend/src/main/java/com/library/demo/model/response/BubbleSortResponse.java`
- Create: `library-backend/src/main/java/com/library/demo/service/HelloWorldService.java`
- Create: `library-backend/src/main/java/com/library/demo/service/HashService.java`
- Create: `library-backend/src/main/java/com/library/demo/service/BubbleSortService.java`
- Create: `library-backend/src/main/java/com/library/demo/controller/DemoController.java`

**Interfaces:**
- Consumes: Task 1 的 Spring Boot 骨架
- Produces: `POST /api/demo/helloworld`, `POST /api/demo/hash`, `POST /api/demo/bubble-sort` 三个可用接口

- [ ] **Step 1: 创建 ApiResponse 统一响应包装**

```java
package com.library.demo.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;

    private ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data);
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
    public T getData() { return data; }
}
```

- [ ] **Step 2: 创建请求 DTO**

HelloWorldRequest.java:
```java
package com.library.demo.model.request;

public class HelloWorldRequest {
    private String name;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
```

HashRequest.java:
```java
package com.library.demo.model.request;

import jakarta.validation.constraints.NotBlank;

public class HashRequest {
    @NotBlank(message = "input is required")
    private String input;
    private String algorithm; // MD5 | SHA-1 | SHA-256, default SHA-256

    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
}
```

BubbleSortRequest.java:
```java
package com.library.demo.model.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class BubbleSortRequest {
    @NotEmpty(message = "numbers array is required")
    @Size(max = 1000, message = "array length must not exceed 1000")
    private List<Integer> numbers;
    private String order; // ASC | DESC, default ASC

    public List<Integer> getNumbers() { return numbers; }
    public void setNumbers(List<Integer> numbers) { this.numbers = numbers; }
    public String getOrder() { return order; }
    public void setOrder(String order) { this.order = order; }
}
```

- [ ] **Step 3: 创建响应 DTO**

HelloWorldResponse.java:
```java
package com.library.demo.model.response;

import java.time.LocalDateTime;

public class HelloWorldResponse {
    private String result;
    private LocalDateTime timestamp;

    public HelloWorldResponse(String result, LocalDateTime timestamp) {
        this.result = result;
        this.timestamp = timestamp;
    }

    public String getResult() { return result; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
```

HashResponse.java:
```java
package com.library.demo.model.response;

import java.time.LocalDateTime;

public class HashResponse {
    private String input;
    private String algorithm;
    private String hashValue;
    private LocalDateTime timestamp;

    public HashResponse(String input, String algorithm, String hashValue, LocalDateTime timestamp) {
        this.input = input;
        this.algorithm = algorithm;
        this.hashValue = hashValue;
        this.timestamp = timestamp;
    }

    public String getInput() { return input; }
    public String getAlgorithm() { return algorithm; }
    public String getHashValue() { return hashValue; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
```

BubbleSortResponse.java:
```java
package com.library.demo.model.response;

import java.time.LocalDateTime;
import java.util.List;

public class BubbleSortResponse {
    private List<Integer> original;
    private List<Integer> sorted;
    private String order;
    private List<List<Integer>> steps;
    private LocalDateTime timestamp;

    public BubbleSortResponse(List<Integer> original, List<Integer> sorted, String order,
                              List<List<Integer>> steps, LocalDateTime timestamp) {
        this.original = original;
        this.sorted = sorted;
        this.order = order;
        this.steps = steps;
        this.timestamp = timestamp;
    }

    public List<Integer> getOriginal() { return original; }
    public List<Integer> getSorted() { return sorted; }
    public String getOrder() { return order; }
    public List<List<Integer>> getSteps() { return steps; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
```

- [ ] **Step 4: 创建 HelloWorldService**

```java
package com.library.demo.service;

import com.library.demo.model.response.HelloWorldResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class HelloWorldService {

    public HelloWorldResponse greet(String name) {
        String target = (name == null || name.isBlank()) ? "World" : name;
        return new HelloWorldResponse("Hello, " + target + "!", LocalDateTime.now());
    }
}
```

- [ ] **Step 5: 创建 HashService**

```java
package com.library.demo.service;

import com.library.demo.model.response.HashResponse;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Set;

@Service
public class HashService {

    private static final Set<String> SUPPORTED = Set.of("MD5", "SHA-1", "SHA-256");

    public HashResponse hash(String input, String algorithm) {
        String algo = (algorithm == null || algorithm.isBlank()) ? "SHA-256" : algorithm.toUpperCase();
        if (!SUPPORTED.contains(algo)) {
            throw new IllegalArgumentException("Unsupported algorithm: " + algo + ". Supported: MD5, SHA-1, SHA-256");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(algo);
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            String hashValue = bytesToHex(hashBytes);
            return new HashResponse(input, algo, hashValue, LocalDateTime.now());
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Algorithm not available: " + algo, e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
```

- [ ] **Step 6: 创建 BubbleSortService**

```java
package com.library.demo.service;

import com.library.demo.model.response.BubbleSortResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BubbleSortService {

    public BubbleSortResponse sort(List<Integer> numbers, String order) {
        String sortOrder = (order == null || order.isBlank()) ? "ASC" : order.toUpperCase();
        if (!sortOrder.equals("ASC") && !sortOrder.equals("DESC")) {
            throw new IllegalArgumentException("order must be ASC or DESC");
        }

        List<Integer> original = new ArrayList<>(numbers);
        List<Integer> arr = new ArrayList<>(numbers);
        List<List<Integer>> steps = new ArrayList<>();
        int n = arr.size();

        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - 1 - i; j++) {
                boolean shouldSwap = sortOrder.equals("ASC")
                        ? arr.get(j) > arr.get(j + 1)
                        : arr.get(j) < arr.get(j + 1);
                if (shouldSwap) {
                    int temp = arr.get(j);
                    arr.set(j, arr.get(j + 1));
                    arr.set(j + 1, temp);
                    swapped = true;
                }
            }
            steps.add(new ArrayList<>(arr));
            if (!swapped) break;
        }

        return new BubbleSortResponse(original, arr, sortOrder, steps, LocalDateTime.now());
    }
}
```

- [ ] **Step 7: 创建 DemoController**

```java
package com.library.demo.controller;

import com.library.demo.model.request.BubbleSortRequest;
import com.library.demo.model.request.HashRequest;
import com.library.demo.model.request.HelloWorldRequest;
import com.library.demo.model.response.ApiResponse;
import com.library.demo.model.response.BubbleSortResponse;
import com.library.demo.model.response.HashResponse;
import com.library.demo.model.response.HelloWorldResponse;
import com.library.demo.service.BubbleSortService;
import com.library.demo.service.HashService;
import com.library.demo.service.HelloWorldService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    private final HelloWorldService helloWorldService;
    private final HashService hashService;
    private final BubbleSortService bubbleSortService;

    public DemoController(HelloWorldService helloWorldService,
                          HashService hashService,
                          BubbleSortService bubbleSortService) {
        this.helloWorldService = helloWorldService;
        this.hashService = hashService;
        this.bubbleSortService = bubbleSortService;
    }

    @PostMapping("/helloworld")
    public ApiResponse<HelloWorldResponse> helloWorld(@RequestBody(required = false) HelloWorldRequest request) {
        String name = (request != null) ? request.getName() : null;
        return ApiResponse.success(helloWorldService.greet(name));
    }

    @PostMapping("/hash")
    public ApiResponse<HashResponse> hash(@Valid @RequestBody HashRequest request) {
        return ApiResponse.success(hashService.hash(request.getInput(), request.getAlgorithm()));
    }

    @PostMapping("/bubble-sort")
    public ApiResponse<BubbleSortResponse> bubbleSort(@Valid @RequestBody BubbleSortRequest request) {
        return ApiResponse.success(bubbleSortService.sort(request.getNumbers(), request.getOrder()));
    }
}
```

- [ ] **Step 8: 创建全局异常处理器**

Create: `library-backend/src/main/java/com/library/demo/controller/GlobalExceptionHandler.java`

```java
package com.library.demo.controller;

import com.library.demo.model.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        return ApiResponse.error(400, message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return ApiResponse.error(400, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleGeneral(Exception ex) {
        return ApiResponse.error(500, "Internal server error: " + ex.getMessage());
    }
}
```

- [ ] **Step 9: 编写单元测试 - HelloWorldServiceTest**

Create: `library-backend/src/test/java/com/library/demo/service/HelloWorldServiceTest.java`

```java
package com.library.demo.service;

import com.library.demo.model.response.HelloWorldResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HelloWorldServiceTest {

    private final HelloWorldService service = new HelloWorldService();

    @Test
    void greet_withName_returnsPersonalizedGreeting() {
        HelloWorldResponse response = service.greet("Alice");
        assertEquals("Hello, Alice!", response.getResult());
        assertNotNull(response.getTimestamp());
    }

    @Test
    void greet_withNull_returnsDefaultGreeting() {
        HelloWorldResponse response = service.greet(null);
        assertEquals("Hello, World!", response.getResult());
    }

    @Test
    void greet_withBlank_returnsDefaultGreeting() {
        HelloWorldResponse response = service.greet("  ");
        assertEquals("Hello, World!", response.getResult());
    }
}
```

- [ ] **Step 10: 编写单元测试 - HashServiceTest**

Create: `library-backend/src/test/java/com/library/demo/service/HashServiceTest.java`

```java
package com.library.demo.service;

import com.library.demo.model.response.HashResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HashServiceTest {

    private final HashService service = new HashService();

    @Test
    void hash_sha256_returnsCorrectHash() {
        HashResponse response = service.hash("hello", "SHA-256");
        assertEquals("hello", response.getInput());
        assertEquals("SHA-256", response.getAlgorithm());
        assertEquals("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", response.getHashValue());
    }

    @Test
    void hash_md5_returnsCorrectHash() {
        HashResponse response = service.hash("hello", "MD5");
        assertEquals("5d41402abc4b2a76b9719d911017c592", response.getHashValue());
    }

    @Test
    void hash_defaultAlgorithm_usesSha256() {
        HashResponse response = service.hash("test", null);
        assertEquals("SHA-256", response.getAlgorithm());
    }

    @Test
    void hash_unsupportedAlgorithm_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> service.hash("test", "BCRYPT"));
    }
}
```

- [ ] **Step 11: 编写单元测试 - BubbleSortServiceTest**

Create: `library-backend/src/test/java/com/library/demo/service/BubbleSortServiceTest.java`

```java
package com.library.demo.service;

import com.library.demo.model.response.BubbleSortResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BubbleSortServiceTest {

    private final BubbleSortService service = new BubbleSortService();

    @Test
    void sort_ascending_returnsSortedArray() {
        BubbleSortResponse response = service.sort(List.of(5, 3, 8, 1, 9, 2), "ASC");
        assertEquals(List.of(1, 2, 3, 5, 8, 9), response.getSorted());
        assertEquals("ASC", response.getOrder());
        assertEquals(List.of(5, 3, 8, 1, 9, 2), response.getOriginal());
        assertFalse(response.getSteps().isEmpty());
    }

    @Test
    void sort_descending_returnsReverseSortedArray() {
        BubbleSortResponse response = service.sort(List.of(3, 1, 2), "DESC");
        assertEquals(List.of(3, 2, 1), response.getSorted());
    }

    @Test
    void sort_defaultOrder_usesAscending() {
        BubbleSortResponse response = service.sort(List.of(3, 1, 2), null);
        assertEquals(List.of(1, 2, 3), response.getSorted());
        assertEquals("ASC", response.getOrder());
    }

    @Test
    void sort_invalidOrder_throwsException() {
        assertThrows(IllegalArgumentException.class,
                () -> service.sort(List.of(1, 2), "RANDOM"));
    }

    @Test
    void sort_singleElement_returnsSameElement() {
        BubbleSortResponse response = service.sort(List.of(42), "ASC");
        assertEquals(List.of(42), response.getSorted());
    }
}
```

- [ ] **Step 12: 运行测试验证**

Run: `cd library-backend && mvn test -pl . -Dtest="HelloWorldServiceTest,HashServiceTest,BubbleSortServiceTest" -q`
Expected: All tests PASS

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: implement HelloWorld, Hash, BubbleSort APIs with unit tests"
```

---

## Task 3: 后端埋点切面 + 实体 + Repository

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/model/entity/ApiCallLog.java`
- Create: `library-backend/src/main/java/com/library/demo/repository/ApiCallLogRepository.java`
- Create: `library-backend/src/main/java/com/library/demo/aspect/ApiCallLogAspect.java`

**Interfaces:**
- Consumes: Task 1 的 schema.sql 表结构, Task 2 的 DemoController 接口路径
- Produces: 每次 `/api/demo/**` 请求自动异步记录埋点数据到 api_call_log 表

- [ ] **Step 1: 创建 ApiCallLog JPA 实体**

```java
package com.library.demo.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_call_log")
public class ApiCallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_type", nullable = false, length = 32)
    private String apiType;

    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "user_name", length = 128)
    private String userName;

    @Column(name = "personnel_type", length = 32)
    private String personnelType;

    @Column(name = "personnel_level", length = 32)
    private String personnelLevel;

    @Column(name = "department", length = 128)
    private String department;

    @Column(name = "request_payload", columnDefinition = "TEXT")
    private String requestPayload;

    @Column(name = "response_payload", columnDefinition = "TEXT")
    private String responsePayload;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getApiType() { return apiType; }
    public void setApiType(String apiType) { this.apiType = apiType; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getPersonnelType() { return personnelType; }
    public void setPersonnelType(String personnelType) { this.personnelType = personnelType; }
    public String getPersonnelLevel() { return personnelLevel; }
    public void setPersonnelLevel(String personnelLevel) { this.personnelLevel = personnelLevel; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getRequestPayload() { return requestPayload; }
    public void setRequestPayload(String requestPayload) { this.requestPayload = requestPayload; }
    public String getResponsePayload() { return responsePayload; }
    public void setResponsePayload(String responsePayload) { this.responsePayload = responsePayload; }
    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 2: 创建 ApiCallLogRepository**

```java
package com.library.demo.repository;

import com.library.demo.model.entity.ApiCallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ApiCallLogRepository extends JpaRepository<ApiCallLog, Long> {

    List<ApiCallLog> findByApiTypeOrderByCreatedAtDesc(String apiType);

    List<ApiCallLog> findByApiTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            String apiType, LocalDateTime start, LocalDateTime end);

    @Query("SELECT a.department, COUNT(a) FROM ApiCallLog a " +
           "WHERE (:apiType = 'all' OR a.apiType = :apiType) " +
           "AND (:start IS NULL OR a.createdAt >= :start) " +
           "AND (:end IS NULL OR a.createdAt <= :end) " +
           "GROUP BY a.department ORDER BY COUNT(a) DESC")
    List<Object[]> countByDepartment(@Param("apiType") String apiType,
                                     @Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);

    @Query("SELECT a.personnelType, COUNT(a) FROM ApiCallLog a " +
           "WHERE (:apiType = 'all' OR a.apiType = :apiType) " +
           "AND (:start IS NULL OR a.createdAt >= :start) " +
           "AND (:end IS NULL OR a.createdAt <= :end) " +
           "GROUP BY a.personnelType ORDER BY COUNT(a) DESC")
    List<Object[]> countByPersonnelType(@Param("apiType") String apiType,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);

    @Query("SELECT a.personnelLevel, COUNT(a) FROM ApiCallLog a " +
           "WHERE (:apiType = 'all' OR a.apiType = :apiType) " +
           "AND (:start IS NULL OR a.createdAt >= :start) " +
           "AND (:end IS NULL OR a.createdAt <= :end) " +
           "GROUP BY a.personnelLevel ORDER BY COUNT(a) DESC")
    List<Object[]> countByPersonnelLevel(@Param("apiType") String apiType,
                                         @Param("start") LocalDateTime start,
                                         @Param("end") LocalDateTime end);

    @Query("SELECT CAST(a.createdAt AS DATE), a.department, COUNT(a) FROM ApiCallLog a " +
           "WHERE (:apiType = 'all' OR a.apiType = :apiType) " +
           "AND (:start IS NULL OR a.createdAt >= :start) " +
           "AND (:end IS NULL OR a.createdAt <= :end) " +
           "GROUP BY CAST(a.createdAt AS DATE), a.department ORDER BY CAST(a.createdAt AS DATE)")
    List<Object[]> timeSeriesByDepartment(@Param("apiType") String apiType,
                                          @Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);

    @Query("SELECT CAST(a.createdAt AS DATE), a.personnelType, COUNT(a) FROM ApiCallLog a " +
           "WHERE (:apiType = 'all' OR a.apiType = :apiType) " +
           "AND (:start IS NULL OR a.createdAt >= :start) " +
           "AND (:end IS NULL OR a.createdAt <= :end) " +
           "GROUP BY CAST(a.createdAt AS DATE), a.personnelType ORDER BY CAST(a.createdAt AS DATE)")
    List<Object[]> timeSeriesByPersonnelType(@Param("apiType") String apiType,
                                              @Param("start") LocalDateTime start,
                                              @Param("end") LocalDateTime end);

    @Query("SELECT CAST(a.createdAt AS DATE), a.personnelLevel, COUNT(a) FROM ApiCallLog a " +
           "WHERE (:apiType = 'all' OR a.apiType = :apiType) " +
           "AND (:start IS NULL OR a.createdAt >= :start) " +
           "AND (:end IS NULL OR a.createdAt <= :end) " +
           "GROUP BY CAST(a.createdAt AS DATE), a.personnelLevel ORDER BY CAST(a.createdAt AS DATE)")
    List<Object[]> timeSeriesByPersonnelLevel(@Param("apiType") String apiType,
                                               @Param("start") LocalDateTime start,
                                               @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a) FROM ApiCallLog a WHERE a.createdAt >= :todayStart")
    Long countToday(@Param("todayStart") LocalDateTime todayStart);

    @Query("SELECT COUNT(DISTINCT a.userId) FROM ApiCallLog a")
    Long countDistinctUsers();

    @Query("SELECT AVG(a.durationMs) FROM ApiCallLog a")
    Double averageDuration();
}
```

- [ ] **Step 3: 创建 ApiCallLogAspect 埋点切面**

```java
package com.library.demo.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.demo.model.entity.ApiCallLog;
import com.library.demo.repository.ApiCallLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Aspect
@Component
public class ApiCallLogAspect {

    private static final Logger log = LoggerFactory.getLogger(ApiCallLogAspect.class);
    private final ApiCallLogRepository repository;
    private final ObjectMapper objectMapper;

    public ApiCallLogAspect(ApiCallLogRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Around("execution(* com.library.demo.controller.DemoController.*(..))")
    public Object logApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        Object result = null;
        Throwable error = null;

        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable t) {
            error = t;
            throw t;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            try {
                String methodName = joinPoint.getSignature().getName();
                String apiType = mapMethodToApiType(methodName);
                Object[] args = joinPoint.getArgs();
                String requestPayload = args.length > 0 ? objectMapper.writeValueAsString(args[0]) : "{}";
                String responsePayload = (result != null && error == null)
                        ? objectMapper.writeValueAsString(result) : "{}";

                saveLogAsync(apiType, requestPayload, responsePayload, duration);
            } catch (Exception e) {
                log.warn("Failed to log API call: {}", e.getMessage());
            }
        }
    }

    @Async
    public void saveLogAsync(String apiType, String requestPayload, String responsePayload, long duration) {
        try {
            ApiCallLog logEntry = new ApiCallLog();
            logEntry.setApiType(apiType);
            logEntry.setRequestPayload(truncate(requestPayload, 4000));
            logEntry.setResponsePayload(truncate(responsePayload, 4000));
            logEntry.setDurationMs(duration);
            logEntry.setCreatedAt(LocalDateTime.now());

            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                logEntry.setUserId(request.getHeader("X-User-Id"));
                logEntry.setUserName(request.getHeader("X-User-Name"));
                logEntry.setPersonnelType(request.getHeader("X-User-Type"));
                logEntry.setPersonnelLevel(request.getHeader("X-User-Level"));
                logEntry.setDepartment(request.getHeader("X-User-Dept"));
            }

            repository.save(logEntry);
        } catch (Exception e) {
            log.error("Async save failed: {}", e.getMessage());
        }
    }

    private String mapMethodToApiType(String methodName) {
        return switch (methodName) {
            case "helloWorld" -> "helloworld";
            case "hash" -> "hash";
            case "bubbleSort" -> "bubble-sort";
            default -> "unknown";
        };
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return null;
        return value.length() > maxLen ? value.substring(0, maxLen) : value;
    }
}
```

- [ ] **Step 4: 编译验证**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add AOP logging aspect, ApiCallLog entity and repository"
```

---

## Task 4: 后端导出接口

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/model/request/ExportRequest.java`
- Create: `library-backend/src/main/java/com/library/demo/service/ExportService.java`
- Create: `library-backend/src/main/java/com/library/demo/controller/ExportController.java`

**Interfaces:**
- Consumes: Task 3 的 `ApiCallLogRepository`（查询埋点数据）
- Produces: `POST /api/demo/export` 返回 Excel 文件流

- [ ] **Step 1: 创建 ExportRequest DTO**

```java
package com.library.demo.model.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class ExportRequest {
    @NotBlank(message = "type is required")
    private String type; // helloworld | hash | bubble-sort
    private List<Long> recordIds; // optional, empty = export all

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public List<Long> getRecordIds() { return recordIds; }
    public void setRecordIds(List<Long> recordIds) { this.recordIds = recordIds; }
}
```

- [ ] **Step 2: 创建 ExportService**

```java
package com.library.demo.service;

import com.library.demo.model.entity.ApiCallLog;
import com.library.demo.repository.ApiCallLogRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportService {

    private static final int MAX_EXPORT_RECORDS = 10000;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ApiCallLogRepository repository;

    public ExportService(ApiCallLogRepository repository) {
        this.repository = repository;
    }

    public byte[] export(String type, List<Long> recordIds) throws IOException {
        List<ApiCallLog> records;
        if (recordIds != null && !recordIds.isEmpty()) {
            records = repository.findAllById(recordIds);
        } else {
            records = repository.findByApiTypeOrderByCreatedAtDesc(type);
        }

        if (records.size() > MAX_EXPORT_RECORDS) {
            records = records.subList(0, MAX_EXPORT_RECORDS);
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("API Call Records");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"序号", "调用时间", "调用人", "输入参数", "输出结果", "耗时(ms)"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            for (int i = 0; i < records.size(); i++) {
                ApiCallLog log = records.get(i);
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue(log.getCreatedAt() != null ? log.getCreatedAt().format(FMT) : "");
                row.createCell(2).setCellValue(log.getUserName() != null ? log.getUserName() : "");
                row.createCell(3).setCellValue(log.getRequestPayload() != null ? log.getRequestPayload() : "");
                row.createCell(4).setCellValue(log.getResponsePayload() != null ? log.getResponsePayload() : "");
                row.createCell(5).setCellValue(log.getDurationMs() != null ? log.getDurationMs() : 0);
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
```

- [ ] **Step 3: 创建 ExportController**

```java
package com.library.demo.controller;

import com.library.demo.model.request.ExportRequest;
import com.library.demo.service.ExportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/demo")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> export(@Valid @RequestBody ExportRequest request) throws IOException {
        byte[] excelBytes = exportService.export(request.getType(), request.getRecordIds());

        String filename = request.getType() + "_export.xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(excelBytes.length)
                .body(excelBytes);
    }
}
```

- [ ] **Step 4: 编译验证**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Excel export endpoint with Apache POI"
```

---

## Task 5: 后端调用统计查询接口

**Files:**
- Create: `library-backend/src/main/java/com/library/demo/model/response/AnalyticsResponse.java`
- Create: `library-backend/src/main/java/com/library/demo/service/AnalyticsService.java`
- Create: `library-backend/src/main/java/com/library/demo/controller/AnalyticsController.java`

**Interfaces:**
- Consumes: Task 3 的 `ApiCallLogRepository` 统计查询方法
- Produces: `GET /api/demo/analytics` 返回分组统计 + 时间序列数据

- [ ] **Step 1: 创建 AnalyticsResponse DTO**

```java
package com.library.demo.model.response;

import java.util.List;
import java.util.Map;

public class AnalyticsResponse {
    private String dimension;
    private String apiType;
    private long totalCalls;
    private long todayCalls;
    private long activeUsers;
    private double avgDurationMs;
    private List<GroupItem> groups;
    private List<TimeSeriesItem> timeSeries;

    // Getters and Setters
    public String getDimension() { return dimension; }
    public void setDimension(String dimension) { this.dimension = dimension; }
    public String getApiType() { return apiType; }
    public void setApiType(String apiType) { this.apiType = apiType; }
    public long getTotalCalls() { return totalCalls; }
    public void setTotalCalls(long totalCalls) { this.totalCalls = totalCalls; }
    public long getTodayCalls() { return todayCalls; }
    public void setTodayCalls(long todayCalls) { this.todayCalls = todayCalls; }
    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }
    public double getAvgDurationMs() { return avgDurationMs; }
    public void setAvgDurationMs(double avgDurationMs) { this.avgDurationMs = avgDurationMs; }
    public List<GroupItem> getGroups() { return groups; }
    public void setGroups(List<GroupItem> groups) { this.groups = groups; }
    public List<TimeSeriesItem> getTimeSeries() { return timeSeries; }
    public void setTimeSeries(List<TimeSeriesItem> timeSeries) { this.timeSeries = timeSeries; }

    public static class GroupItem {
        private String name;
        private long count;
        private double percentage;

        public GroupItem(String name, long count, double percentage) {
            this.name = name;
            this.count = count;
            this.percentage = percentage;
        }

        public String getName() { return name; }
        public long getCount() { return count; }
        public double getPercentage() { return percentage; }
    }

    public static class TimeSeriesItem {
        private String date;
        private Map<String, Long> groups;

        public TimeSeriesItem(String date, Map<String, Long> groups) {
            this.date = date;
            this.groups = groups;
        }

        public String getDate() { return date; }
        public Map<String, Long> getGroups() { return groups; }
    }
}
```

- [ ] **Step 2: 创建 AnalyticsService**

```java
package com.library.demo.service;

import com.library.demo.model.response.AnalyticsResponse;
import com.library.demo.model.response.AnalyticsResponse.GroupItem;
import com.library.demo.model.response.AnalyticsResponse.TimeSeriesItem;
import com.library.demo.repository.ApiCallLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ApiCallLogRepository repository;

    public AnalyticsService(ApiCallLogRepository repository) {
        this.repository = repository;
    }

    public AnalyticsResponse getAnalytics(String dimension, String apiType,
                                          String startDate, String endDate) {
        String effectiveApiType = (apiType == null || apiType.isBlank()) ? "all" : apiType;
        String effectiveDimension = (dimension == null || dimension.isBlank()) ? "department" : dimension;

        LocalDateTime start = (startDate != null && !startDate.isBlank())
                ? LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime end = (endDate != null && !endDate.isBlank())
                ? LocalDate.parse(endDate).atTime(LocalTime.MAX) : null;

        AnalyticsResponse response = new AnalyticsResponse();
        response.setDimension(effectiveDimension);
        response.setApiType(effectiveApiType);

        // Summary stats
        response.setTotalCalls(repository.count());
        Long todayCalls = repository.countToday(LocalDate.now().atStartOfDay());
        response.setTodayCalls(todayCalls != null ? todayCalls : 0L);
        Long activeUsers = repository.countDistinctUsers();
        response.setActiveUsers(activeUsers != null ? activeUsers : 0L);
        Double avgDuration = repository.averageDuration();
        response.setAvgDurationMs(avgDuration != null ? Math.round(avgDuration * 100.0) / 100.0 : 0.0);

        // Group data
        List<Object[]> groupData = fetchGroupData(effectiveDimension, effectiveApiType, start, end);
        long total = groupData.stream().mapToLong(row -> (Long) row[1]).sum();
        List<GroupItem> groups = groupData.stream()
                .map(row -> new GroupItem(
                        row[0] != null ? row[0].toString() : "Unknown",
                        (Long) row[1],
                        total > 0 ? Math.round(((Long) row[1]) * 10000.0 / total) / 100.0 : 0.0))
                .collect(Collectors.toList());
        response.setGroups(groups);

        // Time series data
        List<Object[]> tsData = fetchTimeSeriesData(effectiveDimension, effectiveApiType, start, end);
        Map<String, Map<String, Long>> dateMap = new LinkedHashMap<>();
        for (Object[] row : tsData) {
            String date = row[0].toString();
            String groupName = row[1] != null ? row[1].toString() : "Unknown";
            Long count = (Long) row[2];
            dateMap.computeIfAbsent(date, k -> new LinkedHashMap<>()).put(groupName, count);
        }
        List<TimeSeriesItem> timeSeries = dateMap.entrySet().stream()
                .map(e -> new TimeSeriesItem(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
        response.setTimeSeries(timeSeries);

        return response;
    }

    private List<Object[]> fetchGroupData(String dimension, String apiType,
                                          LocalDateTime start, LocalDateTime end) {
        return switch (dimension) {
            case "personnelType" -> repository.countByPersonnelType(apiType, start, end);
            case "personnelLevel" -> repository.countByPersonnelLevel(apiType, start, end);
            default -> repository.countByDepartment(apiType, start, end);
        };
    }

    private List<Object[]> fetchTimeSeriesData(String dimension, String apiType,
                                               LocalDateTime start, LocalDateTime end) {
        return switch (dimension) {
            case "personnelType" -> repository.timeSeriesByPersonnelType(apiType, start, end);
            case "personnelLevel" -> repository.timeSeriesByPersonnelLevel(apiType, start, end);
            default -> repository.timeSeriesByDepartment(apiType, start, end);
        };
    }
}
```

- [ ] **Step 3: 创建 AnalyticsController**

```java
package com.library.demo.controller;

import com.library.demo.model.response.AnalyticsResponse;
import com.library.demo.model.response.ApiResponse;
import com.library.demo.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/demo")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/analytics")
    public ApiResponse<AnalyticsResponse> getAnalytics(
            @RequestParam(required = false) String dimension,
            @RequestParam(required = false) String apiType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String chartType) {
        return ApiResponse.success(analyticsService.getAnalytics(dimension, apiType, startDate, endDate));
    }
}
```

- [ ] **Step 4: 编译验证**

Run: `cd library-backend && mvn compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 5: 运行全部测试**

Run: `cd library-backend && mvn test -q`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add analytics query endpoint with multi-dimension aggregation"
```

---

## Task 6: 后端集成验证（启动 + 接口冒烟测试）

**Files:**
- 无新增文件，仅验证

**Interfaces:**
- Consumes: Task 1-5 全部后端代码
- Produces: 验证所有 5 个接口可正常响应

- [ ] **Step 1: 启动应用**

Run: `cd library-backend && mvn spring-boot:run &`
Expected: 应用启动成功，监听 8080 端口

- [ ] **Step 2: 测试 HelloWorld 接口**

```bash
curl -s -X POST http://localhost:8080/api/demo/helloworld \
  -H "Content-Type: application/json" \
  -H "X-User-Id: U001" \
  -H "X-User-Name: 张三" \
  -H "X-User-Type: 正式" \
  -H "X-User-Level: P6" \
  -H "X-User-Dept: 技术部" \
  -d '{"name": "Alice"}'
```

Expected: `{"code":200,"message":"success","data":{"result":"Hello, Alice!","timestamp":"..."}}`

- [ ] **Step 3: 测试 Hash 接口**

```bash
curl -s -X POST http://localhost:8080/api/demo/hash \
  -H "Content-Type: application/json" \
  -H "X-User-Id: U001" \
  -H "X-User-Name: 张三" \
  -H "X-User-Type: 正式" \
  -H "X-User-Level: P6" \
  -H "X-User-Dept: 技术部" \
  -d '{"input": "hello", "algorithm": "SHA-256"}'
```

Expected: 返回 SHA-256 哈希值

- [ ] **Step 4: 测试 BubbleSort 接口**

```bash
curl -s -X POST http://localhost:8080/api/demo/bubble-sort \
  -H "Content-Type: application/json" \
  -H "X-User-Id: U001" \
  -H "X-User-Name: 张三" \
  -H "X-User-Type: 正式" \
  -H "X-User-Level: P6" \
  -H "X-User-Dept: 技术部" \
  -d '{"numbers": [5, 3, 8, 1, 9, 2], "order": "ASC"}'
```

Expected: 返回排序结果 `[1,2,3,5,8,9]` 及 steps

- [ ] **Step 5: 测试 Analytics 接口**

```bash
curl -s "http://localhost:8080/api/demo/analytics?dimension=department&apiType=all"
```

Expected: 返回统计结果（含 groups 和 timeSeries）

- [ ] **Step 6: 测试 Export 接口**

```bash
curl -s -X POST http://localhost:8080/api/demo/export \
  -H "Content-Type: application/json" \
  -d '{"type": "helloworld"}' -o /tmp/test_export.xlsx && ls -la /tmp/test_export.xlsx
```

Expected: 生成 Excel 文件

- [ ] **Step 7: 停止应用**

```bash
kill $(lsof -t -i:8080) 2>/dev/null || true
```

- [ ] **Step 8: Commit (如有修复)**

```bash
git add -A
git commit -m "fix: integration test fixes" || echo "No changes to commit"
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

**Interfaces:**
- Consumes: 无（前端首个 Task）
- Produces: 可运行的 React + TypeScript + Ant Design 前端骨架，代理后端 API 到 localhost:8080

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
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "antd": "^5.12.0",
    "axios": "^1.6.0",
    "echarts": "^5.4.3",
    "echarts-for-react": "^3.0.2",
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
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
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
    <title>图书管理系统 - 功能演示</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 src/main.tsx**

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

- [ ] **Step 6: 创建 src/App.tsx**

```tsx
import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import DemoPage from './pages/demo';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <div style={{ padding: 24, minHeight: '100vh', background: '#f5f5f5' }}>
        <DemoPage />
      </div>
    </ConfigProvider>
  );
};

export default App;
```

- [ ] **Step 7: 安装依赖**

Run: `cd library-frontend && npm install`
Expected: 依赖安装成功，生成 node_modules 和 package-lock.json

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold React + TypeScript + Ant Design + Vite project"
```

---

## Task 8: 前端类型定义 + API 服务层

**Files:**
- Create: `library-frontend/src/types/demo.d.ts`
- Create: `library-frontend/src/services/demoApi.ts`

**Interfaces:**
- Consumes: Task 7 的前端骨架 + 后端接口契约（§6 跨库接口契约）
- Produces: 类型安全的 API 调用封装，所有前端请求统一经过 demoApi

- [ ] **Step 1: 创建 TypeScript 类型定义 demo.d.ts**

```typescript
// === 统一响应 ===
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// === HelloWorld ===
export interface HelloWorldRequest {
  name?: string;
}

export interface HelloWorldData {
  result: string;
  timestamp: string;
}

// === Hash ===
export interface HashRequest {
  input: string;
  algorithm?: 'MD5' | 'SHA-1' | 'SHA-256';
}

export interface HashData {
  input: string;
  algorithm: string;
  hashValue: string;
  timestamp: string;
}

// === BubbleSort ===
export interface BubbleSortRequest {
  numbers: number[];
  order?: 'ASC' | 'DESC';
}

export interface BubbleSortData {
  original: number[];
  sorted: number[];
  order: string;
  steps: number[][];
  timestamp: string;
}

// === Export ===
export interface ExportRequest {
  type: 'helloworld' | 'hash' | 'bubble-sort';
  recordIds?: string[];
}

// === Analytics ===
export interface AnalyticsParams {
  dimension: 'personnelType' | 'personnelLevel' | 'department';
  apiType?: 'helloworld' | 'hash' | 'bubble-sort' | 'all';
  startDate?: string;
  endDate?: string;
  chartType?: 'line' | 'pie' | 'bar';
}

export interface GroupItem {
  name: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesItem {
  date: string;
  groups: Record<string, number>;
}

export interface AnalyticsData {
  dimension: string;
  apiType: string;
  totalCalls: number;
  todayCalls: number;
  activeUsers: number;
  avgDurationMs: number;
  groups: GroupItem[];
  timeSeries: TimeSeriesItem[];
}

// === User Context (请求头注入) ===
export interface UserContext {
  userId: string;
  userName: string;
  userType: string;
  userLevel: string;
  userDept: string;
}
```

- [ ] **Step 2: 创建 demoApi.ts 服务层**

```typescript
import axios, { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  HelloWorldRequest,
  HelloWorldData,
  HashRequest,
  HashData,
  BubbleSortRequest,
  BubbleSortData,
  AnalyticsParams,
  AnalyticsData,
  UserContext,
} from '../types/demo';

// Default user context (demo mode)
let currentUserContext: UserContext = {
  userId: 'U001',
  userName: '张三',
  userType: '正式',
  userLevel: 'P6',
  userDept: '技术部',
};

export function setUserContext(ctx: UserContext) {
  currentUserContext = ctx;
}

export function getUserContext(): UserContext {
  return currentUserContext;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/demo',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject user headers
apiClient.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = currentUserContext.userId;
  config.headers['X-User-Name'] = currentUserContext.userName;
  config.headers['X-User-Type'] = currentUserContext.userType;
  config.headers['X-User-Level'] = currentUserContext.userLevel;
  config.headers['X-User-Dept'] = currentUserContext.userDept;
  return config;
});

// === API Functions ===

export async function callHelloWorld(params: HelloWorldRequest): Promise<ApiResponse<HelloWorldData>> {
  const { data } = await apiClient.post<ApiResponse<HelloWorldData>>('/helloworld', params);
  return data;
}

export async function callHash(params: HashRequest): Promise<ApiResponse<HashData>> {
  const { data } = await apiClient.post<ApiResponse<HashData>>('/hash', params);
  return data;
}

export async function callBubbleSort(params: BubbleSortRequest): Promise<ApiResponse<BubbleSortData>> {
  const { data } = await apiClient.post<ApiResponse<BubbleSortData>>('/bubble-sort', params);
  return data;
}

export async function exportData(type: 'helloworld' | 'hash' | 'bubble-sort', recordIds?: string[]): Promise<void> {
  const response = await apiClient.post('/export', { type, recordIds }, { responseType: 'blob' });
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}_export.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function fetchAnalytics(params: AnalyticsParams): Promise<ApiResponse<AnalyticsData>> {
  const { data } = await apiClient.get<ApiResponse<AnalyticsData>>('/analytics', { params });
  return data;
}
```

- [ ] **Step 3: 编译验证**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add TypeScript types and API service layer for demo module"
```

---

## Task 9: 前端三个功能 Tab 页面

**Files:**
- Create: `library-frontend/src/pages/demo/index.tsx`
- Create: `library-frontend/src/pages/demo/HelloWorldTab.tsx`
- Create: `library-frontend/src/pages/demo/HashTab.tsx`
- Create: `library-frontend/src/pages/demo/BubbleSortTab.tsx`
- Create: `library-frontend/src/pages/demo/components/ExportButton.tsx`

**Interfaces:**
- Consumes: Task 8 的 `demoApi.ts` 函数和类型
- Produces: 三个可交互的功能 Tab 页面，各含输入区、执行按钮、结果展示、历史记录表格、导出按钮

- [ ] **Step 1: 创建 ExportButton 通用组件**

```tsx
import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportData } from '../../services/demoApi';

interface ExportButtonProps {
  type: 'helloworld' | 'hash' | 'bubble-sort';
}

const ExportButton: React.FC<ExportButtonProps> = ({ type }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportData(type);
      message.success('导出成功');
    } catch (err) {
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

- [ ] **Step 2: 创建 HelloWorldTab**

```tsx
import React, { useState } from 'react';
import { Card, Input, Button, Table, Space, Typography, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callHelloWorld } from '../../services/demoApi';
import type { HelloWorldData } from '../../types/demo';
import ExportButton from './components/ExportButton';

const { Title } = Typography;

interface HistoryRecord {
  key: number;
  input: string;
  result: string;
  timestamp: string;
}

const HelloWorldTab: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HelloWorldData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const handleCall = async () => {
    setLoading(true);
    try {
      const res = await callHelloWorld({ name: name || undefined });
      if (res.code === 200) {
        setResult(res.data);
        setHistory((prev) => [
          { key: Date.now(), input: name || '(empty)', result: res.data.result, timestamp: res.data.timestamp },
          ...prev,
        ]);
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '输入', dataIndex: 'input', key: 'input' },
    { title: '结果', dataIndex: 'result', key: 'result' },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="HelloWorld 接口调用">
        <Space>
          <Input
            placeholder="输入姓名（可选，默认 World）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleCall}
          />
          <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleCall}>
            调用
          </Button>
        </Space>
        {result && (
          <Card style={{ marginTop: 16 }} type="inner" title="返回结果">
            <Title level={4}>{result.result}</Title>
            <Typography.Text type="secondary">时间: {result.timestamp}</Typography.Text>
          </Card>
        )}
      </Card>

      <Card title="调用历史" extra={<ExportButton type="helloworld" />}>
        <Table dataSource={history} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  );
};

export default HelloWorldTab;
```

- [ ] **Step 3: 创建 HashTab**

```tsx
import React, { useState } from 'react';
import { Card, Input, Select, Button, Table, Space, Typography, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callHash } from '../../services/demoApi';
import type { HashData } from '../../types/demo';
import ExportButton from './components/ExportButton';

const { TextArea } = Input;

interface HistoryRecord {
  key: number;
  input: string;
  algorithm: string;
  hashValue: string;
  timestamp: string;
}

const HashTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<string>('SHA-256');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HashData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const handleCall = async () => {
    if (!input.trim()) {
      message.warning('请输入待哈希的原文');
      return;
    }
    setLoading(true);
    try {
      const res = await callHash({ input, algorithm: algorithm as any });
      if (res.code === 200) {
        setResult(res.data);
        setHistory((prev) => [
          {
            key: Date.now(),
            input: res.data.input,
            algorithm: res.data.algorithm,
            hashValue: res.data.hashValue,
            timestamp: res.data.timestamp,
          },
          ...prev,
        ]);
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '原文', dataIndex: 'input', key: 'input', ellipsis: true },
    { title: '算法', dataIndex: 'algorithm', key: 'algorithm', width: 100 },
    { title: '哈希值', dataIndex: 'hashValue', key: 'hashValue', ellipsis: true },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 200 },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="哈希算法接口调用">
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            placeholder="请输入待哈希的原文"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
          />
          <Space>
            <Select value={algorithm} onChange={setAlgorithm} style={{ width: 160 }}>
              <Select.Option value="MD5">MD5</Select.Option>
              <Select.Option value="SHA-1">SHA-1</Select.Option>
              <Select.Option value="SHA-256">SHA-256</Select.Option>
            </Select>
            <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleCall}>
              计算哈希
            </Button>
          </Space>
        </Space>
        {result && (
          <Card style={{ marginTop: 16 }} type="inner" title="哈希结果">
            <Typography.Paragraph><strong>算法:</strong> {result.algorithm}</Typography.Paragraph>
            <Typography.Paragraph copyable><strong>哈希值:</strong> {result.hashValue}</Typography.Paragraph>
          </Card>
        )}
      </Card>

      <Card title="调用历史" extra={<ExportButton type="hash" />}>
        <Table dataSource={history} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  );
};

export default HashTab;
```

- [ ] **Step 4: 创建 BubbleSortTab**

```tsx
import React, { useState } from 'react';
import { Card, Input, Select, Button, Table, Space, Typography, Tag, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { callBubbleSort } from '../../services/demoApi';
import type { BubbleSortData } from '../../types/demo';
import ExportButton from './components/ExportButton';

interface HistoryRecord {
  key: number;
  original: string;
  sorted: string;
  order: string;
  stepsCount: number;
  timestamp: string;
}

const BubbleSortTab: React.FC = () => {
  const [numbersInput, setNumbersInput] = useState('5, 3, 8, 1, 9, 2');
  const [order, setOrder] = useState<string>('ASC');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BubbleSortData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  const handleCall = async () => {
    const numbers = numbersInput
      .split(/[,\s]+/)
      .filter((s) => s.trim() !== '')
      .map(Number);

    if (numbers.some(isNaN)) {
      message.warning('请输入有效的数字，用逗号分隔');
      return;
    }
    if (numbers.length === 0) {
      message.warning('请输入至少一个数字');
      return;
    }

    setLoading(true);
    try {
      const res = await callBubbleSort({ numbers, order: order as any });
      if (res.code === 200) {
        setResult(res.data);
        setHistory((prev) => [
          {
            key: Date.now(),
            original: res.data.original.join(', '),
            sorted: res.data.sorted.join(', '),
            order: res.data.order,
            stepsCount: res.data.steps.length,
            timestamp: res.data.timestamp,
          },
          ...prev,
        ]);
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '原始数组', dataIndex: 'original', key: 'original', ellipsis: true },
    { title: '排序结果', dataIndex: 'sorted', key: 'sorted', ellipsis: true },
    { title: '方向', dataIndex: 'order', key: 'order', width: 80 },
    { title: '步骤数', dataIndex: 'stepsCount', key: 'stepsCount', width: 80 },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 200 },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="冒泡排序接口调用">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="输入数字，用逗号分隔（如: 5, 3, 8, 1, 9, 2）"
            value={numbersInput}
            onChange={(e) => setNumbersInput(e.target.value)}
          />
          <Space>
            <Select value={order} onChange={setOrder} style={{ width: 120 }}>
              <Select.Option value="ASC">升序 (ASC)</Select.Option>
              <Select.Option value="DESC">降序 (DESC)</Select.Option>
            </Select>
            <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleCall}>
              排序
            </Button>
          </Space>
        </Space>

        {result && (
          <Card style={{ marginTop: 16 }} type="inner" title="排序结果">
            <Typography.Paragraph>
              <strong>原始:</strong> [{result.original.join(', ')}]
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>结果:</strong> [{result.sorted.join(', ')}] <Tag color="green">{result.order}</Tag>
            </Typography.Paragraph>
            <Typography.Title level={5}>排序步骤</Typography.Title>
            {result.steps.map((step, idx) => (
              <Typography.Paragraph key={idx}>
                <Tag>第 {idx + 1} 轮</Tag> [{step.join(', ')}]
              </Typography.Paragraph>
            ))}
          </Card>
        )}
      </Card>

      <Card title="调用历史" extra={<ExportButton type="bubble-sort" />}>
        <Table dataSource={history} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  );
};

export default BubbleSortTab;
```

- [ ] **Step 5: 创建主页面 index.tsx (Tabs 容器)**

```tsx
import React from 'react';
import { Tabs, Typography, Card } from 'antd';
import {
  CodeOutlined,
  LockOutlined,
  SortAscendingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import HelloWorldTab from './HelloWorldTab';
import HashTab from './HashTab';
import BubbleSortTab from './BubbleSortTab';
import AnalyticsTab from './AnalyticsTab';

const { Title } = Typography;

const DemoPage: React.FC = () => {
  const items = [
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
      children: <AnalyticsTab />,
    },
  ];

  return (
    <Card>
      <Title level={3} style={{ marginBottom: 24 }}>功能演示</Title>
      <Tabs defaultActiveKey="helloworld" items={items} size="large" />
    </Card>
  );
};

export default DemoPage;
```

- [ ] **Step 6: 创建 AnalyticsTab 占位（下一 Task 完善）**

```tsx
import React from 'react';
import { Typography } from 'antd';

const AnalyticsTab: React.FC = () => {
  return <Typography.Text>调用统计报表（待实现）</Typography.Text>;
};

export default AnalyticsTab;
```

- [ ] **Step 7: 编译验证**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: implement HelloWorld, Hash, BubbleSort tabs with export buttons"
```

---

## Task 10: 前端调用统计报表 Tab（图表可视化）

**Files:**
- Modify: `library-frontend/src/pages/demo/AnalyticsTab.tsx`
- Create: `library-frontend/src/pages/demo/components/ChartPanel.tsx`
- Create: `library-frontend/src/pages/demo/components/StatsCard.tsx`

**Interfaces:**
- Consumes: Task 8 的 `fetchAnalytics` + `AnalyticsData` 类型
- Produces: 完整的调用统计 Tab，含筛选控件、4 个统计卡片、折线图/饼图/柱状图切换

- [ ] **Step 1: 创建 StatsCard 组件**

```tsx
import React from 'react';
import { Card, Statistic } from 'antd';

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  precision?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, suffix, precision }) => {
  return (
    <Card>
      <Statistic title={title} value={value} suffix={suffix} precision={precision} />
    </Card>
  );
};

export default StatsCard;
```

- [ ] **Step 2: 创建 ChartPanel 组件**

```tsx
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { AnalyticsData } from '../../../types/demo';

interface ChartPanelProps {
  chartType: 'line' | 'pie' | 'bar';
  data: AnalyticsData;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ chartType, data }) => {
  const option = useMemo(() => {
    if (chartType === 'pie') {
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
          {
            name: '调用次数',
            type: 'pie',
            radius: '60%',
            data: data.groups.map((g) => ({ name: g.name, value: g.count })),
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
            },
          },
        ],
      };
    }

    if (chartType === 'bar') {
      return {
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: data.groups.map((g) => g.name),
        },
        yAxis: { type: 'value', name: '调用次数' },
        series: [
          {
            name: '调用次数',
            type: 'bar',
            data: data.groups.map((g) => g.count),
            itemStyle: { color: '#1890ff' },
          },
        ],
      };
    }

    // line chart
    const allGroupNames = new Set<string>();
    data.timeSeries.forEach((ts) => {
      Object.keys(ts.groups).forEach((k) => allGroupNames.add(k));
    });
    const groupNames = Array.from(allGroupNames);
    const dates = data.timeSeries.map((ts) => ts.date);

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: groupNames },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: '调用次数' },
      series: groupNames.map((name) => ({
        name,
        type: 'line',
        data: data.timeSeries.map((ts) => ts.groups[name] || 0),
        smooth: true,
      })),
    };
  }, [chartType, data]);

  return <ReactECharts option={option} style={{ height: 400 }} />;
};

export default ChartPanel;
```

- [ ] **Step 3: 重写 AnalyticsTab 完整实现**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Select, DatePicker, Radio, Space, Row, Col, Spin, message } from 'antd';
import { fetchAnalytics } from '../../services/demoApi';
import type { AnalyticsData } from '../../types/demo';
import ChartPanel from './components/ChartPanel';
import StatsCard from './components/StatsCard';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const AnalyticsTab: React.FC = () => {
  const [dimension, setDimension] = useState<'personnelType' | 'personnelLevel' | 'department'>('department');
  const [apiType, setApiType] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'pie' | 'bar'>('bar');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAnalytics({
        dimension,
        apiType: apiType as any,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
        chartType,
      });
      if (res.code === 200) {
        setData(res.data);
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  }, [dimension, apiType, chartType, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* 筛选区域 */}
      <Card title="筛选条件">
        <Space wrap>
          <Space>
            <span>统计维度:</span>
            <Select value={dimension} onChange={setDimension} style={{ width: 140 }}>
              <Select.Option value="department">人员部门</Select.Option>
              <Select.Option value="personnelType">人员类型</Select.Option>
              <Select.Option value="personnelLevel">人员层级</Select.Option>
            </Select>
          </Space>
          <Space>
            <span>接口类型:</span>
            <Select value={apiType} onChange={setApiType} style={{ width: 140 }}>
              <Select.Option value="all">全部</Select.Option>
              <Select.Option value="helloworld">HelloWorld</Select.Option>
              <Select.Option value="hash">哈希算法</Select.Option>
              <Select.Option value="bubble-sort">冒泡排序</Select.Option>
            </Select>
          </Space>
          <Space>
            <span>日期范围:</span>
            <RangePicker
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([
                    dates[0].format('YYYY-MM-DD'),
                    dates[1].format('YYYY-MM-DD'),
                  ]);
                } else {
                  setDateRange(null);
                }
              }}
            />
          </Space>
          <Space>
            <span>图表类型:</span>
            <Radio.Group value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <Radio.Button value="bar">柱状图</Radio.Button>
              <Radio.Button value="pie">饼图</Radio.Button>
              <Radio.Button value="line">折线图</Radio.Button>
            </Radio.Group>
          </Space>
        </Space>
      </Card>

      {/* 统计卡片 */}
      {data && (
        <Row gutter={16}>
          <Col span={6}>
            <StatsCard title="总调用次数" value={data.totalCalls} />
          </Col>
          <Col span={6}>
            <StatsCard title="今日调用" value={data.todayCalls} />
          </Col>
          <Col span={6}>
            <StatsCard title="活跃用户数" value={data.activeUsers} />
          </Col>
          <Col span={6}>
            <StatsCard title="平均响应耗时" value={data.avgDurationMs} suffix="ms" precision={2} />
          </Col>
        </Row>
      )}

      {/* 图表区域 */}
      <Card title="调用统计图表">
        <Spin spinning={loading}>
          {data ? (
            <ChartPanel chartType={chartType} data={data} />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              暂无数据，请先调用接口产生埋点数据
            </div>
          )}
        </Spin>
      </Card>
    </Space>
  );
};

export default AnalyticsTab;
```

- [ ] **Step 4: 编译验证**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误（若 dayjs 类型缺失则 `npm install dayjs`）

- [ ] **Step 5: 构建验证**

Run: `cd library-frontend && npm run build`
Expected: 构建成功，生成 dist 目录

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement analytics tab with ECharts visualization (line/pie/bar)"
```

---

## Task 11: 前端联调验证 + 最终提交

**Files:**
- 无新增文件（仅验证和修复）

**Interfaces:**
- Consumes: Task 1-10 全部前后端代码
- Produces: 前后端联调通过，所有功能可用

- [ ] **Step 1: 启动后端**

Run: `cd library-backend && mvn spring-boot:run &`
Expected: 后端启动在 8080 端口

- [ ] **Step 2: 启动前端**

Run: `cd library-frontend && npm run dev &`
Expected: 前端启动在 3000 端口，API 代理到 8080

- [ ] **Step 3: 验证 HelloWorld Tab**

通过 curl 模拟前端代理:
```bash
curl -s -X POST http://localhost:3000/api/demo/helloworld \
  -H "Content-Type: application/json" \
  -H "X-User-Id: U001" \
  -H "X-User-Name: 张三" \
  -H "X-User-Type: 正式" \
  -H "X-User-Level: P6" \
  -H "X-User-Dept: 技术部" \
  -d '{"name": "Test"}'
```

Expected: 返回 `{"code":200,...,"data":{"result":"Hello, Test!",...}}`

- [ ] **Step 4: 验证 Analytics 接口**

```bash
curl -s "http://localhost:3000/api/demo/analytics?dimension=department"
```

Expected: 返回统计数据

- [ ] **Step 5: 停止服务**

```bash
kill $(lsof -t -i:8080) 2>/dev/null || true
kill $(lsof -t -i:3000) 2>/dev/null || true
```

- [ ] **Step 6: 最终 Commit**

```bash
# library-backend
cd library-backend && git add -A && git commit -m "chore: final integration verification" || echo "No backend changes"

# library-frontend
cd library-frontend && git add -A && git commit -m "chore: final integration verification" || echo "No frontend changes"
```

---

## 跨仓对齐点检查清单

| # | 检查项 | 前端 | 后端 | 状态 |
|---|--------|------|------|------|
| 1 | 统一响应格式 `{code, message, data}` | `ApiResponse<T>` 类型 | `ApiResponse.java` | ✅ 对齐 |
| 2 | 请求头 `X-User-Id/Name/Type/Level/Dept` | `demoApi.ts` 拦截器注入 | `ApiCallLogAspect.java` 读取 | ✅ 对齐 |
| 3 | POST `/api/demo/helloworld` 请求/响应体 | `HelloWorldRequest/Data` | `DemoController.helloWorld()` | ✅ 对齐 |
| 4 | POST `/api/demo/hash` 请求/响应体 | `HashRequest/Data` | `DemoController.hash()` | ✅ 对齐 |
| 5 | POST `/api/demo/bubble-sort` 请求/响应体 | `BubbleSortRequest/Data` | `DemoController.bubbleSort()` | ✅ 对齐 |
| 6 | POST `/api/demo/export` 请求体 + blob 响应 | `exportData()` blob 下载 | `ExportController.export()` | ✅ 对齐 |
| 7 | GET `/api/demo/analytics` 查询参数 + 响应 | `AnalyticsParams/Data` | `AnalyticsController.getAnalytics()` | ✅ 对齐 |
| 8 | 导出类型枚举 `helloworld/hash/bubble-sort` | `ExportRequest.type` | `ExportRequest.java.type` | ✅ 对齐 |
| 9 | 统计维度枚举 `personnelType/personnelLevel/department` | `AnalyticsParams.dimension` | `AnalyticsService` switch | ✅ 对齐 |
| 10 | Vite 代理 `/api` → `localhost:8080` | `vite.config.ts` proxy | Spring Boot port 8080 | ✅ 对齐 |
