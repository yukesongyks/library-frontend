<template>
  <div class="employee-table">
    <table v-if="employees.length > 0">
      <thead>
        <tr>
          <th>员工编号</th>
          <th>姓名</th>
          <th>部门</th>
          <th>职位</th>
          <th>电话</th>
          <th>邮箱</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="emp in employees" :key="emp.employeeId">
          <td>{{ emp.employeeId }}</td>
          <td>
            <router-link :to="`/employees/${emp.employeeId}`" class="emp-link">
              {{ emp.name }}
            </router-link>
          </td>
          <td>{{ emp.department }}</td>
          <td>{{ emp.position }}</td>
          <td>{{ emp.phone || '-' }}</td>
          <td>{{ emp.email || '-' }}</td>
          <td>
            <span class="status-tag" :class="statusClass(emp.status)">
              {{ statusLabel(emp.status) }}
            </span>
          </td>
          <td class="actions">
            <router-link :to="`/employees/${emp.employeeId}`" class="action-link">查看</router-link>
            <router-link :to="`/employees/${emp.employeeId}/budgets`" class="action-link">预算</router-link>
            <button class="action-btn delete" @click="$emit('delete', emp.employeeId)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <EmptyState v-else message="暂无员工数据" />
  </div>
</template>

<script setup lang="ts">
import type { Employee, EmployeeStatus } from '@/types/employee'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps<{
  employees: Employee[]
}>()

defineEmits<{
  (e: 'delete', id: string): void
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
.employee-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  border-radius: 4px;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
}

th {
  background-color: #fafafa;
  color: #909399;
  font-weight: 500;
}

tr:hover {
  background-color: #f5f7fa;
}

.emp-link {
  color: #409eff;
  text-decoration: none;
}

.emp-link:hover {
  text-decoration: underline;
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

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-link {
  color: #409eff;
  text-decoration: none;
  font-size: 13px;
}

.action-link:hover {
  text-decoration: underline;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  background: none;
}

.action-btn.delete {
  color: #f56c6c;
}

.action-btn.delete:hover {
  background-color: #fef0f0;
}
</style>