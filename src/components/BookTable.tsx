import type { Book } from '../types/book';

interface BookTableProps {
  books: Book[];
  isAdmin: boolean;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export default function BookTable({ books, isAdmin, onEdit, onDelete }: BookTableProps) {
  return (
    <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th>书名</th>
          <th>作者</th>
          <th>ISBN</th>
          <th>出版社</th>
          <th>分类</th>
          <th>库存</th>
          <th>总库存</th>
          {isAdmin && <th>操作</th>}
        </tr>
      </thead>
      <tbody>
        {books.map((book) => (
          <tr key={book.id}>
            <td>{book.title}</td>
            <td>{book.author}</td>
            <td>{book.isbn}</td>
            <td>{book.publisher}</td>
            <td>{book.category}</td>
            <td>{book.stock}</td>
            <td>{book.totalStock}</td>
            {isAdmin && (
              <td>
                <button onClick={() => onEdit(book)}>编辑</button>
                <button onClick={() => onDelete(book)} style={{ marginLeft: '8px' }}>
                  删除
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
