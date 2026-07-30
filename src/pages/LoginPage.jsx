import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      login(res.data)
      navigate(res.data.role === 'ADMIN' ? '/admin/books' : '/books')
    } catch (err) {
      const msg = err.response?.data?.message || '登录失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h2>图书管理系统</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#999' }}>
          测试账号：admin/admin123（管理员）、reader/reader123（读者）
        </p>
      </div>
    </div>
  )
}
