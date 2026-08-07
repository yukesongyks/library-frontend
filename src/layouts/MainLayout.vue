<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = computed(() => authStore.userInfo?.username ?? '未登录')

const activeMenu = computed(() => router.currentRoute.value.path)

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

function handleSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <el-container class="main-layout">
    <el-header class="main-header">
      <div class="header-left">成本统计报表</div>
      <div class="header-right">
        <span class="username">{{ username }}</span>
        <el-button type="danger" size="small" @click="handleLogout">登出</el-button>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="main-aside">
        <el-menu
          :default-active="activeMenu"
          class="side-menu"
          @select="handleSelect"
        >
          <el-menu-item index="/cost/dashboard">成本 Dashboard</el-menu-item>
          <el-menu-item index="/cost/analysis">成本分析</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100vh;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #409eff;
  color: #fff;
}

.header-left {
  font-size: 20px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
}

.main-aside {
  background-color: #f5f7fa;
}

.side-menu {
  border-right: none;
}

.main-content {
  background-color: #fff;
  padding: 20px;
}
</style>
