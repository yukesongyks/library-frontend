<template>
  <div class="panel">
    <el-card>
      <template #header>
        <span>哈希算法接口演示</span>
      </template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="输入文本">
          <el-input v-model="form.input" placeholder="请输入要哈希的文本" />
        </el-form-item>
        <el-form-item label="算法选择">
          <el-select v-model="form.algorithm">
            <el-option label="MD5" value="MD5" />
            <el-option label="SHA-256" value="SHA-256" />
            <el-option label="SHA-512" value="SHA-512" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="compute" :loading="loading">
            计算哈希
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="result" class="result">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="输入文本">{{ result.input }}</el-descriptions-item>
          <el-descriptions-item label="算法">{{ result.algorithm }}</el-descriptions-item>
          <el-descriptions-item label="哈希结果">
            <span class="hash-value">{{ result.hashResult }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { computeHash } from '../api/dashboard'

const form = reactive({
  input: 'Hello World',
  algorithm: 'SHA-256'
})
const loading = ref(false)
const result = ref(null)

async function compute() {
  loading.value = true
  try {
    result.value = await computeHash(form.input, form.algorithm)
  } catch (e) {
    console.error(e)
    ElMessage.error('计算哈希失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.result {
  margin-top: 16px;
}
.hash-value {
  word-break: break-all;
  font-family: monospace;
  font-size: 13px;
}
</style>