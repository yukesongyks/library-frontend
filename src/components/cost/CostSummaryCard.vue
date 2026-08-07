<script setup lang="ts">
import { computed } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    title: string
    value: string
    icon?: string
    color?: string
  }>(),
  {
    icon: 'TrendCharts',
    color: '#409EFF'
  }
)

const iconComp = computed(() => TrendCharts)
</script>

<template>
  <el-card class="summary-card" :body-style="{ padding: '20px' }">
    <div class="summary-inner">
      <div class="summary-icon" :style="{ backgroundColor: props.color }">
        <el-icon :size="28"><component :is="iconComp" /></el-icon>
      </div>
      <div class="summary-content">
        <div class="summary-title">{{ props.title }}</div>
        <div class="summary-value" :style="{ color: props.color }">{{ props.value }}</div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.summary-card {
  border-radius: 8px;
}

.summary-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 8px;
  color: #fff;
  flex-shrink: 0;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-title {
  font-size: 14px;
  color: #909399;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.2;
}
</style>
