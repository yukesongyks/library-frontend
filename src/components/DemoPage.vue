<template>
  <div class="demo-page">
    <h1>Demo 演示页面</h1>

    <!-- Tab 切换 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab 内容区 -->
    <div class="tab-content">
      <HelloWorldTab v-if="activeTab === 'helloworld'" />
      <HashTab v-else-if="activeTab === 'hash'" />
      <BubbleSortTab v-else-if="activeTab === 'bubbleSort'" />
    </div>

    <!-- 调用情况可视化报表区 -->
    <div class="report-section">
      <h2>调用情况报表</h2>
      <div class="report-controls">
        <label>维度：</label>
        <button
          v-for="dim in dimensions"
          :key="dim.value"
          :class="['dim-btn', { active: currentDimension === dim.value }]"
          @click="currentDimension = dim.value; loadStatistics()"
        >
          {{ dim.label }}
        </button>

        <label>业务类型：</label>
        <select v-model="currentBizType" @change="loadStatistics">
          <option value="">全部</option>
          <option value="HELLOWORLD">helloworld</option>
          <option value="HASH">哈希算法</option>
          <option value="BUBBLE_SORT">冒泡排序</option>
        </select>

        <label>时间范围：</label>
        <select v-model="dateRange" @change="updateDateRange">
          <option value="7">近7天</option>
          <option value="30">近30天</option>
        </select>
      </div>

      <div class="total-info">总调用次数：{{ statistics?.total ?? 0 }}</div>

      <!-- 三种图表展示 -->
      <div class="charts">
        <div class="chart-box">
          <h3>折线图</h3>
          <LineChart :data="statistics?.line" />
        </div>
        <div class="chart-box">
          <h3>饼图</h3>
          <PieChart :data="statistics?.pie" />
        </div>
        <div class="chart-box">
          <h3>柱状图</h3>
          <BarChart :data="statistics?.bar" />
        </div>
      </div>
    </div>

    <!-- 全局错误提示 -->
    <div v-if="globalError" class="error-msg">{{ globalError }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import HelloWorldTab from './HelloWorldTab.vue'
import HashTab from './HashTab.vue'
import BubbleSortTab from './BubbleSortTab.vue'
import LineChart from './charts/LineChart.vue'
import PieChart from './charts/PieChart.vue'
import BarChart from './charts/BarChart.vue'
import { getStatistics } from '../api/demo.js'

const tabs = [
  { id: 'helloworld', label: 'HelloWorld' },
  { id: 'hash', label: '哈希算法' },
  { id: 'bubbleSort', label: '冒泡排序' }
]
const activeTab = ref('helloworld')

const dimensions = [
  { value: 'CALLER_TYPE', label: '人员类型' },
  { value: 'CALLER_LEVEL', label: '人员层级' },
  { value: 'CALLER_DEPT', label: '人员部门' }
]
const currentDimension = ref('CALLER_TYPE')
const currentBizType = ref('')
const dateRange = ref('7')
const startDate = ref('')
const endDate = ref('')

const statistics = ref(null)
const globalError = ref('')

function updateDateRange() {
  const today = new Date()
  const past = new Date()
  past.setDate(past.getDate() - (parseInt(dateRange.value) - 1))
  endDate.value = today.toISOString().slice(0, 10)
  startDate.value = past.toISOString().slice(0, 10)
  loadStatistics()
}

async function loadStatistics() {
  globalError.value = ''
  try {
    const resp = await getStatistics(currentDimension.value, currentBizType.value, startDate.value, endDate.value)
    if (resp.code === 'OK') {
      statistics.value = resp.data
    } else {
      statistics.value = null
      globalError.value = resp.msg || '查询失败'
    }
  } catch (e) {
    // 异常兜底：展示友好提示
    statistics.value = null
    globalError.value = e.message || '服务暂时不可用，请稍后重试'
  }
}

onMounted(() => {
  updateDateRange()
})
</script>

<style scoped>
.demo-page { max-width: 1200px; margin: 0 auto; padding: 20px; }
.tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.tab-btn { padding: 8px 20px; border: 1px solid #ddd; background: #f9f9f9; cursor: pointer; border-radius: 4px; }
.tab-btn.active { background: #409eff; color: #fff; border-color: #409eff; }
.tab-content { border: 1px solid #eee; padding: 20px; border-radius: 4px; margin-bottom: 30px; }
.report-section { border-top: 2px solid #eee; padding-top: 20px; }
.report-controls { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.dim-btn { padding: 4px 12px; border: 1px solid #ddd; background: #f9f9f9; cursor: pointer; border-radius: 4px; }
.dim-btn.active { background: #67c23a; color: #fff; border-color: #67c23a; }
.total-info { margin-bottom: 16px; font-weight: bold; }
.charts { display: flex; gap: 16px; flex-wrap: wrap; }
.chart-box { flex: 1; min-width: 300px; border: 1px solid #eee; padding: 12px; border-radius: 4px; }
.error-msg { color: #f56c6c; padding: 10px; background: #fef0f0; border-radius: 4px; margin-top: 16px; }
</style>
