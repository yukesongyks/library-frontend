import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'ApiDashboard',
    component: () => import('../views/ApiDashboard.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router