<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import '@/echarts-setup'
import { getCalls } from '@/api/analytics'
import type {
  AnalyticsResponse,
  ChartType,
  Dimension,
  DimensionPoint,
  TrendPoint
} from '@/api/types'

// AnalyticsDashboard：维度选择 + 图表类型选择 + 日期范围 + ECharts 渲染
// spec tracking-analytics.md 契约：
// - bar/pie → data:[{label,value}]
// - line → data:[{date, values:[{label,value}]}]

const dimension = ref<Dimension>('personnelType')
const chartType = ref<ChartType>('bar')
const startTime = ref('')
const endTime = ref('')
const loading = ref(false)
const error = ref('')
const rawData = ref<AnalyticsResponse | null>(null)

const dimensionOptions: { value: Dimension; label: string }[] = [
  { value: 'personnelType', label: '人员类型' },
  { value: 'personnelLevel', label: '人员层级' },
  { value: 'department', label: '人员部门' }
]

const chartTypeOptions: { value: ChartType; label: string }[] = [
  { value: 'bar', label: '柱状图' },
  { value: 'pie', label: '饼图' },
  { value: 'line', label: '折线图' }
]

function formatLocalTime(date: Date): string {
  // 后端 AnalyticsController 接受 LocalDateTime ISO 格式（如 2026-07-31T10:00:00）
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

async function query() {
  loading.value = true
  error.value = ''
  rawData.value = null
  try {
    rawData.value = await getCalls({
      dimension: dimension.value,
      chartType: chartType.value,
      startTime: startTime.value || undefined,
      endTime: endTime.value || undefined
    })
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '查询分析数据失败'
  } finally {
    loading.value = false
  }
}

// ECharts option 计算属性：依据 chartType 转换数据
const chartOption = computed(() => {
  if (!rawData.value) return {}
  const data = rawData.value.data
  const dimLabel = dimensionOptions.find((d) => d.value === dimension.value)?.label ?? dimension.value

  if (chartType.value === 'pie') {
    const points = data as DimensionPoint[]
    return {
      title: { text: `按${dimLabel} - 调用次数占比` },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: points.map((p) => ({ name: p.label, value: p.value }))
        }
      ]
    }
  }

  if (chartType.value === 'bar') {
    const points = data as DimensionPoint[]
    return {
      title: { text: `按${dimLabel} - 调用次数` },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: points.map((p) => p.label) },
      yAxis: { type: 'value', name: '调用次数' },
      series: [{ type: 'bar', data: points.map((p) => p.value), itemStyle: { color: '#1f6feb' } }]
    }
  }

  // line：data 为 [{date, values:[{label,value}]}]
  const trendPoints = data as TrendPoint[]
  const dates = trendPoints.map((t) => t.date)
  // 收集所有 label（series 名）
  const labelSet = new Set<string>()
  trendPoints.forEach((t) => t.values.forEach((v) => labelSet.add(v.label)))
  const labels = Array.from(labelSet)

  // 每个 label 构造一条 series，按 date 顺序取对应 value
  const series = labels.map((label) => ({
    name: label,
    type: 'line' as const,
    data: trendPoints.map((t) => {
      const found = t.values.find((v) => v.label === label)
      return found ? found.value : 0
    }),
    smooth: true
  }))

  return {
    title: { text: `按${dimLabel} - 调用次数趋势` },
    tooltip: { trigger: 'axis' },
    legend: { data: labels, top: 30 },
    xAxis: { type: 'category', data: dates, name: '日期' },
    yAxis: { type: 'value', name: '调用次数' },
    series
  }
})

// 设置默认日期范围：近 30 天
function setDefaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  startTime.value = formatLocalTime(start)
  endTime.value = formatLocalTime(end)
}

setDefaultRange()
</script>

<template>
  <div class="dashboard">
    <h2>埋点分析报表</h2>
    <div class="filters">
      <div class="filter-row">
        <label>维度：</label>
        <select v-model="dimension">
          <option v-for="o in dimensionOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <div class="filter-row">
        <label>图表：</label>
        <select v-model="chartType">
          <option v-for="o in chartTypeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <div class="filter-row">
        <label>开始：</label>
        <input v-model="startTime" placeholder="2026-01-01T00:00:00" />
      </div>
      <div class="filter-row">
        <label>结束：</label>
        <input v-model="endTime" placeholder="2026-12-31T23:59:59" />
      </div>
      <button :disabled="loading" @click="query">{{ loading ? '查询中...' : '查询' }}</button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="rawData && (rawData as any).data && (rawData as any).data.length === 0" class="empty">
      无数据（查询范围内无埋点记录）
    </div>
    <div v-if="rawData && (rawData as any).data && (rawData as any).data.length > 0" class="chart-container">
      <VChart :option="chartOption" autoresize style="height: 400px" />
    </div>
  </div>
</template>

<style scoped>
.dashboard { background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
h2 { margin: 0 0 16px; font-size: 18px; }
.filters { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 6px; }
.filter-row { display: flex; align-items: center; gap: 6px; }
.filter-row label { color: #6e7681; font-size: 14px; }
.filter-row input, .filter-row select { padding: 6px 10px; border: 1px solid #d0d7de; border-radius: 4px; font-size: 14px; }
.filter-row input { width: 200px; }
button { padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; background: #1f6feb; color: #fff; font-size: 14px; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.chart-container { margin-top: 8px; }
.empty { padding: 40px; text-align: center; color: #6e7681; background: #f8f9fa; border-radius: 6px; }
.error { color: #cf222e; padding: 12px; background: #fff0f0; border-radius: 4px; margin-bottom: 16px; }
</style>
