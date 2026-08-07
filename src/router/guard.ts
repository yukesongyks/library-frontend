/**
 * 路由守卫
 *
 * 对齐 design.md §5.1.3.1 JWT 鉴权流程与 §6.4.2 权限控制
 * - 未登录访问受保护路由 → 重定向 /login
 * - 已登录访问 /login → 重定向首页
 * - ADMIN 专属路由（导入/导出入口）由页面内 v-if 控制，路由层仅校验登录态
 */

import type { Router } from 'vue-router'

export function setupRouterGuard(router: Router): void {
  router.beforeEach((to, _from, next) => {
    const token = localStorage.getItem('cost_token')
    const isLoginRoute = to.path === '/login'

    if (isLoginRoute) {
      // 已登录访问登录页 → 跳转首页
      if (token) {
        next({ path: '/cost/dashboard' })
      } else {
        next()
      }
      return
    }

    // 受保护路由
    if (to.meta?.requiresAuth !== false) {
      if (!token) {
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }

    next()
  })
}
