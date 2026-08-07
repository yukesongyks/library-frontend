# library-frontend

图书管理系统前端 - 功能演示与调用统计可视化

## 技术栈

- React 18
- Vite 5
- ECharts 5（echarts-for-react）

## 项目结构

```
src/
├── main.jsx              # 入口文件
├── App.jsx               # 主应用组件（Tab页 + 图表）
├── index.css            # 全局样式
└── api/
    └── index.js          # API 请求封装
```

## 功能

1. **三个 Tab 页**：
   - HelloWorld：调用后端接口展示欢迎消息
   - 哈希算法：输入字符串计算 SHA-256 哈希
   - 冒泡排序：输入逗号分隔数字串执行排序

2. **导出按钮**：导出当前 Tab 的展示结果为 CSV 文件

3. **调用统计可视化报表**：
   - 支持维度切换：人员类型 / 人员层级 / 人员部门 / 调用人
   - 饼图：调用占比
   - 柱状图：调用次数
   - 折线图：调用趋势（按日期）

## 开发启动

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## API 代理

Vite 开发服务器已配置代理，`/api` 请求转发至 `http://localhost:8080`。
