import { useState, useEffect } from 'react'
import { discoveryApi, circulationApi } from '../api'

export default function BookSearchPage() {
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')

  const loadBooks = async (p = page, kw = keyword, cat = category) => {
    try {
      const res = await discoveryApi.search({ page: p, size: 10, keyword: kw, category: cat })
      setBooks(res.data.content || [])
      setTotalPages(res.data.totalPages || 1)
      setPage(res.data.page || 1)
    } catch (err) {
      setError(err.response?.data?.message || '加载失败')
    }
  }

  useEffect(() => { loadBooks(1, '', '') }, [])

  const handleBorrow = async (book) => {
    if (!confirm(`确认借阅《${book.title}》？`)) return
    try {
      await circulationApi.borrow(book.id)
      alert('借阅成功！')
      loadBooks()
    } catch (err) {
      alert(err.response?.data?.message || '借阅失败')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>图书检索</h2>
      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="搜索书名/作者/ISBN" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ marginBottom: 0 }} />
          <input placeholder="分类过滤" value={category} onChange={e => setCategory(e.target.value)} style={{ marginBottom: 0, width: '200px' }} />
          <button className="btn" onClick={() => loadBooks(1)}>搜索</button>
        </div>
        <table>
          <thead>
            <tr><th>书名</th><th>作者</th><th>ISBN</th><th>分类</th><th>库存</th><th>操作</th></tr>
          </thead>
          <tbody>
            {books.map(b => (
              <tr key={b.id}>
                <td>{b.title}</td><td>{b.author}</td><td>{b.isbn}</td><td>{b.category}</td>
                <td style={{ color: b.stock > 0 ? '#27ae60' : '#e74c3c' }}>{b.stock}</td>
                <td>
                  <button className="btn" disabled={b.stock <= 0} onClick={() => handleBorrow(b)}>
                    {b.stock > 0 ? '借阅' : '无库存'}
                  </button>
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
