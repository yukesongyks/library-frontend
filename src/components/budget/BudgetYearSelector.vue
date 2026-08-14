<template>
  <div class="budget-year-selector">
    <label>选择年份：</label>
    <div class="year-buttons">
      <button
        v-for="year in years"
        :key="year"
        class="year-btn"
        :class="{ active: year === modelValue }"
        @click="$emit('update:modelValue', year)"
      >
        {{ year }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number
  years?: number[]
}>()

defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
</script>

<style scoped>
.budget-year-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.budget-year-selector label {
  font-size: 14px;
  color: #606266;
}

.year-buttons {
  display: flex;
  gap: 8px;
}

.year-btn {
  padding: 6px 16px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.year-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.year-btn.active {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}
</style>