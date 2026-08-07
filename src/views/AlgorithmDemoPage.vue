<template>
  <div class="algorithm-demo-page">
    <el-card class="page-header" shadow="never">
      <div class="header-content">
        <h2>算法演示</h2>
        <p class="subtitle">HelloWorld · 哈希算法 · 冒泡排序，含导出与调用统计报表</p>
      </div>
    </el-card>

    <el-card shadow="never" class="main-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Tab 1: HelloWorld -->
        <el-tab-pane label="HelloWorld" name="helloWorld">
          <HelloWorldTab @track="handleTrack" @export="handleExport" />
        </el-tab-pane>

        <!-- Tab 2: 哈希算法 -->
        <el-tab-pane label="哈希算法" name="hash">
          <HashTab @track="handleTrack" @export="handleExport" />
        </el-tab-pane>

        <!-- Tab 3: 冒泡排序 -->
        <el-tab-pane label="冒泡排序" name="bubbleSort">
          <BubbleSortTab @track="handleTrack" @export="handleExport" />
        </el-tab-pane>

        <!-- Tab 4: 调用统计报表 -->
        <el-tab-pane label="调用统计报表" name="report">
          <ReportChart />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HelloWorldTab from '../components/HelloWorldTab.vue'
import HashTab from '../components/HashTab.vue'
import BubbleSortTab from '../components/BubbleSortTab.vue'
import ReportChart from '../components/ReportChart.vue'

const activeTab = ref('helloWorld')

function handleTrack(info) {
  console.log('埋点信息:', info)
}

function handleExport(params) {
  const url = `/api/export/algorithm-result?${new URLSearchParams(params).toString()}`
  window.open(url, '_blank')
}
</script>

<style scoped>
.algorithm-demo-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.main-card {
  min-height: 600px;
}
</style>
