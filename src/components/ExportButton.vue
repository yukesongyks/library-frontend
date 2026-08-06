<template>
  <button class="export-btn" :disabled="disabled" @click="handleExport">
    {{ loading ? '导出中...' : '导出' }}
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import algoApi from '../api/algo'

const props = defineProps({
  type: { type: String, required: true },
  data: { type: Object, default: null },
  format: { type: String, default: 'CSV' }
})

const loading = ref(false)

const disabled = computed(() => loading.value || !props.data)

async function handleExport() {
  if (!props.data) {
    alert('暂无可导出的结果，请先执行')
    return
  }
  loading.value = true
  try {
    const res = await algoApi.export(props.type, props.format, props.data)
    // 从响应头解析文件名
    const disposition = res.headers['content-disposition'] || ''
    let fileName = 'result.csv'
    const match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (match && match[1]) {
      fileName = decodeURIComponent(match[1])
    }
    // 触发下载
    const blob = new Blob([res.data], { type: res.headers['content-type'] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('导出失败：' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.export-btn {
  padding: 8px 20px;
  background: #52c41a;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.export-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}
.export-btn:not(:disabled):hover {
  background: #389e0d;
}
</style>
