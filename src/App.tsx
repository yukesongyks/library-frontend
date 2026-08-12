import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CostDashboard from './pages/cost/CostDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/cost/dashboard" replace />} />
        <Route path="cost/dashboard" element={<CostDashboard />} />
      </Route>
    </Routes>
  );
}
