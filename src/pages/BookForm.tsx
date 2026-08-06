import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBook, createBook, updateBook } from '../api/books';
import type { BookRequest } from '../types/book';

export default function BookForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState<BookRequest>({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    category: '',
    totalStock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      const fetchBook = async () => {
        try {
          const response = await getBook(Number(id));
          if (response.code === 200 && response.data) {
            const book = response.data;
            setFormData({
              title: book.title,
              author: book.author,
              isbn: book.isbn,
              publisher: book.publisher || '',
              category: book.category || '',
              totalStock: book.totalStock,
            });
          }
        } catch (err) {
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setError(message || '获取图书信息失败');
        }
      };
      fetchBook();
    }
  }, [id, isEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalStock' ? Number(value) : value,
    }));
  };

  const validate = (): string | null => {
    if (!formData.title.trim()) return '书名不能为空';
    if (!formData.author.trim()) return '作者不能为空';
    if (!formData.isbn.trim()) return 'ISBN不能为空';
    if (formData.isbn.length < 10) return 'ISBN至少10个字符';
    if (formData.totalStock < 0) return '总库存不能小于0';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isEdit && id) {
        await updateBook(Number(id), formData);
      } else {
        await createBook(formData);
      }
      navigate('/books');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{isEdit ? '编辑图书' : '新增图书'}</h2>
      <button onClick={() => navigate('/books')} style={{ marginBottom: '12px' }}>
        返回
      </button>
      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '400px' }}
      >
        <input name="title" placeholder="书名" value={formData.title} onChange={handleChange} required />
        <input name="author" placeholder="作者" value={formData.author} onChange={handleChange} required />
        <input
          name="isbn"
          placeholder="ISBN"
          value={formData.isbn}
          onChange={handleChange}
          required
          minLength={10}
        />
        <input name="publisher" placeholder="出版社" value={formData.publisher} onChange={handleChange} />
        <input name="category" placeholder="分类" value={formData.category} onChange={handleChange} />
        <input
          name="totalStock"
          type="number"
          placeholder="总库存"
          value={formData.totalStock}
          onChange={handleChange}
          min={0}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '提交中...' : isEdit ? '更新' : '新增'}
        </button>
      </form>
    </div>
  );
}
