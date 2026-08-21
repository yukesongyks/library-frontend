import { Layout, Menu } from 'antd'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import CostAnalysis from './pages/CostAnalysis'
import Dashboard from './pages/Dashboard'

const menuItems = [
  { key: '/', label: <Link to="/">Dashboard</Link> },
  { key: '/cost-analysis', label: <Link to="/cost-analysis">成本统计分析</Link> }
]

export default function App() {
  const location = useLocation()
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider>
        <div style={{ color: '#fff', padding: 16, fontWeight: 600 }}>成本统计报表</div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Layout.Sider>
      <Layout.Content style={{ padding: 24, background: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cost-analysis" element={<CostAnalysis />} />
        </Routes>
      </Layout.Content>
    </Layout>
  )
}