<template>
  <div class="panel">
    <el-card>
      <template #header>
        <span>冒泡排序接口演示</span>
      </template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="数字列表">
          <el-input v-model="form.numbersText" placeholder="请输入数字，逗号分隔，如: 3,1,4,1,5,9" />
        </el-form-item>
        <el-form-item label="排序顺序">
          <el-radio-group v-model="form.order">
            <el-radio value="asc">升序</el-radio>
            <el-radio value="desc">降序</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doSort" :loading="loading">
            开始排序
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="result" class="result">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="原始数组">
            [{{ result.originalArray.join(', ') }}]
          </el-descriptions-item>
          <el-descriptions-item label="排序后数组">
            [{{ result.sortedArray.join(', ') }}]
          </el-descriptions-item>
          <el-descriptions-item label="排序顺序">
            {{ result.order === 'asc' ? '升序' : '降序' }}
          </el-descriptions-item>
          <el-descriptions-item label="交换次数">
            {{ result.swapCount }}
          </el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            {{ result.executionTimeMs }} ms
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { sortNumbers } from '../api/dashboard'

const form = reactive({
  numbersText: '3,1,4,1,5,9,2,6',
  order: 'asc'
})
const loading = ref(false)
const result = ref(null)

async function doSort() {
  loading.value = true
  try {
    const numbers = form.numbersText.split(',').map(s => parseInt(s.trim(), 10))
    result.value = await sortNumbers(numbers, form.order)
  } catch (e) {
    console.error(e)
    ElMessage.error('排序失败: ' + (e.message || '未知错误'))
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