<template>
  <div class="cost-dashboard">
    <!-- 顶部筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="form" @submit.prevent>
        <el-form-item label="开始月份">
          <el-date-picker
            v-model="form.startMonth"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            placeholder="开始月份"
          />
        </el-form-item>
        <el-form-item label="结束月份">
          <el-date-picker
            v-model="form.endMonth"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            placeholder="结束月份"
          />
        </el-form-item>
        <el-form-item label="趋势粒度">
          <el-select v-model="form.granularity" placeholder="趋势粒度">
            <el-option
              v-for="opt in GRANULARITY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分布维度">
          <el-select v-model="distributionDimension" @change="loadDistribution">
            <el-option
              v-for="opt in DISTRIBUTION_DIMENSION_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadDashboard">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 概览卡片行 -->
    <el-card v-loading="loading" shadow="never" class="summary-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <CostSummaryCard
            title="总人力成本"
            :value="formatMoney(dashboard.totalHumanCost)"
            icon="TrendCharts"
            color="#409EFF"
          />
        </el-col>
        <el-col :span="6">
          <CostSummaryCard
            title="总项目成本"
            :value="formatMoney(dashboard.totalProjectCost)"
            icon="Money"
            color="#67C23A"
          />
        </el-col>
        <el-col :span="6">
          <CostSummaryCard
            title="总预算"
            :value="formatMoney(dashboard.totalBudget)"
            icon="Wallet"
            color="#E6A23C"
          />
        </el-col>
        <el-col :span="6">
          <CostSummaryCard
            title="预计超支总额"
            :value="formatMoney(dashboard.totalOverrun)"
            icon="Warning"
            color="#F56C6C"
          />
        </el-col>
      </el-row>
      <div class="growth-rate-row">
        <span>同比增长率：{{ formatGrowthRate(dashboard.yoyGrowthRate) }}</span>
        <span>环比增长率：{{ formatGrowthRate(dashboard.momGrowthRate) }}</span>
      </div>
    </el-card>

    <!-- 趋势图区域 -->
    <el-card shadow="never" class="chart-card">
      <template #header>成本趋势</template>
      <CostTrendChart v-loading="loading" :data="dashboard.trend" />
    </el-card>

    <!-- 维度分布图区域 -->
    <el-card shadow="never" class="chart-card">
      <template #header>成本分布</template>
      <CostDistributionChart v-loading="distributionLoading" :data="distributionData" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDashboard, aggregate } from '@/api/cost'
import { GRANULARITY_OPTIONS } from '@/constants/cost'
import { formatMoney, formatGrowthRate, currentMonth, monthsAgo } from '@/utils/format'
import CostTrendChart from '@/components/charts/CostTrendChart.vue'
import CostDistributionChart from '@/components/charts/CostDistributionChart.vue'
import CostSummaryCard from '@/components/cost/CostSummaryCard.vue'
import type { DashboardVO, AggregateItemVO, Dimension, Granularity } from '@/types/cost'

/** 成本分布可选维度（部门 / 业务线 / 人员） */
const DISTRIBUTION_DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: 'dept', label: '部门' },
  { value: 'bizLine', label: '业务线' },
  { value: 'person', label: '人员' }
]

/** 空 Dashboard 数据，用于初始态与加载失败回退 */
const EMPTY_DASHBOARD: DashboardVO = {
  totalHumanCost: 0,
  totalProjectCost: 0,
  totalBudget: 0,
  totalOverrun: 0,
  yoyGrowthRate: null,
  momGrowthRate: null,
  trend: [],
  distribution: []
}

const form = reactive({
  startMonth: monthsAgo(5),
  endMonth: currentMonth(),
  granularity: 'month' as Granularity
})

const loading = ref(true)
const distributionLoading = ref(false)
const dashboard = ref<DashboardVO>({ ...EMPTY_DASHBOARD })
const distributionData = ref<AggregateItemVO[]>([])
const distributionDimension = ref<Dimension>('dept')

/** 加载 Dashboard 概览与趋势数据 */
async function loadDashboard() {
  loading.value = true
  try {
    const data = await getDashboard({
      startMonth: form.startMonth,
      endMonth: form.endMonth,
      granularity: form.granularity
    })
    dashboard.value = data ?? { ...EMPTY_DASHBOARD }
  } catch {
    ElMessage.error('加载成本统计数据失败')
    dashboard.value = { ...EMPTY_DASHBOARD }
  } finally {
    loading.value = false
  }
}

/** 加载维度分布数据 */
async function loadDistribution() {
  distributionLoading.value = true
  try {
    const data = await aggregate({
      dimension: distributionDimension.value,
      startMonth: form.startMonth,
      endMonth: form.endMonth
    })
    distributionData.value = data ?? []
  } catch {
    ElMessage.error('加载成本分布数据失败')
    distributionData.value = []
  } finally {
    distributionLoading.value = false
  }
}

onMounted(() => {
  void Promise.all([loadDashboard(), loadDistribution()])
})
</script>

<style scoped>
.cost-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card :deep(.el-form-item) {
  margin-bottom: 0;
}

.growth-rate-row {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
  display: flex;
  gap: 24px;
}
</style>
