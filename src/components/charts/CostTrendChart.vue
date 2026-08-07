<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { TrendPointVO } from '@/types/cost'

const props = defineProps<{
  data: TrendPointVO[]
}>()

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

function getOption(): echarts.EChartsOption {
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['人力成本', '项目成本', '总成本']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map((d) => d.period)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '人力成本',
        type: 'line',
        data: props.data.map((d) => d.humanCost)
      },
      {
        name: '项目成本',
        type: 'line',
        data: props.data.map((d) => d.projectCost)
      },
      {
        name: '总成本',
        type: 'line',
        data: props.data.map((d) => d.totalCost)
      }
    ]
  }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  chartInstance.setOption(getOption())
}

onMounted(() => {
  renderChart()
})

watch(
  () => props.data,
  () => {
    renderChart()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<template>
  <div ref="chartRef" class="cost-trend-chart" />
</template>

<style scoped>
.cost-trend-chart {
  width: 100%;
  height: 350px;
}
</style>
