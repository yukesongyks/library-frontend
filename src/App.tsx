import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import Dashboard from './pages/Dashboard'
import CostAnalysis from './pages/CostAnalysis'
import ProjectCostPage from './pages/ProjectCost'

const { Header, Content } = Layout

export default function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Header>
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['dashboard']}>
            <Menu.Item key="dashboard">
              <Link to="/dashboard">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="analysis">
              <Link to="/analysis">成本分析</Link>
            </Menu.Item>
            <Menu.Item key="project">
              <Link to="/project">项目成本</Link>
            </Menu.Item>
          </Menu>
        </Header>
        <Content>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analysis" element={<CostAnalysis />} />
            <Route path="/project" element={<ProjectCostPage />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  )
}
