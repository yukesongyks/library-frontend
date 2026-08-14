<template>
  <div v-if="totalPages > 1" class="pagination">
    <button
      :disabled="currentPage <= 0"
      class="page-btn"
      @click="$emit('page-change', 0)"
    >
      首页
    </button>
    <button
      :disabled="currentPage <= 0"
      class="page-btn"
      @click="$emit('page-change', currentPage - 1)"
    >
      上一页
    </button>
    <span class="page-info">
      第 {{ currentPage + 1 }} / {{ totalPages }} 页，共 {{ total }} 条
    </span>
    <button
      :disabled="currentPage >= totalPages - 1"
      class="page-btn"
      @click="$emit('page-change', currentPage + 1)"
    >
      下一页
    </button>
    <button
      :disabled="currentPage >= totalPages - 1"
      class="page-btn"
      @click="$emit('page-change', totalPages - 1)"
    >
      末页
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
  total: number
}>()

defineEmits<{
  (e: 'page-change', page: number): void
}>()
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
}

.page-btn:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.page-info {
  font-size: 13px;
  color: #606266;
  margin: 0 8px;
}
</style>