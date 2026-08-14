<template>
  <div class="whitelist-type-toggle">
    <button
      v-for="opt in WHITELIST_TYPE_OPTIONS"
      :key="opt.value"
      class="type-btn"
      :class="{ active: modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { WhitelistType } from '@/types/whitelist'
import { WHITELIST_TYPE_OPTIONS } from '@/types/whitelist'

defineProps<{
  modelValue: WhitelistType
}>()

defineEmits<{
  (e: 'update:modelValue', value: WhitelistType): void
}>()
</script>

<style scoped>
.whitelist-type-toggle {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.type-btn {
  padding: 10px 24px;
  border: none;
  background-color: #fff;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.type-btn:not(:last-child) {
  border-right: 1px solid #dcdfe6;
}

.type-btn.active {
  background-color: #409eff;
  color: #fff;
}

.type-btn:hover:not(.active) {
  color: #409eff;
}
</style>