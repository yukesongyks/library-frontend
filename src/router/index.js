import { createRouter, createWebHistory } from 'vue-router'
import AlgorithmDemoPage from '../views/AlgorithmDemoPage.vue'

// 路由：/algorithm-demo 展示算法演示页
const routes = [
  { path: '/', redirect: '/algorithm-demo' },
  { path: '/algorithm-demo', name: 'AlgorithmDemo', component: AlgorithmDemoPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
