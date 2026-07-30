import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import BookManagePage from './pages/BookManagePage'
import ReaderManagePage from './pages/ReaderManagePage'
import BookSearchPage from './pages/BookSearchPage'
import BorrowRecordsPage from './pages/BorrowRecordsPage'

// 路由守卫
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />
  }
  return children
}

function Nav() {
  const { isAuthenticated, role, logout } = useAuth()
  if (!isAuthenticated) return null

  return (
    <nav className="nav">
      {role === 'ADMIN' && (
        <>
          <Link to="/admin/books">图书管理</Link>
          <Link to="/admin/readers">读者管理</Link>
        </>
      )}
      {role === 'READER' && (
        <>
          <Link to="/books">图书检索</Link>
          <Link to="/me/records">借阅记录</Link>
        </>
      )}
      <span style={{ marginLeft: 'auto', color: '#ecf0f1' }}>
        {role === 'ADMIN' ? '管理员' : '读者'}: {useAuth().username}
      </span>
      <a href="#" onClick={(e) => { e.preventDefault(); logout() }} style={{ color: '#e74c3c' }}>退出</a>
    </nav>
  )
}

export default function App() {
  const { role } = useAuth()

  return (
    <>
      <Nav />
      <div className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/books" element={
            <ProtectedRoute roles={['ADMIN']}><BookManagePage /></ProtectedRoute>
          } />
          <Route path="/admin/readers" element={
            <ProtectedRoute roles={['ADMIN']}><ReaderManagePage /></ProtectedRoute>
          } />
          <Route path="/books" element={
            <ProtectedRoute roles={['READER']}><BookSearchPage /></ProtectedRoute>
          } />
          <Route path="/me/records" element={
            <ProtectedRoute roles={['READER']}><BorrowRecordsPage /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to={role === 'ADMIN' ? '/admin/books' : '/books'} replace />} />
        </Routes>
      </div>
    </>
  )
}
