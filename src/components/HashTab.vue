<template>
  <div class="hash-tab">
    <div class="input-area">
      <textarea v-model="text" placeholder="输入待哈希的文本" rows="3" />
      <select v-model="algorithm">
        <option value="SHA_256">SHA-256</option>
        <option value="MD5">MD5</option>
      </select>
      <button @click="execute" :disabled="loading">执行</button>
      <button @click="doExport" :disabled="exporting">导出</button>
    </div>

    <div v-if="loading" class="loading">执行中...</div>
    <div v-else-if="result" class="result-box">
      <p><strong>算法：</strong>{{ result.algorithm }}</p>
      <p><strong>输入：</strong>{{ result.input }}</p>
      <p><strong>哈希：</strong>{{ result.hash }}</p>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { hash, exportResult } from '../api/demo.js'

const text = ref('')
const algorithm = ref('SHA_256')
const result = ref(null)
const loading = ref(false)
const exporting = ref(false)
const error = ref('')

async function execute() {
  loading.value = true
  error.value = ''
  try {
    const resp = await hash(text.value, algorithm.value)
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
    await exportResult('HASH', { text: text.value, algorithm: algorithm.value })
  } catch (e) {
    error.value = e.message || '导出失败，请稍后重试'
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.hash-tab textarea { width: 100%; margin-bottom: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
.hash-tab select { padding: 6px; margin-right: 8px; border-radius: 4px; }
.hash-tab button { padding: 6px 16px; margin-right: 8px; cursor: pointer; border-radius: 4px; border: 1px solid #ddd; }
.hash-tab button:disabled { opacity: 0.5; cursor: not-allowed; }
.result-box { margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px; word-break: break-all; }
.loading { margin-top: 16px; color: #409eff; }
.error-msg { color: #f56c6c; margin-top: 12px; padding: 8px; background: #fef0f0; border-radius: 4px; }
</style>
