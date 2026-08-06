<template>
  <div class="tab-content">
    <div class="actions">
      <button class="exec-btn" :disabled="loading" @click="exec">
        {{ loading ? '执行中...' : '执行' }}
      </button>
      <ExportButton type="HELLO" :data="result" format="CSV" />
    </div>
    <div v-if="result" class="result-box">
      <p class="result-label">执行结果：</p>
      <p class="result-value">{{ result.message }}</p>
    </div>
    <div v-if="error" class="error-box">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import algoApi from '../api/algo'
import ExportButton from './ExportButton.vue'

const loading = ref(false)
const result = ref(null)
const error = ref('')

async function exec() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const res = await algoApi.hello()
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
.actions { display: flex; gap: 12px; margin-bottom: 16px; }
.exec-btn { padding: 8px 20px; background: #1890ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
.exec-btn:disabled { background: #d9d9d9; cursor: not-allowed; }
.exec-btn:not(:disabled):hover { background: #096dd9; }
.result-box { background: #fff; border: 1px solid #e8e8e8; border-radius: 4px; padding: 16px; }
.result-label { color: #888; font-size: 13px; margin-bottom: 8px; }
.result-value { font-size: 16px; color: #333; }
.error-box { margin-top: 12px; color: #ff4d4f; font-size: 14px; }
</style>
