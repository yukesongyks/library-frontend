<template>
  <div class="tab-content">
    <div class="input-row">
      <textarea v-model="input" class="text-area" placeholder="输入整数，用逗号分隔，如 64,34,25,12,22,11,90" rows="2" @keyup.ctrl.enter="exec"></textarea>
    </div>
    <div class="actions">
      <button class="exec-btn" :disabled="loading || !input" @click="exec">
        {{ loading ? '执行中...' : '冒泡排序' }}
      </button>
      <ExportButton type="BUBBLE_SORT" :data="result" format="CSV" />
    </div>
    <div v-if="result" class="result-box">
      <p class="result-label">排序结果：{{ result.sorted.join(', ') }}</p>
      <p class="result-label">比较次数：{{ result.comparisons }}</p>
      <p class="result-label">交换次数：{{ result.swaps }}</p>
    </div>
    <div v-if="error" class="error-box">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import algoApi from '../api/algo'
import ExportButton from './ExportButton.vue'

const input = ref('64,34,25,12,22,11,90')
const loading = ref(false)
const result = ref(null)
const error = ref('')

async function exec() {
  if (!input.value.trim()) return
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const numbers = input.value
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(Number)
    if (numbers.some(isNaN)) {
      throw new Error('输入包含非数字内容')
    }
    const res = await algoApi.bubbleSort(numbers)
    result.value = res.data.data
  } catch (e) {
    error.value = '请求失败：' + (e.response?.data?.message || e.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.tab-content { padding: 20px; }
.input-row { margin-bottom: 16px; }
.text-area { width: 100%; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; resize: vertical; font-family: inherit; }
.actions { display: flex; gap: 12px; margin-bottom: 16px; }
.exec-btn { padding: 8px 20px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap; }
.exec-btn:disabled { background: #d9d9d9; cursor: not-allowed; }
.exec-btn:not(:disabled):hover { background: #096dd9; }
.result-box { background: #fff; border: 1px solid #e8e8e8; border-radius: 4px; padding: 16px; }
.result-label { color: #333; font-size: 14px; margin-bottom: 6px; }
.result-label:last-child { margin-bottom: 0; }
.error-box { margin-top: 12px; color: #ff4d4f; font-size: 14px; }
</style>
