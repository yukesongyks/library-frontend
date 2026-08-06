<template>
  <div class="tab-content">
    <div class="input-row">
      <input v-model="input" class="text-input" placeholder="请输入要哈希的字符串" @keyup.enter="exec" />
      <button class="exec-btn" :disabled="loading || !input" @click="exec">
        {{ loading ? '执行中...' : '计算哈希' }}
      </button>
      <ExportButton type="HASH" :data="result" format="CSV" />
    </div>
    <div v-if="result" class="result-box">
      <p class="result-label">哈希算法：{{ result.algorithm }}</p>
      <p class="result-label">哈希值：</p>
      <p class="hash-value">{{ result.hashValue }}</p>
    </div>
    <div v-if="error" class="error-box">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import algoApi from '../api/algo'
import ExportButton from './ExportButton.vue'

const input = ref('')
const loading = ref(false)
const result = ref(null)
const error = ref('')

async function exec() {
  if (!input.value) return
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const res = await algoApi.hash(input.value)
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
.input-row { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
.text-input { flex: 1; padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px; }
.exec-btn { padding: 8px 20px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap; }
.exec-btn:disabled { background: #d9d9d9; cursor: not-allowed; }
.exec-btn:not(:disabled):hover { background: #096dd9; }
.result-box { background: #fff; border: 1px solid #e8e8e8; border-radius: 4px; padding: 16px; }
.result-label { color: #888; font-size: 13px; margin-bottom: 8px; }
.hash-value { word-break: break-all; font-family: monospace; font-size: 14px; color: #333; }
.error-box { margin-top: 12px; color: #ff4d4f; font-size: 14px; }
</style>
