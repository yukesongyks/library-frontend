<template>
  <div class="file-uploader">
    <div
      class="upload-zone"
      :class="{ 'is-dragover': isDragover }"
      @dragover.prevent="isDragover = true"
      @dragleave.prevent="isDragover = false"
      @drop.prevent="onDrop"
    >
      <div v-if="!file">
        <div class="upload-icon">📁</div>
        <p class="upload-text">拖拽文件到此处，或点击上传</p>
        <p class="upload-hint">支持 CSV、Excel (.xlsx, .xls) 格式</p>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,.xlsx,.xls"
          class="file-input"
          @change="onFileChange"
        />
        <button class="select-btn" @click="openFileDialog">选择文件</button>
      </div>
      <div v-else class="file-selected">
        <div class="file-icon">📄</div>
        <div class="file-info">
          <p class="file-name">{{ file.name }}</p>
          <p class="file-size">{{ formatSize(file.size) }}</p>
        </div>
        <button class="change-btn" @click="clearFile">重新选择</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'file-change', file: File | null): void
}>()

const file = ref<File | null>(null)
const isDragover = ref(false)
const fileInput = ref<HTMLInputElement>()

function openFileDialog() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    setFile(target.files[0])
  }
}

function onDrop(event: DragEvent) {
  isDragover.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    setFile(event.dataTransfer.files[0])
  }
}

function setFile(f: File) {
  file.value = f
  emit('file-change', f)
}

function clearFile() {
  file.value = null
  emit('file-change', null)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.file-uploader {
  margin-bottom: 20px;
}

.upload-zone {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.upload-zone.is-dragover {
  border-color: #409eff;
  background-color: #e6f0ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #303133;
  margin: 0 0 8px;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px;
}

.file-input {
  display: none;
}

.select-btn {
  padding: 8px 24px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.select-btn:hover {
  background-color: #337ecc;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.file-icon {
  font-size: 32px;
}

.file-info {
  text-align: left;
}

.file-name {
  margin: 0;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.file-size {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.change-btn {
  padding: 6px 16px;
  background-color: #fff;
  color: #409eff;
  border: 1px solid #409eff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.change-btn:hover {
  background-color: #409eff;
  color: #fff;
}
</style>