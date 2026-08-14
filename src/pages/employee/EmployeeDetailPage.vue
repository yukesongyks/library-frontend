<template>
  <div class="employee-detail-page">
    <div class="page-header">
      <h2>员工详情</h2>
      <div class="header-actions">
        <router-link :to="`/employees/${employeeId}/budgets`" class="header-btn">预算管理</router-link>
        <router-link :to="`/employees/${employeeId}/edit`" class="header-btn">编辑</router-link>
        <button class="header-btn danger" @click="onDelete">删除</button>
        <router-link to="/employees" class="header-btn back">返回列表</router-link>
      </div>
    </div>

    <LoadingSpinner :loading="store.loading" />

    <template v-if="!store.loading && store.currentEmployee">
      <EmployeeInfoCard :employee="store.currentEmployee" />

      <div class="budget-section" style="margin-top: 24px;">
        <BudgetSummary
          :summary="budgetSummary"
          :loading="budgetLoading"
          @year-change="onBudgetYearChange"
        />
      </div>
    </template>

    <EmptyState v-else-if="!store.loading" message="员工不存在" />

    <ConfirmDialog
      :visible="deleteDialogVisible"
      title="确认删除"
      message="确定要删除该员工吗？此操作不可恢复。"
      confirm-text="删除"
      :danger="true"
      @confirm="confirmDelete"
      @cancel="deleteDialogVisible = false"
    />

    <Notification
      :visible="notificationVisible"
      :type="notificationType"
      :message="notificationMessage"
      @close="notificationVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/employeeStore'
import { useBudgetStore } from '@/stores/budgetStore'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import EmployeeInfoCard from '@/components/employee/EmployeeInfoCard.vue'
import BudgetSummary from '@/components/employee/BudgetSummary.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Notification from '@/components/common/Notification.vue'

const route = useRoute()
const router = useRouter()
const store = useEmployeeStore()
const budgetStore = useBudgetStore()

const employeeId = route.params.id as string
const deleteDialogVisible = ref(false)
const budgetLoading = ref(false)
const budgetSummary = ref(null)
const notificationVisible = ref(false)
const notificationType = ref<'success' | 'error'>('success')
const notificationMessage = ref('')

onMounted(async () => {
  try {
    await store.fetchEmployeeById(employeeId)
    await loadBudgetSummary(new Date().getFullYear())
  } catch {
    showNotification('error', '获取员工信息失败')
  }
})

async function loadBudgetSummary(year: number) {
  budgetLoading.value = true
  try {
    const res = await budgetStore.fetchSummary(employeeId, year)
    budgetSummary.value = budgetStore.summary
  } catch {
    // budget summary is optional
  } finally {
    budgetLoading.value = false
  }
}

function onBudgetYearChange(year: number) {
  loadBudgetSummary(year)
}

function onDelete() {
  deleteDialogVisible.value = true
}

async function confirmDelete() {
  try {
    await store.deleteEmployee(employeeId)
    showNotification('success', '员工已删除')
    setTimeout(() => router.push('/employees'), 1000)
  } catch {
    showNotification('error', '删除失败')
  }
  deleteDialogVisible.value = false
}

function showNotification(type: 'success' | 'error', message: string) {
  notificationType.value = type
  notificationMessage.value = message
  notificationVisible.value = true
  setTimeout(() => {
    notificationVisible.value = false
  }, 3000)
}
</script>

<style scoped>
.employee-detail-page {
  max-width: 1000px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: #409eff;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 13px;
  border: none;
  cursor: pointer;
}

.header-btn:hover {
  background-color: #337ecc;
}

.header-btn.danger {
  background-color: #f56c6c;
}

.header-btn.danger:hover {
  background-color: #d14545;
}

.header-btn.back {
  background-color: #909399;
}

.header-btn.back:hover {
  background-color: #73767a;
}
</style>