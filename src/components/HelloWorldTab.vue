<template>
  <div class="hello-world-tab">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-button type="primary" :loading="loading" @click="execute">
          <el-icon><Pointer /></el-icon>
          执行 HelloWorld
        </el-button>
      </el-col>
      <el-col :span="4">
        <el-button type="success" :icon="Download" @click="doExport" :disabled="!result">
          导出结果
        </el-button>
      </el-col>
    </el-row>

    <el-divider />

    <div v-if="result" class="result-area">
      <el-descriptions title="执行结果" :column="1" border>
        <el-descriptions-item label="message">{{ result.message }}</el-descriptions-item>
      </el-descriptions>
    </div>
    <el-empty v-else description="点击按钮执行 HelloWorld" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Pointer, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { helloWorld } from '../api/algorithm'

const emit = defineEmits(['track', 'export'])

const loading = ref(false)
const result = ref(null)

async function execute() {
  loading.value = true
  try {
    const res = await helloWorld()
    result.value = res.data
    emit('track', { algorithmType: 'HELLO_WORLD' })
    ElMessage.success('执行成功')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function doExport() {
  emit('export', { algorithmType: 'HELLO_WORLD' })
}
</script>

<style scoped>
.result-area {
  margin-top: 20px;
}
</style>
