import { useState, useEffect } from 'react'
import { readerAdminApi } from '../api'

export default function ReaderManagePage() {
  const [readers, setReaders] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'READER', enabled: true })
  const [error, setError] = useState('')

  const loadReaders = async (p = page, kw = keyword) => {
    try {
      const res = await readerAdminApi.list({ page: p, size: 10, keyword: kw })
      setReaders(res.data.content || [])
      setTotalPages(res.data.totalPages || 1)
      setPage(res.data.page || 1)
    } catch (err) {
      setError(err.response?.data?.message || '加载失败')
    }
  }

  useEffect(() => { loadReaders(1, '') }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await readerAdminApi.update(editing, form)
      } else {
        await readerAdminApi.create(form)
      }
      setEditing(null)
      setForm({ name: '', username: '', password: '', role: 'READER', enabled: true })
      loadReaders()
    } catch (err) {
      setError(err.response?.data?.message || '操作失败')
    }
  }

  const handleEdit = (reader) => {
    setEditing(reader.id)
    setForm({ name: reader.name, username: reader.username, password: '', role: reader.role, enabled: reader.enabled })
  }

  const handleDelete = async (id) => {
    if (!confirm('确认删除？')) return
    try {
      await readerAdminApi.delete(id)
      loadReaders()
    } catch (err) {
      alert(err.response?.data?.message || '删除失败')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>读者管理</h2>

      <div className="card">
        <h3>{editing ? '编辑读者' : '新增读者'}</h3>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input placeholder="姓名" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input placeholder="用户名" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          <input type="password" placeholder={editing ? '密码(留空不改)' : '密码'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editing} />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="READER">读者</option>
            <option value="ADMIN">管理员</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.enabled} onChange={e => setForm({...form, enabled: e.target.checked})} style={{ width: 'auto' }} />
            启用
          </label>
          <div>
            <button type="submit" className="btn">{editing ? '更新' : '新增'}</button>
            {editing && <button type="button" className="btn" onClick={() => { setEditing(null); setForm({name:'',username:'',password:'',role:'READER',enabled:true}) }}>取消</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="搜索姓名/用户名" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ marginBottom: 0 }} />
          <button className="btn" onClick={() => loadReaders(1)}>搜索</button>
        </div>
        <table>
          <thead>
            <tr><th>ID</th><th>姓名</th><th>用户名</th><th>角色</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {readers.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td><td>{r.name}</td><td>{r.username}</td><td>{r.role}</td>
                <td>{r.enabled ? '启用' : '禁用'}</td>
                <td>
                  <button className="btn" onClick={() => handleEdit(r)}>编辑</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(r.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button className="btn" disabled={page <= 1} onClick={() => loadReaders(page - 1)}>上一页</button>
          <span>第 {page} / {totalPages} 页</span>
          <button className="btn" disabled={page >= totalPages} onClick={() => loadReaders(page + 1)}>下一页</button>
        </div>
      </div>
    </div>
  )
}
