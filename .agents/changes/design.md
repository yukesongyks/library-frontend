# 系统分析与设计文档：算法演示与导出功能

## 1. 需求分析

### 1.1 业务背景
在现有图书管理系统前端项目中，新增一个独立的"算法演示"功能模块。该模块旨在通过可视化方式展示基础算法执行结果，并提供数据导出能力，便于用户理解算法行为及留存分析数据。

### 1.2 功能需求清单

| 编号 | 功能点         | 描述                                                                 | 优先级 |
|------|----------------|----------------------------------------------------------------------|--------|
| F-01 | HelloWorld接口 | 提供基础连通性测试接口，返回固定问候语                                 | P0     |
| F-02 | 哈希算法接口   | 接收输入字符串，返回其 SHA-256 哈希值                                  | P0     |
| F-03 | 冒泡排序接口   | 接收整数数组，返回排序后的数组及排序过程关键步骤（可选）                 | P0     |
| F-04 | 前端Tab页面    | 新增独立页面，包含三个Tab分别对应上述三个接口的结果展示                  | P0     |
| F-05 | 结果导出功能   | 每个Tab下提供"导出"按钮，点击后调用后台接口下载当前展示结果的CSV/Excel文件 | P0     |
| F-06 | 导出后台接口   | 通用导出接口，根据类型参数生成对应格式文件流                             | P0     |

### 1.3 非功能性需求
- **性能**：单次算法接口响应时间 < 200ms（常规输入规模）
- **安全**：哈希接口需防重放；导出接口需校验请求合法性，防止任意文件下载
- **兼容性**：前端支持 Chrome/Firefox/Edge 最新两个主版本
- **可扩展**：导出格式预留 JSON/XML 扩展点

---

## 2. 架构设计

### 2.1 整体架构
采用前后端分离架构，本次新增功能遵循现有项目分层约定：

```
┌─────────────────────────────────────────┐
│              Frontend (Vue/React)        │
│  ┌───────────────────────────────────┐  │
│  │      AlgorithmDemoPage            │  │
│  │  ┌─────┐ ┌─────┐ ┌───────────┐  │  │
│  │  │Tab1 │ │Tab2 │ │   Tab3    │  │  │
│  │  │Hello│ │Hash │ │BubbleSort │  │  │
│  │  └──┬──┘ └──┬──┘ └─────┬─────┘  │  │
│  │     │       │          │         │  │
│  │  ┌──▼───────▼──────────▼──────┐  │  │
│  │  │      ExportButton          │  │  │
│  │  └────────────┬───────────────┘  │  │
│  └───────────────┼──────────────────┘  │
└──────────────────┼──────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────┐
│           Backend (Spring Boot)          │
│  ┌────────────────────────────────────┐ │
│  │       AlgorithmController          │ │
│  │  GET /api/algo/hello               │ │
│  │  POST /api/algo/hash               │ │
│  │  POST /api/algo/bubble-sort        │ │
│  │  POST /api/algo/export             │ │
│  └──────────────┬─────────────────────┘ │
│  ┌──────────────▼─────────────────────┐ │
│  │        AlgorithmService            │ │
│  │  - helloWorld()                    │ │
│  │  - computeHash(input)              │ │
│  │  - bubbleSort(arr)                 │ │
│  │  - exportData(type, params)        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2.2 技术选型
- **后端**：Spring Boot 2.x/3.x（沿用项目现有版本），使用 `java.security.MessageDigest` 实现哈希，自定义冒泡排序逻辑
- **前端**：沿用项目现有技术栈（README 标识为 library-frontend，推测为 Vue/React），使用原生 Tab 组件或 UI 库 Tab
- **导出**：后端使用 Apache POI（Excel）或 OpenCSV（CSV）生成文件流；前端通过 Blob + URL.createObjectURL 触发下载

---

## 3. 模块设计

### 3.1 后端模块

#### 3.1.1 Controller 层
- **路径前缀**：`/api/algo`
- **职责**：参数校验、调用 Service、封装统一响应体、处理导出文件流响应头

#### 3.1.2 Service 层
- **HelloWorldService**：无状态，直接返回常量字符串
- **HashService**：输入字符串 → SHA-256 字节数组 → Hex 编码字符串
- **BubbleSortService**：输入 int[] → 复制数组 → 执行冒泡排序 → 返回排序结果 + 比较次数/交换次数（用于前端展示）
- **ExportService**：根据 `exportType` 枚举分发到具体生成器，返回 `byte[]` + 文件名 + Content-Type

#### 3.1.3 DTO/VO 定义
- `HashRequest { String input; }`
- `HashResponse { String hashValue; String algorithm; }`
- `BubbleSortRequest { List<Integer> numbers; }`
- `BubbleSortResponse { List<Integer> sorted; int comparisons; int swaps; }`
- `ExportRequest { String type; Map<String, Object> data; }` （type: HELLO/HASH/BUBBLE_SORT）

### 3.2 前端模块

#### 3.2.1 页面结构
- **路由**：`/algorithm-demo`
- **组件**：`AlgorithmDemoPage.vue/.tsx`
- **子组件**：`HelloTab`, `HashTab`, `BubbleSortTab`, `ExportButton`

#### 3.2.2 状态管理
- 每个 Tab 独立维护本地状态（输入参数、加载态、结果数据）
- 导出时传递当前 Tab 的结果数据给 ExportButton

#### 3.2.3 API 封装
- `algoApi.hello()` → GET
- `algoApi.hash(input)` → POST
- `algoApi.bubbleSort(numbers)` → POST
- `algoApi.export(type, data)` → POST (responseType: blob)

---

## 4. 接口设计

### 4.1 HelloWorld 接口
```
GET /api/algo/hello
Response 200:
{
  "code": 200,
  "data": {
    "message": "Hello, World!"
  }
}
```

### 4.2 哈希算法接口
```
POST /api/algo/hash
Content-Type: application/json
Body:
{
  "input": "test-string"
}

Response 200:
{
  "code": 200,
  "data": {
    "hashValue": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "algorithm": "SHA-256"
  }
}
```

### 4.3 冒泡排序接口
```
POST /api/algo/bubble-sort
Content-Type: application/json
Body:
{
  "numbers": [64, 34, 25, 12, 22, 11, 90]
}

Response 200:
{
  "code": 200,
  "data": {
    "sorted": [11, 12, 22, 25, 34, 64, 90],
    "comparisons": 21,
    "swaps": 10
  }
}
```

### 4.4 导出接口
```
POST /api/algo/export
Content-Type: application/json
Body:
{
  "type": "BUBBLE_SORT",
  "format": "CSV",
  "data": {
    "sorted": [11, 12, 22, 25, 34, 64, 90],
    "comparisons": 21,
    "swaps": 10
  }
}

Response 200:
Content-Type: text/csv (or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
Content-Disposition: attachment; filename="bubble_sort_result.csv"
Body: <binary stream>
```

---

## 5. 数据模型设计

本次功能为纯计算型，不涉及持久化存储。导出数据为临时生成，无需数据库表。

若后续需记录导出历史，可预留表结构：
```sql
CREATE TABLE algo_export_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  export_type VARCHAR(32) NOT NULL,
  format VARCHAR(16) NOT NULL,
  user_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_size INT
);
```

---

## 6. 异常处理与安全

### 6.1 异常码定义
| 错误码 | 含义               | 触发场景                     |
|--------|--------------------|------------------------------|
| 400    | 参数无效           | 输入为空、数组超长、格式错误 |
| 406    | 不支持的导出格式   | format 非 CSV/EXCEL          |
| 500    | 算法执行异常       | 内部计算溢出等               |

### 6.2 安全措施
- 哈希接口限制输入长度 ≤ 10KB，防止 DoS
- 冒泡排序限制数组长度 ≤ 10000，避免 O(n²) 超时
- 导出接口校验 `type` 白名单，禁止反射或动态类加载
- 所有接口启用 CORS 白名单（沿用项目配置）

---

## 7. 部署与依赖

### 7.1 新增依赖（后端）
```xml
<!-- 若导出 Excel -->
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.3</version>
</dependency>
<!-- 若导出 CSV -->
<dependency>
    <groupId>com.opencsv</groupId>
    <artifactId>opencsv</artifactId>
    <version>5.7.1</version>
</dependency>
```

### 7.2 前端依赖
- 无需新增核心依赖，使用项目现有 HTTP 客户端及 UI 组件库

---

## 8. 验证策略

| 验证项         | 方法                                     | 通过标准                     |
|----------------|------------------------------------------|------------------------------|
| 接口连通性     | Postman/curl 调用 /hello                 | 返回 200 + 正确 message      |
| 哈希正确性     | 对比在线 SHA-256 工具                    | 输出一致                     |
| 排序正确性     | 边界用例：空数组、单元素、逆序、全相同   | 结果有序 + 计数合理          |
| 导出完整性     | 下载文件后用 Excel/文本编辑器打开        | 内容与页面展示一致           |
| 前端Tab切换    | 手动切换 + 检查网络请求                  | 仅激活Tab发请求，状态保持    |
| 异常处理       | 发送非法参数                             | 返回对应错误码 + 友好提示    |

---

## 9. 风险与待决事项

| 风险点                 | 影响 | 缓解措施                           |
|------------------------|------|------------------------------------|
| 大数组排序阻塞主线程   | 高   | 限制长度；后续可改异步/WebWorker   |
| 导出文件编码乱码       | 中   | CSV 强制 UTF-8 BOM；Excel 指定编码 |
| 前端Tab状态丢失        | 低   | 使用 keep-alive 或持久化 state     |

**待确认**：
- 导出格式优先 CSV 还是 Excel？（默认实现两者，由前端传参决定）
- 冒泡排序是否需要返回每一步快照用于动画？（当前设计仅返回统计值，如需动画需额外字段）

---

*文档生成时间：2026-08-06*
*适用阶段：系统设计（系分）*
