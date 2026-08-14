<template>
  <div v-if="result" class="import-result-report">
    <h4>导入结果</h4>
    <div class="result-summary">
      <div class="result-item success">
        <span class="result-count">{{ result.successCount }}</span>
        <span class="result-label">成功</span>
      </div>
      <div class="result-item failure">
        <span class="result-count">{{ result.failureCount }}</span>
        <span class="result-label">失败</span>
      </div>
    </div>

    <div v-if="result.failures && result.failures.length > 0" class="failure-details">
      <h5>失败详情</h5>
      <table>
        <thead>
          <tr>
            <th>行号</th>
            <th>错误信息</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(failure, idx) in result.failures" :key="idx">
            <td>{{ failure.row }}</td>
            <td class="error-text">{{ failure.error }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImportResult } from '@/types/import'

defineProps<{
  result: ImportResult | null
}>()
</script>

<style scoped>
.import-result-report {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  border: 1px solid #ebeef5;
}

.import-result-report h4 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #303133;
}

.result-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  border-radius: 4px;
  min-width: 120px;
}

.result-item.success {
  background-color: #f0f9eb;
}

.result-item.failure {
  background-color: #fef0f0;
}

.result-count {
  font-size: 28px;
  font-weight: 700;
}

.result-item.success .result-count {
  color: #67c23a;
}

.result-item.failure .result-count {
  color: #f56c6c;
}

.result-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.failure-details h5 {
  font-size: 14px;
  color: #606266;
  margin: 0 0 8px;
}

.failure-details table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.failure-details th,
.failure-details td {
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  text-align: left;
}

.failure-details th {
  background-color: #fafafa;
  color: #909399;
  font-weight: 500;
}

.error-text {
  color: #f56c6c;
}
</style>