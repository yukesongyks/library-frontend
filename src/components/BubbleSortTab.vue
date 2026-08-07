<template>
  <div class="bubble-sort-tab">
    <el-form :model="form" label-width="120px" @submit.prevent>
      <el-form-item label="数字数组">
        <el-input
          v-model="form.numbersText"
          placeholder="请输入逗号分隔的数字，如 5,3,8,1,9,2,7"
          style="width: 400px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="execute">
          <el-icon><Pointer /></el-icon>
          执行排序
        </el-button>
        <el-button type="success" :icon="Download" @click="doExport" :disabled="!result">
          导出结果
        </el-button>
      </el-form-item>
    </el-form>

    <el-divider />

    <div v-if="result" class="result-area">
      <el-descriptions title="排序结果" :column="1" border>
        <el-descriptions-item label="sortedArray">
          <span class="array-value">{{ result.sortedArray.join(', ') }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="compareCount">{{ result.compareCount }}</el-descriptions-item>
        <el-descriptions-item label="swapCount">{{ result.swapCount }}</el-descriptions-item>
        <el-descriptions-item label="durationMillis">{{ result.durationMillis }} ms</el-descriptions-item>
      </el-descriptions>
    </div>
    <el-empty v-else description="输入数字数组并点击排序按钮" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Pointer, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { bubbleSort } from '../api/algorithm'

const emit = defineEmits(['track', 'export'])

const loading = ref(false)
const result = ref(null)
const form = reactive({
  numbersText: '5,3,8,1,9,2,7'
})

function parseNumbers() {
  const parts = form.numbersText.split(',').map(s => s.trim()).filter(s => s.length > 0)
  return parts.map(s => {
    const n = parseInt(s, 10)
    if (isNaN(n)) {
      throw new Error(`"${s}" 不是有效数字`)
    }
    return n
  })
}

async function execute() {
  let numbers
  try {
    numbers = parseNumbers()
  } catch (e) {
    ElMessage.error(e.message)
    return
  }
  if (numbers.length === 0) {
    ElMessage.warning('请输入至少一个数字')
    return
  }
  if (numbers.length > 1000) {
    ElMessage.warning('数组长度不能超过1000')
    return
  }

  loading.value = true
  try {
    const res = await bubbleSort({ numbers })
    result.value = res.data
    emit('track', { algorithmType: 'BUBBLE_SORT' })
    ElMessage.success('排序成功')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function doExport() {
  emit('export', {
    algorithmType: 'BUBBLE_SORT',
    numbers: form.numbersText
  })
}
</script>

<style scoped>
.result-area {
  margin-top: 20px;
}
.array-value {
  font-family: 'Courier New', monospace;
  word-break: break-all;
}
</style>
