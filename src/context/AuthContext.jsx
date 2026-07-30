import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role'))
  const [username, setUsername] = useState(localStorage.getItem('username'))

  const login = useCallback((loginData) => {
    localStorage.setItem('token', loginData.token)
    localStorage.setItem('role', loginData.role)
    localStorage.setItem('username', loginData.username)
    setToken(loginData.token)
    setRole(loginData.role)
    setUsername(loginData.username)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    setToken(null)
    setRole(null)
    setUsername(null)
  }, [])

  const value = { token, role, username, login, logout, isAuthenticated: !!token }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
