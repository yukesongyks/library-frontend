<template>
  <div class="budget-quarter-table">
    <h4>季度预算</h4>
    <table v-if="budgets.length > 0">
      <thead>
        <tr>
          <th>季度</th>
          <th>预算金额</th>
          <th>已使用</th>
          <th>剩余</th>
          <th>备注</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="budget in budgets" :key="budget.budgetId">
          <td>{{ QUARTER_LABELS[budget.quarter!] || `Q${budget.quarter}` }}</td>
          <td>¥{{ formatAmount(budget.budgetAmount) }}</td>
          <td>¥{{ formatAmount(budget.usedAmount) }}</td>
          <td>¥{{ formatAmount(budget.remainingAmount) }}</td>
          <td>{{ budget.note || '-' }}</td>
          <td>
            <button class="action-btn" @click="$emit('edit', budget)">编辑</button>
          </td>
        </tr>
      </tbody>
    </table>
    <EmptyState v-else message="暂无季度预算" />
  </div>
</template>

<script setup lang="ts">
import type { Budget } from '@/types/budget'
import { QUARTER_LABELS } from '@/types/budget'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps<{
  budgets: Budget[]
}>()

defineEmits<{
  (e: 'edit', budget: Budget): void
}>()

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.budget-quarter-table {
  margin-bottom: 20px;
}

.budget-quarter-table h4 {
  font-size: 15px;
  color: #303133;
  margin: 0 0 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
}

th, td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
}

th {
  background-color: #fafafa;
  color: #909399;
  font-weight: 500;
}

.action-btn {
  padding: 4px 12px;
  border: 1px solid #409eff;
  background-color: #fff;
  color: #409eff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.action-btn:hover {
  background-color: #409eff;
  color: #fff;
}
</style>