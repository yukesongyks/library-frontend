# 图书管理系统 — 演示接口、导出与调用埋点可视化 实施计划

> **阶段**: 实施计划 (Implementation Plan)
> **日期**: 2026-08-12
> **涉及仓库**: `library-frontend` (前端) · `library-backend` (后端)
> **设计基准**: `.agents/specs/library-demo-analytics-design.md`
> **方法论**: writing-plans skill — 基于 Spec 产出可执行的任务分解计划

---

## Goal

在 `library-backend` 和 `library-frontend` 两个 greenfield 仓库中，实现三个演示接口（HelloWorld/哈希/冒泡排序）、前端三 Tab 页面、Excel 导出功能、AOP 埋点统计、以及多维度多图表可视化报表，完成端到端联调验证。

## Architecture

后端采用 Spring Boot 3.x + Java 17 单体架构，通过 AOP 注解式埋点将调用记录写入 H2 数据库，统计查询通过 JOIN `call_log` 与 `person` 表实现多维度聚合。前端采用 React 18 + TypeScript + Vite 单页应用，ECharts 渲染折线/饼/柱状图，Axios 拦截器统一注入调用人 Header。前后端通过 `/api` 前缀的 RESTful 接口通信，Vite dev server 代理转发。

## Tech Stack

- **后端**: Spring Boot 3.x, Java 17, MyBatis-Plus, H2, Apache POI, Lombok, Spring AOP
- **前端**: React 18, TypeScript, Vite, Axios, ECharts (echarts-for-react)

---

## Task 1: 后端项目骨架与依赖配置 (library-backend)

**Files:**
- Create: `library-backend/pom.xml`
- Create: `library-backend/src/main/java/com/library/backend/LibraryBackendApplication.java`
- Create: `library-backend/src/main/resources/application.yml`

**Interfaces:**
- Consumes: 无（greenfield 起步）
- Produces: `LibraryBackendApplication` 主入口类，`pom.xml` 依赖声明

**Steps:**

- [ ] **Step 1: 创建 pom.xml**

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

- [ ] **Step 2: 创建主启动类**

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

- [ ] **Step 3: 创建 application.yml**

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

- [ ] **Step 4: 验证项目可编译**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 2: 后端统一响应体与全局异常处理 (library-backend)

**Files:**
- Create: `library-backend/src/main/java/com/library/backend/common/ApiResponse.java`
- Create: `library-backend/src/main/java/com/library/backend/common/GlobalExceptionHandler.java`

**Interfaces:**
- Consumes: 无
- Produces: `ApiResponse<T>` 类（字段: code/message/data/traceId），`GlobalExceptionHandler` 全局异常拦截

**Steps:**

- [ ] **Step 1: 创建 ApiResponse 统一响应体**

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

- [ ] **Step 2: 创建全局异常处理器**

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

- [ ] **Step 3: 验证编译**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 3: 后端数据库 Schema 与实体类 (library-backend)

**Files:**
- Create: `library-backend/src/main/resources/schema.sql`
- Create: `library-backend/src/main/java/com/library/backend/entity/CallLog.java`
- Create: `library-backend/src/main/java/com/library/backend/entity/Person.java`

**Interfaces:**
- Consumes: `application.yml` 中 `spring.sql.init.schema-locations` 配置
- Produces: `call_log` 表（id/api_name/caller_id/caller_name/call_time/call_result/result_snapshot/input_params/duration_ms），`person` 表（id/name/person_type/person_level/department），`CallLog` 实体类，`Person` 实体类

**Steps:**

- [ ] **Step 1: 创建 schema.sql 建表 + 种子数据**

```sql
CREATE TABLE IF NOT EXISTS call_log (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_name     VARCHAR(50)  NOT NULL,
    caller_id    VARCHAR(64)  NOT NULL,
    caller_name  VARCHAR(100) NOT NULL,
    call_time    DATETIME     NOT NULL,
    call_result  VARCHAR(20)  NOT NULL,
    result_snapshot TEXT,
    input_params TEXT,
    duration_ms  INT
);

CREATE TABLE IF NOT EXISTS person (
    id           VARCHAR(64)  PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    person_type  VARCHAR(30)  NOT NULL,
    person_level VARCHAR(30)  NOT NULL,
    department   VARCHAR(50)  NOT NULL
);

INSERT INTO person (id, name, person_type, person_level, department) VALUES
('u001', '张三', '正式员工', 'P7', '研发部'),
('u002', '李四', '正式员工', 'P6', '产品部'),
('u003', '王五', '实习生',   'P5', '测试部'),
('u004', '赵六', '外包',     'P6', '运维部'),
('u005', '钱七', '正式员工', 'P8', '研发部');
```

- [ ] **Step 2: 创建 CallLog 实体类**

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

- [ ] **Step 3: 创建 Person 实体类**

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

- [ ] **Step 4: 验证编译**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 4: 后端 Mapper 层 (library-backend)

**Files:**
- Create: `library-backend/src/main/java/com/library/backend/mapper/CallLogMapper.java`
- Create: `library-backend/src/main/java/com/library/backend/mapper/PersonMapper.java`

**Interfaces:**
- Consumes: `CallLog` 实体, `Person` 实体
- Produces: `CallLogMapper`（insert + 自定义统计查询），`PersonMapper`（基础 CRUD）

**Steps:**

- [ ] **Step 1: 创建 CallLogMapper**

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

- [ ] **Step 2: 创建 PersonMapper**

```java
package com.library.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.backend.entity.Person;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PersonMapper extends BaseMapper<Person> {
}
```

- [ ] **Step 3: 验证编译**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 5: 后端埋点注解与 AOP 切面 (library-backend)

**Files:**
- Create: `library-backend/src/main/java/com/library/backend/aspect/TrackCall.java`
- Create: `library-backend/src/main/java/com/library/backend/aspect/TrackCallAspect.java`

**Interfaces:**
- Consumes: `CallLogMapper.insert()`, `RequestContextHolder` 获取 HTTP Header
- Produces: `@TrackCall(apiName, description)` 注解，`TrackCallAspect` AOP 切面（Around 环绕通知，异步写入 call_log）

**Steps:**

- [ ] **Step 1: 创建 TrackCall 注解**

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

- [ ] **Step 2: 创建 TrackCallAspect 切面**

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

- [ ] **Step 3: 验证编译**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 6: 后端 DemoService 业务逻辑 (library-backend)

**Files:**
- Create: `library-backend/src/main/java/com/library/backend/service/DemoService.java`

**Interfaces:**
- Consumes: 无外部依赖
- Produces: `DemoService.helloWorld()` → `Map<String,String>`, `DemoService.hash(String input)` → `Map<String,String>`, `DemoService.bubbleSort(String numbers)` → `Map<String,Object>`

**Steps:**

- [ ] **Step 1: 创建 DemoService**

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

- [ ] **Step 2: 验证编译**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 7: 后端 ExportService 导出逻辑 (library-backend)

**Files:**
- Create: `library-backend/src/main/java/com/library/backend/service/ExportService.java`

**Interfaces:**
- Consumes: `CallLogMapper.findSnapshotsByApiName()` 获取历史结果快照
- Produces: `ExportService.exportTab(String tab, HttpServletResponse response)` — 生成 xlsx 文件流写入 response

**Steps:**

- [ ] **Step 1: 创建 ExportService**

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
            // 简化处理：按 Tab 解析 JSON 字段
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

- [ ] **Step 2: 验证编译**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 8: 后端 AnalyticsService 统计查询与 DTO (library-backend)

**Files:**
- Create: `library-backend/src/main/java/com/library/backend/dto/BarLineChartDTO.java`
- Create: `library-backend/src/main/java/com/library/backend/dto/PieChartDTO.java`
- Create: `library-backend/src/main/java/com/library/backend/service/AnalyticsService.java`

**Interfaces:**
- Consumes: `CallLogMapper.countByDimension()` 聚合查询结果
- Produces: `BarLineChartDTO`（dimension/chartType/categories/series），`PieChartDTO`（dimension/chartType/series），`AnalyticsService.getBarLineData()` / `AnalyticsService.getPieData()`

**Steps:**

- [ ] **Step 1: 创建 BarLineChartDTO**

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

- [ ] **Step 2: 创建 PieChartDTO**

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

- [ ] **Step 3: 创建 AnalyticsService**

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

        // 收集所有维度值（categories）和所有 apiName（series names）
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
                data.add(dataMap.getOrDefault(an, Collections.emptyMap()).getOrDefault(cat, 0));
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

        Map<String, Integer> totals = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String dimValue = (String) row.get("dimValue");
            int cnt = ((Number) row.get("cnt")).intValue();
            totals.merge(dimValue, cnt, Integer::sum);
        }

        PieChartDTO dto = new PieChartDTO();
        dto.setDimension(dimension);
        dto.setChartType("pie");
        List<PieChartDTO.PieSeries> seriesList = new ArrayList<>();
        for (Map.Entry<String, Integer> e : totals.entrySet()) {
            PieChartDTO.PieSeries ps = new PieChartDTO.PieSeries();
            ps.setName(e.getKey());
            ps.setValue(e.getValue());
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
            default -> throw new IllegalArgumentException("未知维度: " + dimension);
        };
    }

    private String[] resolveDateRange(String startDate, String endDate) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        if (endDate == null || endDate.isEmpty()) {
            endDate = LocalDate.now().format(fmt);
        }
        if (startDate == null || startDate.isEmpty()) {
            startDate = LocalDate.now().minusDays(7).format(fmt);
        }
        return new String[]{startDate + " 00:00:00", endDate + " 23:59:59"};
    }
}
```

- [ ] **Step 4: 验证编译**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 9: 后端 Controller 层与 CORS 配置 (library-backend)

**Files:**
- Create: `library-backend/src/main/java/com/library/backend/controller/DemoController.java`
- Create: `library-backend/src/main/java/com/library/backend/controller/AnalyticsController.java`
- Create: `library-backend/src/main/java/com/library/backend/config/WebConfig.java`

**Interfaces:**
- Consumes: `DemoService`, `ExportService`, `AnalyticsService`
- Produces: `GET /api/demo/helloworld`, `GET /api/demo/hash`, `GET /api/demo/bubblesort`, `GET /api/demo/export`, `GET /api/analytics/calls`, CORS 配置

**Steps:**

- [ ] **Step 1: 创建 DemoController**

```java
package com.library.backend.controller;

import com.library.backend.aspect.TrackCall;
import com.library.backend.common.ApiResponse;
import com.library.backend.service.DemoService;
import com.library.backend.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

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

- [ ] **Step 2: 创建 AnalyticsController**

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

- [ ] **Step 3: 创建 WebConfig (CORS)**

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
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

- [ ] **Step 4: 验证编译并启动**

Run: `cd library-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

---

## Task 10: 后端单元测试 (library-backend)

**Files:**
- Create: `library-backend/src/test/java/com/library/backend/DemoServiceTest.java`

**Interfaces:**
- Consumes: `DemoService`
- Produces: 单元测试覆盖三个 Service 方法

**Steps:**

- [ ] **Step 1: 创建 DemoServiceTest**

```java
package com.library.backend;

import com.library.backend.service.DemoService;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class DemoServiceTest {

    private final DemoService demoService = new DemoService();

    @Test
    void helloWorld_returnsGreeting() {
        Map<String, String> result = demoService.helloWorld();
        assertEquals("Hello, World!", result.get("result"));
    }

    @Test
    void hash_returnsSha256Hex() {
        Map<String, String> result = demoService.hash("abc");
        assertEquals("abc", result.get("input"));
        assertEquals("SHA-256", result.get("algorithm"));
        assertEquals(64, result.get("hashValue").length());
    }

    @Test
    void bubbleSort_sortsAndCountsSteps() {
        Map<String, Object> result = demoService.bubbleSort("5,3,8,1,9");
        assertEquals(java.util.List.of(1, 3, 5, 8, 9), result.get("sorted"));
        assertTrue((Integer) result.get("steps") > 0);
    }
}
```

- [ ] **Step 2: 运行测试**

Run: `cd library-backend && ./mvnw test -q`
Expected: Tests pass

---

## Task 11: 前端项目骨架与依赖配置 (library-frontend)

**Files:**
- Create: `library-frontend/package.json`
- Create: `library-frontend/vite.config.ts`
- Create: `library-frontend/tsconfig.json`
- Create: `library-frontend/index.html`
- Create: `library-frontend/src/main.tsx`
- Create: `library-frontend/src/App.tsx`

**Interfaces:**
- Consumes: 无（greenfield 起步）
- Produces: Vite + React 18 + TypeScript 项目骨架，`/demo` 路由入口

**Steps:**

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "library-frontend",
  "version": "0.0.1",
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

- [ ] **Step 2: 创建 vite.config.ts (含代理转发)**

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

- [ ] **Step 3: 创建 tsconfig.json**

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

- [ ] **Step 4: 创建 index.html + main.tsx + App.tsx**

```html
<!-- index.html -->
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
import DemoPage from './pages/DemoPage';

export default function App() {
  return <DemoPage />;
}
```

- [ ] **Step 5: 安装依赖并验证启动**

Run: `cd library-frontend && npm install && npm run dev`
Expected: Vite dev server 启动在 http://localhost:5173

---

## Task 12: 前端 API 类型定义与 Axios 拦截器 (library-frontend)

**Files:**
- Create: `library-frontend/src/api/types.ts`
- Create: `library-frontend/src/api/request.ts`

**Interfaces:**
- Consumes: 设计文档 §2.2.3 前端 API 调用层类型定义
- Produces: `ApiResponse<T>`, `HelloWorldResult`, `HashResult`, `BubbleSortResult`, `AnalyticsQuery`, `BarLineChartData`, `PieChartData` 类型；Axios 实例 + `X-User-Id`/`X-User-Name` Header 拦截器

**Steps:**

- [ ] **Step 1: 创建 types.ts 共享类型**

```typescript
// src/api/types.ts
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

- [ ] **Step 2: 创建 request.ts Axios 实例**

```typescript
// src/api/request.ts
import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  // 模拟登录态 — 实际项目从登录上下文获取
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

- [ ] **Step 3: 验证类型检查**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

---

## Task 13: 前端 API 调用函数 (library-frontend)

**Files:**
- Create: `library-frontend/src/api/demo.ts`
- Create: `library-frontend/src/api/analytics.ts`

**Interfaces:**
- Consumes: `request` Axios 实例, `types.ts` 类型定义
- Produces: `callHelloWorld()`, `callHash()`, `callBubbleSort()`, `exportTab()`, `getAnalytics()` 函数

**Steps:**

- [ ] **Step 1: 创建 demo.ts (演示 + 导出接口)**

```typescript
// src/api/demo.ts
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

- [ ] **Step 2: 创建 analytics.ts (埋点统计接口)**

```typescript
// src/api/analytics.ts
import request from './request';
import { ApiResponse, AnalyticsQuery, BarLineChartData, PieChartData } from './types';

export function getAnalytics(
  query: AnalyticsQuery
): Promise<ApiResponse<BarLineChartData | PieChartData>> {
  return request.get('/analytics/calls', { params: query }).then(res => res.data);
}
```

- [ ] **Step 3: 验证类型检查**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

---

## Task 14: 前端 Hooks 层 (library-frontend)

**Files:**
- Create: `library-frontend/src/hooks/useDemoApi.ts`
- Create: `library-frontend/src/hooks/useAnalytics.ts`

**Interfaces:**
- Consumes: `callHelloWorld()`, `callHash()`, `callBubbleSort()`, `getAnalytics()`
- Produces: `useHelloWorld()`, `useHash()`, `useBubbleSort()` Hooks（loading/data/error 状态管理），`useAnalytics(query)` Hook

**Steps:**

- [ ] **Step 1: 创建 useDemoApi.ts**

```typescript
// src/hooks/useDemoApi.ts
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

- [ ] **Step 2: 创建 useAnalytics.ts**

```typescript
// src/hooks/useAnalytics.ts
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

- [ ] **Step 3: 验证类型检查**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

---

## Task 15: 前端 Tab 组件与导出按钮 (library-frontend)

**Files:**
- Create: `library-frontend/src/components/tabs/HelloWorldTab.tsx`
- Create: `library-frontend/src/components/tabs/HashTab.tsx`
- Create: `library-frontend/src/components/tabs/BubbleSortTab.tsx`
- Create: `library-frontend/src/components/ExportButton.tsx`

**Interfaces:**
- Consumes: `useHelloWorld()`, `useHash()`, `useBubbleSort()` Hooks, `exportTab()` 函数
- Produces: 三个 Tab 内容组件（输入+执行+结果展示），`ExportButton` 组件（触发 xlsx 下载）

**Steps:**

- [ ] **Step 1: 创建 HelloWorldTab**

```tsx
// src/components/tabs/HelloWorldTab.tsx
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

- [ ] **Step 2: 创建 HashTab**

```tsx
// src/components/tabs/HashTab.tsx
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

- [ ] **Step 3: 创建 BubbleSortTab**

```tsx
// src/components/tabs/BubbleSortTab.tsx
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

- [ ] **Step 4: 创建 ExportButton**

```tsx
// src/components/ExportButton.tsx
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

- [ ] **Step 5: 验证类型检查**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

---

## Task 16: 前端 ECharts 图表组件 (library-frontend)

**Files:**
- Create: `library-frontend/src/components/charts/BarChart.tsx`
- Create: `library-frontend/src/components/charts/LineChart.tsx`
- Create: `library-frontend/src/components/charts/PieChart.tsx`
- Create: `library-frontend/src/components/AnalyticsPanel.tsx`

**Interfaces:**
- Consumes: `useAnalytics(query)` Hook, `BarLineChartData`, `PieChartData` 类型
- Produces: `BarChart`（柱状图），`LineChart`（折线图），`PieChart`（饼图），`AnalyticsPanel`（维度/图表/接口/日期选择器 + 图表渲染）

**Steps:**

- [ ] **Step 1: 创建 BarChart**

```tsx
// src/components/charts/BarChart.tsx
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

- [ ] **Step 2: 创建 LineChart**

```tsx
// src/components/charts/LineChart.tsx
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

- [ ] **Step 3: 创建 PieChart**

```tsx
// src/components/charts/PieChart.tsx
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

- [ ] **Step 4: 创建 AnalyticsPanel**

```tsx
// src/components/AnalyticsPanel.tsx
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

- [ ] **Step 5: 验证类型检查**

Run: `cd library-frontend && npx tsc --noEmit`
Expected: 无类型错误

---

## Task 17: 前端 DemoPage 主页面与样式 (library-frontend)

**Files:**
- Create: `library-frontend/src/pages/DemoPage.tsx`
- Create: `library-frontend/src/styles/DemoPage.css`

**Interfaces:**
- Consumes: `HelloWorldTab`, `HashTab`, `BubbleSortTab`, `ExportButton`, `AnalyticsPanel` 组件
- Produces: `DemoPage` 主页面（三 Tab 切换 + 导出按钮 + 报表面板），页面样式

**Steps:**

- [ ] **Step 1: 创建 DemoPage.tsx**

```tsx
// src/pages/DemoPage.tsx
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

- [ ] **Step 2: 创建 DemoPage.css**

```css
/* src/styles/DemoPage.css */
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

- [ ] **Step 3: 验证类型检查与构建**

Run: `cd library-frontend && npx tsc --noEmit && npm run build`
Expected: 构建成功，无类型错误

---

## Task 18: 端到端联调验证 (library-backend + library-frontend)

**Files:**
- 无新增文件（验证任务）

**Interfaces:**
- Consumes: 全部已实现的前后端代码
- Produces: 端到端联调验证报告

**Steps:**

- [ ] **Step 1: 启动后端服务**

Run: `cd library-backend && ./mvnw spring-boot:run`
Expected: 应用启动在 8080 端口，H2 控制台可访问 `/h2-console`

- [ ] **Step 2: 启动前端 dev server**

Run: `cd library-frontend && npm run dev`
Expected: Vite dev server 启动在 http://localhost:5173

- [ ] **Step 3: 验证三个演示接口**

手动测试：
1. 打开 http://localhost:5173/demo
2. HelloWorld Tab → 点击执行 → 显示 "Hello, World!"
3. 哈希算法 Tab → 输入 "abc" → 点击执行 → 显示 SHA-256 哈希值
4. 冒泡排序 Tab → 输入 "5,3,8,1,9" → 点击执行 → 显示排序结果 [1,3,5,8,9] 和步数

Expected: 三个 Tab 均正常展示结果

- [ ] **Step 4: 验证导出功能**

手动测试：
1. 切换到任意 Tab
2. 点击"导出当前Tab"按钮
3. 浏览器下载 `demo_<tab>_<timestamp>.xlsx` 文件
4. 打开 xlsx 文件验证内容

Expected: 成功下载并打开 xlsx 文件，内容与接口结果一致

- [ ] **Step 5: 验证埋点统计**

手动测试：
1. 多次调用三个演示接口（使用不同 X-User-Id 模拟不同用户）
2. 查看报表区域，切换维度（人员类型/层级/部门）和图表类型（柱状/折线/饼图）
3. 检查 H2 控制台 `call_log` 表是否有记录

Expected: 报表正确展示调用统计，`call_log` 表有对应记录

- [ ] **Step 6: 验证埋点数据完整性**

Run: 访问 http://localhost:8080/h2-console，查询 `SELECT * FROM call_log`
Expected: 每次接口调用都有对应记录，`caller_id`/`caller_name`/`api_name`/`result_snapshot` 字段完整

---

## 跨库接口契约对齐矩阵

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

---

## 向后兼容性声明

> **契约优先原则**：所有跨库接口变更始终向后兼容。

- 演示接口：新增接口，无历史版本，天然兼容。
- 导出接口：新增接口，无历史版本，天然兼容。
- 埋点统计接口：新增接口，无历史版本，天然兼容。
- 统一响应体 `ApiResponse<T>`：后续如需扩展，仅新增字段（如 `timestamp`），不修改/删除现有字段。

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 埋点 AOP 异步写入高并发数据库压力 | 当前同步写入（MVP），后续可引入 `@Async` + 消息队列削峰 |
| `result_snapshot` TEXT 类型大响应体占用存储 | 可设置截断阈值（如 4KB） |
| 前端图表空数据状态 | `AnalyticsPanel` 已处理 `empty-state` 友好提示 |
| 跨库联调环境依赖 | Vite proxy 代理 `/api` 到 8080，CORS 配置允许 5173 |

---

## 任务依赖图

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

---

## 汇总

### 代码变更清单

| 仓库 | 变更类型 | 文件数 | 说明 |
|------|----------|--------|------|
| `library-backend` | 新增 | ~16 文件 | pom.xml + Application + config + common + controller + service + aspect + entity + mapper + dto + schema.sql + test |
| `library-frontend` | 新增 | ~18 文件 | package.json + vite.config + tsconfig + index.html + main.tsx + App.tsx + api(4) + pages(1) + components(7) + hooks(2) + styles(1) |

### 跨仓对齐点检查结论

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

---

*本实施计划由 writing-plans skill 方法论指导产出，基于 `library-demo-analytics-design.md` 设计规格，作为后续开发阶段的执行基准。*
