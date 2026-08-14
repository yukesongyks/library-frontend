<template>
  <div v-if="previewData.length > 0" class="import-preview">
    <h4>数据预览（前 {{ Math.min(previewData.length, 5) }} 行）</h4>
    <div class="preview-table-wrapper">
      <table class="preview-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in previewData.slice(0, 5)" :key="idx">
            <td v-for="col in columns" :key="col">{{ row[col] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="preview-total">共 {{ previewData.length }} 行数据</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  previewData: Record<string, any>[]
}>()

const columns = computed(() => {
  if (props.previewData.length === 0) return []
  return Object.keys(props.previewData[0])
})
</script>

<style scoped>
.import-preview {
  margin-bottom: 20px;
}

.import-preview h4 {
  font-size: 15px;
  color: #303133;
  margin: 0 0 12px;
}

.preview-table-wrapper {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th,
.preview-table td {
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  text-align: left;
}

.preview-table th {
  background-color: #fafafa;
  color: #909399;
  font-weight: 500;
}

.preview-total {
  margin: 8px 0 0;
  font-size: 13px;
  color: #909399;
}
</style>