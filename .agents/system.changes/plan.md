# 成本统计报表系统 — 前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建成本统计报表系统前端应用，实现 Dashboard 总览、多维度成本统计分析、人力/项目成本展示、数据录入/导入/导出及 RBAC 权限控制。

**Architecture:** React SPA 通过 Vite dev proxy 或生产环境 Nginx 反向代理访问后端 API Gateway（`/api/*`），JWT 鉴权，Zustand 管理全局状态。

**Tech Stack:**
- React 18 + TypeScript 5 + Vite 5
- Ant Design 5 + @ant-design/icons
- ECharts 5 + echarts-for-react
- React Router 6 (createBrowserRouter)
- Zustand (状态管理)
- Axios (HTTP 请求)
- dayjs (日期处理)

**后端 API 依赖（跨库契约）：**
- `auth-service` (8081): 登录/登出/用户/角色管理
- `base-data-service` (8082): 部门/项目/业务线/人员 CRUD
- `cost-core-service` (8083): 成本录入/导入/记录管理
- `report-service` (8084): Dashboard/分析/导出
- 统一入口: API Gateway (8080)，路由前缀 `/api/`

---

## Global Constraints

- Node.js ≥ 18，pnpm 作为包管理器
- 所有 API 响应统一格式 `{ code: number, message: string, data: T, timestamp: number }`
- 分页响应 `{ list: T[], total: number, pageNum: number, pageSize: number }`
- JWT Token 存 localStorage，有效期 24h，请求头 `Authorization: Bearer <token>`
- 前端路由使用 React Router v6 createBrowserRouter，页面组件使用函数组件 + Hooks
- 成本金额 `number` 类型，展示时保留两位小数，前缀 ¥
- RBAC 三角色：admin / dept_manager / viewer
- 导出格式仅 Excel (.xlsx)
- 时间粒度参数 `timeGranularity`：month / quarter / year
- 预计超支金额 = MAX(实际消耗 − 项目预算, 0)

---

## File Structure

```
library-frontend-main/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── public/
└── src/
    ├── main.tsx                               # 入口
    ├── App.tsx                                # 路由配置
    ├── api/                                   # API 请求封装
    │   ├── request.ts                         # Axios 实例 + 拦截器
    │   ├── auth.ts                            # 认证接口
    │   ├── baseData.ts                        # 基础数据接口
    │   ├── cost.ts                            # 成本数据接口
    │   └── report.ts                          # 报表统计接口
    ├── types/                                 # TypeScript 类型
    │   ├── api.ts                             # 通用响应类型
    │   ├── auth.ts                            # 认证类型
    │   ├── baseData.ts                        # 基础数据类型
    │   ├── cost.ts                            # 成本类型
    │   └── report.ts                          # 报表类型
    ├── store/                                 # Zustand 状态管理
    │   ├── useAuthStore.ts                    # 认证状态
    │   └── useFilterStore.ts                  # 筛选条件状态
    ├── layouts/
    │   └── MainLayout.tsx                     # 侧边栏 + 顶栏布局
    ├── components/                            # 通用组件
    │   ├── Charts/
    │   │   ├── LineChart.tsx                  # 折线图
    │   │   ├── PieChart.tsx                   # 饼图
    │   │   └── BarChart.tsx                   # 柱状图
    │   ├── StatCard/index.tsx                 # 统计卡片
    │   ├── FilterBar/index.tsx                # 通用筛选栏
    │   ├── ExportButton/index.tsx             # 导出按钮
    │   └── AuthRoute/index.tsx                # 路由守卫
    ├── pages/
    │   ├── Login/index.tsx                    # 登录页
    │   ├── Dashboard/index.tsx                # Dashboard 总览
    │   ├── CostAnalysis/index.tsx             # 成本统计分析
    │   ├── LaborCost/index.tsx                # 人力成本
    │   ├── ProjectCost/index.tsx              # 项目成本
    │   ├── DataEntry/index.tsx                # 数据录入
    │   ├── DataImport/index.tsx               # 数据导入
    │   ├── ReportExport/index.tsx             # 报表导出
    │   └── System/
    │       ├── UserManage/index.tsx           # 用户管理
    │       └── RoleManage/index.tsx           # 角色管理
    └── utils/
        ├── format.ts                          # 金额/日期格式化
        └── constants.ts                       # 常量定义
```

---

## Task 1: 前端项目脚手架搭建

**Files:**
- Create: `library-frontend-main/package.json`
- Create: `library-frontend-main/tsconfig.json`
- Create: `library-frontend-main/tsconfig.node.json`
- Create: `library-frontend-main/vite.config.ts`
- Create: `library-frontend-main/index.html`
- Create: `library-frontend-main/src/main.tsx`
- Create: `library-frontend-main/src/App.tsx`
- Create: `library-frontend-main/src/api/request.ts`
- Create: `library-frontend-main/src/types/api.ts`
- Create: `library-frontend-main/src/utils/format.ts`
- Create: `library-frontend-main/src/utils/constants.ts`
- Create: `library-frontend-main/src/store/useAuthStore.ts`

**Interfaces:**
- Produces: Axios 实例 `request` — 自动附加 JWT Token、统一错误处理、401 自动跳转登录
- Produces: `ApiResponse<T>` 类型 — `{ code: number; message: string; data: T; timestamp: number }`
- Produces: `PageResponse<T>` 类型 — `{ list: T[]; total: number; pageNum: number; pageSize: number }`
- Produces: `useAuthStore` — Zustand store，管理 token/user/login/logout/hasRole

- [ ] **Step 1: 初始化项目**

Run:
```bash
cd library-frontend-main
pnpm create vite . --template react-ts
```

- [ ] **Step 2: 安装依赖**

Run:
```bash
pnpm add antd @ant-design/icons echarts echarts-for-react react-router-dom zustand axios dayjs
pnpm add -D @types/react @types/react-dom
```

- [ ] **Step 3: 配置 vite.config.ts**

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

- [ ] **Step 4: 创建 API 请求封装 src/api/request.ts**

```typescript
import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    message.error(error.response?.data?.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request;
```

- [ ] **Step 5: 创建类型定义 src/types/api.ts**

```typescript
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}
```

- [ ] **Step 6: 创建 Zustand Auth Store**

```typescript
// src/store/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  name: string | null;
  roles: string[];
  setAuth: (token: string, username: string, name: string, roles: string[]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  name: localStorage.getItem('name'),
  roles: JSON.parse(localStorage.getItem('roles') || '[]'),

  setAuth: (token, username, name, roles) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('name', name);
    localStorage.setItem('roles', JSON.stringify(roles));
    set({ token, username, name, roles });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('roles');
    set({ token: null, username: null, name: null, roles: [] });
  },

  isAuthenticated: () => !!get().token,
  hasRole: (role) => get().roles.includes(role),
}));
```

- [ ] **Step 7: 创建工具函数**

```typescript
// src/utils/format.ts
export const formatMoney = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const roleTypeLabel: Record<string, string> = {
  dev: '开发', test: '测试', product: '产品', ops: '运维',
};

export const costTypeLabel: Record<string, string> = {
  labor: '人力成本', infra: '基础设施', license: '许可证', travel: '差旅', other: '其他',
};
```

```typescript
// src/utils/constants.ts
export const PERIOD_OPTIONS = [
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年度', value: 'year' },
  { label: '自定义', value: 'custom' },
];

export const COST_TYPES = [
  { label: '人力成本', value: 'labor' },
  { label: '基础设施', value: 'infra' },
  { label: '许可证', value: 'license' },
  { label: '差旅', value: 'travel' },
  { label: '其他', value: 'other' },
];

export const ROLE_TYPES = [
  { label: '开发', value: 'dev' },
  { label: '测试', value: 'test' },
  { label: '产品', value: 'product' },
  { label: '运维', value: 'ops' },
];

export const TIME_GRANULARITY = [
  { label: '月份', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年度', value: 'year' },
];
```

- [ ] **Step 8: 创建入口文件 src/main.tsx + src/App.tsx**

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
```

```tsx
// src/App.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

const router = createBrowserRouter([
  { path: '/login', lazy: () => import('./pages/Login') },
  {
    path: '/',
    lazy: () => import('./layouts/MainLayout'),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', lazy: () => import('./pages/Dashboard') },
      { path: 'cost/analysis', lazy: () => import('./pages/CostAnalysis') },
      { path: 'cost/labor', lazy: () => import('./pages/LaborCost') },
      { path: 'cost/project', lazy: () => import('./pages/ProjectCost') },
      { path: 'cost/entry', lazy: () => import('./pages/DataEntry') },
      { path: 'cost/import', lazy: () => import('./pages/DataImport') },
      { path: 'cost/export', lazy: () => import('./pages/ReportExport') },
      { path: 'system/users', lazy: () => import('./pages/System/UserManage') },
      { path: 'system/roles', lazy: () => import('./pages/System/RoleManage') },
    ],
  },
]);

const App: React.FC = () => <RouterProvider router={router} />;
export default App;
```

- [ ] **Step 9: 验证构建**

Run:
```bash
cd library-frontend-main && pnpm build
```
Expected: 构建成功（页面文件尚未创建，路由 lazy import 暂不报错即可；若报错则先创建空壳页面文件）

---

## Task 2: 前端布局 + 登录页 + 路由守卫

**Files:**
- Create: `library-frontend-main/src/layouts/MainLayout.tsx`
- Create: `library-frontend-main/src/components/AuthRoute/index.tsx`
- Create: `library-frontend-main/src/pages/Login/index.tsx`
- Create: `library-frontend-main/src/api/auth.ts`
- Create: `library-frontend-main/src/types/auth.ts`

**Interfaces:**
- Consumes: `useAuthStore` from store
- Consumes: `POST /api/auth/login` → `{ token, username, name, roles }`
- Produces: `MainLayout` — Ant Design Sider 侧边栏布局，含菜单导航和用户退出
- Produces: `AuthRoute` — 路由守卫组件，未登录重定向到 /login，角色不匹配重定向到 /dashboard

**跨库契约:**
| 接口 | 方法 | 路径 | 请求体 | 响应 data |
|------|------|------|--------|----------|
| 登录 | POST | `/api/auth/login` | `{ username: string, password: string }` | `{ token: string, username: string, name: string, roles: string[] }` |
| 登出 | POST | `/api/auth/logout` | — | `null` |

- [ ] **Step 1: 创建 auth API + 类型**

```typescript
// src/api/auth.ts
import request from './request';
import { ApiResponse } from '../types/api';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  username: string;
  name: string;
  roles: string[];
}

export const loginApi = (params: LoginParams): Promise<ApiResponse<LoginResult>> =>
  request.post('/auth/login', params);

export const logoutApi = (): Promise<ApiResponse<null>> =>
  request.post('/auth/logout');
```

```typescript
// src/types/auth.ts
export interface UserInfo {
  id: number;
  username: string;
  name: string;
  deptId: number | null;
  status: number;
  roles: string[];
}
```

- [ ] **Step 2: 创建 MainLayout**

```tsx
// src/layouts/MainLayout.tsx
import React from 'react';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import {
  DashboardOutlined, BarChartOutlined, TeamOutlined,
  ProjectOutlined, EditOutlined, UploadOutlined,
  DownloadOutlined, SettingOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/cost/analysis', icon: <BarChartOutlined />, label: '成本分析' },
  { key: '/cost/labor', icon: <TeamOutlined />, label: '人力成本' },
  { key: '/cost/project', icon: <ProjectOutlined />, label: '项目成本' },
  { key: '/cost/entry', icon: <EditOutlined />, label: '数据录入' },
  { key: '/cost/import', icon: <UploadOutlined />, label: '数据导入' },
  { key: '/cost/export', icon: <DownloadOutlined />, label: '报表导出' },
  {
    key: '/system', icon: <SettingOutlined />, label: '系统管理',
    children: [
      { key: '/system/users', label: '用户管理' },
      { key: '/system/roles', label: '角色管理' },
    ],
  },
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text strong style={{ color: '#fff', fontSize: 18 }}>成本统计报表</Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/system']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Space>
            <Text>{name || '用户'}</Text>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
          </Space>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
```

- [ ] **Step 3: 创建 AuthRoute 路由守卫**

```tsx
// src/components/AuthRoute/index.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children, requiredRole }) => {
  const { token, roles } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
```

- [ ] **Step 4: 创建 Login 页面**

```tsx
// src/pages/Login/index.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';

const { Title } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await loginApi(values);
      const { token, username, name, roles } = res.data;
      setAuth(token, username, name, roles);
      message.success('登录成功');
      navigate('/dashboard');
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>成本统计报表系统</Title>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
```

- [ ] **Step 5: 验证**

Run:
```bash
cd library-frontend-main && pnpm dev
```
Expected: 访问 http://localhost:5173 自动跳转到 /login，展示登录页面

---

## Task 3: Dashboard 页面

**Files:**
- Create: `library-frontend-main/src/api/report.ts`
- Create: `library-frontend-main/src/types/report.ts`
- Create: `library-frontend-main/src/components/StatCard/index.tsx`
- Create: `library-frontend-main/src/components/Charts/LineChart.tsx`
- Create: `library-frontend-main/src/components/Charts/PieChart.tsx`
- Create: `library-frontend-main/src/components/Charts/BarChart.tsx`
- Create: `library-frontend-main/src/pages/Dashboard/index.tsx`

**Interfaces:**
- Consumes: `GET /api/report/dashboard` → `DashboardData`
- Produces: Dashboard 页面含 4 个统计卡片（总成本、本月成本、预算执行率、超支预警）+ 4 个图表（趋势折线图、成本占比饼图、部门对比柱状图、项目预算执行进度条）

**跨库契约:**
| 接口 | 方法 | 路径 | 响应 data 结构 |
|------|------|------|---------------|
| Dashboard | GET | `/api/report/dashboard` | `{ totalCost, monthCost, monthCostGrowthRate, budgetExecutionRate, overBudgetProjectCount, trendData[], typeDistribution[], deptComparison[], projectBudget[] }` |

- [ ] **Step 1: 创建 report API + 类型**

```typescript
// src/api/report.ts
import request from './request';
import { ApiResponse } from '../types/api';

export interface DashboardData {
  totalCost: number;
  monthCost: number;
  monthCostGrowthRate: number;
  budgetExecutionRate: number;
  overBudgetProjectCount: number;
  trendData: Array<{ period: string; amount: number }>;
  typeDistribution: Array<{ costType: string; amount: number }>;
  deptComparison: Array<{ deptName: string; amount: number }>;
  projectBudget: Array<{ projectName: string; budget: number; actual: number; rate: number }>;
}

export interface AnalysisParams {
  deptId?: number;
  projectId?: number;
  bizLineId?: number;
  employeeId?: number;
  roleType?: string;
  periodStart?: string;
  periodEnd?: string;
  costType?: string;
  timeGranularity?: string;
  groupBy?: string;
}

export const getDashboard = (): Promise<ApiResponse<DashboardData>> =>
  request.get('/report/dashboard');

export const getAnalysis = (params: AnalysisParams): Promise<ApiResponse<any[]>> =>
  request.get('/report/analysis', { params });

export const getLaborCost = (params: { periodStart: string; periodEnd: string; timeGranularity?: string }): Promise<ApiResponse<any[]>> =>
  request.get('/report/labor', { params });

export const getProjectCost = (): Promise<ApiResponse<any[]>> =>
  request.get('/report/project');

export const getTrend = (params: { periodStart: string; periodEnd: string; timeGranularity?: string }): Promise<ApiResponse<any[]>> =>
  request.get('/report/trend', { params });

export const exportReport = (params: AnalysisParams): Promise<Blob> =>
  request.post('/report/export', params, { responseType: 'blob' });
```

```typescript
// src/types/report.ts
export interface AnalysisItem {
  groupName: string;
  groupId: string | number;
  amount: number;
  recordCount: number;
}

export interface LaborCostItem {
  roleType: string;
  amount: number;
  headCount: number;
}

export interface ProjectCostItem {
  projectName: string;
  budget: number;
  actual: number;
  rate: number;
}

export interface TrendItem {
  period: string;
  amount: number;
}
```

- [ ] **Step 2: 创建 StatCard 组件**

```tsx
// src/components/StatCard/index.tsx
import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  growthRate?: number;
  precision?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, suffix, growthRate, precision = 2 }) => (
  <Card>
    <Statistic
      title={title}
      value={value}
      prefix={prefix}
      suffix={suffix}
      precision={precision}
    />
    {growthRate !== undefined && (
      <Typography.Text type={growthRate >= 0 ? 'danger' : 'success'} style={{ fontSize: 12 }}>
        {growthRate >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {` ${Math.abs(growthRate).toFixed(1)}%`}
      </Typography.Text>
    )}
  </Card>
);

export default StatCard;
```

- [ ] **Step 3: 创建 ECharts 图表组件**

```tsx
// src/components/Charts/LineChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface LineChartProps {
  title: string;
  data: Array<{ period: string; amount: number }>;
}

const LineChart: React.FC<LineChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>金额: ¥{c}' },
    xAxis: { type: 'category', data: data.map(d => d.period) },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{ type: 'line', data: data.map(d => d.amount), smooth: true, areaStyle: { opacity: 0.15 } }],
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default LineChart;
```

```tsx
// src/components/Charts/PieChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { costTypeLabel } from '../../utils/format';

interface PieChartProps {
  title: string;
  data: Array<{ costType: string; amount: number }>;
}

const PieChart: React.FC<PieChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '65%'],
      data: data.map(d => ({ name: costTypeLabel[d.costType] || d.costType, value: d.amount })),
      label: { formatter: '{b}\n{d}%' },
    }],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default PieChart;
```

```tsx
// src/components/Charts/BarChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface BarChartProps {
  title: string;
  data: Array<{ deptName: string; amount: number }>;
}

const BarChart: React.FC<BarChartProps> = ({ title, data }) => {
  const option = {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>金额: ¥{c}' },
    xAxis: { type: 'category', data: data.map(d => d.deptName), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{ type: 'bar', data: data.map(d => d.amount), itemStyle: { borderRadius: [4, 4, 0, 0] } }],
    grid: { left: 60, right: 20, top: 40, bottom: 50 },
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default BarChart;
```

- [ ] **Step 4: 创建 Dashboard 页面**

```tsx
// src/pages/Dashboard/index.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Typography, Spin } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import StatCard from '../../components/StatCard';
import LineChart from '../../components/Charts/LineChart';
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import { getDashboard, DashboardData } from '../../api/report';
import { formatMoney, formatPercent } from '../../utils/format';

const { Text } = Typography;

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <StatCard title="总成本" value={data.totalCost} prefix="¥" precision={2} growthRate={data.monthCostGrowthRate} />
        </Col>
        <Col span={6}>
          <StatCard title="本月成本" value={data.monthCost} prefix="¥" precision={2} />
        </Col>
        <Col span={6}>
          <StatCard title="预算执行率" value={data.budgetExecutionRate} suffix="%" precision={1} />
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="超支预警" value={data.overBudgetProjectCount} suffix="个项目" prefix={<WarningOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card><LineChart title="月度成本趋势" data={data.trendData} /></Card>
        </Col>
        <Col span={12}>
          <Card><PieChart title="成本类型占比" data={data.typeDistribution} /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card><BarChart title="部门成本对比" data={data.deptComparison} /></Card>
        </Col>
        <Col span={12}>
          <Card title="项目预算执行">
            {data.projectBudget.map((p, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{p.projectName}</Text>
                  <Text type="secondary">{formatPercent(p.rate)}</Text>
                </div>
                <Progress percent={Math.min(p.rate, 100)} status={p.rate > 100 ? 'exception' : 'active'} showInfo={false} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <Text type="secondary">预算: {formatMoney(p.budget)}</Text>
                  <Text type="secondary">实际: {formatMoney(p.actual)}</Text>
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 5: 验证**

Run:
```bash
cd library-frontend-main && pnpm dev
```
Expected: 登录后进入 /dashboard，页面渲染 4 个统计卡片 + 4 个图表区域（后端未启动时显示 loading 或报错，结构正确即可）

---

## Task 4: 成本统计分析 + 人力成本 + 项目成本页面

**Files:**
- Create: `library-frontend-main/src/components/FilterBar/index.tsx`
- Create: `library-frontend-main/src/api/baseData.ts`
- Create: `library-frontend-main/src/types/baseData.ts`
- Create: `library-frontend-main/src/store/useFilterStore.ts`
- Create: `library-frontend-main/src/pages/CostAnalysis/index.tsx`
- Create: `library-frontend-main/src/pages/LaborCost/index.tsx`
- Create: `library-frontend-main/src/pages/ProjectCost/index.tsx`

**Interfaces:**
- Consumes: `GET /api/report/analysis`, `GET /api/report/labor`, `GET /api/report/project`
- Consumes: `GET /api/base/departments`, `GET /api/base/projects`, `GET /api/base/business-lines`, `GET /api/base/employees`
- Produces: 成本分析页 — 筛选栏 + 表格 + 图表联动，支持 groupBy 多维度切换
- Produces: 人力成本页 — 按岗位类型（开发/测试/产品/运维）统计，支持时间粒度切换
- Produces: 项目成本页 — 预算 vs 实际对比，预算占比进度条，预计超支金额标签

**跨库契约:**
| 接口 | 方法 | 路径 | 关键参数 | 响应 data |
|------|------|------|---------|----------|
| 成本分析 | GET | `/api/report/analysis` | `deptId, projectId, bizLineId, periodStart, periodEnd, costType, timeGranularity, groupBy` | `AnalysisItem[]` |
| 人力成本 | GET | `/api/report/labor` | `periodStart, periodEnd, timeGranularity` | `LaborCostItem[]` |
| 项目成本 | GET | `/api/report/project` | — | `ProjectCostItem[]` |
| 部门列表 | GET | `/api/base/departments` | — | `Department[]` |
| 项目列表 | GET | `/api/base/projects` | `pageNum, pageSize` | `PageResponse<Project>` |
| 业务线列表 | GET | `/api/base/business-lines` | — | `BusinessLine[]` |
| 人员列表 | GET | `/api/base/employees` | `deptId?, roleType?` | `Employee[]` |

- [ ] **Step 1: 创建 baseData API + 类型**

```typescript
// src/api/baseData.ts
import request from './request';
import { ApiResponse, PageResponse } from '../types/api';

export interface Department {
  id: number; name: string; code: string; parentId: number; status: number;
}
export interface Project {
  id: number; name: string; code: string; budget: number; deptId: number; bizLineId: number; status: number;
}
export interface BusinessLine {
  id: number; name: string; code: string; description: string; status: number;
}
export interface Employee {
  id: number; name: string; empNo: string; deptId: number; roleType: string; salary: number; status: number;
}

export const getDepartments = (): Promise<ApiResponse<Department[]>> =>
  request.get('/base/departments');
export const getProjects = (params?: { pageNum?: number; pageSize?: number }): Promise<ApiResponse<PageResponse<Project>>> =>
  request.get('/base/projects', { params: { pageNum: 1, pageSize: 1000, ...params } });
export const getBusinessLines = (): Promise<ApiResponse<BusinessLine[]>> =>
  request.get('/base/business-lines');
export const getEmployees = (params?: { deptId?: number; roleType?: string }): Promise<ApiResponse<Employee[]>> =>
  request.get('/base/employees', { params });
```

```typescript
// src/types/baseData.ts
export type { Department, Project, BusinessLine, Employee } from '../api/baseData';
```

- [ ] **Step 2: 创建 FilterStore**

```typescript
// src/store/useFilterStore.ts
import { create } from 'zustand';

interface FilterState {
  deptId?: number;
  projectId?: number;
  bizLineId?: number;
  periodStart?: string;
  periodEnd?: string;
  costType?: string;
  timeGranularity: string;
  groupBy: string;
  setFilter: (partial: Partial<FilterState>) => void;
  reset: () => void;
}

const initialState = {
  timeGranularity: 'month',
  groupBy: 'dept',
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setFilter: (partial) => set(partial),
  reset: () => set(initialState),
}));
```

- [ ] **Step 3: 创建 FilterBar 通用筛选组件**

```tsx
// src/components/FilterBar/index.tsx
import React, { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getDepartments, getProjects, getBusinessLines, Department, Project, BusinessLine } from '../../api/baseData';
import { COST_TYPES, ROLE_TYPES, TIME_GRANULARITY } from '../../utils/constants';

const { RangePicker } = DatePicker;

interface FilterBarProps {
  onSearch: (values: any) => void;
  showCostType?: boolean;
  showRoleType?: boolean;
  showGroupBy?: boolean;
  showTimeGranularity?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ onSearch, showCostType, showRoleType, showGroupBy, showTimeGranularity }) => {
  const [form] = Form.useForm();
  const [depts, setDepts] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bizLines, setBizLines] = useState<BusinessLine[]>([]);

  useEffect(() => {
    getDepartments().then(r => setDepts(r.data));
    getProjects().then(r => setProjects(r.data.list));
    getBusinessLines().then(r => setBizLines(r.data));
  }, []);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params: any = { ...values };
    if (values.periodRange) {
      params.periodStart = values.periodRange[0].format('YYYY-MM');
      params.periodEnd = values.periodRange[1].format('YYYY-MM');
      delete params.periodRange;
    }
    onSearch(params);
  };

  const handleReset = () => {
    form.resetFields();
    handleSearch();
  };

  return (
    <Form form={form} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
      <Form.Item name="deptId" label="部门">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={depts.map(d => ({ label: d.name, value: d.id }))} />
      </Form.Item>
      <Form.Item name="projectId" label="项目">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={projects.map(p => ({ label: p.name, value: p.id }))} />
      </Form.Item>
      <Form.Item name="bizLineId" label="业务线">
        <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
          options={bizLines.map(b => ({ label: b.name, value: b.id }))} />
      </Form.Item>
      {showCostType && (
        <Form.Item name="costType" label="成本类型">
          <Select allowClear style={{ width: 120 }} options={COST_TYPES} />
        </Form.Item>
      )}
      {showRoleType && (
        <Form.Item name="roleType" label="岗位">
          <Select allowClear style={{ width: 120 }} options={ROLE_TYPES} />
        </Form.Item>
      )}
      {showGroupBy && (
        <Form.Item name="groupBy" label="分组维度">
          <Select style={{ width: 120 }} defaultValue="dept" options={[
            { label: '部门', value: 'dept' }, { label: '项目', value: 'project' },
            { label: '业务线', value: 'bizLine' }, { label: '人员', value: 'employee' },
            { label: '岗位', value: 'roleType' },
          ]} />
        </Form.Item>
      )}
      {showTimeGranularity && (
        <Form.Item name="timeGranularity" label="时间粒度">
          <Select style={{ width: 100 }} defaultValue="month" options={TIME_GRANULARITY} />
        </Form.Item>
      )}
      <Form.Item name="periodRange" label="期间">
        <RangePicker picker="month" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FilterBar;
```

- [ ] **Step 4: 创建 CostAnalysis 页面**

```tsx
// src/pages/CostAnalysis/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col } from 'antd';
import FilterBar from '../../components/FilterBar';
import BarChart from '../../components/Charts/BarChart';
import { getAnalysis, AnalysisParams } from '../../api/report';
import { formatMoney } from '../../utils/format';

const CostAnalysis: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = (params: AnalysisParams) => {
    setLoading(true);
    getAnalysis({ groupBy: 'dept', ...params })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData({}); }, []);

  const columns = [
    { title: '分组', dataIndex: 'groupName', key: 'groupName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v), sorter: (a: any, b: any) => a.amount - b.amount },
    { title: '记录数', dataIndex: 'recordCount', key: 'recordCount' },
  ];

  const chartData = data.map(d => ({ deptName: d.groupName, amount: d.amount }));

  return (
    <div>
      <FilterBar onSearch={fetchData} showCostType showGroupBy showTimeGranularity />
      <Row gutter={16}>
        <Col span={14}>
          <Card title="统计结果">
            <Table dataSource={data} columns={columns} rowKey="groupId" loading={loading} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card><BarChart title="成本分布" data={chartData} /></Card>
        </Col>
      </Row>
    </div>
  );
};

export default CostAnalysis;
```

- [ ] **Step 5: 创建 LaborCost 页面**

```tsx
// src/pages/LaborCost/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col } from 'antd';
import FilterBar from '../../components/FilterBar';
import PieChart from '../../components/Charts/PieChart';
import { getLaborCost } from '../../api/report';
import { formatMoney, roleTypeLabel } from '../../utils/format';
import dayjs from 'dayjs';

const LaborCost: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = (params: any) => {
    setLoading(true);
    const periodStart = params.periodStart || dayjs().startOf('year').format('YYYY-MM');
    const periodEnd = params.periodEnd || dayjs().format('YYYY-MM');
    getLaborCost({ periodStart, periodEnd, timeGranularity: params.timeGranularity })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData({}); }, []);

  const columns = [
    { title: '岗位类型', dataIndex: 'roleType', key: 'roleType', render: (v: string) => roleTypeLabel[v] || v },
    { title: '人力成本', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v), sorter: (a: any, b: any) => a.amount - b.amount },
    { title: '人数', dataIndex: 'headCount', key: 'headCount' },
  ];

  const pieData = data.map(d => ({ costType: d.roleType, amount: d.amount }));

  return (
    <div>
      <FilterBar onSearch={fetchData} showRoleType showTimeGranularity />
      <Row gutter={16}>
        <Col span={14}>
          <Card title="人力成本统计">
            <Table dataSource={data} columns={columns} rowKey="roleType" loading={loading} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card><PieChart title="岗位成本占比" data={pieData} /></Card>
        </Col>
      </Row>
    </div>
  );
};

export default LaborCost;
```

- [ ] **Step 6: 创建 ProjectCost 页面**

```tsx
// src/pages/ProjectCost/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Tag } from 'antd';
import { getProjectCost } from '../../api/report';
import { formatMoney } from '../../utils/format';

const ProjectCost: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProjectCost()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '预算', dataIndex: 'budget', key: 'budget', render: (v: number) => formatMoney(v) },
    { title: '实际消耗', dataIndex: 'actual', key: 'actual', render: (v: number) => formatMoney(v) },
    {
      title: '预算占比', dataIndex: 'rate', key: 'rate',
      render: (v: number) => (
        <Progress percent={Math.min(v, 100)} status={v > 100 ? 'exception' : 'active'} size="small" style={{ width: 150 }} />
      ),
    },
    {
      title: '预计超支', key: 'overBudget',
      render: (_: any, record: any) => {
        const over = Math.max(record.actual - record.budget, 0);
        return over > 0
          ? <Tag color="red">{formatMoney(over)}</Tag>
          : <Tag color="green">未超支</Tag>;
      },
    },
  ];

  return (
    <Card title="项目成本统计">
      <Table dataSource={data} columns={columns} rowKey="projectName" loading={loading} pagination={false} />
    </Card>
  );
};

export default ProjectCost;
```

- [ ] **Step 7: 验证**

Run:
```bash
cd library-frontend-main && pnpm build
```
Expected: TypeScript 编译通过，无类型错误

---

## Task 5: 数据录入 + 数据导入 + 报表导出页面

**Files:**
- Create: `library-frontend-main/src/api/cost.ts`
- Create: `library-frontend-main/src/types/cost.ts`
- Create: `library-frontend-main/src/pages/DataEntry/index.tsx`
- Create: `library-frontend-main/src/pages/DataImport/index.tsx`
- Create: `library-frontend-main/src/pages/ReportExport/index.tsx`
- Create: `library-frontend-main/src/components/ExportButton/index.tsx`

**Interfaces:**
- Consumes: `POST /api/cost/entry`, `POST /api/cost/import`, `GET /api/cost/import/template`, `GET /api/cost/records`, `POST /api/report/export`
- Produces: 数据录入表单页（选择部门/项目/业务线/人员/成本类型/期间 + 输入金额 + 备注）
- Produces: 数据导入页（模板下载 + 拖拽上传 + 导入结果展示含失败明细）
- Produces: 报表导出页（选择筛选条件 + 导出 Excel 按钮）

**跨库契约:**
| 接口 | 方法 | 路径 | 请求体 | 响应 data |
|------|------|------|--------|----------|
| 成本录入 | POST | `/api/cost/entry` | `CostEntryRequest` | `CostRecord` |
| 批量录入 | POST | `/api/cost/batch-entry` | `CostEntryRequest[]` | `CostRecord[]` |
| 记录列表 | GET | `/api/cost/records` | `?pageNum&pageSize&deptId&period` | `PageResponse<CostRecord>` |
| 下载模板 | GET | `/api/cost/import/template` | — | Blob (.xlsx) |
| 导入 Excel | POST | `/api/cost/import` | `FormData(file)` | `ImportResult` |
| 导出报表 | POST | `/api/report/export` | `AnalysisParams` | Blob (.xlsx) |

- [ ] **Step 1: 创建 cost API + 类型**

```typescript
// src/api/cost.ts
import request from './request';
import { ApiResponse, PageResponse } from '../types/api';

export interface CostEntryRequest {
  deptId: number;
  projectId?: number;
  bizLineId?: number;
  employeeId?: number;
  roleType?: string;
  costType: string;
  amount: number;
  period: string;
  remark?: string;
}

export interface CostRecord {
  id: number;
  deptId: number;
  projectId: number;
  bizLineId: number;
  employeeId: number;
  roleType: string;
  costType: string;
  amount: number;
  period: string;
  source: string;
  remark: string;
  createdAt: string;
}

export interface ImportResult {
  totalCount: number;
  successCount: number;
  failCount: number;
  failDetails: Array<{ rowNum: number; reason: string }>;
}

export const createCostEntry = (data: CostEntryRequest): Promise<ApiResponse<CostRecord>> =>
  request.post('/cost/entry', data);

export const batchCostEntry = (data: CostEntryRequest[]): Promise<ApiResponse<CostRecord[]>> =>
  request.post('/cost/batch-entry', data);

export const getCostRecords = (params: { pageNum?: number; pageSize?: number; deptId?: number; period?: string }): Promise<ApiResponse<PageResponse<CostRecord>>> =>
  request.get('/cost/records', { params });

export const downloadImportTemplate = (): Promise<Blob> =>
  request.get('/cost/import/template', { responseType: 'blob' });

export const importCostExcel = (file: File): Promise<ApiResponse<ImportResult>> => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/cost/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

```typescript
// src/types/cost.ts
export type { CostEntryRequest, CostRecord, ImportResult } from '../api/cost';
```

- [ ] **Step 2: 创建 DataEntry 页面**

```tsx
// src/pages/DataEntry/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Select, InputNumber, DatePicker, Input, Button, message, Table } from 'antd';
import { getDepartments, getProjects, getBusinessLines, getEmployees, Department, Project, BusinessLine, Employee } from '../../api/baseData';
import { createCostEntry, getCostRecords, CostRecord } from '../../api/cost';
import { COST_TYPES, ROLE_TYPES } from '../../utils/constants';
import { formatMoney, costTypeLabel } from '../../utils/format';

const DataEntry: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [depts, setDepts] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bizLines, setBizLines] = useState<BusinessLine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    getDepartments().then(r => setDepts(r.data));
    getProjects().then(r => setProjects(r.data.list));
    getBusinessLines().then(r => setBizLines(r.data));
    getEmployees().then(r => setEmployees(r.data));
    fetchRecords(1);
  }, []);

  const fetchRecords = (pageNum: number) => {
    getCostRecords({ pageNum, pageSize: 10 }).then(res => {
      setRecords(res.data.list);
      setTotal(res.data.total);
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createCostEntry({
        ...values,
        period: values.period.format('YYYY-MM'),
      });
      message.success('录入成功');
      form.resetFields();
      fetchRecords(1);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  };

  const columns = [
    { title: '期间', dataIndex: 'period', key: 'period' },
    { title: '成本类型', dataIndex: 'costType', key: 'costType', render: (v: string) => costTypeLabel[v] || v },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => formatMoney(v) },
    { title: '来源', dataIndex: 'source', key: 'source' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div>
      <Card title="成本数据录入" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleSubmit} style={{ flexWrap: 'wrap', gap: 8 }}>
          <Form.Item name="deptId" label="部门" rules={[{ required: true }]}>
            <Select style={{ width: 150 }} showSearch optionFilterProp="label"
              options={depts.map(d => ({ label: d.name, value: d.id }))} />
          </Form.Item>
          <Form.Item name="projectId" label="项目">
            <Select allowClear style={{ width: 150 }} showSearch optionFilterProp="label"
              options={projects.map(p => ({ label: p.name, value: p.id }))} />
          </Form.Item>
          <Form.Item name="bizLineId" label="业务线">
            <Select allowClear style={{ width: 150 }} showSearch optionFilterProp="label"
              options={bizLines.map(b => ({ label: b.name, value: b.id }))} />
          </Form.Item>
          <Form.Item name="employeeId" label="人员">
            <Select allowClear showSearch optionFilterProp="label" style={{ width: 150 }}
              options={employees.map(e => ({ label: `${e.name}(${e.empNo})`, value: e.id }))} />
          </Form.Item>
          <Form.Item name="roleType" label="岗位">
            <Select allowClear style={{ width: 100 }} options={ROLE_TYPES} />
          </Form.Item>
          <Form.Item name="costType" label="成本类型" rules={[{ required: true }]}>
            <Select style={{ width: 120 }} options={COST_TYPES} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item name="period" label="期间" rules={[{ required: true }]}>
            <DatePicker picker="month" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="最近录入记录">
        <Table dataSource={records} columns={columns} rowKey="id" size="small"
          pagination={{ total, pageSize: 10, onChange: fetchRecords }} />
      </Card>
    </div>
  );
};

export default DataEntry;
```

- [ ] **Step 3: 创建 DataImport 页面**

```tsx
// src/pages/DataImport/index.tsx
import React, { useState } from 'react';
import { Card, Upload, Button, Table, Alert, message, Space, Typography } from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { downloadImportTemplate, importCostExcel, ImportResult } from '../../api/cost';

const { Dragger } = Upload;
const { Text } = Typography;

const DataImport: React.FC = () => {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '成本导入模板.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { message.error('下载模板失败'); }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const res = await importCostExcel(file);
      setResult(res.data);
      message.success(`导入完成：成功 ${res.data.successCount} 条`);
    } catch { /* handled */ }
    finally { setLoading(false); }
    return false;
  };

  const failColumns = [
    { title: '行号', dataIndex: 'rowNum', key: 'rowNum' },
    { title: '失败原因', dataIndex: 'reason', key: 'reason' },
  ];

  return (
    <div>
      <Card title="数据导入" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>下载导入模板</Button>
          <Dragger
            accept=".xlsx,.xls"
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={loading}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">点击或拖拽 Excel 文件到此区域上传</p>
            <p className="ant-upload-hint">仅支持 .xlsx / .xls 格式</p>
          </Dragger>
        </Space>
      </Card>

      {result && (
        <Card title="导入结果">
          <Alert
            type={result.failCount === 0 ? 'success' : 'warning'}
            message={`总计 ${result.totalCount} 条，成功 ${result.successCount} 条，失败 ${result.failCount} 条`}
            style={{ marginBottom: 16 }}
          />
          {result.failDetails.length > 0 && (
            <Table
              dataSource={result.failDetails}
              columns={failColumns}
              rowKey="rowNum"
              size="small"
              pagination={false}
              title={() => <Text strong>失败明细</Text>}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default DataImport;
```

- [ ] **Step 4: 创建 ExportButton 组件 + ReportExport 页面**

```tsx
// src/components/ExportButton/index.tsx
import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportReport, AnalysisParams } from '../../api/report';

interface ExportButtonProps {
  params: AnalysisParams;
}

const ExportButton: React.FC<ExportButtonProps> = ({ params }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await exportReport(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '成本统计报表.xlsx'; a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="primary" icon={<DownloadOutlined />} loading={loading} onClick={handleExport}>
      导出 Excel
    </Button>
  );
};

export default ExportButton;
```

```tsx
// src/pages/ReportExport/index.tsx
import React, { useState } from 'react';
import { Card, Space, Typography } from 'antd';
import FilterBar from '../../components/FilterBar';
import ExportButton from '../../components/ExportButton';
import { AnalysisParams } from '../../api/report';

const { Paragraph } = Typography;

const ReportExport: React.FC = () => {
  const [params, setParams] = useState<AnalysisParams>({});

  return (
    <Card title="报表导出">
      <Paragraph>选择筛选条件后，点击导出按钮生成 Excel 文件。导出内容包含：汇总、明细、项目成本、人力成本四个 Sheet。</Paragraph>
      <FilterBar onSearch={setParams} showCostType showRoleType showTimeGranularity />
      <Space style={{ marginTop: 16 }}>
        <ExportButton params={params} />
      </Space>
    </Card>
  );
};

export default ReportExport;
```

- [ ] **Step 5: 验证**

Run:
```bash
cd library-frontend-main && pnpm build
```
Expected: 构建成功，无 TypeScript 类型错误

---

## Task 6: 系统管理页面 + 最终构建验证

**Files:**
- Create: `library-frontend-main/src/pages/System/UserManage/index.tsx`
- Create: `library-frontend-main/src/pages/System/RoleManage/index.tsx`

**Interfaces:**
- Consumes: `GET /api/auth/users`, `POST /api/auth/users`, `PUT /api/auth/users/{id}`, `GET /api/auth/roles`, `POST /api/auth/roles`, `PUT /api/auth/roles/{id}`
- Produces: 用户管理页（用户列表 + 新增/编辑弹窗 + 角色分配）
- Produces: 角色管理页（角色列表 + 新增/编辑弹窗 + 权限配置）

**跨库契约:**
| 接口 | 方法 | 路径 | 请求体 | 响应 data |
|------|------|------|--------|----------|
| 用户列表 | GET | `/api/auth/users` | `?pageNum&pageSize` | `PageResponse<UserInfo>` |
| 创建用户 | POST | `/api/auth/users` | `{ username, password, name, deptId }` | `UserInfo` |
| 更新用户 | PUT | `/api/auth/users/{id}` | `{ name, deptId, status, roleIds }` | `UserInfo` |
| 角色列表 | GET | `/api/auth/roles` | — | `Role[]` |
| 创建角色 | POST | `/api/auth/roles` | `{ name, code, description, dataScope }` | `Role` |
| 更新角色 | PUT | `/api/auth/roles/{id}` | `{ name, description, dataScope, permissionIds }` | `Role` |

- [ ] **Step 1: 创建 UserManage 页面**

```tsx
// src/pages/System/UserManage/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import request from '../../../api/request';
import { getDepartments, Department } from '../../../api/baseData';

interface UserItem {
  id: number;
  username: string;
  name: string;
  deptId: number | null;
  status: number;
  roles: string[];
}

const UserManage: React.FC = () => {
  const [data, setData] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [depts, setDepts] = useState<Department[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    getDepartments().then(r => setDepts(r.data));
    fetchUsers(1);
  }, []);

  const fetchUsers = (pageNum: number) => {
    setLoading(true);
    request.get('/auth/users', { params: { pageNum, pageSize: 10 } })
      .then((res: any) => { setData(res.data.list); setTotal(res.data.total); })
      .finally(() => setLoading(false));
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingUser) {
      await request.put(`/auth/users/${editingUser.id}`, values);
      message.success('更新成功');
    } else {
      await request.post('/auth/users', values);
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingUser(null);
    fetchUsers(1);
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '角色', dataIndex: 'roles', key: 'roles', render: (roles: string[]) => roles?.map(r => <Tag key={r}>{r}</Tag>) },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: number) => v === 1 ? <Tag color="green">启用</Tag> : <Tag color="red">停用</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, record: UserItem) => (
        <Button type="link" onClick={() => { setEditingUser(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</Button>
      ),
    },
  ];

  return (
    <Card title="用户管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); form.resetFields(); setModalOpen(true); }}>新增用户</Button>}>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading}
        pagination={{ total, pageSize: 10, onChange: fetchUsers }} />
      <Modal title={editingUser ? '编辑用户' : '新增用户'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          {!editingUser && (
            <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="deptId" label="部门">
            <Select allowClear options={depts.map(d => ({ label: d.name, value: d.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManage;
```

- [ ] **Step 2: 创建 RoleManage 页面**

```tsx
// src/pages/System/RoleManage/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import request from '../../../api/request';

interface RoleItem {
  id: number;
  name: string;
  code: string;
  description: string;
  dataScope: string;
}

const DATA_SCOPE_OPTIONS = [
  { label: '全部数据', value: 'all' },
  { label: '本部门数据', value: 'dept' },
  { label: '本人数据', value: 'self' },
];

const RoleManage: React.FC = () => {
  const [data, setData] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = () => {
    setLoading(true);
    request.get('/auth/roles')
      .then((res: any) => setData(res.data))
      .finally(() => setLoading(false));
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingRole) {
      await request.put(`/auth/roles/${editingRole.id}`, values);
      message.success('更新成功');
    } else {
      await request.post('/auth/roles', values);
      message.success('创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingRole(null);
    fetchRoles();
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '角色编码', dataIndex: 'code', key: 'code' },
    { title: '数据范围', dataIndex: 'dataScope', key: 'dataScope', render: (v: string) => DATA_SCOPE_OPTIONS.find(o => o.value === v)?.label || v },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: RoleItem) => (
        <Button type="link" onClick={() => { setEditingRole(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</Button>
      ),
    },
  ];

  return (
    <Card title="角色管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRole(null); form.resetFields(); setModalOpen(true); }}>新增角色</Button>}>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={false} />
      <Modal title={editingRole ? '编辑角色' : '新增角色'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editingRole && (
            <Form.Item name="code" label="角色编码" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
          <Form.Item name="dataScope" label="数据范围" rules={[{ required: true }]}>
            <Select options={DATA_SCOPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RoleManage;
```

- [ ] **Step 3: 最终构建验证**

Run:
```bash
cd library-frontend-main && pnpm build
```
Expected: 构建成功，无 TypeScript 类型错误，所有页面组件均被路由引用

- [ ] **Step 4: 跨库 API 契约对齐检查**

逐项核对前端请求与后端 Controller 签名一致性：

| 接口 | 前端调用 | 后端 Controller | 状态 |
|------|---------|----------------|------|
| 登录 | `POST /api/auth/login` → `LoginParams` | `AuthController.login(LoginRequest)` | ✅ |
| Dashboard | `GET /api/report/dashboard` → `DashboardData` | `DashboardController.getDashboard()` | ✅ |
| 成本分析 | `GET /api/report/analysis` → `AnalysisParams` | `AnalysisController.analyze(AnalysisQuery)` | ✅ |
| 人力成本 | `GET /api/report/labor` → `{periodStart, periodEnd, timeGranularity}` | `AnalysisController.labor(...)` | ✅ |
| 项目成本 | `GET /api/report/project` | `AnalysisController.project()` | ✅ |
| 数据录入 | `POST /api/cost/entry` → `CostEntryRequest` | `CostEntryController.entry(CostEntryRequest)` | ✅ |
| 数据导入 | `POST /api/cost/import` → `FormData` | `CostImportController.importExcel(MultipartFile)` | ✅ |
| 报表导出 | `POST /api/report/export` → `AnalysisParams` | `ExportController.export(AnalysisQuery)` | ✅ |
| 部门列表 | `GET /api/base/departments` | `DepartmentController.list()` | ✅ |
| 项目列表 | `GET /api/base/projects` | `ProjectController.list(pageNum, pageSize)` | ✅ |
| 用户管理 | `GET/POST/PUT /api/auth/users` | `UserController` | ✅ |
| 角色管理 | `GET/POST/PUT /api/auth/roles` | `RoleController` | ✅ |

---

## 跨仓对齐点总结

| 对齐点 | 前端 (library-frontend) | 后端 (library-backend) | 契约 |
|--------|------------------------|----------------------|------|
| 认证 | `src/api/auth.ts` → `POST /api/auth/login` | `auth-service` → `AuthController` | `{username, password}` → `{token, username, name, roles}` |
| Dashboard | `src/api/report.ts` → `GET /api/report/dashboard` | `report-service` → `DashboardController` | → `DashboardDTO` |
| 成本分析 | `src/api/report.ts` → `GET /api/report/analysis` | `report-service` → `AnalysisController` | `AnalysisQuery` → `List<AnalysisItem>` |
| 人力成本 | `src/api/report.ts` → `GET /api/report/labor` | `report-service` → `AnalysisController` | `{periodStart, periodEnd, timeGranularity}` → `List<LaborCostItem>` |
| 项目成本 | `src/api/report.ts` → `GET /api/report/project` | `report-service` → `AnalysisController` | → `List<ProjectCostItem>` |
| 数据录入 | `src/api/cost.ts` → `POST /api/cost/entry` | `cost-core-service` → `CostEntryController` | `CostEntryRequest` → `CostRecord` |
| 数据导入 | `src/api/cost.ts` → `POST /api/cost/import` | `cost-core-service` → `CostImportController` | `FormData` → `ImportResultDTO` |
| 报表导出 | `src/api/report.ts` → `POST /api/report/export` | `report-service` → `ExportController` | `AnalysisQuery` → `.xlsx` Blob |
| 基础数据 | `src/api/baseData.ts` → `GET /api/base/*` | `base-data-service` → 4 个 Controller | CRUD 标准 REST |
| JWT 鉴权 | `src/api/request.ts` 拦截器附加 `Authorization` | `gateway` → `JwtAuthGlobalFilter` 校验 + 透传 `X-User-Id` | Bearer Token |
| 用户管理 | `src/api/request.ts` → `GET/POST/PUT /api/auth/users` | `auth-service` → `UserController` | 标准 CRUD |
| 角色管理 | `src/api/request.ts` → `GET/POST/PUT /api/auth/roles` | `auth-service` → `RoleController` | 标准 CRUD |

---

## 开发顺序

```
Task 1 (脚手架) → Task 2 (布局 + 登录)
    ↓
Task 3 (Dashboard) → Task 4 (分析页面)
    ↓
Task 5 (录入/导入/导出) → Task 6 (系统管理 + 验证)
```

每个 Task 完成后独立可测，产出可运行的增量交付物。
