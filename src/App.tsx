import { Routes, Route, Link } from 'react-router-dom'
import AlgorithmDemoPage from './pages/AlgorithmDemoPage'

function App() {
  return (
    <div style={{ padding: '16px' }}>
      <nav style={{ marginBottom: '16px', borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>
        <Link to="/" style={{ marginRight: '16px' }}>Home</Link>
        <Link to="/algorithm-demo">Algorithm Demo</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Welcome to Library</h1>} />
        <Route path="/algorithm-demo" element={<AlgorithmDemoPage />} />
      </Routes>
    </div>
  )
}

export default App