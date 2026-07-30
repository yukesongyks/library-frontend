import { useState, useEffect } from 'react'
import { bookAdminApi } from '../api'

export default function BookManagePage() {
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState(null)  // null=新增, 对象=编辑
  const [form, setForm] = useState({ title: '', author: '', isbn: '', category: '', stock: 0 })
  const [error, setError] = useState('')

  const loadBooks = async (p = page, kw = keyword) => {
    try {
      const res = await bookAdminApi.list({ page: p, size: 10, keyword: kw })
      setBooks(res.data.content || [])
      setTotalPages(res.data.totalPages || 1)
      setPage(res.data.page || 1)
    } catch (err) {
      setError(err.response?.data?.message || '加载失败')
    }
  }

  useEffect(() => { loadBooks(1, '') }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await bookAdminApi.update(editing, form)
      } else {
        await bookAdminApi.create(form)
      }
      setEditing(null)
      setForm({ title: '', author: '', isbn: '', category: '', stock: 0 })
      loadBooks()
    } catch (err) {
      setError(err.response?.data?.message || '操作失败')
    }
  }

  const handleEdit = (book) => {
    setEditing(book.id)
    setForm({ title: book.title, author: book.author, isbn: book.isbn, category: book.category, stock: book.stock })
  }

  const handleDelete = async (id) => {
    if (!confirm('确认删除？')) return
    try {
      await bookAdminApi.delete(id)
      loadBooks()
    } catch (err) {
      alert(err.response?.data?.message || '删除失败')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>图书管理</h2>

      <div className="card">
        <h3>{editing ? '编辑图书' : '新增图书'}</h3>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input placeholder="书名" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <input placeholder="作者" value={form.author} onChange={e => setForm({...form, author: e.target.value})} required />
          <input placeholder="ISBN" value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} required />
          <input placeholder="分类" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
          <input type="number" placeholder="库存" min="0" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} required />
          <div>
            <button type="submit" className="btn">{editing ? '更新' : '新增'}</button>
            {editing && <button type="button" className="btn" onClick={() => { setEditing(null); setForm({title:'',author:'',isbn:'',category:'',stock:0}) }}>取消</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="搜索书名/作者/ISBN" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ marginBottom: 0 }} />
          <button className="btn" onClick={() => loadBooks(1)}>搜索</button>
        </div>
        <table>
          <thead>
            <tr><th>ID</th><th>书名</th><th>作者</th><th>ISBN</th><th>分类</th><th>库存</th><th>操作</th></tr>
          </thead>
          <tbody>
            {books.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td><td>{b.title}</td><td>{b.author}</td><td>{b.isbn}</td><td>{b.category}</td><td>{b.stock}</td>
                <td>
                  <button className="btn" onClick={() => handleEdit(b)}>编辑</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(b.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button className="btn" disabled={page <= 1} onClick={() => loadBooks(page - 1)}>上一页</button>
          <span>第 {page} / {totalPages} 页</span>
          <button className="btn" disabled={page >= totalPages} onClick={() => loadBooks(page + 1)}>下一页</button>
        </div>
      </div>
    </div>
  )
}
