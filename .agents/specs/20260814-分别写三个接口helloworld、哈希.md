# 三个后端接口（HelloWorld / 哈希算法 / 冒泡排序）+ 前端 Tab 页面 + 导出 + 埋点看板 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现三个后端示例接口（HelloWorld / 哈希算法 / 冒泡排序）、前端含三个 Tab 分别展示各接口执行结果、导出按钮及后台导出接口、埋点统计调用次数和调用人信息、前端可视化报表（折线图/饼图/柱状图）按人员类型/层级/部门维度展示。

**现状分析：**
- **[library-frontend]** 前端代码已完整实现（Vue3 + Element Plus + ECharts），含 ApiDashboard.vue、HelloWorldPanel.vue、HashPanel.vue、SortPanel.vue、StatsDashboard.vue
- **[library-backend] Python FastAPI** 后端代码已完整实现，含所有 API 路由、埋点中间件、SQLite 追踪、导出、统计接口
- **[library-backend] Java Spring Boot** 后端仅项目骨架（pom.xml + BackendApplication.java + application.yml），尚未实现业务逻辑

**架构决策：** 选择 **Python FastAPI** 作为后端实现（已在 `src/main.py` 中完成），因为其代码更简洁、依赖少、开发效率高。Java Spring Boot 骨架保留作为参考。

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│                 前端 (Vue3 + Vite)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ApiDashboard.vue                                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐ │   │
│  │  │HelloWorld│ │ 哈希算法 │ │冒泡排序 │ │看板 │ │   │
│  │  │ Panel    │ │ Panel    │ │ Panel    │ │图表 │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────┘ │   │
│  │  [导出按钮 → 弹出对话框 → 选择类型/格式 → 下载]   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │ HTTP REST (axios)              │
│                         │ + 请求头埋点信息               │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│             后端 (Python FastAPI)                        │
│  ┌──────────────┐  ┌──────────────────────┐            │
│  │ API 路由     │  │ 埋点 Middleware      │            │
│  │ GET /api/hello│  │ 自动拦截 /api/* 请求 │            │
│  │ POST /api/hash│  │ 提取 X-Caller-Name  │            │
│  │ POST /api/sort│  │ X-Person-Type/Level/Dept        │
│  │ GET /api/export│  └──────────┬───────────┘            │
│  │ GET /api/stats/│             │                        │
│  │     overview   │             ▼                        │
│  └──────────────┘  ┌──────────────────────┐            │
│                    │ SQLite (tracking.db)  │            │
│                    │ api_tracking_log 表   │            │
│                    └──────────────────────┘            │
└──────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- 前端: Vue 3 (Composition API) + Vite + Element Plus + ECharts 5 + axios
- 后端: Python 3.12 + FastAPI + uvicorn + SQLite3
- 接口: RESTful JSON

---

## 文件结构

### 后端 (library-backend) — Python FastAPI 实现

```
src/
├── main.py          # FastAPI 应用入口，所有路由、中间件、CORS
├── models.py        # Pydantic 数据模型 (ApiResponse, HelloResult, HashRequest, HashResult, SortRequest, SortResult)
├── services.py      # 业务逻辑 (get_hello, compute_hash, bubble_sort)
├── database.py      # SQLite 数据库操作 (init_db, insert_log, get_overview)
└── tracking.db      # SQLite 数据库文件 (运行时生成)
```

### 前端 (library-frontend) — Vue3 实现

```
src/
├── App.vue                    # 根组件，含 router-view
├── main.js                    # Vue 应用入口，注册 ElementPlus + Router
├── router/index.js            # 路由配置 (/ → /dashboard)
├── api/dashboard.js           # API 封装层 (getHello, computeHash, sortNumbers, getStatsOverview, getExportUrl)
├── utils/request.js           # Axios 实例，含拦截器 + 埋点请求头
├── views/ApiDashboard.vue     # 主页面：Tab 容器 + 导出对话框
└── components/
    ├── HelloWorldPanel.vue    # Tab1: HelloWorld 接口演示
    ├── HashPanel.vue          # Tab2: 哈希算法接口演示
    ├── SortPanel.vue          # Tab3: 冒泡排序接口演示
    └── StatsDashboard.vue     # Tab4: 调用统计看板（折线图 + 饼图 + 柱状图）
```

---

## 任务 1: 后端 — Python FastAPI 项目脚手架

**Files:**
- 已存在: `src/main.py`, `src/models.py`, `src/services.py`, `src/database.py`
- 确认: `src/requirements.txt` 不存在，需创建

**Interfaces:**
- Produces: FastAPI 应用，可 `uvicorn main:app --port 8080` 启动

- [ ] **Step 1: 创建 requirements.txt**

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
```

- [ ] **Step 2: 验证启动**

```bash
cd /path/to/library-backend/src
pip install -r requirements.txt
python main.py
```
预期: uvicorn 启动在 `http://0.0.0.0:8080`

---

## 任务 2: 后端 — 数据模型 (models.py)

**Files:**
- 已创建: `src/models.py`

**Interfaces:**
- Produces: `ApiResponse`, `HelloResult`, `HashRequest`, `HashResult`, `SortRequest`, `SortResult`

- [ ] **Step 1: 确认 models.py 内容**

```python
from pydantic import BaseModel
from typing import Optional, List

class ApiResponse(BaseModel):
    code: int = 200
    message: str = "success"
    data: object = None

class HelloResult(BaseModel):
    greeting: str
    timestamp: str

class HashRequest(BaseModel):
    input: str
    algorithm: str = "SHA-256"

class HashResult(BaseModel):
    input: str
    algorithm: str
    hashResult: str

class SortRequest(BaseModel):
    numbers: List[int]
    order: str = "asc"

class SortResult(BaseModel):
    originalArray: List[int]
    sortedArray: List[int]
    order: str
    swapCount: int
    executionTimeMs: float
```

---

## 任务 3: 后端 — 业务逻辑层 (services.py)

**Files:**
- 已创建: `src/services.py`

**Interfaces:**
- Produces: `get_hello() -> HelloResult`, `compute_hash(input, algorithm) -> HashResult`, `bubble_sort(numbers, order) -> SortResult`

- [ ] **Step 1: 确认 services.py 内容**

```python
import hashlib
import time
from datetime import datetime
from typing import List
from models import HelloResult, HashResult, SortResult

def get_hello() -> HelloResult:
    return HelloResult(
        greeting="Hello World! Welcome to Library System",
        timestamp=datetime.now().isoformat()
    )

def compute_hash(input_str: str, algorithm: str = "SHA-256") -> HashResult:
    alg = algorithm or "SHA-256"
    h = hashlib.new(alg.replace("-", "").lower())
    h.update(input_str.encode("utf-8"))
    return HashResult(
        input=input_str,
        algorithm=alg,
        hashResult=h.hexdigest()
    )

def bubble_sort(numbers: List[int], order: str = "asc") -> SortResult:
    arr = list(numbers)
    n = len(arr)
    swap_count = 0
    start = time.time()
    ascending = order != "desc"
    for i in range(n - 1):
        for j in range(n - 1 - i):
            need_swap = arr[j] > arr[j + 1] if ascending else arr[j] < arr[j + 1]
            if need_swap:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swap_count += 1
    elapsed = (time.time() - start) * 1000
    return SortResult(
        originalArray=numbers,
        sortedArray=arr,
        order="asc" if ascending else "desc",
        swapCount=swap_count,
        executionTimeMs=round(elapsed, 2)
    )
```

---

## 任务 4: 后端 — 数据库层 + 埋点 (database.py)

**Files:**
- 已创建: `src/database.py`

**Interfaces:**
- Produces: `init_db()`, `insert_log(...)`, `get_overview() -> dict`

- [ ] **Step 1: 确认数据库初始化**

建表 `api_tracking_log`:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK AUTO | 主键 |
| api_name | TEXT | 接口名称 |
| caller_name | TEXT | 调用人 |
| person_type | TEXT | 人员类型 |
| person_level | TEXT | 人员层级 |
| person_dept | TEXT | 人员部门 |
| call_time | TEXT | 调用时间 |
| response_time_ms | REAL | 响应耗时(ms) |
| status | TEXT | 状态 |

- [ ] **Step 2: 确认 get_overview() 返回结构**

```json
{
  "totalCalls": 1024,
  "byApi": {"hello": 350, "hash": 420, "sort": 254},
  "byDimension": {
    "personType": [{"label": "管理员", "value": 400}],
    "personLevel": [{"label": "中级", "value": 500}],
    "personDept": [{"label": "技术部", "value": 450}]
  },
  "trend": [{"date": "2025-01-07", "count": 120}]
}
```

---

## 任务 5: 后端 — API 路由 + 中间件 (main.py)

**Files:**
- 已创建: `src/main.py`

**Interfaces — API 端点:**

| 方法 | 路径 | 说明 | 请求/响应 |
|------|------|------|-----------|
| GET | `/api/hello` | HelloWorld | → `ApiResponse<HelloResult>` |
| POST | `/api/hash` | 哈希计算 | Body: `HashRequest` → `ApiResponse<HashResult>` |
| POST | `/api/sort` | 冒泡排序 | Body: `SortRequest` → `ApiResponse<SortResult>` |
| GET | `/api/export?type=hello\|hash\|sort&format=json\|csv` | 导出 | 文件下载 (StreamingResponse) |
| GET | `/api/stats/overview` | 统计概览 | → `ApiResponse<overview>` |

- [ ] **Step 1: 确认路由实现**

```python
# --- Routes ---
@app.get("/api/hello")
def hello():
    return ApiResponse(data=get_hello().model_dump())

@app.post("/api/hash")
def hash_endpoint(req: HashRequest):
    result = compute_hash(req.input, req.algorithm)
    return ApiResponse(data=result.model_dump())

@app.post("/api/sort")
def sort_endpoint(req: SortRequest):
    result = bubble_sort(req.numbers, req.order)
    return ApiResponse(data=result.model_dump())

@app.get("/api/export")
def export_endpoint(type: str = Query(...), format: str = Query("json")):
    # 根据 type 获取对应数据，format=json/csv 返回 StreamingResponse
    ...

@app.get("/api/stats/overview")
def stats_overview():
    data = get_overview()
    return ApiResponse(data=data)
```

- [ ] **Step 2: 确认埋点中间件**

```python
@app.middleware("http")
async def tracking_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = (time.time() - start) * 1000
    # 仅追踪 /api/ 路径
    if not request.url.path.startswith("/api/"):
        return response
    # 提取请求头中的埋点信息
    caller_name = request.headers.get("x-caller-name", "anonymous")
    person_type = request.headers.get("x-person-type")
    person_level = request.headers.get("x-person-level")
    person_dept = request.headers.get("x-person-dept")
    # 写入数据库
    insert_log(...)
    return response
```

---

## 任务 6: 前端 — 项目脚手架（已实现）

**Files:**
- 已创建: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.vue`, `src/router/index.js`, `src/utils/request.js`

- [ ] **Step 1: 确认依赖**

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "element-plus": "^2.5.0",
    "axios": "^1.6.0",
    "echarts": "^5.4.0"
  }
}
```

- [ ] **Step 2: 确认 request.js 埋点请求头**

```javascript
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Caller-Name': 'demo-user',
    'X-Person-Type': '管理员',
    'X-Person-Level': '中级',
    'X-Person-Dept': '技术部'
  }
})
```

- [ ] **Step 3: 确认 vite.config.js 代理**

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
}
```

---

## 任务 7: 前端 — API 封装层（已实现）

**Files:**
- 已创建: `src/api/dashboard.js`

- [ ] **Step 1: 确认 API 函数签名**

```javascript
export function getHello()                    // GET /hello
export function computeHash(input, algorithm) // POST /hash
export function sortNumbers(numbers, order)   // POST /sort
export function getStatsOverview()            // GET /stats/overview
export function getExportUrl(type, format)    // 导出 URL
```

---

## 任务 8: 前端 — 主页面 ApiDashboard.vue（已实现）

**Files:**
- 已创建: `src/views/ApiDashboard.vue`

**关键交互：**
- `el-tabs` 四个 Tab：Hello World / 哈希算法 / 冒泡排序 / 调用统计看板
- 右上角「导出数据」按钮 → 弹出对话框 → 选择类型(hello/hash/sort) + 格式(json/csv) → `window.open(getExportUrl(...))`

---

## 任务 9: 前端 — HelloWorldPanel 组件（已实现）

**Files:**
- 已创建: `src/components/HelloWorldPanel.vue`

**交互：** 点击「调用接口」按钮 → `getHello()` → 展示 greeting + timestamp

---

## 任务 10: 前端 — HashPanel 组件（已实现）

**Files:**
- 已创建: `src/components/HashPanel.vue`

**交互：** 输入文本 + 选择算法(MD5/SHA-256/SHA-512) → 点击「计算哈希」→ `computeHash()` → 展示 hashResult

---

## 任务 11: 前端 — SortPanel 组件（已实现）

**Files:**
- 已创建: `src/components/SortPanel.vue`

**交互：** 输入逗号分隔数字 + 选择排序顺序(asc/desc) → 点击「开始排序」→ `sortNumbers()` → 展示 sortedArray + swapCount + executionTimeMs

---

## 任务 12: 前端 — StatsDashboard 组件（已实现）

**Files:**
- 已创建: `src/components/StatsDashboard.vue`

**图表布局：**

```
┌─────────────────────────────────────────────────────┐
│ [维度筛选: 人员类型 ▼]         总调用次数: 1024      │
├──────────────────────────┬──────────────────────────┤
│ 调用趋势（近7天）        │ 维度分布（饼图）         │
│   折线图                 │   饼图                    │
│                          │                          │
├──────────────────────────┴──────────────────────────┤
│ 各接口调用量对比（柱状图）                            │
│   柱状图                                             │
└─────────────────────────────────────────────────────┘
```

**维度联动：**
- 切换「人员类型/人员层级/人员部门」→ 饼图更新
- 折线图展示近7日调用趋势
- 柱状图展示三个接口的调用量对比

---

## 任务 13: 全链路集成验证

- [ ] **Step 1: 启动后端**

```bash
cd /path/to/library-backend/src
python main.py
```
预期: `Uvicorn running on http://0.0.0.0:8080`

- [ ] **Step 2: 启动前端**

```bash
cd /path/to/library-frontend
npm install
npm run dev
```
预期: Vite 启动在 `http://localhost:3000`

- [ ] **Step 3: 测试 Hello 接口**

```bash
curl http://localhost:8080/api/hello
```
预期: `{"code":200,"message":"success","data":{"greeting":"Hello World! Welcome to Library System","timestamp":"..."}}`

- [ ] **Step 4: 测试 Hash 接口**

```bash
curl -X POST http://localhost:8080/api/hash \
  -H "Content-Type: application/json" \
  -d '{"input":"test","algorithm":"SHA-256"}'
```
预期: 返回哈希结果

- [ ] **Step 5: 测试 Sort 接口**

```bash
curl -X POST http://localhost:8080/api/sort \
  -H "Content-Type: application/json" \
  -d '{"numbers":[3,1,4,1,5],"order":"asc"}'
```
预期: 返回排序后数组及交换次数

- [ ] **Step 6: 测试导出接口**

```bash
curl -o result.json "http://localhost:8080/api/export?type=hello&format=json"
```
预期: 下载 JSON 文件

```bash
curl -o result.csv "http://localhost:8080/api/export?type=hello&format=csv"
```
预期: 下载 CSV 文件

- [ ] **Step 7: 测试统计接口**

```bash
curl http://localhost:8080/api/stats/overview
```
预期: 返回统计数据，包含 totalCalls, byApi, byDimension, trend

- [ ] **Step 8: 浏览器验证**

打开 `http://localhost:3000/dashboard`，验证：
- 四个 Tab 可正常切换
- Hello World Tab 点击「调用接口」展示结果
- 哈希算法 Tab 输入文本 + 选择算法，点击计算展示结果
- 冒泡排序 Tab 输入数字，点击排序展示结果
- 调用统计看板 Tab 展示三种图表，维度切换联动
- 导出按钮弹出对话框，选择类型和格式后下载文件

---

## 仓间对齐点

| 对齐点 | 前端 | 后端 |
|--------|------|------|
| API 基础路径 | `baseURL: '/api'` → 代理到 `localhost:8080` | 统一前缀 `/api` |
| 请求头埋点 | 每次请求携带 X-Caller-Name, X-Person-Type, X-Person-Level, X-Person-Dept | 中间件统一解析请求头 |
| 统一响应格式 | 拦截器解析 `{code, message, data}` | `ApiResponse` 统一包装 |
| 导出格式 | 支持 JSON/CSV 下载 (window.open) | 根据 format 参数返回不同 Content-Type |
| 统计维度 | 传递 dimension 参数(pie联动) | 按 dimension 分组聚合查询 |

## 自检清单

1. **Spec 覆盖**: 三个接口 ✓ / 前端 Tab 页面 ✓ / 导出按钮+接口 ✓ / 埋点统计 ✓ / 三种图表 ✓ / 维度筛选 ✓
2. **占位符检查**: 无 TBD/TODO — 所有代码已完整实现
3. **类型一致性**: 前端 API 调用与后端接口签名完全匹配
4. **仓间对齐**: request.js 请求头与后端中间件解析字段一致