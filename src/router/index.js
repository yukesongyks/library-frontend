import { createRouter, createWebHistory } from 'vue-router'
import AlgorithmDemoPage from '../views/AlgorithmDemoPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/algorithm-demo'
  },
  {
    path: '/algorithm-demo',
    name: 'AlgorithmDemo',
    component: AlgorithmDemoPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
