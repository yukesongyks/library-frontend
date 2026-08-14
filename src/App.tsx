import { Routes, Route, Navigate } from 'react-router-dom';
import AlgorithmToolsPage from './pages/AlgorithmTools';

function App() {
  return (
    <Routes>
      <Route path="/algorithm-tools" element={<AlgorithmToolsPage />} />
      <Route path="*" element={<Navigate to="/algorithm-tools" replace />} />
    </Routes>
  );
}

export default App;