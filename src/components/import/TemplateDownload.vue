<template>
  <div class="template-download">
    <div class="template-info">
      <span class="template-icon">📄</span>
      <div class="template-text">
        <p>下载导入模板文件（支持 CSV、Excel 格式）</p>
        <p class="template-hint">模板包含所有必填字段，请按模板格式填写数据</p>
      </div>
    </div>
    <button class="download-btn" :disabled="downloading" @click="onDownload">
      {{ downloading ? '下载中...' : '下载模板' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'download'): void
}>()

const downloading = ref(false)

async function onDownload() {
  downloading.value = true
  try {
    emit('download')
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.template-download {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.template-icon {
  font-size: 32px;
}

.template-text p {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.template-hint {
  font-size: 12px !important;
  color: #909399 !important;
  margin-top: 4px !important;
}

.download-btn {
  padding: 8px 20px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.download-btn:hover {
  background-color: #337ecc;
}

.download-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>