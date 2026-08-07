<template>
  <div ref="chartRef" class="chart-container"></div>
  <div v-if="isEmpty" class="chart-empty">暂无数据</div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart as EBarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([EBarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Object, default: null }
})

const chartRef = ref(null)
const isEmpty = ref(true)
let chartInstance = null

function renderChart() {
  if (!chartRef.value) return

  // 异常兜底：数据为空展示占位（6.2.2）
  if (!props.data || !props.data.categories || props.data.categories.length === 0 ||
      !props.data.series || props.data.series.length === 0) {
    isEmpty.value = true
    if (chartInstance) {
      chartInstance.clear()
    }
    return
  }
  isEmpty.value = false

  try {
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value)
    }

    const seriesData = props.data.series.map(s => ({
      name: s.name,
      type: 'bar',
      data: s.data
    }))

    chartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: props.data.series.map(s => s.name) },
      xAxis: { type: 'category', data: props.data.categories },
      yAxis: { type: 'value' },
      series: seriesData
    }, true)
  } catch (e) {
    isEmpty.value = true
    if (chartInstance) {
      chartInstance.clear()
    }
  }
}

watch(() => props.data, () => {
  nextTick(renderChart)
}, { deep: true })

onMounted(() => {
  nextTick(renderChart)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.chart-container { width: 100%; height: 250px; }
.chart-empty { text-align: center; line-height: 100px; color: #999; }
</style>
