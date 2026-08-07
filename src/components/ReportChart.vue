<template>
  <div class="report-chart">
    <!-- 查询条件 -->
    <el-form :inline="true" :model="form" class="query-form">
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item label="算法类型">
        <el-select v-model="form.algorithmType" placeholder="全部" clearable style="width: 160px">
          <el-option label="全部" value="" />
          <el-option label="HelloWorld" value="HELLO_WORLD" />
          <el-option label="哈希算法" value="HASH" />
          <el-option label="冒泡排序" value="BUBBLE_SORT" />
        </el-select>
      </el-form-item>
      <el-form-item label="聚合维度">
        <el-select v-model="form.dimension" style="width: 140px">
          <el-option label="人员类型" value="USER_TYPE" />
          <el-option label="人员层级" value="USER_LEVEL" />
          <el-option label="人员部门" value="DEPARTMENT" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="loadData">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 汇总卡片 -->
    <el-row :gutter="20" class="summary-row" v-if="stats">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="summary-card">
            <div class="summary-value">{{ stats.totalCallCount }}</div>
            <div class="summary-label">总调用次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="summary-card">
            <div class="summary-value">{{ stats.distinctUserCount }}</div>
            <div class="summary-label">去重用户数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="20" class="chart-row" v-if="stats">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <span>调用趋势（折线图）</span>
          </template>
          <div ref="lineChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row" v-if="stats">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>维度占比（饼图）</span>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>维度对比（柱状图）</span>
          </template>
          <div ref="barChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!stats && !loading" description="选择条件后点击查询" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { queryCallStats } from '../api/algorithm'

const loading = ref(false)
const stats = ref(null)
const dateRange = ref([])

const form = reactive({
  algorithmType: '',
  dimension: 'USER_TYPE'
})

const lineChartRef = ref(null)
const pieChartRef = ref(null)
const barChartRef = ref(null)

let lineChart = null
let pieChart = null
let barChart = null

onMounted(() => {
  initDefaultDateRange()
})

onUnmounted(() => {
  lineChart?.dispose()
  pieChart?.dispose()
  barChart?.dispose()
  window.removeEventListener('resize', handleResize)
})

function initDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  dateRange.value = [fmt(start), fmt(end)]
}

async function loadData() {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择时间范围')
    return
  }

  loading.value = true
  stats.value = null
  try {
    const res = await queryCallStats({
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
      algorithmType: form.algorithmType || undefined,
      dimension: form.dimension
    })
    stats.value = res.data
    await nextTick()
    renderCharts()
    ElMessage.success('查询成功')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  renderLineChart()
  renderPieChart()
  renderBarChart()
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  lineChart?.resize()
  pieChart?.resize()
  barChart?.resize()
}

function renderLineChart() {
  if (lineChart) {
    lineChart.dispose()
  }
  lineChart = echarts.init(lineChartRef.value)
  const trendList = stats.value.trendList || []
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendList.map(t => t.date),
      boundaryGap: false
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '调用次数',
      type: 'line',
      data: trendList.map(t => t.count),
      smooth: true,
      areaStyle: {},
      itemStyle: { color: '#409EFF' }
    }]
  })
}

function renderPieChart() {
  if (pieChart) {
    pieChart.dispose()
  }
  pieChart = echarts.init(pieChartRef.value)
  const ratioList = stats.value.dimensionRatioList || []
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: ratioList.map(r => ({ name: r.name || '未知', value: r.value })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  })
}

function renderBarChart() {
  if (barChart) {
    barChart.dispose()
  }
  barChart = echarts.init(barChartRef.value)
  const comparisonList = stats.value.dimensionComparisonList || []

  const algoTypes = [...new Set(comparisonList.map(c => c.algorithmType))]
  const dimensions = [...new Set(comparisonList.map(c => c.name))]

  const series = algoTypes.map(algo => ({
    name: algo,
    type: 'bar',
    data: dimensions.map(d => {
      const item = comparisonList.find(c => c.algorithmType === algo && c.name === d)
      return item ? item.value : 0
    })
  }))

  barChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: algoTypes },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: dimensions },
    yAxis: { type: 'value', minInterval: 1 },
    series
  })
}
</script>

<style scoped>
.query-form {
  margin-bottom: 20px;
}

.summary-row {
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;
  padding: 10px 0;
}

.summary-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 350px;
}
</style>
