# library-frontend
图书管理系统前端

## 技术栈
纯静态 HTML/CSS/JS + 零依赖 Node 静态服务器（无构建步骤）。

## 启动
```bash
npm start
# 监听 http://localhost:3000
```
需先启动后端（默认 http://localhost:3001），前端通过 fetch 跨域调用。

## 页面
- 图书列表（展示标题/作者/馆藏/可借/状态）
- 新增图书表单
- 借出/归还/删除操作

API 调用封装见 `js/app.js`，DTO 字段与后端 `design.md` 对齐：
`{id,title,author,totalCopies,availableCopies,status}`，枚举 `AVAILABLE`/`UNAVAILABLE`。
