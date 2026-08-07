<template>
  <el-dialog
    v-model="visible"
    title="导入数据"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    @closed="handleClosed"
  >
    <el-form label-width="100px" :model="form">
      <el-form-item label="导入类型">
        <el-select v-model="form.type" placeholder="请选择导入类型" style="width: 100%">
          <el-option
            v-for="opt in IMPORT_TYPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="导入模板">
        <el-button :icon="Download" :loading="templateLoading" @click="handleDownloadTemplate">
          下载模板
        </el-button>
      </el-form-item>

      <el-form-item label="数据文件">
        <el-upload
          ref="uploadRef"
          class="import-uploader"
          drag
          accept=".xlsx"
          :auto-upload="true"
          :show-file-list="true"
          :limit="1"
          :before-upload="handleBeforeUpload"
          :http-request="handleHttpRequest"
          :on-exceed="handleExceed"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">将 .xlsx 文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              仅支持 .xlsx 文件，单文件不超过 {{ maxFileSizeText }}
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <!-- 导入结果 -->
      <el-form-item v-if="result" label="导入结果">
        <div class="import-result">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="成功">
              <el-text type="success">{{ result.success }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="失败">
              <el-text :type="result.failed > 0 ? 'danger' : 'info'">{{ result.failed }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="覆盖">
              <el-text type="warning">{{ result.overwritten }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
          <div v-if="result.message" class="result-message">{{ result.message }}</div>
          <div v-if="result.errors.length" class="result-errors">
            <div class="result-errors__title">错误明细（{{ result.errors.length }} 条）：</div>
            <el-scrollbar max-height="180px">
              <ul>
                <li v-for="(err, idx) in result.errors" :key="idx">{{ err }}</li>
              </ul>
            </el-scrollbar>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, UploadFilled } from '@element-plus/icons-vue'
import type { UploadRequestOptions } from 'element-plus'
import { importCost, downloadTemplate } from '@/api/cost'
import {
  IMPORT_TYPE_OPTIONS,
  MAX_FILE_SIZE
} from '@/constants/cost'
import type { ImportType, ImportResultVO } from '@/types/cost'

/** v-model:visible 控制显隐 */
const visible = defineModel<boolean>('visible', { default: false })

/** emit success 通知父组件刷新 */
const emit = defineEmits<{
  (e: 'success', result: ImportResultVO): void
}>()

const form = reactive<{ type: ImportType }>({
  type: 'human'
})

const uploading = ref(false)
const templateLoading = ref(false)
const result = ref<ImportResultVO | null>(null)
const uploadRef = ref()

const maxFileSizeText = computed(() => `${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`)

/** 上传前校验：类型 + 大小 */
function handleBeforeUpload(file: File): boolean | undefined {
  result.value = null

  const isXlsx = file.name.toLowerCase().endsWith('.xlsx')
  if (!isXlsx) {
    ElMessage.error('仅支持 .xlsx 格式文件')
    return false
  }

  if (file.size > MAX_FILE_SIZE) {
    ElMessage.error(`文件大小不能超过 ${maxFileSizeText.value}`)
    return false
  }

  return true
}

/** 自定义上传：调用 importCost */
async function handleHttpRequest(options: UploadRequestOptions): Promise<void> {
  const file = options.file as File
  uploading.value = true
  try {
    const res = await importCost(file, form.type)
    result.value = res
    if (res.failed > 0) {
      ElMessage.warning(`导入完成：成功 ${res.success} 条，失败 ${res.failed} 条`)
    } else {
      ElMessage.success(`导入成功 ${res.success} 条`)
    }
    // 导入成功（有成功记录）后通知父组件刷新
    if (res.success > 0) {
      emit('success', res)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '导入失败'
    ElMessage.error(message)
  } finally {
    uploading.value = false
    // 清空已上传文件列表，便于下次重新选择同一文件
    uploadRef.value?.clearFiles?.()
    options.onSuccess?.({})
  }
}

/** 超出限制提示 */
function handleExceed(): void {
  ElMessage.warning('每次只能上传一个文件，请先移除已选文件')
}

/** 下载模板 */
async function handleDownloadTemplate(): Promise<void> {
  templateLoading.value = true
  try {
    await downloadTemplate(form.type)
    ElMessage.success('模板下载成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '模板下载失败'
    ElMessage.error(message)
  } finally {
    templateLoading.value = false
  }
}

/** 对话框关闭后重置内部状态 */
function handleClosed(): void {
  result.value = null
  uploadRef.value?.clearFiles?.()
}

defineExpose({ uploading })
</script>

<style scoped>
.import-uploader :deep(.el-upload-dragger) {
  width: 100%;
}
.import-result {
  width: 100%;
}
.result-message {
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.result-errors {
  margin-top: 8px;
}
.result-errors__title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
.result-errors ul {
  margin: 0;
  padding-left: 18px;
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.6;
}
</style>
