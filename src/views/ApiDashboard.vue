<template>
  <div class="dashboard-container">
    <div class="header">
      <h1>API 演示与数据看板</h1>
      <el-button type="primary" @click="showExportDialog">
        <el-icon><Download /></el-icon>
        导出数据
      </el-button>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="Hello World" name="hello">
        <HelloWorldPanel />
      </el-tab-pane>
      <el-tab-pane label="哈希算法" name="hash">
        <HashPanel />
      </el-tab-pane>
      <el-tab-pane label="冒泡排序" name="sort">
        <SortPanel />
      </el-tab-pane>
      <el-tab-pane label="调用统计看板" name="stats">
        <StatsDashboard />
      </el-tab-pane>
    </el-tabs>

    <!-- 导出对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出数据" width="400px">
      <el-form label-width="100px">
        <el-form-item label="导出类型">
          <el-select v-model="exportType" style="width: 100%">
            <el-option label="Hello World" value="hello" />
            <el-option label="哈希算法" value="hash" />
            <el-option label="冒泡排序" value="sort" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio value="json">JSON</el-radio>
            <el-radio value="csv">CSV</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Download } from '@element-plus/icons-vue'
import HelloWorldPanel from '../components/HelloWorldPanel.vue'
import HashPanel from '../components/HashPanel.vue'
import SortPanel from '../components/SortPanel.vue'
import StatsDashboard from '../components/StatsDashboard.vue'
import { getExportUrl } from '../api/dashboard'

const activeTab = ref('hello')
const exportDialogVisible = ref(false)
const exportType = ref('hello')
const exportFormat = ref('json')

function showExportDialog() {
  exportDialogVisible.value = true
}

function handleExport() {
  window.open(getExportUrl(exportType.value, exportFormat.value), '_blank')
  exportDialogVisible.value = false
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}
</style>