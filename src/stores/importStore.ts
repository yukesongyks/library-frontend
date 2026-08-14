import { defineStore } from 'pinia'
import { ref } from 'vue'
import { importApi } from '@/api/importApi'
import type { ImportResult } from '@/types/import'

export const useImportStore = defineStore('import', () => {
  const importResult = ref<ImportResult | null>(null)
  const uploadedFile = ref<File | null>(null)
  const isUploading = ref(false)
  const error = ref<string | null>(null)

  async function uploadFile(file: File) {
    isUploading.value = true
    error.value = null
    importResult.value = null
    uploadedFile.value = file
    try {
      const res = await importApi.upload(file)
      importResult.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e.message || '导入失败'
      throw e
    } finally {
      isUploading.value = false
    }
  }

  async function downloadTemplate() {
    error.value = null
    try {
      const blob = await importApi.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '导入模板.xlsx'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      error.value = e.message || '下载模板失败'
      throw e
    }
  }

  function reset() {
    importResult.value = null
    uploadedFile.value = null
    isUploading.value = false
    error.value = null
  }

  return {
    importResult,
    uploadedFile,
    isUploading,
    error,
    uploadFile,
    downloadTemplate,
    reset,
  }
})