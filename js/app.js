/**
 * 图书管理系统前端逻辑
 * 与后端 API 契约对齐: /api/v1/books
 */

var API_BASE = 'http://localhost:8080/api/v1/books';
var pageNum = 1;
var pageSize = 10;
var totalPages = 1;
var isEdit = false;

document.addEventListener('DOMContentLoaded', function () {
    loadBooks();
    document.getElementById('bookForm').addEventListener('submit', handleSubmit);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
});

/**
 * 加载图书列表
 */
function loadBooks() {
    fetch(API_BASE + '?pageNum=' + pageNum + '&pageSize=' + pageSize)
        .then(function (response) {
            return response.json();
        })
        .then(function (res) {
            if (res.code === 10000) {
                renderTable(res.data);
            } else {
                showMessage(res.message, 'error');
            }
        })
        .catch(function (error) {
            showMessage('加载图书列表失败: ' + error, 'error');
        });
}

/**
 * 渲染表格
 */
function renderTable(pageData) {
    var tbody = document.getElementById('bookTableBody');
    tbody.innerHTML = '';
    totalPages = pageData.pages || 1;

    pageData.list.forEach(function (book) {
        var row = document.createElement('tr');
        row.innerHTML =
            '<td>' + book.id + '</td>' +
            '<td>' + escapeHtml(book.title) + '</td>' +
            '<td>' + escapeHtml(book.author) + '</td>' +
            '<td>' + escapeHtml(book.isbn) + '</td>' +
            '<td>' + escapeHtml(book.publisher || '') + '</td>' +
            '<td>' + book.stock + '</td>' +
            '<td>' +
            '<button class="edit-btn" onclick="editBook(' + book.id + ')">编辑</button>' +
            '<button class="delete-btn" onclick="deleteBook(' + book.id + ')">删除</button>' +
            '</td>';
        tbody.appendChild(row);
    });

    updatePagination();
}

/**
 * 表单提交(新增/更新)
 */
function handleSubmit(event) {
    event.preventDefault();

    var bookData = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        isbn: document.getElementById('isbn').value,
        publisher: document.getElementById('publisher').value,
        stock: parseInt(document.getElementById('stock').value, 10)
    };

    var bookId = document.getElementById('bookId').value;
    var method = isEdit ? 'PUT' : 'POST';
    var url = isEdit ? API_BASE + '/' + bookId : API_BASE;

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (res) {
            if (res.code === 10000) {
                showMessage(isEdit ? '更新成功' : '新增成功', 'success');
                resetForm();
                loadBooks();
            } else {
                showMessage(res.message, 'error');
            }
        })
        .catch(function (error) {
            showMessage('保存失败: ' + error, 'error');
        });
}

/**
 * 编辑图书 - 回填表单
 */
function editBook(id) {
    fetch(API_BASE + '/' + id)
        .then(function (response) {
            return response.json();
        })
        .then(function (res) {
            if (res.code === 10000) {
                var book = res.data;
                isEdit = true;
                document.getElementById('bookId').value = book.id;
                document.getElementById('title').value = book.title;
                document.getElementById('author').value = book.author;
                document.getElementById('isbn').value = book.isbn;
                document.getElementById('publisher').value = book.publisher || '';
                document.getElementById('stock').value = book.stock;
                document.getElementById('formTitle').textContent = '编辑图书';
                document.getElementById('submitBtn').textContent = '更新';
            } else {
                showMessage(res.message, 'error');
            }
        })
        .catch(function (error) {
            showMessage('加载图书详情失败: ' + error, 'error');
        });
}

/**
 * 删除图书
 */
function deleteBook(id) {
    if (!confirm('确认删除该图书?')) {
        return;
    }

    fetch(API_BASE + '/' + id, { method: 'DELETE' })
        .then(function (response) {
            return response.json();
        })
        .then(function (res) {
            if (res.code === 10000) {
                showMessage('删除成功', 'success');
                loadBooks();
            } else {
                showMessage(res.message, 'error');
            }
        })
        .catch(function (error) {
            showMessage('删除失败: ' + error, 'error');
        });
}

/**
 * 重置表单
 */
function resetForm() {
    isEdit = false;
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('formTitle').textContent = '新增图书';
    document.getElementById('submitBtn').textContent = '保存';
}

/**
 * 上一页
 */
function prevPage() {
    if (pageNum > 1) {
        pageNum--;
        loadBooks();
    }
}

/**
 * 下一页
 */
function nextPage() {
    if (pageNum < totalPages) {
        pageNum++;
        loadBooks();
    }
}

/**
 * 更新分页控件
 */
function updatePagination() {
    document.getElementById('pageInfo').textContent = '第 ' + pageNum + ' / ' + totalPages + ' 页';
    document.getElementById('prevBtn').disabled = (pageNum <= 1);
    document.getElementById('nextBtn').disabled = (pageNum >= totalPages);
}

/**
 * 显示消息
 */
function showMessage(text, type) {
    var msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = 'message ' + type;
    setTimeout(function () {
        msg.className = 'message hidden';
    }, 3000);
}

/**
 * HTML转义, 防止XSS
 */
function escapeHtml(str) {
    if (!str) {
        return '';
    }
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
