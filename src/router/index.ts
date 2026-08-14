import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/employees',
  },
  {
    path: '/employees',
    name: 'EmployeeList',
    component: () => import('@/pages/employee/EmployeeListPage.vue'),
  },
  {
    path: '/employees/new',
    name: 'EmployeeNew',
    component: () => import('@/pages/employee/EmployeeFormPage.vue'),
  },
  {
    path: '/employees/:id',
    name: 'EmployeeDetail',
    component: () => import('@/pages/employee/EmployeeDetailPage.vue'),
  },
  {
    path: '/employees/:id/budgets',
    name: 'EmployeeBudgets',
    component: () => import('@/pages/budget/BudgetPage.vue'),
  },
  {
    path: '/import',
    name: 'Import',
    component: () => import('@/pages/import/ImportPage.vue'),
  },
  {
    path: '/whitelist',
    name: 'Whitelist',
    component: () => import('@/pages/whitelist/WhitelistPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router