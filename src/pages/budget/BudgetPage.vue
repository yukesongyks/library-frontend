<template>
  <div class="budget-page">
    <div class="page-header">
      <h2>预算管理 - {{ employee?.name || employeeId }}</h2>
      <router-link :to="`/employees/${employeeId}`" class="back-btn">返回详情</router-link>
    </div>

    <BudgetYearSelector v-model="selectedYear" @update:model-value="onYearChange" />

    <LoadingSpinner :loading="store.loading" />

    <div v-if="!store.loading" class="budget-content">
      <div class="budget-tables">
        <BudgetQuarterTable :budgets="quarterBudgets" @edit="onEditBudget" />
        <BudgetMonthTable :budgets="monthBudgets" @edit="onEditBudget" />
      </div>

      <div class="budget-form-section">
        <BudgetForm
          :is-edit="!!editingBudget"
          :initial-data="editingBudget || {}"
          @submit="onBudgetSubmit"
          @cancel="editingBudget = null"
        />
      </div>
    </div>

    <Notification
      :visible="notificationVisible"
      :type="notificationType"
      :message="notificationMessage"
      @close="notificationVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEmployeeStore } from '@/stores/employeeStore'
import { useBudgetStore } from '@/stores/budgetStore'
import type { Budget, BudgetRequest } from '@/types/budget'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BudgetYearSelector from '@/components/budget/BudgetYearSelector.vue'
import BudgetQuarterTable from '@/components/budget/BudgetQuarterTable.vue'
import BudgetMonthTable from '@/components/budget/BudgetMonthTable.vue'
import BudgetForm from '@/components/budget/BudgetForm.vue'
import Notification from '@/components/common/Notification.vue'

const route = useRoute()
const employeeStore = useEmployeeStore()
const store = useBudgetStore()

const employeeId = route.params.id as string
const selectedYear = ref(new Date().getFullYear())
const editingBudget = ref<Partial<Budget> | null>(null)
const employee = ref<any>(null)
const notificationVisible = ref(false)
const notificationType = ref<'success' | 'error'>('success')
const notificationMessage = ref('')

const quarterBudgets = computed(() =>
  store.budgets.filter((b) => b.quarter != null && b.month == null)
)

const monthBudgets = computed(() =>
  store.budgets.filter((b) => b.month != null)
)

onMounted(async () => {
  try {
    const emp = await employeeStore.fetchEmployeeById(employeeId)
    employee.value = emp
  } catch {
    // ignore
  }
  await loadBudgets()
})

async function loadBudgets() {
  try {
    await store.fetchBudgets(employeeId, selectedYear.value)
  } catch {
    showNotification('error', '获取预算数据失败')
  }
}

function onYearChange(year: number) {
  selectedYear.value = year
  loadBudgets()
}

function onEditBudget(budget: Budget) {
  editingBudget.value = { ...budget }
}

async function onBudgetSubmit(data: BudgetRequest) {
  try {
    if (editingBudget.value?.budgetId) {
      await store.updateBudget(employeeId, editingBudget.value.budgetId, data)
      showNotification('success', '预算更新成功')
    } else {
      await store.createBudget(employeeId, data)
      showNotification('success', '预算创建成功')
    }
    editingBudget.value = null
    await loadBudgets()
  } catch {
    showNotification('error', '预算操作失败')
  }
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
.budget-page {
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

.back-btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: #909399;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 13px;
}

.back-btn:hover {
  background-color: #73767a;
}

.budget-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.budget-form-section {
  position: sticky;
  top: 24px;
  align-self: start;
}

@media (max-width: 900px) {
  .budget-content {
    grid-template-columns: 1fr;
  }
}
</style>