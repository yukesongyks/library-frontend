// library-frontend app.js
// HTTP client + UI logic for the library management system.
// DTO fields must match library-backend design.md exactly:
//   Book: {id,title,author,totalCopies,availableCopies,status}
//   status enum: AVAILABLE | UNAVAILABLE
//   BorrowRecord: {id,bookId,borrower,borrowedAt,returnedAt,status}
//   borrow status enum: BORROWED | RETURNED
//   Error body: {error:"<message>"}

const API_BASE = 'http://localhost:3001/api';

// ---- HTTP client ----
async function api(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!res.ok) {
      const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('无法连接后端服务，请确认后端已启动 (localhost:3001)');
    }
    throw err;
  }
}

// ---- API wrappers ----
const Books = {
  list: () => api('/books'),
  get: (id) => api(`/books/${id}`),
  create: (data) => api('/books', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => api(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => api(`/books/${id}`, { method: 'DELETE' }),
  borrow: (id, borrower) => api(`/books/${id}/borrow`, { method: 'POST', body: JSON.stringify({ borrower }) }),
  return: (id, borrowId) => api(`/books/${id}/return`, { method: 'POST', body: JSON.stringify({ borrowId }) }),
};

// ---- UI helpers ----
function $(sel) { return document.querySelector(sel); }

let toastTimer = null;
function showError(msg) {
  const toast = $('#error-toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 4000);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ---- Render book list ----
async function renderBooks() {
  const list = $('#book-list');
  list.innerHTML = '<tr><td colspan="7" class="loading">加载中…</td></tr>';
  try {
    const books = await Books.list();
    if (books.length === 0) {
      list.innerHTML = '<tr><td colspan="7" class="loading">暂无图书，请添加</td></tr>';
      return;
    }
    list.innerHTML = books.map(b => `
      <tr id="row-${b.id}">
        <td>${b.id}</td>
        <td class="cell-title-${b.id}">${escapeHtml(b.title)}</td>
        <td class="cell-author-${b.id}">${escapeHtml(b.author)}</td>
        <td class="cell-total-${b.id}">${b.totalCopies}</td>
        <td>${b.availableCopies}</td>
        <td class="status-${b.status}">${b.status === 'AVAILABLE' ? '可借' : '已借完'}</td>
        <td class="actions">
          <input type="text" placeholder="借阅人" id="borrower-${b.id}" ${b.availableCopies === 0 ? 'disabled' : ''}>
          <button class="btn-borrow" data-borrow="${b.id}" ${b.availableCopies === 0 ? 'disabled' : ''}>借出</button>
          <button class="btn-return" data-return="${b.id}">归还</button>
          <button class="btn-edit" data-edit="${b.id}">编辑</button>
          <button class="btn-delete" data-delete="${b.id}">删除</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    list.innerHTML = `<tr><td colspan="7" class="loading">加载失败：${escapeHtml(err.message)}</td></tr>`;
  }
}

// ---- Event handlers ----
async function handleAdd(e) {
  e.preventDefault();
  const title = $('#title').value.trim();
  const author = $('#author').value.trim();
  const totalCopies = Number($('#totalCopies').value);
  if (!title || !author) { showError('书名和作者不能为空'); return; }
  if (!Number.isInteger(totalCopies) || totalCopies < 1) { showError('馆藏数量须为 >=1 的整数'); return; }
  try {
    await Books.create({ title, author, totalCopies });
    $('#title').value = '';
    $('#author').value = '';
    $('#totalCopies').value = '1';
    await renderBooks();
  } catch (err) {
    showError(err.message);
  }
}

async function handleBorrow(id) {
  const borrower = $(`#borrower-${id}`).value.trim();
  if (!borrower) { showError('请输入借阅人'); return; }
  try {
    const record = await Books.borrow(id, borrower);
    alert(`借出成功！借阅记录 ID: ${record.id}，借阅人: ${record.borrower}`);
    await renderBooks();
  } catch (err) {
    showError(err.message);
  }
}

async function handleReturn(id) {
  const input = prompt('请输入要归还的借阅记录 ID:');
  if (input === null) return;
  const borrowId = Number(input);
  if (!Number.isInteger(borrowId)) { showError('借阅记录 ID 须为整数'); return; }
  try {
    const record = await Books.return(id, borrowId);
    alert(`归还成功！记录 ID: ${record.id}，状态: ${record.status}`);
    await renderBooks();
  } catch (err) {
    showError(err.message);
  }
}

async function handleDelete(id) {
  if (!confirm('确认删除此图书？')) return;
  try {
    await Books.remove(id);
    await renderBooks();
  } catch (err) {
    showError(err.message);
  }
}

// ---- Inline edit: PUT /api/books/{id} (specs 更新图书信息) ----
function startEdit(id) {
  const titleEl = $(`#row-${id} .cell-title-${id}`);
  const authorEl = $(`#row-${id} .cell-author-${id}`);
  const totalEl = $(`#row-${id} .cell-total-${id}`);

  const title = titleEl.textContent;
  const author = authorEl.textContent;
  const total = totalEl.textContent;

  titleEl.innerHTML = `<input type="text" class="edit-title-${id}" value="${escapeHtml(title)}">`;
  authorEl.innerHTML = `<input type="text" class="edit-author-${id}" value="${escapeHtml(author)}">`;
  totalEl.innerHTML = `<input type="number" min="1" class="edit-total-${id}" value="${escapeHtml(total)}">`;

  // Replace actions with Save/Cancel only while editing
  $(`#row-${id} .actions`).innerHTML = `
    <button class="btn-save" data-save="${id}">保存</button>
    <button class="btn-cancel" data-cancel="${id}">取消</button>
  `;
}

async function handleSave(id) {
  const title = $(`#row-${id} .edit-title-${id}`).value.trim();
  const author = $(`#row-${id} .edit-author-${id}`).value.trim();
  const totalCopies = Number($(`#row-${id} .edit-total-${id}`).value);
  if (!title || !author) { showError('书名和作者不能为空'); return; }
  if (!Number.isInteger(totalCopies) || totalCopies < 1) { showError('馆藏数量须为 >=1 的整数'); return; }
  try {
    await Books.update(id, { title, author, totalCopies });
    await renderBooks();
  } catch (err) {
    showError(err.message);
  }
}

function handleCancel(id) {
  renderBooks();
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  $('#add-form').addEventListener('submit', handleAdd);
  $('#refresh').addEventListener('click', renderBooks);

  $('#book-list').addEventListener('click', (e) => {
    const borrowId = e.target.dataset.borrow;
    const returnId = e.target.dataset.return;
    const deleteId = e.target.dataset.delete;
    const editId = e.target.dataset.edit;
    const saveId = e.target.dataset.save;
    const cancelId = e.target.dataset.cancel;
    if (borrowId) handleBorrow(Number(borrowId));
    else if (returnId) handleReturn(Number(returnId));
    else if (editId) startEdit(Number(editId));
    else if (saveId) handleSave(Number(saveId));
    else if (cancelId) handleCancel(Number(cancelId));
    else if (deleteId) handleDelete(Number(deleteId));
  });

  renderBooks();
});
