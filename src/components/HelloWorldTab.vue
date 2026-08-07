<template>
  <div class="hello-world-tab">
    <button @click="execute" :disabled="loading">执行</button>
    <button @click="doExport" :disabled="exporting">导出</button>

    <div v-if="loading" class="loading">执行中...</div>
    <div v-else-if="result" class="result-box">
      <p><strong>结果：</strong>{{ result.result }}</p>
      <p><strong>时间戳：</strong>{{ result.timestamp }}</p>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { helloWorld, exportResult } from '../api/demo.js'

const result = ref(null)
const loading = ref(false)
const exporting = ref(false)
const error = ref('')

async function execute() {
  loading.value = true
  error.value = ''
  try {
    const resp = await helloWorld()
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
    await exportResult('HELLOWORLD')
  } catch (e) {
    error.value = e.message || '导出失败，请稍后重试'
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.hello-world-tab button { padding: 6px 16px; margin-right: 8px; cursor: pointer; border-radius: 4px; border: 1px solid #ddd; }
.hello-world-tab button:disabled { opacity: 0.5; cursor: not-allowed; }
.result-box { margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px; }
.loading { margin-top: 16px; color: #409eff; }
.error-msg { color: #f56c6c; margin-top: 12px; padding: 8px; background: #fef0f0; border-radius: 4px; }
</style>
