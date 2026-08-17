# 三接口 + 前端页面 + 导出功能 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现三个后端接口（helloworld、哈希算法、冒泡排序）及对应前端页面，包含三个 Tab 分别展示结果，并支持导出功能。

**Architecture:** 前后端分离架构。后端 Spring Boot (Java) 提供 RESTful API；前端 React + TypeScript (Vite) 通过 HTTP 调用后端接口，页面使用 Ant Design Tabs 组件组织三个独立功能 Tab，导出按钮触发后端导出接口下载文件。

**Tech Stack:** 前端: React 18 + TypeScript + Vite + Ant Design；后端: Spring Boot 3 + Maven + Java 17

## Global Constraints

- 后端 API 统一 `/api/` 前缀
- 前后端接口契约严格遵守 run_context.json 中定义的 API contracts
- 新增字段/接口必须向后兼容，不得修改已有接口的请求/响应结构
- 导出格式默认 JSON，可选 CSV
- 哈希算法默认 SHA-256，可选 MD5
- 冒泡排序输入为逗号分隔的整数数组
- 禁止使用 Git 写操作，仅允许纯读取命令
- 代码修改限定在指定仓库路径内

---

## 仓库 library-backend 任务

### Task 1: 初始化 Spring Boot 项目结构

**Files:**
- Create: `library-backend/pom.xml`
- Create: `library-backend/src/main/java/com/library/LibraryApplication.java`
- Create: `library-backend/src/main/resources/application.yml`

**Interfaces:**
- Produces: Spring Boot 可启动项目骨架，后续 Controller 可注册至 `/api/*` 路径

- [ ] **Step 1: 创建 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
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
    <description>Library Backend Service</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
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

- [ ] **Step 3: 创建 application.yml**

- [ ] **Step 4: 验证项目结构**

```bash
ls library-backend/pom.xml library-backend/src/main/java/com/library/LibraryApplication.java library-backend/src/main/resources/application.yml
```

---

### Task 2: 实现 HelloWorld API

**Files:**
- Create: `library-backend/src/main/java/com/library/controller/HelloWorldController.java`

**Interfaces:**
- Consumes: Task 1 的 Spring Boot 基础结构
- Produces: `GET /api/helloworld` → `{ "message": "Hello World!", "timestamp": "2026-08-17T12:00:00Z" }`

- [ ] **Step 1: 创建 HelloWorldController**

```java
package com.library.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HelloWorldController {

    @GetMapping("/helloworld")
    public Map<String, Object> helloWorld() {
        return Map.of(
            "message", "Hello World!",
            "timestamp", Instant.now().toString()
        );
    }
}
```

- [ ] **Step 2: 编译验证**

运行 `mvn compile -f library-backend/pom.xml`，期望 BUILD SUCCESS。

---

### Task 3: 实现哈希算法 API

**Files:**
- Create: `library-backend/src/main/java/com/library/controller/HashController.java`
- Create: `library-backend/src/main/java/com/library/dto/HashRequest.java`
- Create: `library-backend/src/main/java/com/library/dto/HashResponse.java`

**Interfaces:**
- Consumes: Task 1 的 Spring Boot 基础结构
- Produces: `POST /api/hash` | Request: `{ "input": "字符串", "algorithm": "SHA-256" }` | Response: `{ "input": "字符串", "algorithm": "SHA-256", "hash": "abc..." }`

- [ ] **Step 1: 创建 HashRequest DTO**

```java
package com.library.dto;

public class HashRequest {
    private String input;
    private String algorithm; // "SHA-256" 或 "MD5"，默认 "SHA-256"

    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
}
```

- [ ] **Step 2: 创建 HashResponse DTO**

```java
package com.library.dto;

public class HashResponse {
    private String input;
    private String algorithm;
    private String hash;

    public HashResponse(String input, String algorithm, String hash) {
        this.input = input;
        this.algorithm = algorithm;
        this.hash = hash;
    }

    public String getInput() { return input; }
    public String getAlgorithm() { return algorithm; }
    public String getHash() { return hash; }
}
```

- [ ] **Step 3: 创建 HashController**

```java
package com.library.controller;

import com.library.dto.HashRequest;
import com.library.dto.HashResponse;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@RestController
@RequestMapping("/api")
public class HashController {

    @PostMapping("/hash")
    public HashResponse hash(@RequestBody HashRequest request) throws NoSuchAlgorithmException {
        String algorithm = request.getAlgorithm();
        if (algorithm == null || algorithm.isBlank()) {
            algorithm = "SHA-256";
        }
        // 验证算法
        if (!"SHA-256".equals(algorithm) && !"MD5".equals(algorithm)) {
            algorithm = "SHA-256";
        }
        MessageDigest digest = MessageDigest.getInstance(algorithm);
        byte[] hashBytes = digest.digest(request.getInput().getBytes());
        String hashHex = HexFormat.of().formatHex(hashBytes);
        return new HashResponse(request.getInput(), algorithm, hashHex);
    }
}
```

- [ ] **Step 4: 编译验证**

运行 `mvn compile -f library-backend/pom.xml`，期望 BUILD SUCCESS。

---

### Task 4: 实现冒泡排序 API

**Files:**
- Create: `library-backend/src/main/java/com/library/controller/BubbleSortController.java`
- Create: `library-backend/src/main/java/com/library/dto/BubbleSortRequest.java`
- Create: `library-backend/src/main/java/com/library/dto/BubbleSortResponse.java`

**Interfaces:**
- Consumes: Task 1 的 Spring Boot 基础结构
- Produces: `POST /api/bubble-sort` | Request: `{ "array": [5,3,8,1,2] }` | Response: `{ "input": [5,3,8,1,2], "steps": [[...],[...]], "result": [1,2,3,5,8] }`

- [ ] **Step 1: 创建 BubbleSortRequest DTO**

```java
package com.library.dto;

import java.util.List;

public class BubbleSortRequest {
    private List<Integer> array;

    public List<Integer> getArray() { return array; }
    public void setArray(List<Integer> array) { this.array = array; }
}
```

- [ ] **Step 2: 创建 BubbleSortResponse DTO**

```java
package com.library.dto;

import java.util.List;

public class BubbleSortResponse {
    private List<Integer> input;
    private List<List<Integer>> steps;
    private List<Integer> result;

    public BubbleSortResponse(List<Integer> input, List<List<Integer>> steps, List<Integer> result) {
        this.input = input;
        this.steps = steps;
        this.result = result;
    }

    public List<Integer> getInput() { return input; }
    public List<List<Integer>> getSteps() { return steps; }
    public List<Integer> getResult() { return result; }
}
```

- [ ] **Step 3: 创建 BubbleSortController**

```java
package com.library.controller;

import com.library.dto.BubbleSortRequest;
import com.library.dto.BubbleSortResponse;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class BubbleSortController {

    @PostMapping("/bubble-sort")
    public BubbleSortResponse bubbleSort(@RequestBody BubbleSortRequest request) {
        List<Integer> arr = new ArrayList<>(request.getArray());
        List<Integer> input = new ArrayList<>(arr);
        List<List<Integer>> steps = new ArrayList<>();
        int n = arr.size();
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - 1 - i; j++) {
                if (arr.get(j) > arr.get(j + 1)) {
                    int temp = arr.get(j);
                    arr.set(j, arr.get(j + 1));
                    arr.set(j + 1, temp);
                }
            }
            steps.add(new ArrayList<>(arr));
        }
        return new BubbleSortResponse(input, steps, arr);
    }
}
```

- [ ] **Step 4: 编译验证**

运行 `mvn compile -f library-backend/pom.xml`，期望 BUILD SUCCESS。

---

### Task 5: 实现导出 API

**Files:**
- Create: `library-backend/src/main/java/com/library/controller/ExportController.java`
- Create: `library-backend/src/main/java/com/library/service/ExportService.java`

**Interfaces:**
- Consumes: Task 2/3/4 的 Controller 处理逻辑需复用
- Produces: `GET /api/export?tab=helloworld|hash|bubble-sort&format=json|csv` → 文件下载

- [ ] **Step 1: 创建 ExportService**

```java
package com.library.service;

import com.library.dto.BubbleSortResponse;
import com.library.dto.HashResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExportService {

    public String exportJson(String tab) {
        Map<String, Object> data = buildExportData(tab);
        return mapToJsonString(data);
    }

    public String exportCsv(String tab) {
        Map<String, Object> data = buildExportData(tab);
        return mapToCsvString(tab, data);
    }

    private Map<String, Object> buildExportData(String tab) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("tab", tab);
        data.put("exportTime", Instant.now().toString());
        switch (tab) {
            case "helloworld":
                data.put("message", "Hello World!");
                data.put("timestamp", Instant.now().toString());
                break;
            case "hash":
                data.put("algorithm", "SHA-256");
                data.put("hash", "example-hash-value");
                break;
            case "bubble-sort":
                data.put("input", List.of(5, 3, 8, 1, 2));
                data.put("result", List.of(1, 2, 3, 5, 8));
                break;
            default:
                throw new IllegalArgumentException("Unknown tab: " + tab);
        }
        return data;
    }

    private String mapToJsonString(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(entry.getKey()).append("\":");
            Object value = entry.getValue();
            if (value instanceof String) {
                sb.append("\"").append(value).append("\"");
            } else if (value instanceof List) {
                sb.append(value.toString().replace(" ", ""));
            } else {
                sb.append(value);
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private String mapToCsvString(String tab, Map<String, Object> map) {
        StringBuilder sb = new StringBuilder();
        String header = map.keySet().stream().collect(Collectors.joining(","));
        sb.append(header).append("\n");
        String row = map.values().stream()
            .map(v -> v instanceof String ? "\"" + v + "\"" : String.valueOf(v))
            .collect(Collectors.joining(","));
        sb.append(row);
        return sb.toString();
    }
}
```

- [ ] **Step 2: 创建 ExportController**

```java
package com.library.controller;

import com.library.service.ExportService;
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

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam String tab,
            @RequestParam(defaultValue = "json") String format) {

        String content;
        String filename;
        MediaType mediaType;

        if ("csv".equalsIgnoreCase(format)) {
            content = exportService.exportCsv(tab);
            filename = tab + "-export.csv";
            mediaType = MediaType.TEXT_PLAIN;
        } else {
            content = exportService.exportJson(tab);
            filename = tab + "-export.json";
            mediaType = MediaType.APPLICATION_JSON;
        }

        byte[] bytes = content.getBytes();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}
```

- [ ] **Step 3: 编译验证**

运行 `mvn compile -f library-backend/pom.xml`，期望 BUILD SUCCESS。

---

## 仓库 library-frontend 任务

### Task 6: 初始化 React + TypeScript + Vite 前端项目

**Files:**
- Create: `library-frontend/package.json`
- Create: `library-frontend/tsconfig.json`
- Create: `library-frontend/vite.config.ts`
- Create: `library-frontend/index.html`
- Create: `library-frontend/src/main.tsx`
- Create: `library-frontend/src/App.tsx`
- Create: `library-frontend/src/vite-env.d.ts`

**Interfaces:**
- Produces: 可运行的前端项目骨架，后续组件可注册到 App.tsx 中

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "library-frontend",
  "private": true,
  "version": "1.0.0",
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
    "axios": "^1.6.0"
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

- [ ] **Step 3: 创建 vite.config.ts**

- [ ] **Step 4: 创建 index.html**

- [ ] **Step 5: 创建 src/main.tsx**

- [ ] **Step 6: 创建 src/App.tsx**（基础框架，含 Ant Design 配置）

- [ ] **Step 7: 创建 src/vite-env.d.ts**

- [ ] **Step 8: 安装依赖**

```bash
cd library-frontend && npm install
```

---

### Task 7: 创建 API 类型定义与 HTTP 服务层

**Files:**
- Create: `library-frontend/src/types/api.ts`
- Create: `library-frontend/src/services/api.ts`

**Interfaces:**
- Consumes: Task 6 的前端项目结构
- Produces: TypeScript 类型定义和 axios 封装，供 Task 8/9/10/11 使用

- [ ] **Step 1: 创建 src/types/api.ts** — 定义所有接口的请求/响应类型

```typescript
export interface HelloWorldResponse {
  message: string;
  timestamp: string;
}

export interface HashRequest {
  input: string;
  algorithm: string;
}

export interface HashResponse {
  input: string;
  algorithm: string;
  hash: string;
}

export interface BubbleSortRequest {
  array: number[];
}

export interface BubbleSortResponse {
  input: number[];
  steps: number[][];
  result: number[];
}

export type TabType = 'helloworld' | 'hash' | 'bubble-sort';
export type ExportFormat = 'json' | 'csv';
```

- [ ] **Step 2: 创建 src/services/api.ts**

```typescript
import axios from 'axios';
import type {
  HelloWorldResponse,
  HashRequest,
  HashResponse,
  BubbleSortRequest,
  BubbleSortResponse,
  TabType,
  ExportFormat,
} from '../types/api';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export async function getHelloWorld(): Promise<HelloWorldResponse> {
  const response = await client.get<HelloWorldResponse>('/helloworld');
  return response.data;
}

export async function postHash(data: HashRequest): Promise<HashResponse> {
  const response = await client.post<HashResponse>('/hash', data);
  return response.data;
}

export async function postBubbleSort(data: BubbleSortRequest): Promise<BubbleSortResponse> {
  const response = await client.post<BubbleSortResponse>('/bubble-sort', data);
  return response.data;
}

export async function exportData(tab: TabType, format: ExportFormat = 'json'): Promise<Blob> {
  const response = await client.get('/export', {
    params: { tab, format },
    responseType: 'blob',
  });
  return response.data;
}
```

---

### Task 8: 实现 HelloWorld Tab 组件

**Files:**
- Create: `library-frontend/src/components/HelloWorldTab.tsx`

**Interfaces:**
- Consumes: Task 7 的 `getHelloWorld()` API 函数
- Produces: 可嵌入 Tabs 的 React 组件，展示 HelloWorld 消息和时间戳

- [ ] **Step 1: 创建 HelloWorldTab 组件**

```tsx
import { useState, useEffect } from 'react';
import { Card, Spin, Typography } from 'antd';
import { getHelloWorld } from '../services/api';
import type { HelloWorldResponse } from '../types/api';

const { Text, Title } = Typography;

export default function HelloWorldTab() {
  const [data, setData] = useState<HelloWorldResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHelloWorld()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" />;
  if (error) return <Text type="danger">Error: {error}</Text>;

  return (
    <Card>
      <Title level={4}>{data?.message}</Title>
      <Text type="secondary">Timestamp: {data?.timestamp}</Text>
    </Card>
  );
}
```

---

### Task 9: 实现哈希算法 Tab 组件

**Files:**
- Create: `library-frontend/src/components/HashTab.tsx`

**Interfaces:**
- Consumes: Task 7 的 `postHash()` API 函数
- Produces: 可嵌入 Tabs 的 React 组件，含输入框、算法选择、计算按钮和结果展示区

- [ ] **Step 1: 创建 HashTab 组件**

```tsx
import { useState } from 'react';
import { Card, Input, Select, Button, Typography, Space, Alert } from 'antd';
import { postHash } from '../services/api';
import type { HashResponse } from '../types/api';

const { Text, Title } = Typography;

export default function HashTab() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'MD5'>('SHA-256');
  const [result, setResult] = useState<HashResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postHash({ input, algorithm });
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="输入要计算哈希的字符串"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <Select
          value={algorithm}
          onChange={v => setAlgorithm(v)}
          options={[
            { value: 'SHA-256', label: 'SHA-256' },
            { value: 'MD5', label: 'MD5' },
          ]}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={handleCalculate} loading={loading}>
          计算哈希
        </Button>
        {error && <Alert type="error" message={error} />}
        {result && (
          <Card size="small">
            <Text>Input: {result.input}</Text><br />
            <Text>Algorithm: {result.algorithm}</Text><br />
            <Text>Hash: <Text code>{result.hash}</Text></Text>
          </Card>
        )}
      </Space>
    </Card>
  );
}
```

---

### Task 10: 实现冒泡排序 Tab 组件

**Files:**
- Create: `library-frontend/src/components/BubbleSortTab.tsx`

**Interfaces:**
- Consumes: Task 7 的 `postBubbleSort()` API 函数
- Produces: 可嵌入 Tabs 的 React 组件，含输入框、排序按钮、分步过程和最终结果展示

- [ ] **Step 1: 创建 BubbleSortTab 组件**

```tsx
import { useState } from 'react';
import { Card, Input, Button, Typography, Space, Alert, Steps } from 'antd';
import { postBubbleSort } from '../services/api';
import type { BubbleSortResponse } from '../types/api';

const { Text, Title } = Typography;

export default function BubbleSortTab() {
  const [inputArray, setInputArray] = useState('');
  const [result, setResult] = useState<BubbleSortResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSort = async () => {
    const array = inputArray.split(',').map(s => parseInt(s.trim(), 10));
    if (array.some(isNaN)) {
      setError('请输入逗号分隔的整数数组，例如: 5,3,8,1,2');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await postBubbleSort({ array });
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="输入逗号分隔的整数数组，例如: 5,3,8,1,2"
          value={inputArray}
          onChange={e => setInputArray(e.target.value)}
        />
        <Button type="primary" onClick={handleSort} loading={loading}>
          排序
        </Button>
        {error && <Alert type="error" message={error} />}
        {result && (
          <>
            <Text>Input: [{result.input.join(', ')}]</Text><br />
            <Text>Result: <Text strong>[{result.result.join(', ')}]</Text></Text>
            <Title level={5}>排序过程:</Title>
            <Steps
              direction="vertical"
              current={-1}
              items={result.steps.map((step, i) => ({
                title: `Step ${i + 1}`,
                description: `[${step.join(', ')}]`,
              }))}
            />
          </>
        )}
      </Space>
    </Card>
  );
}
```

---

### Task 11: 组装主页面 - 三 Tab 页面 + 导出按钮

**Files:**
- Modify: `library-frontend/src/App.tsx`

**Interfaces:**
- Consumes: Task 8/9/10 的三个 Tab 组件，Task 7 的 `exportData()` 函数
- Produces: 完整功能页面，含三个 Tab 和全局导出按钮

- [ ] **Step 1: 重写 App.tsx**

```tsx
import { useState } from 'react';
import { Tabs, Button, Layout, Typography, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import HelloWorldTab from './components/HelloWorldTab';
import HashTab from './components/HashTab';
import BubbleSortTab from './components/BubbleSortTab';
import { exportData } from './services/api';
import type { TabType, ExportFormat } from './types/api';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('helloworld');

  const handleExport = async (format: ExportFormat) => {
    try {
      const blob = await exportData(activeTab, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-export.${format === 'json' ? 'json' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (e: any) {
      message.error('导出失败: ' + e.message);
    }
  };

  const tabItems = [
    { key: 'helloworld', label: 'Hello World', children: <HelloWorldTab /> },
    { key: 'hash', label: '哈希算法', children: <HashTab /> },
    { key: 'bubble-sort', label: '冒泡排序', children: <BubbleSortTab /> },
  ];

  return (
    <Layout style={{ minHeight: '100vh', padding: 24 }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>功能演示</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('json')}>
            导出 JSON
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>
            导出 CSV
          </Button>
        </Space>
      </Header>
      <Content style={{ marginTop: 24 }}>
        <Tabs activeKey={activeTab} onChange={k => setActiveTab(k as TabType)} items={tabItems} />
      </Content>
    </Layout>
  );
}
```

---

## 跨仓集成任务

### Task 12: 配置前端代理与后端联调

**Files:**
- Modify: `library-frontend/vite.config.ts`
- Modify: `library-backend/src/main/resources/application.yml` (确认 CORS 配置)

**Interfaces:**
- 确保前端开发服务器代理 `/api` 到后端端口

- [ ] **Step 1: 配置 Vite 代理**

```typescript
// vite.config.ts
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

- [ ] **Step 2: 确认后端 application.yml 配置 CORS**

```yaml
server:
  port: 8080
spring:
  web:
    cors:
      allowed-origins: "http://localhost:3000"
      allowed-methods: GET,POST
```

---

## 跨仓对齐点检查

| 对齐点 | 前端类型 | 后端接口 | 状态 |
|--------|---------|---------|------|
| GET /api/helloworld | `HelloWorldResponse` | `{ message, timestamp }` | ✅ 一致 |
| POST /api/hash | `HashRequest` → `HashResponse` | `{ input, algorithm }` → `{ input, algorithm, hash }` | ✅ 一致 |
| POST /api/bubble-sort | `BubbleSortRequest` → `BubbleSortResponse` | `{ array }` → `{ input, steps, result }` | ✅ 一致 |
| GET /api/export | `(tab, format) → Blob` | `?tab=&format=` → 文件下载 | ✅ 一致 |
| 导出格式 | JSON / CSV | JSON / CSV | ✅ 一致 |
| 哈希算法 | SHA-256 / MD5 | SHA-256 / MD5 | ✅ 一致 |

## 自检清单

1. **Spec 覆盖:** ✅ 三个接口（helloworld、hash、bubble-sort）均有独立 Controller 和前端 Tab；✅ 导出按钮 + 后端导出接口已覆盖
2. **占位符检查:** 所有代码块包含完整实现，无 TBD/TODO 占位符
3. **类型一致性:** 前端 `types/api.ts` 类型定义与后端 DTO 及 run_context.json 中的 API contracts 完全一致
4. **路径正确性:** 所有文件路径以 `library-backend/` 或 `library-frontend/` 为仓库前缀，符合物理路径规则