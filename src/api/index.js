import api from './client'

// 认证
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me')
}

// 管理员 - 图书管理
export const bookAdminApi = {
  list: (params) => api.get('/admin/books', { params }),
  create: (data) => api.post('/admin/books', data),
  update: (id, data) => api.put(`/admin/books/${id}`, data),
  delete: (id) => api.delete(`/admin/books/${id}`)
}

// 管理员 - 读者管理
export const readerAdminApi = {
  list: (params) => api.get('/admin/readers', { params }),
  create: (data) => api.post('/admin/readers', data),
  update: (id, data) => api.put(`/admin/readers/${id}`, data),
  delete: (id) => api.delete(`/admin/readers/${id}`)
}

// 读者 - 图书检索
export const discoveryApi = {
  search: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`)
}

// 读者 - 借阅流通
export const circulationApi = {
  borrow: (bookId) => api.post('/borrow', { bookId }),
  return: (recordId) => api.post('/return', { recordId }),
  myRecords: () => api.get('/me/borrow-records')
}
