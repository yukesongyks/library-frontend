<template>
  <div class="app-layout">
    <SideNav />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import SideNav from './SideNav.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  margin-left: 240px;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}
</style>