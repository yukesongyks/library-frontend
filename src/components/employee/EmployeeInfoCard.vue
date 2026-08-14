<template>
  <div v-if="employee" class="info-card">
    <div class="card-header">
      <h3>基本信息</h3>
      <div class="card-actions">
        <router-link :to="`/employees/${employee.employeeId}/budgets`" class="action-btn">预算管理</router-link>
        <router-link :to="`/employees/${employee.employeeId}/edit`" class="action-btn">编辑</router-link>
      </div>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="info-label">员工编号</span>
        <span class="info-value">{{ employee.employeeId }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">姓名</span>
        <span class="info-value">{{ employee.name }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">部门</span>
        <span class="info-value">{{ employee.department }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">职位</span>
        <span class="info-value">{{ employee.position }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">电话</span>
        <span class="info-value">{{ employee.phone || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">邮箱</span>
        <span class="info-value">{{ employee.email || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">入职日期</span>
        <span class="info-value">{{ employee.hireDate }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">状态</span>
        <span class="info-value">
          <span class="status-tag" :class="statusClass(employee.status)">
            {{ statusLabel(employee.status) }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Employee, EmployeeStatus } from '@/types/employee'

defineProps<{
  employee: Employee | null
}>()

function statusClass(status: EmployeeStatus): string {
  const map: Record<EmployeeStatus, string> = {
    ACTIVE: 'status-active',
    INACTIVE: 'status-inactive',
    TERMINATED: 'status-terminated',
  }
  return map[status] || ''
}

function statusLabel(status: EmployeeStatus): string {
  const map: Record<EmployeeStatus, string> = {
    ACTIVE: '在职',
    INACTIVE: '停职',
    TERMINATED: '离职',
  }
  return map[status] || status
}
</script>

<style scoped>
.info-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: inline-block;
  padding: 6px 16px;
  background-color: #409eff;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 13px;
}

.action-btn:hover {
  background-color: #337ecc;
}

.card-body {
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-active {
  background-color: #e1f3d8;
  color: #67c23a;
}

.status-inactive {
  background-color: #faecd8;
  color: #e6a23c;
}

.status-terminated {
  background-color: #fde2e2;
  color: #f56c6c;
}
</style>