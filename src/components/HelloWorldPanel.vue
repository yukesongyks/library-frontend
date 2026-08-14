<template>
  <div class="panel">
    <el-card>
      <template #header>
        <span>Hello World 接口演示</span>
      </template>
      <el-button type="primary" @click="fetchHello" :loading="loading">
        调用接口
      </el-button>

      <div v-if="result" class="result">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="问候语">{{ result.greeting }}</el-descriptions-item>
          <el-descriptions-item label="时间戳">{{ result.timestamp }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getHello } from '../api/dashboard'

const loading = ref(false)
const result = ref(null)

async function fetchHello() {
  loading.value = true
  try {
    result.value = await getHello()
  } catch (e) {
    console.error(e)
    ElMessage.error('调用 HelloWorld 接口失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.result {
  margin-top: 16px;
}
</style>