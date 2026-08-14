import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

const Login = React.lazy(() => import('./pages/Login'));
const MainLayout = React.lazy(() => import('./layouts/MainLayout'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CostAnalysis = React.lazy(() => import('./pages/CostAnalysis'));
const LaborCost = React.lazy(() => import('./pages/LaborCost'));
const ProjectCost = React.lazy(() => import('./pages/ProjectCost'));
const DataEntry = React.lazy(() => import('./pages/DataEntry'));
const DataImport = React.lazy(() => import('./pages/DataImport'));
const ReportExport = React.lazy(() => import('./pages/ReportExport'));
const UserManage = React.lazy(() => import('./pages/System/UserManage'));
const RoleManage = React.lazy(() => import('./pages/System/RoleManage'));

const Loading = () => <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

const router = createBrowserRouter([
  { path: '/login', element: <Suspense fallback={<Loading />}><Login /></Suspense> },
  {
    path: '/',
    element: <Suspense fallback={<Loading />}><MainLayout /></Suspense>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={<Loading />}><Dashboard /></Suspense> },
      { path: 'cost/analysis', element: <Suspense fallback={<Loading />}><CostAnalysis /></Suspense> },
      { path: 'cost/labor', element: <Suspense fallback={<Loading />}><LaborCost /></Suspense> },
      { path: 'cost/project', element: <Suspense fallback={<Loading />}><ProjectCost /></Suspense> },
      { path: 'cost/entry', element: <Suspense fallback={<Loading />}><DataEntry /></Suspense> },
      { path: 'cost/import', element: <Suspense fallback={<Loading />}><DataImport /></Suspense> },
      { path: 'cost/export', element: <Suspense fallback={<Loading />}><ReportExport /></Suspense> },
      { path: 'system/users', element: <Suspense fallback={<Loading />}><UserManage /></Suspense> },
      { path: 'system/roles', element: <Suspense fallback={<Loading />}><RoleManage /></Suspense> },
    ],
  },
]);

const App: React.FC = () => <RouterProvider router={router} />;
export default App;
