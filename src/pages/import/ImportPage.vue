<template>
  <div class="import-page">
    <div class="page-header">
      <h2>批量导入</h2>
    </div>

    <TemplateDownload @download="onDownloadTemplate" />

    <FileUploader @file-change="onFileChange" />

    <div v-if="selectedFile" class="upload-action">
      <button class="upload-btn" :disabled="store.isUploading" @click="onUpload">
        {{ store.isUploading ? '导入中...' : '开始导入' }}
      </button>
    </div>

    <LoadingSpinner :loading="store.isUploading" />

    <ImportResultReport :result="store.importResult" />

    <Notification
      :visible="notificationVisible"
      :type="notificationType"
      :message="notificationMessage"
      @close="notificationVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useImportStore } from '@/stores/importStore'
import TemplateDownload from '@/components/import/TemplateDownload.vue'
import FileUploader from '@/components/import/FileUploader.vue'
import ImportResultReport from '@/components/import/ImportResultReport.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Notification from '@/components/common/Notification.vue'

const store = useImportStore()

const selectedFile = ref<File | null>(null)
const notificationVisible = ref(false)
const notificationType = ref<'success' | 'error'>('success')
const notificationMessage = ref('')

function onFileChange(file: File | null) {
  selectedFile.value = file
  store.reset()
}

async function onDownloadTemplate() {
  try {
    await store.downloadTemplate()
    showNotification('success', '模板下载成功')
  } catch {
    showNotification('error', '模板下载失败')
  }
}

async function onUpload() {
  if (!selectedFile.value) return
  try {
    await store.uploadFile(selectedFile.value)
    showNotification('success', '导入完成')
  } catch {
    showNotification('error', '导入失败')
  }
}

function showNotification(type: 'success' | 'error', message: string) {
  notificationType.value = type
  notificationMessage.value = message
  notificationVisible.value = true
  setTimeout(() => {
    notificationVisible.value = false
  }, 3000)
}
</script>

<style scoped>
.import-page {
  max-width: 800px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.upload-action {
  margin-bottom: 20px;
}

.upload-btn {
  padding: 12px 32px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.upload-btn:hover {
  background-color: #337ecc;
}

.upload-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>