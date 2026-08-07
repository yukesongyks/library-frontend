<template>
  <div class="bubble-sort-tab">
    <div class="input-area">
      <input v-model="numbersText" placeholder="输入数字，逗号分隔，如 5,3,8,1,9,2" />
      <button @click="execute" :disabled="loading">执行</button>
      <button @click="doExport" :disabled="exporting">导出</button>
    </div>

    <div v-if="loading" class="loading">执行中...</div>
    <div v-else-if="result" class="result-box">
      <p><strong>排序结果：</strong>{{ result.sorted?.join(', ') }}</p>
      <p><strong>耗时：</strong>{{ result.costMs }} ms</p>
      <p><strong>数量：</strong>{{ result.size }}</p>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { bubbleSort, exportResult } from '../api/demo.js'

const numbersText = ref('')
const result = ref(null)
const loading = ref(false)
const exporting = ref(false)
const error = ref('')

function parseNumbers() {
  return numbersText.value
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n))
}

async function execute() {
  loading.value = true
  error.value = ''
  try {
    const numbers = parseNumbers()
    const resp = await bubbleSort(numbers)
    if (resp.code === 'OK') {
      result.value = resp.data
    } else {
      error.value = resp.msg
    }
  } catch (e) {
    error.value = e.message || '服务暂时不可用，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function doExport() {
  exporting.value = true
  error.value = ''
  try {
    await exportResult('BUBBLE_SORT', { numbers: numbersText.value })
  } catch (e) {
    error.value = e.message || '导出失败，请稍后重试'
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.bubble-sort-tab input { width: 60%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin-right: 8px; }
.bubble-sort-tab button { padding: 6px 16px; margin-right: 8px; cursor: pointer; border-radius: 4px; border: 1px solid #ddd; }
.bubble-sort-tab button:disabled { opacity: 0.5; cursor: not-allowed; }
.result-box { margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px; }
.loading { margin-top: 16px; color: #409eff; }
.error-msg { color: #f56c6c; margin-top: 12px; padding: 8px; background: #fef0f0; border-radius: 4px; }
</style>
