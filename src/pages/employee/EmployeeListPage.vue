<template>
  <div class="employee-list-page">
    <div class="page-header">
      <h2>员工管理</h2>
      <router-link to="/employees/new" class="add-btn">+ 添加员工</router-link>
    </div>

    <div class="toolbar">
      <SearchBar
        :model-value="store.searchQuery"
        placeholder="搜索姓名或部门..."
        @search="onSearch"
        @update:model-value="onSearchInput"
      />
      <div class="filter-group">
        <label>状态：</label>
        <select
          :value="store.statusFilter"
          class="filter-select"
          @change="onStatusChange"
        >
          <option value="">全部</option>
          <option v-for="opt in EMPLOYEE_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <LoadingSpinner :loading="store.loading" />

    <EmployeeTable
      v-if="!store.loading"
      :employees="store.employees"
      @delete="onDelete"
    />

    <Pagination
      :current-page="store.currentPage"
      :total-pages="store.totalPages"
      :total="store.totalElements"
      @page-change="onPageChange"
    />

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
import { onMounted, ref } from 'vue'
import { useEmployeeStore } from '@/stores/employeeStore'
import { EMPLOYEE_STATUS_OPTIONS } from '@/types/employee'
import type { EmployeeStatus } from '@/types/employee'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmployeeTable from '@/components/employee/EmployeeTable.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Notification from '@/components/common/Notification.vue'

const store = useEmployeeStore()

const deleteDialogVisible = ref(false)
const deleteTargetId = ref<string | null>(null)
const notificationVisible = ref(false)
const notificationType = ref<'success' | 'error'>('success')
const notificationMessage = ref('')

onMounted(() => {
  store.fetchEmployees()
})

function onSearch(query: string) {
  store.setSearch(query)
  store.fetchEmployees()
}

function onSearchInput() {
  // debounced search handled by search button
}

function onStatusChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as EmployeeStatus | ''
  store.setStatusFilter(value)
  store.fetchEmployees()
}

function onPageChange(page: number) {
  store.setPage(page)
  store.fetchEmployees()
}

function onDelete(id: string) {
  deleteTargetId.value = id
  deleteDialogVisible.value = true
}

async function confirmDelete() {
  if (!deleteTargetId.value) return
  try {
    await store.deleteEmployee(deleteTargetId.value)
    showNotification('success', '员工已删除')
  } catch {
    showNotification('error', '删除失败')
  }
  deleteDialogVisible.value = false
  deleteTargetId.value = null
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
.employee-list-page {
  max-width: 1200px;
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

.add-btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #409eff;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
}

.add-btn:hover {
  background-color: #337ecc;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.filter-select:focus {
  border-color: #409eff;
}
</style>