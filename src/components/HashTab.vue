<template>
  <div class="hash-tab">
    <el-form :model="form" label-width="120px" @submit.prevent>
      <el-form-item label="输入文本">
        <el-input
          v-model="form.inputText"
          type="textarea"
          :rows="3"
          placeholder="请输入需要哈希的文本"
          maxlength="10000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="哈希算法">
        <el-select v-model="form.algorithm" placeholder="选择哈希算法" style="width: 200px">
          <el-option label="SHA-256（默认）" value="SHA-256" />
          <el-option label="MD5" value="MD5" />
          <el-option label="SHA-512" value="SHA-512" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="execute">
          <el-icon><Pointer /></el-icon>
          计算哈希
        </el-button>
        <el-button type="success" :icon="Download" @click="doExport" :disabled="!result">
          导出结果
        </el-button>
      </el-form-item>
    </el-form>

    <el-divider />

    <div v-if="result" class="result-area">
      <el-descriptions title="哈希结果" :column="1" border>
        <el-descriptions-item label="hashHex">
          <span class="hash-value">{{ result.hashHex }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="inputLength">{{ result.inputLength }}</el-descriptions-item>
      </el-descriptions>
    </div>
    <el-empty v-else description="输入文本并点击计算按钮" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Pointer, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { hash } from '../api/algorithm'

const emit = defineEmits(['track', 'export'])

const loading = ref(false)
const result = ref(null)
const form = reactive({
  inputText: '',
  algorithm: 'SHA-256'
})

async function execute() {
  if (!form.inputText) {
    ElMessage.warning('请输入文本')
    return
  }
  loading.value = true
  try {
    const res = await hash({
      inputText: form.inputText,
      algorithm: form.algorithm
    })
    result.value = res.data
    emit('track', { algorithmType: 'HASH' })
    ElMessage.success('计算成功')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function doExport() {
  emit('export', {
    algorithmType: 'HASH',
    inputText: form.inputText,
    algorithm: form.algorithm
  })
}
</script>

<style scoped>
.result-area {
  margin-top: 20px;
}
.hash-value {
  font-family: 'Courier New', monospace;
  word-break: break-all;
}
</style>
