<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { AggregateItemVO } from '@/types/cost'

const props = defineProps<{
  data: AggregateItemVO[]
}>()

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

function getOption(): echarts.EChartsOption {
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const ratio = props.data.find((d) => d.label === params.name)?.ratio
        const ratioText =
          ratio != null ? (ratio * 100).toFixed(2) + '%' : params.percent + '%'
        return `${params.name}: ${params.value} (${ratioText})`
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0
    },
    series: [
      {
        name: '维度分布',
        type: 'pie',
        radius: '50%',
        data: props.data.map((d) => ({ name: d.label, value: d.amount }))
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
  <div ref="chartRef" class="cost-distribution-chart" />
</template>

<style scoped>
.cost-distribution-chart {
  width: 100%;
  height: 350px;
}
</style>
