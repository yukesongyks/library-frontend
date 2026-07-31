<script setup lang="ts">
import { ref } from 'vue'
import { computeHash, exportRecords } from '@/api/algorithms'
import type { HashResponse } from '@/api/types'

// Hash Tab：输入文本+算法 → POST /api/algorithms/hash，展示哈希结果 + 导出按钮
const text = ref('abc')
const algorithm = ref('SHA-256')
const result = ref<HashResponse | null>(null)
const error = ref('')
const loading = ref(false)

const algorithms = ['SHA-256', 'MD5']

async function execute() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    result.value = await computeHash({ text: text.value, algorithm: algorithm.value })
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '调用 hash 接口失败'
  } finally {
    loading.value = false
  }
}

function handleExport() {
  exportRecords('hash')
}
</script>

<template>
  <div class="tab-panel">
    <div class="form-row">
      <label>文本：</label>
      <input v-model="text" placeholder="输入待哈希的文本" />
    </div>
    <div class="form-row">
      <label>算法：</label>
      <select v-model="algorithm">
        <option v-for="a in algorithms" :key="a" :value="a">{{ a }}</option>
      </select>
    </div>
    <div class="actions">
      <button :disabled="loading" @click="execute">
        {{ loading ? '执行中...' : '计算哈希' }}
      </button>
      <button class="btn-secondary" @click="handleExport">导出记录</button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="result" class="result">
      <div class="result-row"><span class="result-label">算法：</span><code>{{ result.algorithm }}</code></div>
      <div class="result-row"><span class="result-label">哈希值：</span><code class="hash">{{ result.result }}</code></div>
    </div>
  </div>
</template>

<style scoped>
.tab-panel { padding: 16px 0; }
.form-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.form-row label { width: 60px; color: #6e7681; }
.form-row input, .form-row select {
  flex: 1; padding: 6px 10px; border: 1px solid #d0d7de; border-radius: 4px; font-size: 14px;
}
.actions { display: flex; gap: 12px; margin-bottom: 16px; }
button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #1f6feb; color: #fff; font-size: 14px; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #6c757d; }
.result { padding: 12px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; }
.result-row { display: flex; align-items: flex-start; margin-bottom: 8px; word-break: break-all; }
.result-label { color: #6e7681; margin-right: 8px; flex-shrink: 0; }
.hash { word-break: break-all; font-size: 13px; }
.error { color: #cf222e; padding: 12px; background: #fff0f0; border-radius: 4px; }
</style>
