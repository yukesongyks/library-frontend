import { useState, useEffect } from 'react'
import { circulationApi } from '../api'

export default function BorrowRecordsPage() {
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')

  const loadRecords = async () => {
    try {
      const res = await circulationApi.myRecords()
      setRecords(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || '加载失败')
    }
  }

  useEffect(() => { loadRecords() }, [])

  const handleReturn = async (record) => {
    if (!confirm('确认归还？')) return
    try {
      await circulationApi.return(record.id)
      alert('归还成功！')
      loadRecords()
    } catch (err) {
      alert(err.response?.data?.message || '归还失败')
    }
  }

  const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : '-'

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>我的借阅记录</h2>
      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>书名</th><th>借阅时间</th><th>应还时间</th><th>归还时间</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.bookTitle || '(已删除)'}</td>
                <td>{formatTime(r.borrowAt)}</td>
                <td>{formatTime(r.dueAt)}</td>
                <td>{formatTime(r.returnAt)}</td>
                <td>
                  {r.status === 'ACTIVE' && <span style={{ color: '#3498db' }}>借阅中</span>}
                  {r.status === 'RETURNED' && <span style={{ color: '#27ae60' }}>已归还</span>}
                  {r.status === 'OVERDUE' && <span style={{ color: '#e74c3c' }}>逾期</span>}
                  {r.overdue && <div className="overdue-tip">{r.overdueTip}</div>}
                </td>
                <td>
                  {(r.status === 'ACTIVE' || r.status === 'OVERDUE') && (
                    <button className="btn btn-success" onClick={() => handleReturn(r)}>归还</button>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: '#999' }}>暂无借阅记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
