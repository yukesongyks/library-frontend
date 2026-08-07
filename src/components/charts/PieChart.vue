<template>
  <div ref="chartRef" class="chart-container"></div>
  <div v-if="isEmpty" class="chart-empty">暂无数据</div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart as EPieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([EPieChart, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Array, default: null }
})

const chartRef = ref(null)
const isEmpty = ref(true)
let chartInstance = null

function renderChart() {
  if (!chartRef.value) return

  // 异常兜底：数据为空展示占位（6.2.2）
  if (!props.data || props.data.length === 0) {
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

    chartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: props.data.map(item => ({
          name: item.name,
          value: item.value
        }))
      }]
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
