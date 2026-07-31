<script setup lang="ts">
// 根组件：提供布局容器与路由出口
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>图书管理系统 - 算法与埋点分析</h1>
      <nav class="app-nav">
        <RouterLink to="/algorithms">算法演示</RouterLink>
        <RouterLink to="/analytics">埋点分析</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f6f8;
  color: #1f2329;
}
.app {
  min-height: 100vh;
}
.app-header {
  background: #1f6feb;
  color: #fff;
  padding: 16px 24px;
}
.app-header h1 {
  margin: 0 0 8px;
  font-size: 20px;
}
.app-nav {
  display: flex;
  gap: 16px;
}
.app-nav a {
  color: #fff;
  text-decoration: none;
  font-size: 14px;
}
.app-nav a.router-link-active {
  border-bottom: 2px solid #fff;
  padding-bottom: 2px;
}
.app-main {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
