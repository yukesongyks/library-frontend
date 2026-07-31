<script setup lang="ts">
import { ref } from 'vue'
import { getHelloWorld } from '@/api/algorithms'
import { exportRecords } from '@/api/algorithms'

// HelloWorld Tab：调用 GET /api/algorithms/helloworld，展示结果 + 导出按钮
const result = ref<string>('')
const error = ref<string>('')
const loading = ref(false)

async function execute() {
  loading.value = true
  error.value = ''
  result.value = ''
  try {
    const res = await getHelloWorld()
    result.value = res.result
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '调用 helloworld 接口失败'
  } finally {
    loading.value = false
  }
}

function handleExport() {
  exportRecords('helloworld')
}
</script>

<template>
  <div class="tab-panel">
    <div class="actions">
      <button :disabled="loading" @click="execute">
        {{ loading ? '执行中...' : '执行 HelloWorld' }}
      </button>
      <button class="btn-secondary" @click="handleExport">导出记录</button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="result" class="result">
      <span class="result-label">结果：</span>
      <code>{{ result }}</code>
    </div>
  </div>
</template>

<style scoped>
.tab-panel { padding: 16px 0; }
.actions { display: flex; gap: 12px; margin-bottom: 16px; }
button {
  padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;
  background: #1f6feb; color: #fff; font-size: 14px;
}
button:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #6c757d; }
.result { padding: 12px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; }
.result-label { color: #6e7681; margin-right: 8px; }
code { font-size: 15px; }
.error { color: #cf222e; padding: 12px; background: #fff0f0; border-radius: 4px; }
</style>
