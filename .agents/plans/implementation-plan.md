# 前端实施计划 — hello world-1.0T2 (library-frontend)

> 阶段：编码实现  
> 日期：2026-10-30  
> 关联需求：`library-backend/.agents/changeset/dima.md`  
> 关联设计：`library-backend/.agents/system.changes/design.md`  
> 状态：📝 待执行

---

## 零、前置说明

**关键发现**：当前 library-frontend 实现了一个"成本分析系统"（Cost Analysis），与需求定义的 "Hello World 功能集 + 埋点报表" 完全不符。本次实施计划将**重建前端**，使前端与后端 API 契约完全对齐。

**已有基础设施**（可保留）：
- Vite + React + TypeScript 脚手架 ✅
- Ant Design 组件库 ✅
- `src/api/client.ts`（axios 实例）✅

**后端 API 契约参考**：
- POST `/api/hello` → `{ message: "Hello, World!" }`（需要 body 含 userId/userType）
- POST `/api/hash` → `{ input, hash }`（body 含 input + algorithm + 用户信息）
- POST `/api/bubble-sort` → `{ original, sorted }`（body 含 array + 用户信息）
- POST `/api/export` → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`（body 含 tab + filters）
- GET `/api/stats?dimension=...&startDate=...&endDate=...&apiName=...` → `{ dimension, items: [{label, count}] }`

---

## 一、目标与范围

重建 library-frontend，交付：

1. **Demo 页面**：三个 Tab 分别展示 hello / hash / bubble-sort 接口结果
2. **报表区域**：同页面内嵌 ECharts 图表（折线/饼/柱状图），按人员类型/层级/部门维度筛选
3. **导出功能**：每个 Tab 的导出按钮，下载后端生成的 Excel 文件
4. **人员信息模拟**：页面顶部提供 userId/userType/level/department 输入区，每次请求携带

**不包含**：真实用户认证、数据库操作、成本分析功能（本次将移除现有成本分析页面）。

---

## 二、技术选型确认

| 项 | 选择 | 版本 |
|---|---|---|
| 框架 | React + TypeScript | 18.x |
| 构建 | Vite | 5.x |
| UI 组件 | Ant Design | 5.x |
| 图表 | ECharts (echarts-for-react) | 3.x |
| 路由 | react-router-dom | 6.x |
| HTTP | axios（已有） | - |

---

## 三、项目结构规划

```
library-frontend/
├── src/
│   ├── api/
│   │   ├── client.ts          # 已有 axios 实例，保留
│   │   └── demoApi.ts         # 新增：hello/hash/bubble-sort/export/stats API
│   ├── types/
│   │   └── demo.ts            # 新增：前端类型定义
│   ├── pages/
│   │   └── DemoPage.tsx       # 新增：主页面（Tab + 图表）
│   ├── components/
│   │   ├── UserInfoForm.tsx   # 新增：人员信息输入区
│   │   ├── HelloTab.tsx       # 新增：Hello World 结果展示
│   │   ├── HashTab.tsx        # 新增：哈希算法结果展示
│   │   ├── BubbleSortTab.tsx  # 新增：冒泡排序结果展示
│   │   └── StatsChart.tsx     # 新增：报表图表（折线/饼/柱状 + 维度筛选）
│   ├── App.tsx                # 修改：路由改为 / → DemoPage
│   └── main.tsx               # 保留
```

**移除文件**：
- `src/pages/Dashboard.tsx`（成本 Dashboard）
- `src/pages/CostAnalysis.tsx`（成本分析）
- `src/pages/ProjectCost.tsx`（项目成本）
- `src/api/costApi.ts`（成本 API）
- `src/types/cost.ts`（成本类型）
- `src/components/CostTrendChart.tsx`
- `src/components/DimensionFilter.tsx`
- `src/components/ProjectBudgetBar.tsx`
- `src/components/RoleCostPie.tsx`
- `src/components/StatCard.tsx`
- `src/hooks/useCostData.ts`

---

## 四、API 契约（与后端对齐）

### 4.1 通用请求体字段

所有业务接口 POST body 统一包含：

```json
{
  "userId": "user001",
  "userType": "EMPLOYEE",
  "level": "P6",
  "department": "技术部",
  "...接口特有字段..."
}
```

### 4.2 各接口请求/响应

| 接口 | 特有请求字段 | 响应 data |
|------|-------------|-----------|
| POST /api/hello | 无 | `{ message }` |
| POST /api/hash | `input`, `algorithm` | `{ input, hash }` |
| POST /api/bubble-sort | `array` | `{ original, sorted }` |
| POST /api/export | `tab`, `filters` | Blob (xlsx) |
| GET /api/stats | query: `dimension`, `startDate`, `endDate`, `apiName?` | `{ dimension, items: [{label, count}] }` |

---

## 五、实施任务拆分

### Task 1: 清理旧代码 + 建立类型与 API 层 [priority: high]

- 删除所有成本分析相关文件（见第三节"移除文件"列表）
- 创建 `src/types/demo.ts`：定义 `ApiRequest`, `ApiResponse<T>`, `StatsItem`, `StatsResponse`
- 创建 `src/api/demoApi.ts`：封装 5 个接口调用（hello/hash/bubbleSort/exportExcel/fetchStats）
- 修改 `src/api/client.ts`：确保 baseURL 指向后端 `http://localhost:8080`

### Task 2: 人员信息输入组件 [priority: high]

- 创建 `UserInfoForm.tsx`
- 四个字段：userId（文本）、userType（Select：EMPLOYEE/CONTRACTOR/INTERN）、level（文本）、department（文本）
- 使用 React Context 或状态提升，使子组件可获取当前人员信息

### Task 3: 三个业务 Tab 组件 [priority: high]

- `HelloTab.tsx`：按钮触发 hello 调用，展示返回的 message
- `HashTab.tsx`：输入框 + 算法选择（默认 SHA-256）+ 提交，展示 input/hash 结果
- `BubbleSortTab.tsx`：输入逗号分隔数字 + 排序按钮，展示 original/sorted
- 每个 Tab 含导出按钮（调用 export API，tab 参数对应 hello/hash/bubble-sort）

### Task 4: 报表图表组件 [priority: medium]

- `StatsChart.tsx`：
  - 维度下拉：userType / level / department
  - 图表类型切换：折线图 / 饼图 / 柱状图
  - 日期范围选择器（startDate / endDate）
  - apiName 可选过滤
  - ECharts 渲染 stats 数据

### Task 5: 主页面组装与路由 [priority: medium]

- 修改 `App.tsx`：
  - 路由 `/` → DemoPage
  - 移除 Dashboard/CostAnalysis/ProjectCost 路由
- 创建 `DemoPage.tsx`：
  - 顶部：UserInfoForm
  - 中部：Tabs（Hello / Hash / BubbleSort）
  - 底部：StatsChart 报表区域

---

## 六、全局约束（Global Constraints）

1. **API 契约不可降级**：所有请求/响应格式必须与后端 §4 契约严格一致
2. **人员信息**：每次 API 调用必须携带 userId/userType/level/department
3. **导出响应处理**：后端返回 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，前端必须正确 Blob 下载
4. **现有技术栈不变**：保持 React + TypeScript + Vite + Ant Design
5. **代码风格**：TypeScript 严格模式，函数组件 + Hooks，禁止 any 类型

---

## 七、验收标准

1. DemoPage 三 Tab 正常切换，各 Tab 能调用后端接口并展示结果
2. 人员信息变更后，后续 API 调用携带最新值
3. 每个 Tab 的导出按钮可下载有效的 xlsx 文件
4. 报表图表支持三种维度 + 三种图表类型切换
5. 日期筛选后图表数据正确更新
6. `npm run build` 无 TypeScript 错误
7. 前端开发服务器启动正常（`npm run dev`）