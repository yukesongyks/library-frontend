import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBooks, deleteBook } from '../api/books';
import { useAuth } from '../context/AuthContext';
import BookTable from '../components/BookTable';
import type { Book } from '../types/book';

export default function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();
  const size = 10;

  const loadBooks = async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBooks(currentPage, size);
      if (response.code === 200 && response.data) {
        setBooks(response.data.content);
        setTotalElements(response.data.totalElements);
        setTotalPages(response.data.totalPages);
      } else {
        setError(response.message || '获取图书列表失败');
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || '获取图书列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleEdit = (book: Book) => {
    navigate(`/books/${book.id}/edit`);
  };

  const handleDelete = async (book: Book) => {
    if (window.confirm(`确认删除《${book.title}》吗？`)) {
      try {
        await deleteBook(book.id);
        loadBooks(page);
      } catch (err) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message || '删除失败');
      }
    }
  };

  const isAdmin = auth.role === 'ROLE_ADMIN';

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>图书列表</h2>
        <div>
          <span style={{ marginRight: '12px' }}>欢迎, {auth.username}</span>
          <button onClick={() => auth.logout()}>退出登录</button>
        </div>
      </div>
      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}
      {loading ? (
        <p>加载中...</p>
      ) : books.length === 0 ? (
        <p>暂无图书</p>
      ) : (
        <>
          {isAdmin && (
            <button onClick={() => navigate('/books/new')} style={{ marginBottom: '12px' }}>
              新增图书
            </button>
          )}
          <BookTable books={books} isAdmin={isAdmin} onEdit={handleEdit} onDelete={handleDelete} />
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setPage(page - 1)} disabled={page === 0}>
              上一页
            </button>
            <span>
              第 {page + 1} / {totalPages} 页 (共 {totalElements} 条)
            </span>
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  );
}
