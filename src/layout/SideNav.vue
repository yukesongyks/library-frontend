<template>
  <nav class="side-nav">
    <div class="nav-header">
      <h2>人员看板</h2>
    </div>
    <ul class="nav-list">
      <li>
        <router-link to="/employees" class="nav-link" active-class="active">
          <span class="nav-icon">👥</span>
          <span>员工管理</span>
        </router-link>
      </li>
      <li>
        <router-link to="/import" class="nav-link" active-class="active">
          <span class="nav-icon">📥</span>
          <span>导入</span>
        </router-link>
      </li>
      <li>
        <router-link to="/whitelist" class="nav-link" active-class="active">
          <span class="nav-icon">📋</span>
          <span>白名单</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
</script>

<style scoped>
.side-nav {
  position: fixed;
  left: 0;
  top: 0;
  width: 240px;
  height: 100vh;
  background-color: #1a1a2e;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.nav-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.nav-list li {
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-link.active {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-right: 3px solid #4fc3f7;
}

.nav-icon {
  margin-right: 10px;
  font-size: 16px;
}
</style>