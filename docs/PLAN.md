# 跨仓实施计划：算法演示 + 埋点 + 导出 + 可视化报表

> Plan ID: cross-repo-algo-report
> Phase: plan
> Skill: writing-plans
> Date: 2026-08-07

## Goal

分别在后端实现三个算法接口（helloworld、哈希算法、冒泡排序），前端新增页面以三 Tab 展示执行结果；后端提供导出接口支持导出各页面结果；后端做调用埋点（调用次数 + 调用人），前端在当前页面可视化报表（折线图/饼图/柱状图，维度=人员类型/层级/部门）。

## Scope

- **library-backend**：Spring Boot 3.2 + Java 17 + Maven；新增 3 算法接口、导出接口、埋点统计接口、H2 文件存储、Mock 人员数据。
- **library-frontend**：React 18 + Vite + TypeScript + Ant Design 5 + Apache ECharts；新增页面含 3 Tab + 导出按钮 + 报表区。

## Global Constraints

- Java 17、Spring Boot 3.2.x、Maven 3.9+
- Node 18+、pnpm 包管理
- 后端默认端口 8080，前端 dev 端口 5173
- 前端 dev 代理 `/api` → `http://localhost:8080`
- 人员数据字段：`userType`(STUDENT/TEACHER/ADMIN)、`userLevel`(L1/L2/L3)、`department`(研发部/产品部/运营部)
- 埋点表 `call_log`：id, api_name, caller_id, caller_name, user_type, user_level, department, called_at
- 所有接口统一前缀 `/api`
- H2 文件路径：`./data/librarydb`（嵌入式，重启不丢失）

## Task 1 — 后端：项目脚手架 + H2 + Mock 数据

### 1.1 创建 Maven 项目结构

**File: `library-backend/pom.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
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
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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
            </plugin>
        </plugins>
    </build>
</project>
```

### 1.2 主启动类

**File: `library-backend/src/main/java/com/library/LibraryBackendApplication.java`**

```java
package com.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

### 1.3 应用配置

**File: `library-backend/src/main/resources/application.yml`**

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:h2:file:./data/librarydb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

### 1.4 Mock 人员种子数据

**File: `library-backend/src/main/resources/data.sql`**

```sql
INSERT INTO app_user (id, user_id, user_name, user_type, user_level, department) VALUES
  (1, 'U001', '张三', 'STUDENT', 'L1', '研发部'),
  (2, 'U002', '李四', 'TEACHER', 'L2', '产品部'),
  (3, 'U003', '王五', 'ADMIN',   'L3', '运营部'),
  (4, 'U004', '赵六', 'STUDENT', 'L2', '研发部'),
  (5, 'U005', '钱七', 'TEACHER', 'L1', '运营部')
ON CONFLICT (id) DO NOTHING;
```

### 1.5 验证

```bash
cd library-backend
mvn clean compile
```

**Expected**: BUILD SUCCESS，无编译错误。

## Task 2 — 后端：人员实体 + 埋点实体 + Repository

### 2.1 人员实体

**File: `library-backend/src/main/java/com/library/entity/AppUser.java`**

```java
package com.library.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "app_user")
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userId;
    private String userName;
    private String userType;
    private String userLevel;
    private String department;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
    public String getUserLevel() { return userLevel; }
    public void setUserLevel(String userLevel) { this.userLevel = userLevel; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
```

### 2.2 埋点实体

**File: `library-backend/src/main/java/com/library/entity/CallLog.java`**

```java
package com.library.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_log")
public class CallLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String apiName;
    private String callerId;
    private String callerName;
    private String userType;
    private String userLevel;
    private String department;
    private LocalDateTime calledAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getApiName() { return apiName; }
    public void setApiName(String apiName) { this.apiName = apiName; }
    public String getCallerId() { return callerId; }
    public void setCallerId(String callerId) { this.callerId = callerId; }
    public String getCallerName() { return callerName; }
    public void setCallerName(String callerName) { this.callerName = callerName; }
    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
    public String getUserLevel() { return userLevel; }
    public void setUserLevel(String userLevel) { this.userLevel = userLevel; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public LocalDateTime getCalledAt() { return calledAt; }
    public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }
}
```

### 2.3 Repository

**File: `library-backend/src/main/java/com/library/repository/AppUserRepository.java`**

```java
package com.library.repository;

import com.library.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUserId(String userId);
}
```

**File: `library-backend/src/main/java/com/library/repository/CallLogRepository.java`**

```java
package com.library.repository;

import com.library.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CallLogRepository extends JpaRepository<CallLog, Long> {
}
```

### 2.4 验证

```bash
cd library-backend
mvn clean compile
```

**Expected**: BUILD SUCCESS。

## Task 3 — 后端：三个算法接口 + 埋点切面

### 3.1 响应 DTO

**File: `library-backend/src/main/java/com/library/dto/AlgoResult.java`**

```java
package com.library.dto;

import java.util.List;

public record AlgoResult(
    String apiName,
    Object input,
    Object output,
    long durationMs
) {}
```

### 3.2 算法 Controller

**File: `library-backend/src/main/java/com/library/controller/AlgoController.java`**

```java
package com.library.controller;

import com.library.dto.AlgoResult;
import com.library.service.AlgoService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/algo")
public class AlgoController {
    private final AlgoService algoService;

    public AlgoController(AlgoService algoService) {
        this.algoService = algoService;
    }

    @GetMapping("/helloworld")
    public AlgoResult helloworld() {
        return algoService.helloworld();
    }

    @GetMapping("/hash")
    public AlgoResult hash(@RequestParam(defaultValue = "hello") String input) {
        return algoService.hash(input);
    }

    @GetMapping("/bubblesort")
    public AlgoResult bubblesort(@RequestParam(defaultValue = "5,3,8,1,9,2,7") String input) {
        return algoService.bubblesort(input);
    }
}
```

### 3.3 算法 Service

**File: `library-backend/src/main/java/com/library/service/AlgoService.java`**

```java
package com.library.service;

import com.library.dto.AlgoResult;
import org.springframework.stereotype.Service;
import java.security.MessageDigest;
import java.util.*;

@Service
public class AlgoService {

    public AlgoResult helloworld() {
        long start = System.currentTimeMillis();
        String output = "Hello, World!";
        long duration = System.currentTimeMillis() - start;
        return new AlgoResult("helloworld", null, output, duration);
    }

    public AlgoResult hash(String input) {
        long start = System.currentTimeMillis();
        String output = sha256(input);
        long duration = System.currentTimeMillis() - start;
        return new AlgoResult("hash", input, output, duration);
    }

    public AlgoResult bubblesort(String input) {
        long start = System.currentTimeMillis();
        List<Integer> arr = parseInput(input);
        List<Integer> sorted = bubbleSort(arr);
        long duration = System.currentTimeMillis() - start;
        return new AlgoResult("bubblesort", arr, sorted, duration);
    }

    private String sha256(String base) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(base.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private List<Integer> parseInput(String input) {
        String[] parts = input.split(",");
        List<Integer> arr = new ArrayList<>();
        for (String p : parts) {
            arr.add(Integer.parseInt(p.trim()));
        }
        return arr;
    }

    private List<Integer> bubbleSort(List<Integer> arr) {
        List<Integer> a = new ArrayList<>(arr);
        int n = a.size();
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - 1 - i; j++) {
                if (a.get(j) > a.get(j + 1)) {
                    int tmp = a.get(j);
                    a.set(j, a.get(j + 1));
                    a.set(j + 1, tmp);
                }
            }
        }
        return a;
    }
}
```

### 3.4 埋点切面

**File: `library-backend/src/main/java/com/library/aspect/CallLogAspect.java`**

```java
package com.library.aspect;

import com.library.entity.AppUser;
import com.library.entity.CallLog;
import com.library.repository.AppUserRepository;
import com.library.repository.CallLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Aspect
@Component
public class CallLogAspect {
    private final CallLogRepository callLogRepository;
    private final AppUserRepository appUserRepository;

    public CallLogAspect(CallLogRepository callLogRepository,
                         AppUserRepository appUserRepository) {
        this.callLogRepository = callLogRepository;
        this.appUserRepository = appUserRepository;
    }

    @Around("execution(* com.library.controller..*.*(..))")
    public Object logCall(ProceedingJoinPoint pjp) throws Throwable {
        Object result = pjp.proceed();
        try {
            String apiName = pjp.getSignature().toShortString();
            String callerId = resolveCallerId();
            AppUser user = appUserRepository.findByUserId(callerId).orElse(null);

            CallLog log = new CallLog();
            log.setApiName(apiName);
            log.setCallerId(callerId);
            log.setCallerName(user != null ? user.getUserName() : "匿名");
            log.setUserType(user != null ? user.getUserType() : "UNKNOWN");
            log.setUserLevel(user != null ? user.getUserLevel() : "UNKNOWN");
            log.setDepartment(user != null ? user.getDepartment() : "UNKNOWN");
            log.setCalledAt(LocalDateTime.now());
            callLogRepository.save(log);
        } catch (Exception ignored) {
        }
        return result;
    }

    private String resolveCallerId() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            HttpServletRequest req = sra.getRequest();
            String uid = req.getHeader("X-User-Id");
            return uid != null ? uid : "U001";
        }
        return "U001";
    }
}
```

> 说明：调用方通过请求头 `X-User-Id` 传人员 ID（U001~U005）；缺省回退 U001，便于开发联调。

### 3.5 验证

```bash
cd library-backend
mvn clean compile
```

**Expected**: BUILD SUCCESS。

## Task 4 — 后端：导出接口

### 4.1 导出 Controller

**File: `library-backend/src/main/java/com/library/controller/ExportController.java`**

```java
package com.library.controller;

import com.library.dto.AlgoResult;
import com.library.service.AlgoService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {
    private final AlgoService algoService;

    public ExportController(AlgoService algoService) {
        this.algoService = algoService;
    }

    @GetMapping("/{apiName}")
    public void export(@PathVariable String apiName,
                       @RequestParam(defaultValue = "hello") String input,
                       @RequestParam(defaultValue = "5,3,8,1,9,2,7") String sortInput,
                       HttpServletResponse response) throws Exception {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition",
            "attachment; filename=\"" + apiName + ".csv\"");
        PrintWriter writer = response.getWriter();
        switch (apiName) {
            case "helloworld" -> {
                AlgoResult r = algoService.helloworld();
                writer.println("apiName,input,output,durationMs");
                writer.println(r.apiName() + "," + r.input() + "," + r.output() + "," + r.durationMs());
            }
            case "hash" -> {
                AlgoResult r = algoService.hash(input);
                writer.println("apiName,input,output,durationMs");
                writer.println(r.apiName() + "," + r.input() + "," + r.output() + "," + r.durationMs());
            }
            case "bubblesort" -> {
                AlgoResult r = algoService.bubblesort(sortInput);
                writer.println("apiName,input,output,durationMs");
                writer.println(r.apiName() + ",\"" + r.input() + "\",\"" + r.output() + "\"," + r.durationMs());
            }
            default -> {
                response.setStatus(404);
                writer.println("error,unknown api: " + apiName);
            }
        }
        writer.flush();
    }
}
```

### 4.2 验证

```bash
cd library-backend
mvn clean compile
```

**Expected**: BUILD SUCCESS。

## Task 5 — 后端：埋点统计接口

### 5.1 统计 DTO

**File: `library-backend/src/main/java/com/library/dto/CallStatRow.java`**

```java
package com.library.dto;

public record CallStatRow(
    String dimension,
    String value,
    long count
) {}
```

### 5.2 统计 Controller

**File: `library-backend/src/main/java/com/library/controller/CallLogController.java`**

```java
package com.library.controller;

import com.library.dto.CallStatRow;
import com.library.repository.CallLogRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;

@RestController
@RequestMapping("/api/stats")
public class CallLogController {
    @Autowired
    private CallLogRepository callLogRepository;

    @GetMapping
    public Map<String, List<CallStatRow>> stats() {
        List<Object[]> rows = callLogRepository.findAllByDimensions();
        List<CallStatRow> flat = new ArrayList<>();
        for (Object[] r : rows) {
            flat.add(new CallStatRow(
                (String) r[0], (String) r[1], ((Number) r[2]).longValue()
            ));
        }
        Map<String, List<CallStatRow>> grouped = new LinkedHashMap<>();
        grouped.put("userType", new ArrayList<>());
        grouped.put("userLevel", new ArrayList<>());
        grouped.put("department", new ArrayList<>());
        for (CallStatRow row : flat) {
            grouped.get(row.dimension()).add(row);
        }
        return grouped;
    }
}
```

### 5.3 自定义聚合查询

**File: `library-backend/src/main/java/com/library/repository/CallLogRepository.java`** (修改)

```java
package com.library.repository;

import com.library.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CallLogRepository extends JpaRepository<CallLog, Long> {

    @Query("""
        SELECT 'userType', c.userType, COUNT(c)
        FROM CallLog c GROUP BY c.userType
        UNION ALL
        SELECT 'userLevel', c.userLevel, COUNT(c)
        FROM CallLog c GROUP BY c.userLevel
        UNION ALL
        SELECT 'department', c.department, COUNT(c)
        FROM CallLog c GROUP BY c.department
        """)
    List<Object[]> findAllByDimensions();
}
```

### 5.4 验证

```bash
cd library-backend
mvn clean compile
```

**Expected**: BUILD SUCCESS。

## Task 6 — 后端：启动测试 + 接口冒烟测试

### 6.1 Spring Boot 测试

**File: `library-backend/src/test/java/com/library/AlgoApiTest.java`**

```java
package com.library;

import com.library.LibraryBackendApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.client.AutoConfigureMockRestServiceServer;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AlgoApiTest {
    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    void helloworld() {
        ResponseEntity<String> resp = restTemplate.getForEntity(url("/api/algo/helloworld"), String.class);
        assertTrue(resp.getStatusCode().is2xxSuccessful());
        assertTrue(resp.getBody().contains("Hello"));
    }

    @Test
    void hash() {
        ResponseEntity<String> resp = restTemplate.getForEntity(url("/api/algo/hash?input=test"), String.class);
        assertTrue(resp.getStatusCode().is2xxSuccessful());
        assertTrue(resp.getBody().contains("hash"));
    }

    @Test
    void bubblesort() {
        ResponseEntity<String> resp = restTemplate.getForEntity(url("/api/algo/bubblesort?input=5,3,8,1"), String.class);
        assertTrue(resp.getStatusCode().is2xxSuccessful());
        assertTrue(resp.getBody().contains("bubblesort"));
    }

    @Test
    void stats() {
        restTemplate.getForEntity(url("/api/algo/helloworld"), String.class);
        ResponseEntity<String> resp = restTemplate.getForEntity(url("/api/stats"), String.class);
        assertTrue(resp.getStatusCode().is2xxSuccessful());
        assertTrue(resp.getBody().contains("userType"));
    }
}
```

### 6.2 运行测试

```bash
cd library-backend
mvn clean test
```

**Expected**: BUILD SUCCESS，4 个测试全部通过。

---

## Task 7 — 前端：项目脚手架

### 7.1 创建 Vite + React + TS 项目

**Command** (在 `library-frontend` 根目录执行)

```bash
cd library-frontend
pnpm create vite@latest . --template react-ts
pnpm install
pnpm add antd echarts axios
```

> 注：`pnpm create vite .` 在已有 README 目录执行时，选 "Ignore files and continue" 覆盖脚手架。

### 7.2 dev 代理配置

**File: `library-frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
})
```

### 7.3 验证

```bash
cd library-frontend
pnpm install
pnpm run dev
```

**Expected**: Vite dev server 启动，访问 http://localhost:5173 显示默认页。

## Task 8 — 前端：API 客户端 + 类型定义

### 8.1 类型定义

**File: `library-frontend/src/types/index.ts`**

```typescript
export interface AlgoResult {
  apiName: string
  input: number[] | string | null
  output: string | number[]
  durationMs: number
}

export interface CallStatRow {
  dimension: 'userType' | 'userLevel' | 'department'
  value: string
  count: number
}

export type CallStats = Record<string, CallStatRow[]>
```

### 8.2 API 客户端

**File: `library-frontend/src/api/index.ts`**

```typescript
import axios from 'axios'
import type { AlgoResult, CallStats } from '../types'

const client = axios.create({ baseURL: '/api' })
client.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = 'U001'
  return config
})

export async function callHello(): Promise<AlgoResult> {
  const { data } = await client.get('/algo/helloworld')
  return data
}

export async function callHash(input: string): Promise<AlgoResult> {
  const { data } = await client.get('/algo/hash', { params: { input } })
  return data
}

export async function callBubble(input: string): Promise<AlgoResult> {
  const { data } = await client.get('/algo/bubblesort', { params: { input } })
  return data
}

export async function fetchStats(): Promise<CallStats> {
  const { data } = await client.get('/stats')
  return data
}

export function exportUrl(apiName: string): string {
  return `/api/export/${apiName}`
}
```

### 8.3 验证

```bash
cd library-frontend
pnpm run build
```

**Expected**: 编译通过，无 TS 错误。

## Task 9 — 前端：三 Tab 执行展示组件

### 9.1 HelloWorld Tab

**File: `library-frontend/src/components/HelloWorldTab.tsx`**

```tsx
import { useState } from 'react'
import { Button, Card, Typography, message, Space } from 'antd'
import { callHello, exportUrl } from '../api'
import type { AlgoResult } from '../types'

const { Text } = Typography

export default function HelloWorldTab() {
  const [result, setResult] = useState<AlgoResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    try {
      setResult(await callHello())
    } catch {
      message.error('调用失败')
    } finally {
      setLoading(false)
    }
  }

  function doExport() {
    window.open(exportUrl('helloworld'), '_blank')
  }

  return (
    <Card title="HelloWorld 算法">
      <Space>
        <Button type="primary" loading={loading} onClick={run}>执行</Button>
        <Button onClick={doExport} disabled={!result}>导出 CSV</Button>
      </Space>
      {result && (
        <div style={{ marginTop: 16 }}>
          <Text>输出：{String(result.output)}</Text><br />
          <Text>耗时：{result.durationMs} ms</Text>
        </div>
      )}
    </Card>
  )
}
```

### 9.2 Hash Tab

**File: `library-frontend/src/components/HashTab.tsx`**

```tsx
import { useState } from 'react'
import { Button, Card, Input, Typography, message, Space } from 'antd'
import { callHash, exportUrl } from '../api'
import type { AlgoResult } from '../types'

const { Text } = Typography

export default function HashTab() {
  const [input, setInput] = useState('hello')
  const [result, setResult] = useState<AlgoResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    try {
      setResult(await callHash(input))
    } catch {
      message.error('调用失败')
    } finally {
      setLoading(false)
    }
  }

  function doExport() {
    window.open(`${exportUrl('hash')}?input=${encodeURIComponent(input)}`, '_blank')
  }

  return (
    <Card title="哈希算法 (SHA-256)">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入待哈希字符串" />
        <Space>
          <Button type="primary" loading={loading} onClick={run}>执行</Button>
          <Button onClick={doExport} disabled={!result}>导出 CSV</Button>
        </Space>
      </Space>
      {result && (
        <div style={{ marginTop: 16 }}>
          <Text>输入：{String(result.input)}</Text><br />
          <Text>输出(SHA-256)：{String(result.output)}</Text><br />
          <Text>耗时：{result.durationMs} ms</Text>
        </div>
      )}
    </Card>
  )
}
```

### 9.3 BubbleSort Tab

**File: `library-frontend/src/components/BubbleSortTab.tsx`**

```tsx
import { useState } from 'react'
import { Button, Card, Input, Typography, message, Space } from 'antd'
import { callBubble, exportUrl } from '../api'
import type { AlgoResult } from '../types'

const { Text } = Typography

export default function BubbleSortTab() {
  const [input, setInput] = useState('5,3,8,1,9,2,7')
  const [result, setResult] = useState<AlgoResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    try {
      setResult(await callBubble(input))
    } catch {
      message.error('调用失败')
    } finally {
      setLoading(false)
    }
  }

  function doExport() {
    window.open(`${exportUrl('bubblesort')}?sortInput=${encodeURIComponent(input)}`, '_blank')
  }

  return (
    <Card title="冒泡排序">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入逗号分隔的数字" />
        <Space>
          <Button type="primary" loading={loading} onClick={run}>执行</Button>
          <Button onClick={doExport} disabled={!result}>导出 CSV</Button>
        </Space>
      </Space>
      {result && (
        <div style={{ marginTop: 16 }}>
          <Text>输入：{String(result.input)}</Text><br />
          <Text>输出：{String(result.output)}</Text><br />
          <Text>耗时：{result.durationMs} ms</Text>
        </div>
      )}
    </Card>
  )
}
```

### 9.4 验证

```bash
cd library-frontend
pnpm run build
```

**Expected**: 编译通过，无 TS 错误。

## Task 10 — 前端：可视化报表组件

### 10.1 报表组件

**File: `library-frontend/src/components/CallReport.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Card, Spin, Segmented } from 'antd'
import * as echarts from 'echarts'
import { fetchStats } from '../api'
import type { CallStats } from '../types'

const DIM_LABELS: Record<string, string> = {
  userType: '人员类型',
  userLevel: '人员层级',
  department: '部门',
}

const CHART_LABELS: Record<string, string> = {
  line: '折线图',
  pie: '饼图',
  bar: '柱状图',
}

export default function CallReport() {
  const [stats, setStats] = useState<CallStats | null>(null)
  const [dim, setDim] = useState<string>('userType')
  const [chartType, setChartType] = useState<string>('bar')
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    fetchStats().then(setStats)
  }, [])

  useEffect(() => {
    if (!chartRef.current || !stats) return
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }
    const rows = stats[dim] || []
    const names = rows.map((r) => r.value)
    const counts = rows.map((r) => r.count)

    let option: echarts.EChartsOption
    if (chartType === 'pie') {
      option = {
        title: { text: `${DIM_LABELS[dim]} - 调用次数占比`, left: 'center' },
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            radius: '60%',
            data: rows.map((r) => ({ name: r.value, value: r.count })),
          },
        ],
      }
    } else {
      option = {
        title: { text: `${DIM_LABELS[dim]} - 调用次数`, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: names },
        yAxis: { type: 'value' },
        series: [
          {
            type: chartType === 'line' ? 'line' : 'bar',
            data: counts,
          },
        ],
      }
    }
    chartInstance.current.setOption(option, true)
  }, [stats, dim, chartType])

  return (
    <Card title="调用情况报表" style={{ marginTop: 24 }}>
      <Spin spinning={!stats}>
        <Segmented
          options={Object.keys(DIM_LABELS).map((k) => ({ label: DIM_LABELS[k], value: k }))}
          value={dim}
          onChange={(v) => setDim(v as string)}
          style={{ marginBottom: 16 }}
        />
        <Segmented
          options={Object.keys(CHART_LABELS).map((k) => ({ label: CHART_LABELS[k], value: k }))}
          value={chartType}
          onChange={(v) => setChartType(v as string)}
          style={{ marginBottom: 16 }}
        />
        <div ref={chartRef} style={{ width: '100%', height: 400 }} />
      </Spin>
    </Card>
  )
}
```

### 10.2 验证

```bash
cd library-frontend
pnpm run build
```

**Expected**: 编译通过，无 TS 错误。

## Task 11 — 前端：组装页面 + 路由

### 11.1 主页面

**File: `library-frontend/src/pages/AlgoPage.tsx`**

```tsx
import { Tabs } from 'antd'
import HelloWorldTab from '../components/HelloWorldTab'
import HashTab from '../components/HashTab'
import BubbleSortTab from '../components/BubbleSortTab'
import CallReport from '../components/CallReport'

export default function AlgoPage() {
  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Tabs
        defaultActiveKey="helloworld"
        items={[
          { key: 'helloworld', label: 'HelloWorld', children: <HelloWorldTab /> },
          { key: 'hash', label: '哈希算法', children: <HashTab /> },
          { key: 'bubblesort', label: '冒泡排序', children: <BubbleSortTab /> },
        ]}
      />
      <CallReport />
    </div>
  )
}
```

### 11.2 App 入口

**File: `library-frontend/src/App.tsx`**

```tsx
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AlgoPage from './pages/AlgoPage'

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AlgoPage />
    </ConfigProvider>
  )
}
```

### 11.3 验证

```bash
cd library-frontend
pnpm run build
```

**Expected**: 构建通过，生成 dist/ 目录。

## Task 12 — 跨仓联调与端到端验证

### 12.1 启动后端

```bash
cd library-backend
mvn spring-boot:run
```

**Expected**: 应用在 8080 启动，H2 控制台可访问 `/h2-console`。

### 12.2 启动前端

```bash
cd library-frontend
pnpm run dev
```

**Expected**: Vite dev server 在 5173 启动。

### 12.3 端到端验证清单

1. 打开 http://localhost:5173 → 页面显示 3 个 Tab + 报表区。
2. 点 "HelloWorld" Tab → 执行 → 展示 `Hello, World!` + 耗时。
3. 点 "哈希算法" Tab → 输入 `test` → 执行 → 展示 SHA-256 值。
4. 点 "冒泡排序" Tab → 输入 `5,3,8,1` → 执行 → 展示 `[1,3,5,8]`。
5. 各 Tab 点"导出 CSV" → 浏览器下载对应 `.csv` 文件。
6. 报表区切维度（人员类型/层级/部门）→ 切图类型（折线/饼/柱）→ 图表正常渲染。
7. 后端 `/api/stats` 返回 `userType`/`userLevel`/`department` 三组聚合数据。

### 12.4 后端单元测试

```bash
cd library-backend
mvn clean test
```

**Expected**: BUILD SUCCESS，4 个测试通过。

## Task 13 — 仓间对齐点确认

| 对齐点 | 后端契约 | 前端消费 |
|---|---|---|
| 算法接口路径 | `GET /api/algo/{helloworld,hash,bubblesort}` | `api/index.ts` 中 `callHello/callHash/callBubble` |
| 算法响应结构 | `AlgoResult{apiName,input,output,durationMs}` | `types/index.ts` 中 `AlgoResult` |
| 导出接口路径 | `GET /api/export/{apiName}` | `exportUrl()` 函数 |
| 统计接口路径 | `GET /api/stats` | `fetchStats()` 函数 |
| 统计响应结构 | `{userType:[],userLevel:[],department:[]}` | `CallStats` 类型 |
| 调用人识别 | 请求头 `X-User-Id` | `axios` 拦截器注入 `U001` |
| 前端代理 | — | `vite.config.ts` 代理 `/api`→8080 |

---

## Verification Summary

| 仓库 | 验证命令 | 预期结果 |
|---|---|---|
| library-backend | `mvn clean test` | BUILD SUCCESS，4 测试通过 |
| library-frontend | `pnpm run build` | 构建通过，生成 dist/ |
| 端到端 | 浏览器访问 5173 | 3 Tab + 导出 + 报表全链路正常 |

## Risks

- `AlgoController` 未加 `@CrossOrigin`，若前端不走 Vite 代理直接访问 8080 会有 CORS 问题；本计划用 dev 代理规避，生产需配置 CORS。
- 埋点切面用 `@Around` 拦截所有 Controller 方法，包括 `/api/stats` 和 `/api/export`；查询/导出接口也会被埋点，可在切面 pointcut 中排除，或保留（查询也算调用）。本计划保留全部埋点。
- H2 文件存储在 `./data/librarydb.*`，首次启动自动建表 + 执行 `data.sql`；需确认 `spring.sql.init.mode` 默认 always。若 data.sql 不执行，改 `spring.sql.init.mode: always`。
