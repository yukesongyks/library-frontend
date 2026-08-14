<template>
  <div class="stats-dashboard">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="维度筛选">
          <el-select v-model="filters.dimension" @change="refreshCharts" style="width: 200px">
            <el-option label="人员类型" value="personType" />
            <el-option label="人员层级" value="personLevel" />
            <el-option label="人员部门" value="personDept" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-tag type="info" effect="plain">
            总调用次数: {{ totalCalls }}
          </el-tag>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="charts-row">
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span><strong>调用趋势（近7天）</strong></span>
        </template>
        <div ref="lineChartRef" class="chart"></div>
      </el-card>
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span><strong>维度分布（饼图）</strong></span>
        </template>
        <div ref="pieChartRef" class="chart"></div>
      </el-card>
    </div>

    <el-card class="chart-card-full" shadow="never">
      <template #header>
        <span><strong>各接口调用量对比（柱状图）</strong></span>
      </template>
      <div ref="barChartRef" class="chart chart-full"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getStatsOverview } from '../api/dashboard'

const filters = ref({ dimension: 'personType' })
const totalCalls = ref(0)
const lineChartRef = ref(null)
const pieChartRef = ref(null)
const barChartRef = ref(null)

let lineChart = null
let pieChart = null
let barChart = null

async function refreshCharts() {
  try {
    const data = await getStatsOverview()
    totalCalls.value = data.totalCalls || 0
    await nextTick()
    renderLineChart(data.trend || [])
    renderPieChart((data.byDimension || {})[filters.value.dimension] || [])
    renderBarChart(data.byApi || {})
  } catch (e) {
    console.error('Failed to load stats:', e)
    ElMessage.error('加载统计看板数据失败: ' + (e.message || '未知错误'))
  }
}

function renderLineChart(trendData) {
  if (!lineChartRef.value) return
  if (!lineChart) {
    lineChart = echarts.init(lineChartRef.value)
  }
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.date),
      axisLabel: { rotate: 30 }
    },
    yAxis: { type: 'value', minInterval: 1 },
    grid: { left: 50, right: 20, bottom: 50 },
    series: [{
      type: 'line',
      data: trendData.map(d => d.count),
      smooth: true,
      areaStyle: { opacity: 0.3, color: '#409EFF' },
      lineStyle: { width: 3, color: '#409EFF' },
      itemStyle: { color: '#409EFF' }
    }]
  })
}

function renderPieChart(dimensionData) {
  if (!pieChartRef.value) return
  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  const hasData = dimensionData && dimensionData.length > 0
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: hasData
        ? dimensionData.map(d => ({ name: d.label, value: d.value }))
        : [{ name: '暂无数据', value: 1 }],
      label: { show: true, formatter: '{b}: {c}' },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' }
      }
    }]
  })
}

function renderBarChart(apiData) {
  if (!barChartRef.value) return
  if (!barChart) {
    barChart = echarts.init(barChartRef.value)
  }
  const keys = Object.keys(apiData)
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: keys
    },
    yAxis: { type: 'value', minInterval: 1 },
    grid: { left: 50, right: 20, bottom: 30 },
    series: [{
      type: 'bar',
      data: keys.map(k => apiData[k]),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#79bbff' }
        ])
      },
      barWidth: '50%'
    }]
  })
}

onMounted(() => {
  refreshCharts()
})
</script>

<style scoped>
.stats-dashboard {
  width: 100%;
}
.filter-card {
  margin-bottom: 16px;
}
.charts-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.chart-card {
  flex: 1;
}
.chart-card-full {
  margin-bottom: 0;
}
.chart {
  width: 100%;
  height: 300px;
}
.chart-full {
  height: 350px;
}
</style>