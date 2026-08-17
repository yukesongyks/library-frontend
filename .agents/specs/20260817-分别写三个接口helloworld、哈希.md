# 三接口（HelloWorld / 哈希算法 / 冒泡排序）及前端展示页实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 后端提供三个独立接口（HelloWorld、哈希算法、冒泡排序）及统一导出接口；前端新增页面以三个 Tab 分别展示各接口执行结果，并提供导出按钮。

**Architecture:** 后端三个接口相互独立，各自接收输入并返回计算结果；前端通过 HTTP 调用后端接口，结果在 Tab 内展示，导出按钮调用统一导出接口生成 CSV/JSON 文件下载。

**Tech Stack:** 后端 Java 17 + Spring Boot 3.x + Maven；前端 React 18 + TypeScript + Ant Design 5.x；HTTP 通信采用 RESTful API + JSON。

---

## 跨仓依赖与现状摘要

| 仓库 | 当前状态 | 技术栈 | 需要新增 |
|------|---------|--------|---------|
| [backend] `library-backend-main` | 空项目（仅 README） | Java 17 + Spring Boot 3.x + Maven | Controller、Service 层、DTO、导出接口 |
| [frontend] `library-frontend-main` | 空项目（仅 README） | React 18 + TypeScript + Ant Design 5.x | 页面组件、API 调用层、Tab 展示、导出按钮 |

**仓间对齐点：** 前端请求 URL 路径、请求/响应 DTO 结构必须与后端接口严格一致。

---

## 全局约束

- 后端所有接口返回统一 JSON 包装：`{ "code": 0, "data": ..., "message": "success" }`
- 前端 API 请求路径统一以 `/api/` 开头
- 前端使用 Ant Design 组件库，主题色与现有项目一致
- 所有接口需有基本的异常处理，返回友好错误信息
- 导出接口支持导出各 Tab 的当前展示结果（CSV 格式）

---

## Task 1: [Backend] 初始化 Spring Boot 项目骨架

**Files:**
- Create: `library-backend-main/pom.xml`
- Create: `library-backend-main/src/main/java/com/library/LibraryApplication.java`
- Create: `library-backend-main/src/main/java/com/library/config/WebConfig.java`
- Create: `library-backend-main/src/main/java/com/library/dto/ApiResult.java`
- Create: `library-backend-main/src/main/resources/application.yml`

**Interfaces:**
- Consumes: 无
- Produces: 统一响应包装类 `ApiResult<T>`，供后续 Task 引用

- [ ] **Step 1: 创建 pom.xml**

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
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    <groupId>com.library</groupId>
    <artifactId>library-backend</artifactId>
    <version>1.0.0</version>
    <name>library-backend</name>
    <description>图书管理系统后端</description>
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

- [ ] **Step 2: 创建主启动类**

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

- [ ] **Step 3: 创建统一响应包装类 `ApiResult.java`**

```java
package com.library.dto;

public class ApiResult<T> {
    private int code;
    private String message;
    private T data;

    public ApiResult() {}

    public ApiResult(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResult<T> success(T data) {
        return new ApiResult<>(0, "success", data);
    }

    public static <T> ApiResult<T> error(int code, String message) {
        return new ApiResult<>(code, message, null);
    }

    // getters and setters
    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}
```

- [ ] **Step 4: 创建跨域配置**

```java
package com.library.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST");
            }
        };
    }
}
```

- [ ] **Step 5: 创建 `application.yml`**

```yaml
server:
  port: 8080
spring:
  application:
    name: library-backend
```

- [ ] **Step 6: 验证项目可编译**

```bash
cd /workspace/library-backend-main && mvn compile -q
```

Expected: BUILD SUCCESS（无错误输出）

---

## Task 2: [Backend] 实现 HelloWorld 接口

**Files:**
- Create: `library-backend-main/src/main/java/com/library/controller/AlgorithmController.java`（新增 HelloWorld 方法）
- Create: `library-backend-main/src/main/java/com/library/service/AlgorithmService.java`

**Interfaces:**
- Consumes: `ApiResult<T>`（来自 Task 1）
- Produces: `GET /api/hello` → `ApiResult<String>` 返回 "Hello World!"

- [ ] **Step 1: 创建 Service 接口和实现**

```java
// AlgorithmService.java
package com.library.service;

public interface AlgorithmService {
    String helloWorld();
}
```

```java
// AlgorithmServiceImpl.java
package com.library.service.impl;

import com.library.service.AlgorithmService;
import org.springframework.stereotype.Service;

@Service
public class AlgorithmServiceImpl implements AlgorithmService {
    @Override
    public String helloWorld() {
        return "Hello World! Current time: " + java.time.LocalDateTime.now().toString();
    }
}
```

- [ ] **Step 2: 创建 Controller 并添加 HelloWorld 端点**

```java
package com.library.controller;

import com.library.dto.ApiResult;
import com.library.service.AlgorithmService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AlgorithmController {
    private final AlgorithmService algorithmService;

    public AlgorithmController(AlgorithmService algorithmService) {
        this.algorithmService = algorithmService;
    }

    @GetMapping("/hello")
    public ApiResult<String> helloWorld() {
        return ApiResult.success(algorithmService.helloWorld());
    }
}
```

- [ ] **Step 3: 启动后端并验证**

```bash
cd /workspace/library-backend-main && mvn spring-boot:run -q &
sleep 5
curl -s http://localhost:8080/api/hello
```

Expected: `{"code":0,"message":"success","data":"Hello World! Current time: 2026-08-17T..."}`

---

## Task 3: [Backend] 实现哈希算法接口

**Files:**
- Modify: `library-backend-main/src/main/java/com/library/service/AlgorithmService.java`（新增 hash 方法）
- Modify: `library-backend-main/src/main/java/com/library/service/impl/AlgorithmServiceImpl.java`（实现 hash 方法）
- Modify: `library-backend-main/src/main/java/com/library/controller/AlgorithmController.java`（新增 hash 端点）

**Interfaces:**
- Consumes: `ApiResult<T>`（来自 Task 1）
- Produces: `POST /api/hash` 请求体 `{ "input": "string" }` → `ApiResult<HashResult>` 返回 SHA-256 哈希值

- [ ] **Step 1: 创建哈希结果 DTO**

```java
// HashResult.java
package com.library.dto;

public class HashResult {
    private String input;
    private String sha256;
    private String md5;
    private long timestamp;

    public HashResult() {}

    public HashResult(String input, String sha256, String md5, long timestamp) {
        this.input = input;
        this.sha256 = sha256;
        this.md5 = md5;
        this.timestamp = timestamp;
    }

    // getters and setters
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getSha256() { return sha256; }
    public void setSha256(String sha256) { this.sha256 = sha256; }
    public String getMd5() { return md5; }
    public void setMd5(String md5) { this.md5 = md5; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
```

- [ ] **Step 2: 扩展 Service 接口和实现**

```java
// AlgorithmService.java — 新增方法
public interface AlgorithmService {
    String helloWorld();
    HashResult hashString(String input);
}
```

```java
// AlgorithmServiceImpl.java — 新增实现
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import com.library.dto.HashResult;

@Service
public class AlgorithmServiceImpl implements AlgorithmService {
    // ... 保留 helloWorld 实现

    @Override
    public HashResult hashString(String input) {
        try {
            String sha256 = bytesToHex(MessageDigest.getInstance("SHA-256").digest(input.getBytes()));
            String md5 = bytesToHex(MessageDigest.getInstance("MD5").digest(input.getBytes()));
            return new HashResult(input, sha256, md5, System.currentTimeMillis());
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Hash algorithm not available", e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
```

- [ ] **Step 3: 扩展 Controller**

```java
// AlgorithmController.java — 新增端点
@PostMapping("/hash")
public ApiResult<HashResult> hash(@RequestBody Map<String, String> request) {
    String input = request.get("input");
    if (input == null || input.isBlank()) {
        return ApiResult.error(400, "input cannot be empty");
    }
    return ApiResult.success(algorithmService.hashString(input));
}
```

- [ ] **Step 4: 验证**

```bash
curl -s -X POST http://localhost:8080/api/hash \
  -H "Content-Type: application/json" \
  -d '{"input":"hello"}'
```

Expected: `{"code":0,"message":"success","data":{"input":"hello","sha256":"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824","md5":"5d41402abc4b2a76b9719d911017c592","timestamp":...}}`

---

## Task 4: [Backend] 实现冒泡排序接口

**Files:**
- Modify: `library-backend-main/src/main/java/com/library/service/AlgorithmService.java`（新增 bubbleSort 方法）
- Modify: `library-backend-main/src/main/java/com/library/service/impl/AlgorithmServiceImpl.java`（实现 bubbleSort 方法）
- Modify: `library-backend-main/src/main/java/com/library/controller/AlgorithmController.java`（新增 bubbleSort 端点）
- Create: `library-backend-main/src/main/java/com/library/dto/SortResult.java`

**Interfaces:**
- Consumes: `ApiResult<T>`（来自 Task 1）
- Produces: `POST /api/sort/bubble` 请求体 `{ "array": [3,1,4,1,5] }` → `ApiResult<SortResult>`

- [ ] **Step 1: 创建排序结果 DTO**

```java
package com.library.dto;

public class SortResult {
    private int[] originalArray;
    private int[] sortedArray;
    private long elapsedTimeMs;

    public SortResult() {}

    public SortResult(int[] originalArray, int[] sortedArray, long elapsedTimeMs) {
        this.originalArray = originalArray;
        this.sortedArray = sortedArray;
        this.elapsedTimeMs = elapsedTimeMs;
    }

    // getters and setters
    public int[] getOriginalArray() { return originalArray; }
    public void setOriginalArray(int[] originalArray) { this.originalArray = originalArray; }
    public int[] getSortedArray() { return sortedArray; }
    public void setSortedArray(int[] sortedArray) { this.sortedArray = sortedArray; }
    public long getElapsedTimeMs() { return elapsedTimeMs; }
    public void setElapsedTimeMs(long elapsedTimeMs) { this.elapsedTimeMs = elapsedTimeMs; }
}
```

- [ ] **Step 2: 扩展 Service**

```java
// AlgorithmService.java — 新增方法
SortResult bubbleSort(int[] array);
```

```java
// AlgorithmServiceImpl.java — 新增实现
@Override
public SortResult bubbleSort(int[] array) {
    int[] arr = array.clone();
    long start = System.nanoTime();
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    long elapsed = (System.nanoTime() - start) / 1_000_000; // ms
    return new SortResult(array, arr, elapsed);
}
```

- [ ] **Step 3: 扩展 Controller**

```java
// AlgorithmController.java — 新增端点
@PostMapping("/sort/bubble")
public ApiResult<SortResult> bubbleSort(@RequestBody Map<String, int[]> request) {
    int[] array = request.get("array");
    if (array == null || array.length == 0) {
        return ApiResult.error(400, "array cannot be empty");
    }
    return ApiResult.success(algorithmService.bubbleSort(array));
}
```

- [ ] **Step 4: 验证**

```bash
curl -s -X POST http://localhost:8080/api/sort/bubble \
  -H "Content-Type: application/json" \
  -d '{"array":[3,1,4,1,5,9,2,6]}'
```

Expected: `{"code":0,"message":"success","data":{"originalArray":[3,1,4,1,5,9,2,6],"sortedArray":[1,1,2,3,4,5,6,9],"elapsedTimeMs":...}}`

---

## Task 5: [Backend] 实现统一导出接口

**Files:**
- Create: `library-backend-main/src/main/java/com/library/controller/ExportController.java`
- Create: `library-backend-main/src/main/java/com/library/service/ExportService.java`
- Create: `library-backend-main/src/main/java/com/library/service/impl/ExportServiceImpl.java`

**Interfaces:**
- Consumes: `AlgorithmService`（来自 Task 2-4），`ApiResult<T>`（来自 Task 1）
- Produces: `POST /api/export` 请求体 `{ "type": "hello|hash|sort", "data": ... }` → 返回 CSV 文件流

- [ ] **Step 1: 创建 ExportService**

```java
// ExportService.java
package com.library.service;

public interface ExportService {
    byte[] exportAsCsv(String type, Object data);
}
```

```java
// ExportServiceImpl.java
package com.library.service.impl;

import com.library.dto.HashResult;
import com.library.dto.SortResult;
import com.library.service.ExportService;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;

@Service
public class ExportServiceImpl implements ExportService {
    @Override
    public byte[] exportAsCsv(String type, Object data) {
        StringBuilder sb = new StringBuilder();
        switch (type) {
            case "hello" -> {
                sb.append("result\n");
                sb.append(data).append("\n");
            }
            case "hash" -> {
                HashResult hr = (HashResult) data;
                sb.append("input,sha256,md5,timestamp\n");
                sb.append(hr.getInput()).append(",")
                  .append(hr.getSha256()).append(",")
                  .append(hr.getMd5()).append(",")
                  .append(hr.getTimestamp()).append("\n");
            }
            case "sort" -> {
                SortResult sr = (SortResult) data;
                sb.append("originalArray,sortedArray,elapsedTimeMs\n");
                sb.append(arrayToString(sr.getOriginalArray())).append(",")
                  .append(arrayToString(sr.getSortedArray())).append(",")
                  .append(sr.getElapsedTimeMs()).append("\n");
            }
            default -> throw new IllegalArgumentException("Unknown export type: " + type);
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String arrayToString(int[] arr) {
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(arr[i]);
        }
        sb.append("\"");
        return sb.toString();
    }
}
```

- [ ] **Step 2: 创建 ExportController**

```java
// ExportController.java
package com.library.controller;

import com.library.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ExportController {
    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> export(@RequestBody Map<String, Object> request) {
        String type = (String) request.get("type");
        Object data = request.get("data");
        byte[] csvBytes = exportService.exportAsCsv(type, data);
        String filename = "export_" + type + "_" + System.currentTimeMillis() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
}
```

- [ ] **Step 3: 验证**

```bash
curl -s -X POST http://localhost:8080/api/export \
  -H "Content-Type: application/json" \
  -d '{"type":"hello","data":"Hello World! Current time: 2026-08-17T12:00:00"}'
```

Expected: CSV 内容：`result\nHello World! Current time: 2026-08-17T12:00:00\n`

---

## Task 6: [Frontend] 初始化 React 项目骨架

**Files:**
- Create: `library-frontend-main/package.json`
- Create: `library-frontend-main/tsconfig.json`
- Create: `library-frontend-main/public/index.html`
- Create: `library-frontend-main/src/index.tsx`
- Create: `library-frontend-main/src/App.tsx`
- Create: `library-frontend-main/src/App.css`
- Create: `library-frontend-main/src/api/client.ts`

**Interfaces:**
- Consumes: 无
- Produces: API 调用层 `client.ts`（供后续 Task 引用）

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "library-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "antd": "^5.12.0",
    "axios": "^1.6.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "devDependencies": {
    "react-scripts": "5.0.1"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
```

- [ ] **Step 2: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "baseUrl": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 `public/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>图书管理系统</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

- [ ] **Step 4: 创建 `src/index.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
```

- [ ] **Step 5: 创建 API 客户端 `src/api/client.ts`**

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

export interface HashResult {
  input: string;
  sha256: string;
  md5: string;
  timestamp: number;
}

export interface SortResult {
  originalArray: number[];
  sortedArray: number[];
  elapsedTimeMs: number;
}

export const helloWorld = () =>
  apiClient.get<ApiResult<string>>('/hello').then(res => res.data);

export const hashString = (input: string) =>
  apiClient.post<ApiResult<HashResult>>('/hash', { input }).then(res => res.data);

export const bubbleSort = (array: number[]) =>
  apiClient.post<ApiResult<SortResult>>('/sort/bubble', { array }).then(res => res.data);

export const exportData = (type: string, data: any) =>
  apiClient.post('/export', { type, data }, { responseType: 'blob' }).then(res => res.data);

export default apiClient;
```

- [ ] **Step 6: 创建 `src/App.tsx`**

```tsx
import React from 'react';
import { Tabs } from 'antd';
import HelloWorldTab from './components/HelloWorldTab';
import HashTab from './components/HashTab';
import SortTab from './components/SortTab';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <h1>算法演示平台</h1>
      <Tabs
        defaultActiveKey="hello"
        items={[
          { key: 'hello', label: 'HelloWorld', children: <HelloWorldTab /> },
          { key: 'hash', label: '哈希算法', children: <HashTab /> },
          { key: 'sort', label: '冒泡排序', children: <SortTab /> },
        ]}
      />
    </div>
  );
};

export default App;
```

- [ ] **Step 7: 创建 `src/App.css`**

```css
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
```

- [ ] **Step 8: 安装依赖并验证**

```bash
cd /workspace/library-frontend-main && npm install
```

Expected: 无报错，node_modules 生成

---

## Task 7: [Frontend] 实现 HelloWorld Tab 组件

**Files:**
- Create: `library-frontend-main/src/components/HelloWorldTab.tsx`
- Create: `library-frontend-main/src/components/ExportButton.tsx`

**Interfaces:**
- Consumes: `helloWorld()` 和 `exportData()` 来自 `src/api/client.ts`（Task 6）
- Produces: HelloWorld Tab 展示组件

- [ ] **Step 1: 创建 `HelloWorldTab.tsx`**

```tsx
import React, { useState } from 'react';
import { Button, Card, Spin, message } from 'antd';
import { helloWorld, exportData } from '../api/client';
import ExportButton from './ExportButton';

const HelloWorldTab: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await helloWorld();
      if (res.code === 0) {
        setResult(res.data);
      } else {
        message.error(res.message);
      }
    } catch (e: any) {
      message.error('请求失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Button type="primary" onClick={handleExecute} loading={loading} style={{ marginRight: 8 }}>
        执行 HelloWorld
      </Button>
      <ExportButton type="hello" data={result} disabled={!result} />
      {loading && <Spin style={{ marginLeft: 16 }} />}
      {result && (
        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <pre>{result}</pre>
        </div>
      )}
    </Card>
  );
};

export default HelloWorldTab;
```

- [ ] **Step 2: 创建通用导出按钮 `ExportButton.tsx`**

```tsx
import React from 'react';
import { Button, message } from 'antd';
import { exportData } from '../api/client';

interface ExportButtonProps {
  type: string;
  data: any;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ type, data, disabled }) => {
  const handleExport = async () => {
    try {
      const blob = await exportData(type, data);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_${type}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (e: any) {
      message.error('导出失败: ' + e.message);
    }
  };

  return (
    <Button onClick={handleExport} disabled={disabled}>
      导出结果
    </Button>
  );
};

export default ExportButton;
```

---

## Task 8: [Frontend] 实现哈希算法 Tab 组件

**Files:**
- Create: `library-frontend-main/src/components/HashTab.tsx`

**Interfaces:**
- Consumes: `hashString()` 和 `exportData()` 来自 `src/api/client.ts`（Task 6）, `ExportButton`
- Produces: 哈希算法 Tab 展示组件

- [ ] **Step 1: 创建 `HashTab.tsx`**

```tsx
import React, { useState } from 'react';
import { Button, Card, Input, Spin, message, Descriptions } from 'antd';
import { hashString, HashResult, exportData } from '../api/client';
import ExportButton from './ExportButton';

const HashTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<HashResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!input.trim()) {
      message.warning('请输入要哈希的字符串');
      return;
    }
    setLoading(true);
    try {
      const res = await hashString(input);
      if (res.code === 0) {
        setResult(res.data);
      } else {
        message.error(res.message);
      }
    } catch (e: any) {
      message.error('请求失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Input.TextArea
        rows={2}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="请输入要哈希的字符串..."
        style={{ marginBottom: 12 }}
      />
      <Button type="primary" onClick={handleExecute} loading={loading} style={{ marginRight: 8 }}>
        执行哈希
      </Button>
      <ExportButton type="hash" data={result} disabled={!result} />
      {loading && <Spin style={{ marginLeft: 16 }} />}
      {result && (
        <Descriptions column={1} bordered style={{ marginTop: 16 }}>
          <Descriptions.Item label="输入字符串">{result.input}</Descriptions.Item>
          <Descriptions.Item label="SHA-256">{result.sha256}</Descriptions.Item>
          <Descriptions.Item label="MD5">{result.md5}</Descriptions.Item>
          <Descriptions.Item label="时间戳">{result.timestamp}</Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  );
};

export default HashTab;
```

---

## Task 9: [Frontend] 实现冒泡排序 Tab 组件

**Files:**
- Create: `library-frontend-main/src/components/SortTab.tsx`

**Interfaces:**
- Consumes: `bubbleSort()` 和 `exportData()` 来自 `src/api/client.ts`（Task 6）, `ExportButton`
- Produces: 冒泡排序 Tab 展示组件

- [ ] **Step 1: 创建 `SortTab.tsx`**

```tsx
import React, { useState } from 'react';
import { Button, Card, Input, Spin, message, Descriptions, Tag } from 'antd';
import { bubbleSort, SortResult } from '../api/client';
import ExportButton from './ExportButton';

const SortTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SortResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    const numbers = input.split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
    if (numbers.length === 0) {
      message.warning('请输入有效的数字数组，以逗号或空格分隔');
      return;
    }
    setLoading(true);
    try {
      const res = await bubbleSort(numbers);
      if (res.code === 0) {
        setResult(res.data);
      } else {
        message.error(res.message);
      }
    } catch (e: any) {
      message.error('请求失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="请输入数字数组，如：3, 1, 4, 1, 5, 9, 2, 6"
        style={{ marginBottom: 12 }}
      />
      <Button type="primary" onClick={handleExecute} loading={loading} style={{ marginRight: 8 }}>
        执行排序
      </Button>
      <ExportButton type="sort" data={result} disabled={!result} />
      {loading && <Spin style={{ marginLeft: 16 }} />}
      {result && (
        <div style={{ marginTop: 16 }}>
          <Descriptions column={1} bordered style={{ marginBottom: 12 }}>
            <Descriptions.Item label="原始数组">
              {result.originalArray.map((n, i) => <Tag key={i}>{n}</Tag>)}
            </Descriptions.Item>
            <Descriptions.Item label="排序后数组">
              {result.sortedArray.map((n, i) => <Tag key={i} color="green">{n}</Tag>)}
            </Descriptions.Item>
            <Descriptions.Item label="耗时">{result.elapsedTimeMs} ms</Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Card>
  );
};

export default SortTab;
```

---

## 跨仓对齐点检查清单

| 检查项 | [backend] 路径 | [frontend] 路径 | 对齐要求 |
|--------|---------------|----------------|---------|
| API 路径 | `/api/hello` | `client.ts` 中 `GET /hello` | 一致 |
| API 路径 | `/api/hash` | `client.ts` 中 `POST /hash` | 一致 |
| API 路径 | `/api/sort/bubble` | `client.ts` 中 `POST /sort/bubble` | 一致 |
| API 路径 | `/api/export` | `client.ts` 中 `POST /export` | 一致 |
| 响应格式 | `ApiResult<T>` | `ApiResult<T>` 接口 | 字段 `code`/`message`/`data` 一致 |
| DTO: HashResult | `input,sha256,md5,timestamp` | `HashResult` 接口 | 字段名和类型一致 |
| DTO: SortResult | `originalArray,sortedArray,elapsedTimeMs` | `SortResult` 接口 | 字段名和类型一致 |
| 导出格式 | CSV | Blob 下载 | 一致 |

---

## 自检清单

**1. Spec 覆盖度：**
- ✅ 三个接口（HelloWorld / 哈希 / 冒泡排序）→ Task 2, 3, 4
- ✅ 前端新页面，三个 Tab → Task 7, 8, 9
- ✅ 导出按钮 → Task 7 中 ExportButton 组件
- ✅ 后台导出接口 → Task 5

**2. 占位符检查：** 无 TBD、TODO 等占位符，所有代码块包含完整实现。

**3. 类型一致性：** 后端 DTO 字段与前端 TypeScript 接口完全对齐，无类型不匹配。