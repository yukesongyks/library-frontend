/**
 * 路由定义
 *
 * 对齐 design.md §2 架构：Dashboard 与成本分析页为两个主路由，登录页为鉴权入口
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouterGuard } from './guard'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/cost/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/cost',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'CostDashboard',
        component: () => import('@/views/cost/CostDashboardView.vue'),
        meta: { title: '成本统计 Dashboard' }
      },
      {
        path: 'analysis',
        name: 'CostAnalysis',
        component: () => import('@/views/cost/CostAnalysisView.vue'),
        meta: { title: '成本统计分析' }
      }
    ]
  },
  {
    path: '/hello',
    name: 'HelloWorld',
    component: () => import('@/views/HelloWorldView.vue'),
    meta: { requiresAuth: false, title: 'Hello World' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false, title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

setupRouterGuard(router)

export default router
