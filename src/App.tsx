import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import DemoPage from './pages/demo';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <div style={{ padding: 24, minHeight: '100vh', background: '#f5f5f5' }}>
        <DemoPage />
      </div>
    </ConfigProvider>
  );
};

export default App;
