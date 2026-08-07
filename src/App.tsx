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
