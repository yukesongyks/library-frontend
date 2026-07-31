import { Navigate, Route, Routes } from 'react-router-dom';
import { DemoPage } from './pages/DemoPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/demo" replace />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="*" element={<Navigate to="/demo" replace />} />
    </Routes>
  );
}

export default App;
