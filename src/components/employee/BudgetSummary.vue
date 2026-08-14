<template>
  <div class="budget-summary">
    <h3>预算汇总</h3>
    <div class="year-selector">
      <label>年份：</label>
      <select v-model="year" @change="$emit('year-change', year)">
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <LoadingSpinner :loading="loading" />

    <div v-if="summary && !loading" class="summary-content">
      <div class="summary-total">
        <div class="summary-item">
          <span class="summary-label">年度预算</span>
          <span class="summary-value">¥{{ formatAmount(summary.totalBudget) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">已使用</span>
          <span class="summary-value used">¥{{ formatAmount(summary.totalUsed) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">剩余</span>
          <span class="summary-value remaining">¥{{ formatAmount(summary.totalRemaining) }}</span>
        </div>
      </div>

      <div v-if="summary.quarters && summary.quarters.length > 0" class="summary-quarters">
        <h4>季度预算</h4>
        <div v-for="q in summary.quarters" :key="q.quarter" class="summary-row">
          <span class="period-label">{{ QUARTER_LABELS[q.quarter] }}</span>
          <span class="period-amount">¥{{ formatAmount(q.budgetAmount) }}</span>
          <span class="period-used">已用 ¥{{ formatAmount(q.usedAmount) }}</span>
          <span class="period-remaining">剩余 ¥{{ formatAmount(q.remainingAmount) }}</span>
        </div>
      </div>

      <div v-if="summary.months && summary.months.length > 0" class="summary-months">
        <h4>月度预算</h4>
        <div v-for="m in summary.months" :key="m.month" class="summary-row">
          <span class="period-label">{{ MONTH_LABELS[m.month] }}</span>
          <span class="period-amount">¥{{ formatAmount(m.budgetAmount) }}</span>
          <span class="period-used">已用 ¥{{ formatAmount(m.usedAmount) }}</span>
          <span class="period-remaining">剩余 ¥{{ formatAmount(m.remainingAmount) }}</span>
        </div>
      </div>
    </div>

    <EmptyState v-else-if="!loading && !summary" message="暂无预算数据" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { BudgetSummary } from '@/types/budget'
import { QUARTER_LABELS, MONTH_LABELS } from '@/types/budget'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

withDefaults(defineProps<{
  summary: BudgetSummary | null
  loading?: boolean
}>(), {
  loading: false,
})

defineEmits<{
  (e: 'year-change', year: number): void
}>()

const year = ref(new Date().getFullYear())
const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.budget-summary {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
}

.budget-summary h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #303133;
}

.year-selector {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.year-selector select {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.summary-total {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.summary-value.used {
  color: #e6a23c;
}

.summary-value.remaining {
  color: #67c23a;
}

.summary-quarters, .summary-months {
  margin-bottom: 16px;
}

.summary-quarters h4, .summary-months h4 {
  font-size: 14px;
  color: #606266;
  margin: 0 0 8px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #f2f2f2;
  font-size: 13px;
}

.period-label {
  width: 100px;
  color: #303133;
  font-weight: 500;
}

.period-amount {
  width: 150px;
  color: #606266;
}

.period-used {
  width: 150px;
  color: #e6a23c;
}

.period-remaining {
  color: #67c23a;
}
</style>