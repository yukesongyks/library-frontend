import { createRouter, createWebHistory } from 'vue-router'
import AlgorithmPage from '@/views/AlgorithmPage.vue'
import AnalyticsDashboard from '@/views/AnalyticsDashboard.vue'

// 路由表：/algorithms 算法演示三 Tab，/analytics 埋点分析报表
const routes = [
  { path: '/', redirect: '/algorithms' },
  { path: '/algorithms', name: 'algorithms', component: AlgorithmPage },
  { path: '/analytics', name: 'analytics', component: AnalyticsDashboard }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
