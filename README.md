# library-frontend
图书管理系统前端 —— 成本统计报表

## 运行
- 依赖: `npm install`
- 开发: `npm run dev`（端口 5173，/api 代理到 http://localhost:8080）
- 测试: `npm test`
- 构建: `npm run build`

## 页面
- `/`             成本总览 Dashboard（指标卡 + 月度趋势）
- `/cost-analysis` 成本统计分析（部门/项目/业务线/人员/月份/季度/年度 + 角色筛选，Excel/CSV 导出）