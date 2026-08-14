# 算法工具与调用分析平台 — 实施计划

> **版本**: v1.0
> **日期**: 2025-08-14
> **项目**: library-frontend / library-backend（图书管理系统）
> **规格文档**: `.agents/specs/${system.dima}.md`
> **适用阶段**: 实施计划 (writing-plans)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在图书管理系统基础上新增算法工具与调用分析模块，包含三个算法接口（HelloWorld、哈希、冒泡排序）、结果导出、埋点记录及可视化分析报表。

**Architecture:** 后端 Spring Boot 3.x + MyBatis-Plus + MySQL 提供 REST API，通过 AOP 切面自动埋点；前端 React 18 + TypeScript + Ant Design 5.x + ECharts 5.x 提供三 Tab 算法工具页面和可视化报表面板。

**Tech Stack:**
- Backend: Spring Boot 3.x, Java 17, MyBatis-Plus, MySQL 8.0, Apache POI, OpenCSV
- Frontend: React 18, TypeScript, Vite, Ant Design 5.x, ECharts 5.x, Axios

---

## Global Constraints

- 所有接口统一返回 `{code, data, message}` 结构
- 前端 Axios 拦截器统一注入 `X-User-*` 请求头（调用人信息）
- 埋点由 AOP 切面自动触发，不侵入业务代码
- 导出格式支持 CSV（默认）和 XLSX
- 图表维度支持：人员类型（caller_type）、人员层级（caller_level）、人员部门（caller_dept）
- 图表类型支持：折线图、饼图、柱状图
- 数组排序长度限制 2~1000
- 哈希算法支持：MD5、SHA-1、SHA-256、SHA-512

---

## File Structure

### library-backend

```
src/main/java/com/library/
├── LibraryApplication.java                    # Spring Boot 入口
├── common/
│   ├── Result.java                            # 统一响应封装
│   └── GlobalExceptionHandler.java            # 全局异常处理
├── config/
│   └── WebConfig.java                         # CORS 配置
├── controller/
│   ├── HelloWorldController.java              # HelloWorld 接口
│   ├── HashController.java                    # 哈希接口
│   ├── BubbleSortController.java              # 冒泡排序接口
│   ├── ExportController.java                  # 导出接口
│   └── MetricsController.java                 # 统计查询接口
├── service/
│   ├── HashService.java                       # 哈希算法服务
│   ├── BubbleSortService.java                 # 冒泡排序服务
│   ├── ExportService.java                     # 导出服务
│   └── MetricsService.java                    # 统计查询服务
├── entity/
│   └── ApiMetrics.java                        # 埋点实体
├── mapper/
│   └── ApiMetricsMapper.java                  # 埋点 Mapper
├── aspect/
│   └── MetricsAspect.java                     # 埋点 AOP 切面
└── dto/
    ├── HashRequest.java                       # 哈希请求 DTO
    ├── BubbleSortRequest.java                 # 冒泡排序请求 DTO
    ├── ExportRequest.java                     # 导出请求 DTO
    └── MetricsQueryRequest.java               # 统计查询请求 DTO

src/main/resources/
├── application.yml                            # 应用配置
└── db/
    └── migration/
        └── V1__create_api_metrics.sql          # 数据库迁移脚本
```

### library-frontend

```
src/
├── main.tsx                                   # 入口
├── App.tsx                                    # 路由配置
├── api/
│   ├── client.ts                              # Axios 实例 + 拦截器
│   ├── helloworld.ts                          # HelloWorld API
│   ├── hash.ts                                # 哈希 API
│   ├── bubblesort.ts                          # 冒泡排序 API
│   ├── export.ts                              # 导出 API
│   └── metrics.ts                             # 统计 API
├── pages/
│   └── AlgorithmTools/
│       ├── index.tsx                          # 页面入口（布局 + Tab）
│       ├── HelloWorldTab.tsx                  # HelloWorld Tab
│       ├── HashTab.tsx                        # 哈希 Tab
│       ├── BubbleSortTab.tsx                  # 冒泡排序 Tab
│       ├── ExportButton.tsx                   # 导出按钮
│       └── MetricsDashboard.tsx               # 可视化报表面板
├── components/
│   └── ResultDisplay.tsx                      # 结果展示组件
├── types/
│   └── algorithm.ts                           # 类型定义
└── utils/
    └── download.ts                            # 文件下载工具
```

---

## Task 1: Backend Project Scaffolding

**Files:**
- Create: `library-backend/src/main/java/com/library/LibraryApplication.java`
- Create: `library-backend/src/main/java/com/library/common/Result.java`
- Create: `library-backend/src/main/java/com/library/common/GlobalExceptionHandler.java`
- Create: `library-backend/src/main/java/com/library/config/WebConfig.java`
- Create: `library-backend/src/main/resources/application.yml`
- Create: `library-backend/pom.xml`

**Interfaces:**
- Produces: `Result<T>` — `{code: int, message: string, data: T}`，静态工厂方法 `Result.ok(T data)`、`Result.fail(int code, String message)`
- Produces: `GlobalExceptionHandler` — `@RestControllerAdvice`，处理 `MethodArgumentNotValidException`(400)、`IllegalArgumentException`(400)、`Exception`(500)

- [ ] **Step 1: Create pom.xml with all dependencies**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
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
            <artifactId>spring-boot-starter-validation</artifactId>
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
    </dependencies>
</project>
```

- [ ] **Step 2: Create LibraryApplication.java**

```java
package com.library;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.library.mapper")
public class LibraryApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

- [ ] **Step 3: Create Result.java**

```java
package com.library.common;

import lombok.Data;

@Data
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) {
        Result<T> r = new Result<>();
        r.code = 200;
        r.message = "success";
        r.data = data;
        return r;
    }

    public static <T> Result<T> fail(int code, String message) {
        Result<T> r = new Result<>();
        r.code = code;
        r.message = message;
        return r;
    }
}
```

- [ ] **Step 4: Create GlobalExceptionHandler.java**

```java
package com.library.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleIllegalArgument(IllegalArgumentException e) {
        return Result.fail(400, "参数错误: " + e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b).orElse("校验失败");
        return Result.fail(400, "参数错误: " + msg);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e) {
        return Result.fail(500, "服务器内部错误");
    }
}
```

- [ ] **Step 5: Create WebConfig.java (CORS)**

```java
package com.library.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

- [ ] **Step 6: Create application.yml**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/library?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: auto
server:
  port: 8080
```

- [ ] **Step 7: Verify project compiles**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-55f890a2-938d-4b89-9cdf-2ce532bf2d34/worktree/library-backend-main && mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 2: Database Migration — api_metrics Table

**Files:**
- Create: `library-backend/src/main/resources/db/migration/V1__create_api_metrics.sql`
- Create: `library-backend/src/main/java/com/library/entity/ApiMetrics.java`
- Create: `library-backend/src/main/java/com/library/mapper/ApiMetricsMapper.java`

**Interfaces:**
- Produces: `ApiMetrics` entity — fields: id(Long), apiPath(String), callerId(String), callerName(String), callerType(String), callerLevel(String), callerDept(String), callTime(LocalDateTime), durationMs(Integer), success(Integer)
- Produces: `ApiMetricsMapper` — extends `BaseMapper<ApiMetrics>`，自定义查询方法 `selectStatsByDimension`、`selectTrend`

- [ ] **Step 1: Create SQL migration**

```sql
CREATE TABLE IF NOT EXISTS api_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_path VARCHAR(255) NOT NULL COMMENT '接口路径',
    caller_id VARCHAR(64) COMMENT '调用人ID',
    caller_name VARCHAR(128) COMMENT '调用人姓名',
    caller_type VARCHAR(32) COMMENT '人员类型',
    caller_level VARCHAR(16) COMMENT '人员层级',
    caller_dept VARCHAR(128) COMMENT '人员部门',
    call_time DATETIME NOT NULL COMMENT '调用时间',
    duration_ms INT COMMENT '耗时(ms)',
    success TINYINT DEFAULT 1 COMMENT '1成功 0失败',
    INDEX idx_api_path (api_path),
    INDEX idx_caller_type (caller_type),
    INDEX idx_caller_level (caller_level),
    INDEX idx_caller_dept (caller_dept),
    INDEX idx_call_time (call_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API调用埋点记录表';
```

- [ ] **Step 2: Create ApiMetrics.java entity**

```java
package com.library.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("api_metrics")
public class ApiMetrics {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String apiPath;
    private String callerId;
    private String callerName;
    private String callerType;
    private String callerLevel;
    private String callerDept;
    private LocalDateTime callTime;
    private Integer durationMs;
    private Integer success;
}
```

- [ ] **Step 3: Create ApiMetricsMapper.java**

```java
package com.library.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.entity.ApiMetrics;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;
import java.util.Map;

@Mapper
public interface ApiMetricsMapper extends BaseMapper<ApiMetrics> {

    @Select("SELECT ${dimension} AS label, COUNT(*) AS count, " +
            "ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM api_metrics WHERE 1=1 " +
            "${whereCondition}), 1) AS percentage " +
            "FROM api_metrics WHERE 1=1 ${whereCondition} " +
            "GROUP BY ${dimension} ORDER BY count DESC")
    List<Map<String, Object>> selectStatsByDimension(
            @Param("dimension") String dimension,
            @Param("whereCondition") String whereCondition);

    @Select("SELECT DATE(call_time) AS date, COUNT(*) AS count " +
            "FROM api_metrics WHERE 1=1 ${whereCondition} " +
            "GROUP BY DATE(call_time) ORDER BY date")
    List<Map<String, Object>> selectTrend(@Param("whereCondition") String whereCondition);

    @Select("SELECT COUNT(*) FROM api_metrics WHERE 1=1 ${whereCondition}")
    Long selectTotalCount(@Param("whereCondition") String whereCondition);
}
```

---

## Task 3: HelloWorld API

**Files:**
- Create: `library-backend/src/main/java/com/library/controller/HelloWorldController.java`

**Interfaces:**
- Consumes: `Result<T>` from Task 1
- Produces: `GET /api/helloworld?name={name}` → `Result<Map>` with `{message, timestamp}`

- [ ] **Step 1: Create HelloWorldController.java**

```java
package com.library.controller;

import com.library.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HelloWorldController {

    @GetMapping("/helloworld")
    public Result<Map<String, Object>> helloworld(
            @RequestParam(defaultValue = "World") String name) {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Hello, " + name + "!");
        data.put("timestamp", System.currentTimeMillis());
        return Result.ok(data);
    }
}
```

- [ ] **Step 2: Verify endpoint**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-55f890a2-938d-4b89-9cdf-2ce532bf2d34/worktree/library-backend-main && mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 4: Hash API

**Files:**
- Create: `library-backend/src/main/java/com/library/dto/HashRequest.java`
- Create: `library-backend/src/main/java/com/library/service/HashService.java`
- Create: `library-backend/src/main/java/com/library/controller/HashController.java`

**Interfaces:**
- Consumes: `Result<T>` from Task 1
- Produces: `POST /api/hash` (body: `{input, algorithm}`) → `Result<Map>` with `{hash, algorithm, input}`
- Produces: `HashService.compute(String input, String algorithm)` → String (hex hash)

- [ ] **Step 1: Create HashRequest.java**

```java
package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.Set;

@Data
public class HashRequest {
    @NotBlank(message = "input不能为空")
    private String input;
    private String algorithm = "SHA-256";

    private static final Set<String> SUPPORTED = Set.of("MD5", "SHA-1", "SHA-256", "SHA-512");

    public void validate() {
        if (!SUPPORTED.contains(algorithm)) {
            throw new IllegalArgumentException("不支持的算法: " + algorithm
                + "，可选: " + String.join(", ", SUPPORTED));
        }
    }
}
```

- [ ] **Step 2: Create HashService.java**

```java
package com.library.service;

import org.springframework.stereotype.Service;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class HashService {

    public String compute(String input, String algorithm) {
        String javaAlgo = algorithm.replace("-", "-");
        try {
            MessageDigest md = MessageDigest.getInstance(javaAlgo);
            byte[] digest = md.digest(input.getBytes());
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalArgumentException("不支持的算法: " + algorithm);
        }
    }
}
```

- [ ] **Step 3: Create HashController.java**

```java
package com.library.controller;

import com.library.common.Result;
import com.library.dto.HashRequest;
import com.library.service.HashService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HashController {

    private final HashService hashService;

    public HashController(HashService hashService) {
        this.hashService = hashService;
    }

    @PostMapping("/hash")
    public Result<Map<String, Object>> hash(@Valid @RequestBody HashRequest request) {
        request.validate();
        String hash = hashService.compute(request.getInput(), request.getAlgorithm());
        Map<String, Object> data = new HashMap<>();
        data.put("hash", hash);
        data.put("algorithm", request.getAlgorithm());
        data.put("input", request.getInput());
        return Result.ok(data);
    }
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-55f890a2-938d-4b89-9cdf-2ce532bf2d34/worktree/library-backend-main && mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 5: BubbleSort API

**Files:**
- Create: `library-backend/src/main/java/com/library/dto/BubbleSortRequest.java`
- Create: `library-backend/src/main/java/com/library/service/BubbleSortService.java`
- Create: `library-backend/src/main/java/com/library/controller/BubbleSortController.java`

**Interfaces:**
- Consumes: `Result<T>` from Task 1
- Produces: `POST /api/bubblesort` (body: `{array, order}`) → `Result<Map>` with `{sorted, steps, original}`
- Produces: `BubbleSortService.sort(int[] array, String order)` → `BubbleSortResult {sorted, steps}`

- [ ] **Step 1: Create BubbleSortRequest.java**

```java
package com.library.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.Set;

@Data
public class BubbleSortRequest {
    @NotNull(message = "array不能为空")
    @Size(min = 2, max = 1000, message = "数组长度需在2~1000之间")
    private int[] array;
    private String order = "asc";

    private static final Set<String> VALID_ORDERS = Set.of("asc", "desc");

    public void validate() {
        if (!VALID_ORDERS.contains(order)) {
            throw new IllegalArgumentException("排序方向仅支持 asc 或 desc");
        }
    }
}
```

- [ ] **Step 2: Create BubbleSortService.java**

```java
package com.library.service;

import org.springframework.stereotype.Service;
import java.util.Arrays;

@Service
public class BubbleSortService {

    public BubbleSortResult sort(int[] array, String order) {
        int[] sorted = Arrays.copyOf(array, array.length);
        int steps = 0;
        int n = sorted.length;
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - 1 - i; j++) {
                steps++;
                boolean shouldSwap = "asc".equals(order)
                        ? sorted[j] > sorted[j + 1]
                        : sorted[j] < sorted[j + 1];
                if (shouldSwap) {
                    int tmp = sorted[j];
                    sorted[j] = sorted[j + 1];
                    sorted[j + 1] = tmp;
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
        return new BubbleSortResult(sorted, steps);
    }

    public record BubbleSortResult(int[] sorted, int steps) {}
}
```

- [ ] **Step 3: Create BubbleSortController.java**

```java
package com.library.controller;

import com.library.common.Result;
import com.library.dto.BubbleSortRequest;
import com.library.service.BubbleSortService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BubbleSortController {

    private final BubbleSortService bubbleSortService;

    public BubbleSortController(BubbleSortService bubbleSortService) {
        this.bubbleSortService = bubbleSortService;
    }

    @PostMapping("/bubblesort")
    public Result<Map<String, Object>> bubbleSort(@Valid @RequestBody BubbleSortRequest request) {
        request.validate();
        BubbleSortService.BubbleSortResult result =
                bubbleSortService.sort(request.getArray(), request.getOrder());
        Map<String, Object> data = new HashMap<>();
        data.put("sorted", result.sorted());
        data.put("steps", result.steps());
        data.put("original", request.getArray());
        return Result.ok(data);
    }
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-55f890a2-938d-4b89-9cdf-2ce532bf2d34/worktree/library-backend-main && mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 6: Export API

**Files:**
- Create: `library-backend/src/main/java/com/library/dto/ExportRequest.java`
- Create: `library-backend/src/main/java/com/library/service/ExportService.java`
- Create: `library-backend/src/main/java/com/library/controller/ExportController.java`

**Interfaces:**
- Consumes: `Result<T>` from Task 1
- Produces: `POST /api/export` (body: `{type, data, format}`) → `application/octet-stream` file download
- Produces: `ExportService.export(String type, Map data, String format)` → `byte[]`

- [ ] **Step 1: Create ExportRequest.java**

```java
package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Map;
import java.util.Set;

@Data
public class ExportRequest {
    @NotBlank
    private String type;

    @NotNull
    private Map<String, Object> data;

    private String format = "csv";

    private static final Set<String> VALID_TYPES = Set.of("helloworld", "hash", "bubblesort");
    private static final Set<String> VALID_FORMATS = Set.of("csv", "xlsx");

    public void validate() {
        if (!VALID_TYPES.contains(type)) {
            throw new IllegalArgumentException("导出类型仅支持: " + String.join(", ", VALID_TYPES));
        }
        if (!VALID_FORMATS.contains(format)) {
            throw new IllegalArgumentException("导出格式仅支持 csv 或 xlsx");
        }
    }
}
```

- [ ] **Step 2: Create ExportService.java**

```java
package com.library.service;

import com.opencsv.CSVWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.util.Map;

@Service
public class ExportService {

    public byte[] export(String type, Map<String, Object> data, String format) {
        return "xlsx".equals(format) ? exportXlsx(type, data) : exportCsv(type, data);
    }

    private byte[] exportCsv(String type, Map<String, Object> data) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             CSVWriter writer = new CSVWriter(new OutputStreamWriter(bos))) {
            writer.writeNext(new String[]{"Key", "Value"});
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                String value = formatValue(entry.getValue());
                writer.writeNext(new String[]{entry.getKey(), value});
            }
            writer.flush();
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("CSV导出失败", e);
        }
    }

    private byte[] exportXlsx(String type, Map<String, Object> data) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(type);
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Key");
            header.createCell(1).setCellValue("Value");
            int rowIdx = 1;
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(entry.getKey());
                row.createCell(1).setCellValue(formatValue(entry.getValue()));
            }
            wb.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("XLSX导出失败", e);
        }
    }

    private String formatValue(Object value) {
        if (value == null) return "";
        if (value instanceof int[] arr) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(arr[i]);
            }
            return sb.append("]").toString();
        }
        return value.toString();
    }
}
```

- [ ] **Step 3: Create ExportController.java**

```java
package com.library.controller;

import com.library.dto.ExportRequest;
import com.library.service.ExportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> export(@Valid @RequestBody ExportRequest request) {
        request.validate();
        byte[] content = exportService.export(request.getType(), request.getData(), request.getFormat());
        String filename = request.getType() + "_result." + request.getFormat();
        MediaType mediaType = "xlsx".equals(request.getFormat())
                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                : MediaType.parseMediaType("text/csv");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(content);
    }
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-55f890a2-938d-4b89-9cdf-2ce532bf2d34/worktree/library-backend-main && mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 7: Metrics AOP Aspect

**Files:**
- Create: `library-backend/src/main/java/com/library/aspect/MetricsAspect.java`

**Interfaces:**
- Consumes: `ApiMetricsMapper` from Task 2
- Produces: AOP `@Around` on all `@GetMapping` / `@PostMapping` / `@RequestMapping` methods in `com.library.controller` package; extracts caller info from request headers, records duration, async writes to `api_metrics` table

- [ ] **Step 1: Create MetricsAspect.java**

```java
package com.library.aspect;

import com.library.entity.ApiMetrics;
import com.library.mapper.ApiMetricsMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.time.LocalDateTime;

@Aspect
@Component
public class MetricsAspect {

    private final ApiMetricsMapper apiMetricsMapper;

    public MetricsAspect(ApiMetricsMapper apiMetricsMapper) {
        this.apiMetricsMapper = apiMetricsMapper;
    }

    @Around("(@annotation(org.springframework.web.bind.annotation.GetMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.RequestMapping)) && " +
            "execution(* com.library.controller..*(..))")
    public Object recordMetrics(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        boolean success = true;
        try {
            return joinPoint.proceed();
        } catch (Throwable t) {
            success = false;
            throw t;
        } finally {
            long duration = System.currentTimeMillis() - start;
            saveMetrics(joinPoint, duration, success);
        }
    }

    @Async
    void saveMetrics(ProceedingJoinPoint joinPoint, long durationMs, boolean success) {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return;
            HttpServletRequest request = attrs.getRequest();

            ApiMetrics metrics = new ApiMetrics();
            metrics.setApiPath(request.getRequestURI());
            metrics.setCallerId(getHeader(request, "X-User-Id", "anonymous"));
            metrics.setCallerName(getHeader(request, "X-User-Name", "anonymous"));
            metrics.setCallerType(getHeader(request, "X-User-Type", "unknown"));
            metrics.setCallerLevel(getHeader(request, "X-User-Level", "unknown"));
            metrics.setCallerDept(getHeader(request, "X-User-Dept", "unknown"));
            metrics.setCallTime(LocalDateTime.now());
            metrics.setDurationMs((int) durationMs);
            metrics.setSuccess(success ? 1 : 0);

            apiMetricsMapper.insert(metrics);
        } catch (Exception ignored) {
            // 埋点失败不影响业务
        }
    }

    private String getHeader(HttpServletRequest request, String name, String defaultValue) {
        String value = request.getHeader(name);
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }
}
```

- [ ] **Step 2: Enable async in LibraryApplication.java**

Modify `LibraryApplication.java` — add `@EnableAsync`:

```java
package com.library;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@MapperScan("com.library.mapper")
@EnableAsync
public class LibraryApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-55f890a2-938d-4b89-9cdf-2ce532bf2d34/worktree/library-backend-main && mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 8: Metrics Query API

**Files:**
- Create: `library-backend/src/main/java/com/library/dto/MetricsQueryRequest.java`
- Create: `library-backend/src/main/java/com/library/service/MetricsService.java`
- Create: `library-backend/src/main/java/com/library/controller/MetricsController.java`

**Interfaces:**
- Consumes: `ApiMetricsMapper` from Task 2, `Result<T>` from Task 1
- Produces: `GET /api/metrics?dimension=&startDate=&endDate=&apiPath=` → `Result<Map>` with `{dimension, total, breakdown, trend}`

- [ ] **Step 1: Create MetricsService.java**

```java
package com.library.service;

import com.library.mapper.ApiMetricsMapper;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MetricsService {

    private static final Set<String> VALID_DIMENSIONS = Set.of("caller_type", "caller_level", "caller_dept");

    private final ApiMetricsMapper apiMetricsMapper;

    public MetricsService(ApiMetricsMapper apiMetricsMapper) {
        this.apiMetricsMapper = apiMetricsMapper;
    }

    public Map<String, Object> query(String dimension, String startDate, String endDate, String apiPath) {
        if (dimension == null || !VALID_DIMENSIONS.contains(dimension)) {
            dimension = "caller_type";
        }

        String whereCondition = buildWhere(startDate, endDate, apiPath);

        List<Map<String, Object>> breakdown = apiMetricsMapper.selectStatsByDimension(dimension, whereCondition);
        List<Map<String, Object>> trend = apiMetricsMapper.selectTrend(whereCondition);
        Long total = apiMetricsMapper.selectTotalCount(whereCondition);
        if (total == null) total = 0L;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dimension", dimension);
        result.put("total", total);
        result.put("breakdown", breakdown);
        result.put("trend", trend);
        return result;
    }

    private String buildWhere(String startDate, String endDate, String apiPath) {
        StringBuilder sb = new StringBuilder();
        if (startDate != null && !startDate.isEmpty()) {
            sb.append(" AND call_time >= '").append(startDate).append(" 00:00:00'");
        }
        if (endDate != null && !endDate.isEmpty()) {
            sb.append(" AND call_time <= '").append(endDate).append(" 23:59:59'");
        }
        if (apiPath != null && !apiPath.isEmpty()) {
            sb.append(" AND api_path = '").append(apiPath).append("'");
        }
        return sb.toString();
    }
}
```

- [ ] **Step 2: Create MetricsController.java**

```java
package com.library.controller;

import com.library.common.Result;
import com.library.service.MetricsService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/metrics")
    public Result<Map<String, Object>> metrics(
            @RequestParam(required = false) String dimension,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String apiPath) {
        Map<String, Object> data = metricsService.query(dimension, startDate, endDate, apiPath);
        return Result.ok(data);
    }
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-55f890a2-938d-4b89-9cdf-2ce532bf2d34/worktree/library-backend-main && mvn compile -q`
Expected: BUILD SUCCESS

---

## Task 9: Frontend Project Scaffolding

**Files:**
- Create: `library-frontend/package.json`
- Create: `library-frontend/tsconfig.json`
- Create: `library-frontend/vite.config.ts`
- Create: `library-frontend/index.html`
- Create: `library-frontend/src/main.tsx`
- Create: `library-frontend/src/App.tsx`
- Create: `library-frontend/src/api/client.ts`
- Create: `library-frontend/src/types/algorithm.ts`

**Interfaces:**
- Produces: Axios instance with `/api` base URL, request interceptor injecting `X-User-*` headers, response interceptor unwrapping `{code, data, message}`
- Produces: TypeScript types: `HelloWorldResult`, `HashResult`, `BubbleSortResult`, `MetricsData`, `BreakdownItem`, `TrendItem`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "library-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "antd": "^5.20.0",
    "axios": "^1.7.0",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

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
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>图书管理系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 6: Create src/App.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import AlgorithmToolsPage from './pages/AlgorithmTools';

function App() {
  return (
    <Routes>
      <Route path="/algorithm-tools" element={<AlgorithmToolsPage />} />
      <Route path="*" element={<Navigate to="/algorithm-tools" replace />} />
    </Routes>
  );
}

export default App;
```

- [ ] **Step 7: Create src/api/client.ts**

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = 'user-001';
  config.headers['X-User-Name'] = '测试用户';
  config.headers['X-User-Type'] = '内部员工';
  config.headers['X-User-Level'] = 'P5';
  config.headers['X-User-Dept'] = '技术部';
  return config;
});

client.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 200) {
      return Promise.reject(new Error(res.data?.message || '请求失败'));
    }
    return res.data.data;
  },
  (err) => Promise.reject(err)
);

export default client;
```

- [ ] **Step 8: Create src/types/algorithm.ts**

```typescript
export interface HelloWorldResult {
  message: string;
  timestamp: number;
}

export interface HashResult {
  hash: string;
  algorithm: string;
  input: string;
}

export interface BubbleSortResult {
  sorted: number[];
  steps: number;
  original: number[];
}

export interface BreakdownItem {
  label: string;
  count: number;
  percentage: number;
}

export interface TrendItem {
  date: string;
  count: number;
}

export interface MetricsData {
  dimension: string;
  total: number;
  breakdown: BreakdownItem[];
  trend: TrendItem[];
}

export interface ExportParams {
  type: 'helloworld' | 'hash' | 'bubblesort';
  data: Record<string, unknown>;
  format?: 'csv' | 'xlsx';
}
```

- [ ] **Step 9: Install dependencies**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-55f890a2-938d-4b89-9cdf-2ce532bf2d34/worktree/library-frontend-main && npm install`
Expected: dependencies installed without errors

---

## Task 10: Frontend API Modules

**Files:**
- Create: `library-frontend/src/api/helloworld.ts`
- Create: `library-frontend/src/api/hash.ts`
- Create: `library-frontend/src/api/bubblesort.ts`
- Create: `library-frontend/src/api/export.ts`
- Create: `library-frontend/src/api/metrics.ts`
- Create: `library-frontend/src/utils/download.ts`

**Interfaces:**
- Consumes: `client` from Task 9 (Axios instance), types from Task 9
- Produces: API functions — `getHelloWorld(name)`, `computeHash(input, algorithm)`, `bubbleSort(array, order)`, `exportData(params)`, `getMetrics(params)`

- [ ] **Step 1: Create src/api/helloworld.ts**

```typescript
import client from './client';
import type { HelloWorldResult } from '../types/algorithm';

export async function getHelloWorld(name?: string): Promise<HelloWorldResult> {
  return client.get('/helloworld', { params: { name } });
}
```

- [ ] **Step 2: Create src/api/hash.ts**

```typescript
import client from './client';
import type { HashResult } from '../types/algorithm';

export async function computeHash(input: string, algorithm?: string): Promise<HashResult> {
  return client.post('/hash', { input, algorithm });
}
```

- [ ] **Step 3: Create src/api/bubblesort.ts**

```typescript
import client from './client';
import type { BubbleSortResult } from '../types/algorithm';

export async function bubbleSort(array: number[], order?: string): Promise<BubbleSortResult> {
  return client.post('/bubblesort', { array, order });
}
```

- [ ] **Step 4: Create src/api/export.ts**

```typescript
import client from './client';
import type { ExportParams } from '../types/algorithm';

export async function exportData(params: ExportParams): Promise<Blob> {
  const resp = await client.post('/export', params, {
    responseType: 'blob',
  });
  return resp;
}
```

- [ ] **Step 5: Create src/api/metrics.ts**

```typescript
import client from './client';
import type { MetricsData } from '../types/algorithm';

export interface MetricsQueryParams {
  dimension?: string;
  startDate?: string;
  endDate?: string;
  apiPath?: string;
}

export async function getMetrics(params: MetricsQueryParams): Promise<MetricsData> {
  return client.get('/metrics', { params });
}
```

- [ ] **Step 6: Create src/utils/download.ts**

```typescript
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
```

---

## Task 11: AlgorithmTools Page — Layout & Tabs

**Files:**
- Create: `library-frontend/src/pages/AlgorithmTools/index.tsx`
- Create: `library-frontend/src/components/ResultDisplay.tsx`

**Interfaces:**
- Consumes: None (top-level page)
- Produces: Page layout with Tabs for HelloWorld / Hash / BubbleSort, plus MetricsDashboard below

- [ ] **Step 1: Create src/components/ResultDisplay.tsx**

```tsx
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface Props {
  data: Record<string, unknown> | null;
}

export default function ResultDisplay({ data }: Props) {
  if (!data) return null;

  return (
    <Card title="执行结果" size="small" style={{ marginTop: 16 }}>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
        <Text code>{JSON.stringify(data, null, 2)}</Text>
      </pre>
    </Card>
  );
}
```

- [ ] **Step 2: Create src/pages/AlgorithmTools/index.tsx**

```tsx
import { useState } from 'react';
import { Tabs, Typography } from 'antd';
import HelloWorldTab from './HelloWorldTab';
import HashTab from './HashTab';
import BubbleSortTab from './BubbleSortTab';
import MetricsDashboard from './MetricsDashboard';

const { Title } = Typography;

const tabItems = [
  { key: 'helloworld', label: 'HelloWorld', children: <HelloWorldTab /> },
  { key: 'hash', label: '哈希算法', children: <HashTab /> },
  { key: 'bubblesort', label: '冒泡排序', children: <BubbleSortTab /> },
];

export default function AlgorithmToolsPage() {
  const [activeTab, setActiveTab] = useState('helloworld');

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3}>算法工具与调用分析</Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      <MetricsDashboard />
    </div>
  );
}
```

---

## Task 12: HelloWorldTab Component

**Files:**
- Create: `library-frontend/src/pages/AlgorithmTools/HelloWorldTab.tsx`

**Interfaces:**
- Consumes: `getHelloWorld` from Task 10, `ResultDisplay` from Task 11, `exportData` from Task 10, `downloadBlob` from Task 10
- Produces: Input for name, Execute button, result display, Export button

- [ ] **Step 1: Create HelloWorldTab.tsx**

```tsx
import { useState } from 'react';
import { Input, Button, Space, message } from 'antd';
import { getHelloWorld } from '../../api/helloworld';
import { exportData } from '../../api/export';
import { downloadBlob } from '../../utils/download';
import ResultDisplay from '../../components/ResultDisplay';
import type { HelloWorldResult } from '../../types/algorithm';

export default function HelloWorldTab() {
  const [name, setName] = useState('');
  const [result, setResult] = useState<HelloWorldResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const data = await getHelloWorld(name || undefined);
      setResult(data);
    } catch (err: any) {
      message.error(err?.message || '执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!result) return;
    try {
      const blob = await exportData({
        type: 'helloworld',
        data: result as unknown as Record<string, unknown>,
        format,
      });
      downloadBlob(blob, `helloworld_result.${format}`);
      message.success('导出成功');
    } catch (err: any) {
      message.error(err?.message || '导出失败');
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="输入名称（默认 World）"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <Space>
          <Button type="primary" onClick={handleExecute} loading={loading}>
            执行
          </Button>
          <Button onClick={() => handleExport('csv')} disabled={!result}>
            导出 CSV
          </Button>
          <Button onClick={() => handleExport('xlsx')} disabled={!result}>
            导出 Excel
          </Button>
        </Space>
      </Space>
      <ResultDisplay data={result as unknown as Record<string, unknown> | null} />
    </div>
  );
}
```

---

## Task 13: HashTab Component

**Files:**
- Create: `library-frontend/src/pages/AlgorithmTools/HashTab.tsx`

**Interfaces:**
- Consumes: `computeHash` from Task 10, `ResultDisplay` from Task 11, `exportData` + `downloadBlob` from Task 10
- Produces: TextArea for input, Algorithm select, Execute button, result display, Export button

- [ ] **Step 1: Create HashTab.tsx**

```tsx
import { useState } from 'react';
import { Input, Select, Button, Space, message } from 'antd';
import { computeHash } from '../../api/hash';
import { exportData } from '../../api/export';
import { downloadBlob } from '../../utils/download';
import ResultDisplay from '../../components/ResultDisplay';
import type { HashResult } from '../../types/algorithm';

const ALGORITHMS = [
  { value: 'MD5', label: 'MD5' },
  { value: 'SHA-1', label: 'SHA-1' },
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-512', label: 'SHA-512' },
];

export default function HashTab() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA-256');
  const [result, setResult] = useState<HashResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!input.trim()) {
      message.warning('请输入待哈希字符串');
      return;
    }
    setLoading(true);
    try {
      const data = await computeHash(input, algorithm);
      setResult(data);
    } catch (err: any) {
      message.error(err?.message || '执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!result) return;
    try {
      const blob = await exportData({
        type: 'hash',
        data: result as unknown as Record<string, unknown>,
        format,
      });
      downloadBlob(blob, `hash_result.${format}`);
      message.success('导出成功');
    } catch (err: any) {
      message.error(err?.message || '导出失败');
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input.TextArea
          placeholder="输入待哈希字符串"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          style={{ maxWidth: 600 }}
        />
        <Select
          value={algorithm}
          onChange={setAlgorithm}
          options={ALGORITHMS}
          style={{ width: 200 }}
        />
        <Space>
          <Button type="primary" onClick={handleExecute} loading={loading}>
            执行
          </Button>
          <Button onClick={() => handleExport('csv')} disabled={!result}>
            导出 CSV
          </Button>
          <Button onClick={() => handleExport('xlsx')} disabled={!result}>
            导出 Excel
          </Button>
        </Space>
      </Space>
      <ResultDisplay data={result as unknown as Record<string, unknown> | null} />
    </div>
  );
}
```

---

## Task 14: BubbleSortTab Component

**Files:**
- Create: `library-frontend/src/pages/AlgorithmTools/BubbleSortTab.tsx`

**Interfaces:**
- Consumes: `bubbleSort` from Task 10, `ResultDisplay` from Task 11, `exportData` + `downloadBlob` from Task 10
- Produces: Input for comma-separated numbers, Order select, Execute button, result display, Export button

- [ ] **Step 1: Create BubbleSortTab.tsx**

```tsx
import { useState } from 'react';
import { Input, Select, Button, Space, message } from 'antd';
import { bubbleSort } from '../../api/bubblesort';
import { exportData } from '../../api/export';
import { downloadBlob } from '../../utils/download';
import ResultDisplay from '../../components/ResultDisplay';
import type { BubbleSortResult } from '../../types/algorithm';

const ORDERS = [
  { value: 'asc', label: '升序 (asc)' },
  { value: 'desc', label: '降序 (desc)' },
];

export default function BubbleSortTab() {
  const [arrayStr, setArrayStr] = useState('');
  const [order, setOrder] = useState('asc');
  const [result, setResult] = useState<BubbleSortResult | null>(null);
  const [loading, setLoading] = useState(false);

  const parseArray = (): number[] => {
    return arrayStr
      .split(/[,，\s]+/)
      .filter(Boolean)
      .map(Number);
  };

  const handleExecute = async () => {
    const arr = parseArray();
    if (arr.length < 2) {
      message.warning('请至少输入2个数字，以逗号分隔');
      return;
    }
    if (arr.length > 1000) {
      message.warning('数组长度不能超过1000');
      return;
    }
    if (arr.some(isNaN)) {
      message.warning('请确保输入均为有效数字');
      return;
    }
    setLoading(true);
    try {
      const data = await bubbleSort(arr, order);
      setResult(data);
    } catch (err: any) {
      message.error(err?.message || '执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!result) return;
    try {
      const blob = await exportData({
        type: 'bubblesort',
        data: {
          sorted: JSON.stringify(result.sorted),
          steps: String(result.steps),
          original: JSON.stringify(result.original),
        },
        format,
      });
      downloadBlob(blob, `bubblesort_result.${format}`);
      message.success('导出成功');
    } catch (err: any) {
      message.error(err?.message || '导出失败');
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="输入数字，以逗号分隔（如 5,3,8,1,2）"
          value={arrayStr}
          onChange={(e) => setArrayStr(e.target.value)}
          style={{ maxWidth: 500 }}
        />
        <Select
          value={order}
          onChange={setOrder}
          options={ORDERS}
          style={{ width: 200 }}
        />
        <Space>
          <Button type="primary" onClick={handleExecute} loading={loading}>
            执行
          </Button>
          <Button onClick={() => handleExport('csv')} disabled={!result}>
            导出 CSV
          </Button>
          <Button onClick={() => handleExport('xlsx')} disabled={!result}>
            导出 Excel
          </Button>
        </Space>
      </Space>
      <ResultDisplay data={result as unknown as Record<string, unknown> | null} />
    </div>
  );
}
```

---

## Task 15: MetricsDashboard Component

**Files:**
- Create: `library-frontend/src/pages/AlgorithmTools/MetricsDashboard.tsx`

**Interfaces:**
- Consumes: `getMetrics` from Task 10, `MetricsData` type from Task 9
- Produces: Dimension selector, chart type switch (line/pie/bar), date range picker, ECharts container rendering breakdown/trend data

- [ ] **Step 1: Create MetricsDashboard.tsx**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Card, Select, Radio, DatePicker, Space, Spin, Typography, Statistic, Row, Col } from 'antd';
import ReactECharts from 'echarts-for-react';
import { getMetrics } from '../../api/metrics';
import type { MetricsData } from '../../types/algorithm';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const DIMENSIONS = [
  { value: 'caller_type', label: '人员类型' },
  { value: 'caller_level', label: '人员层级' },
  { value: 'caller_dept', label: '人员部门' },
];

const CHART_TYPES = [
  { value: 'line', label: '折线图' },
  { value: 'pie', label: '饼图' },
  { value: 'bar', label: '柱状图' },
];

export default function MetricsDashboard() {
  const [dimension, setDimension] = useState('caller_type');
  const [chartType, setChartType] = useState('bar');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMetrics({
        dimension,
        startDate: dateRange?.[0],
        endDate: dateRange?.[1],
      });
      setData(result);
    } catch {
      // silently fail for dashboard
    } finally {
      setLoading(false);
    }
  }, [dimension, dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const getChartOption = () => {
    if (!data) return {};

    if (chartType === 'pie') {
      return {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: data.breakdown.map((item) => ({
            name: item.label,
            value: item.count,
          })),
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
          },
        }],
      };
    }

    const xData = data.trend.map((t) => t.date);
    const yData = data.trend.map((t) => t.count);
    const breakdownSeries = data.breakdown.map((item) => ({
      name: item.label,
      type: chartType,
      data: [item.count],
    }));

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: data.breakdown.map((b) => b.label) },
      xAxis: chartType === 'bar' ? { type: 'category', data: data.breakdown.map((b) => b.label) } : { type: 'category', data: xData },
      yAxis: { type: 'value' },
      series: chartType === 'bar'
        ? [{
            type: 'bar',
            data: data.breakdown.map((b) => ({
              name: b.label,
              value: b.count,
            })),
            label: { show: true, position: 'top' },
          }]
        : chartType === 'line'
          ? [{ type: 'line', data: yData, smooth: true, areaStyle: {} }]
          : breakdownSeries,
    };
  };

  return (
    <Card title="调用分析报表" style={{ marginTop: 24 }}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Text strong>统计维度：</Text>
        <Select
          value={dimension}
          onChange={setDimension}
          options={DIMENSIONS}
          style={{ width: 140 }}
        />
        <Text strong>图表类型：</Text>
        <Radio.Group
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          options={CHART_TYPES}
          optionType="button"
        />
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

      {data && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic title="总调用次数" value={data.total} />
          </Col>
        </Row>
      )}

      <Spin spinning={loading}>
        <ReactECharts option={getChartOption()} style={{ height: 400 }} />
      </Spin>
    </Card>
  );
}
```

---

## Self-Review

### 1. Spec Coverage

| Spec Section | Covered By |
|---|---|
| HelloWorld API (GET /api/helloworld) | Task 3 |
| Hash API (POST /api/hash) | Task 4 |
| BubbleSort API (POST /api/bubblesort) | Task 5 |
| Export API (POST /api/export) | Task 6 |
| Metrics AOP aspect | Task 7 |
| Metrics query API (GET /api/metrics) | Task 8 |
| Frontend routing & layout | Task 9 + Task 11 |
| Three tabs (HelloWorld/Hash/BubbleSort) | Task 12, 13, 14 |
| Export button per tab | Task 12, 13, 14 (integrated) |
| Visualization dashboard (line/pie/bar) | Task 15 |
| Dimension filter (type/level/dept) | Task 15 |
| Date range filter | Task 15 |
| Database api_metrics table | Task 2 |
| Error handling (400/500) | Task 1 (GlobalExceptionHandler) |
| Cross-repo alignment | All tasks match spec contracts |

### 2. Placeholder Scan

No TBD/TODO/missing implementations. All code is complete and ready to execute.

### 3. Type Consistency

- `Result<T>` defined in Task 1, consumed by all backend controllers
- `ApiMetrics` entity + `ApiMetricsMapper` defined in Task 2, consumed by Task 7 (aspect) and Task 8 (metrics service)
- TypeScript types defined in Task 9, consumed by all frontend API modules and components
- All API paths match between frontend (`client.ts` baseURL `/api`) and backend controllers (`@RequestMapping("/api")`)

---

## Execution Handoff

Plan complete and saved to `.agents/specs/20260814-分别写三个接口helloworld、哈希.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?