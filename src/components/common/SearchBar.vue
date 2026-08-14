<template>
  <div class="search-bar">
    <input
      v-model="searchText"
      type="text"
      :placeholder="placeholder"
      class="search-input"
      @input="onInput"
    />
    <button class="search-btn" @click="$emit('search', searchText)">搜索</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  placeholder?: string
  modelValue?: string
}>(), {
  placeholder: '搜索...',
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}>()

const searchText = ref(props.modelValue)

function onInput() {
  emit('update:modelValue', searchText.value)
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  width: 280px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #409eff;
}

.search-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn:hover {
  background-color: #337ecc;
}
</style>