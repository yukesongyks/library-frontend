<script setup lang="ts">
import { ref } from 'vue'
import { bubbleSort, exportRecords } from '@/api/algorithms'
import type { BubbleSortResponse } from '@/api/types'

// BubbleSort Tab：输入数组 → POST /api/algorithms/bubble-sort，展示排序结果 + 导出按钮
const numbersInput = ref('5, 3, 8, 1, 9')
const result = ref<BubbleSortResponse | null>(null)
const error = ref('')
const loading = ref(false)

function parseNumbers(): number[] {
  return numbersInput.value
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
}

async function execute() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const numbers = parseNumbers()
    if (numbers.some((n) => Number.isNaN(n))) {
      throw new Error('数组包含非数字元素')
    }
    result.value = await bubbleSort({ numbers })
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? e?.message ?? '调用 bubble-sort 接口失败'
  } finally {
    loading.value = false
  }
}

function handleExport() {
  exportRecords('bubble-sort')
}
</script>

<template>
  <div class="tab-panel">
    <div class="form-row">
      <label>数组：</label>
      <input v-model="numbersInput" placeholder="输入数字，用逗号或空格分隔" />
    </div>
    <div class="actions">
      <button :disabled="loading" @click="execute">
        {{ loading ? '执行中...' : '冒泡排序' }}
      </button>
      <button class="btn-secondary" @click="handleExport">导出记录</button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="result" class="result">
      <div class="result-row"><span class="result-label">输入：</span><code>{{ JSON.stringify(result.input) }}</code></div>
      <div class="result-row"><span class="result-label">排序后：</span><code>{{ JSON.stringify(result.result) }}</code></div>
    </div>
  </div>
</template>

<style scoped>
.tab-panel { padding: 16px 0; }
.form-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.form-row label { width: 60px; color: #6e7681; }
.form-row input { flex: 1; padding: 6px 10px; border: 1px solid #d0d7de; border-radius: 4px; font-size: 14px; }
.actions { display: flex; gap: 12px; margin-bottom: 16px; }
button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #1f6feb; color: #fff; font-size: 14px; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #6c757d; }
.result { padding: 12px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; }
.result-row { margin-bottom: 8px; }
.result-label { color: #6e7681; margin-right: 8px; }
.error { color: #cf222e; padding: 12px; background: #fff0f0; border-radius: 4px; }
</style>
