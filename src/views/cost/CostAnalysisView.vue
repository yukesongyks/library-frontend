<template>
  <div class="cost-analysis">
    <!-- A. 顶部筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filter" class="filter-form">
        <el-form-item label="部门">
          <el-select
            v-model="filter.deptId"
            placeholder="全部部门"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option
              v-for="opt in deptOptions"
              :key="opt.id"
              :label="opt.deptName"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="项目">
          <el-select
            v-model="filter.projectId"
            placeholder="全部项目"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option
              v-for="opt in projectOptions"
              :key="opt.id"
              :label="opt.projectName"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="业务线">
          <el-select
            v-model="filter.bizLineId"
            placeholder="全部业务线"
            clearable
            filterable
            style="width: 180px"
          >
            <el-option
              v-for="opt in bizLineOptions"
              :key="opt.id"
              :label="opt.bizLineName"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="activeTab === 'human'" label="人员姓名">
          <el-input
            v-model="filter.personName"
            placeholder="请输入人员姓名"
            clearable
            style="width: 160px"
          />
        </el-form-item>

        <el-form-item v-if="activeTab === 'human'" label="角色">
          <el-select
            v-model="filter.roleCode"
            placeholder="全部角色"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="opt in HUMAN_ROLE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="开始月份">
          <el-date-picker
            v-model="filter.startMonth"
            type="month"
            value-format="YYYY-MM"
            placeholder="开始月份"
            style="width: 160px"
          />
        </el-form-item>

        <el-form-item label="结束月份">
          <el-date-picker
            v-model="filter.endMonth"
            type="month"
            value-format="YYYY-MM"
            placeholder="结束月份"
            style="width: 160px"
          />
        </el-form-item>

        <el-form-item v-if="activeTab === 'human'" label="对比类型">
          <el-select
            v-model="filter.compareType"
            placeholder="无对比"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="opt in COMPARE_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="activeTab === 'project'" label="仅看超支">
          <el-switch v-model="filter.onlyOverrun" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作区 -->
    <div class="action-bar">
      <el-tabs v-model="activeTab" class="cost-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="人力成本明细" name="human" />
        <el-tab-pane label="项目成本明细" name="project" />
      </el-tabs>

      <div class="action-buttons">
        <el-button v-if="authStore.isAdmin" type="primary" :icon="Upload" @click="handleOpenImport">
          导入数据
        </el-button>
        <el-dropdown v-if="authStore.isAdmin" trigger="click" @command="handleExport">
          <el-button type="success" :icon="Download" :loading="exporting">
            导出报表
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="opt in EXPORT_FORMAT_OPTIONS"
                :key="opt.value"
                :command="opt.value"
              >
                {{ opt.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- B. Tab 1 人力成本明细 -->
    <el-card v-show="activeTab === 'human'" shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="humanData"
        stripe
        border
        :max-height="tableMaxHeight"
        empty-text="暂无数据"
        :row-key="getHumanRowKey"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="deptName" label="部门" min-width="120" show-overflow-tooltip>
          <template #default="{ row }: { row: CostHumanVO }">
            {{ row.deptName ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="projectName" label="项目" min-width="140" show-overflow-tooltip>
          <template #default="{ row }: { row: CostHumanVO }">
            {{ row.projectName ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="bizLineName" label="业务线" min-width="120" show-overflow-tooltip>
          <template #default="{ row }: { row: CostHumanVO }">
            {{ row.bizLineName ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="personName" label="人员" min-width="100" show-overflow-tooltip />
        <el-table-column prop="costPeriod" label="月份" width="100" align="center" />
        <el-table-column prop="roleCode" label="角色" width="90" align="center">
          <template #default="{ row }: { row: CostHumanVO }">
            {{ HUMAN_ROLE_MAP[row.roleCode] ?? row.roleCode }}
          </template>
        </el-table-column>
        <el-table-column prop="costAmount" label="成本金额" width="130" align="right">
          <template #default="{ row }: { row: CostHumanVO }">
            {{ formatMoney(row.costAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="personMonths" label="人月数" width="100" align="right">
          <template #default="{ row }: { row: CostHumanVO }">
            {{ formatPersonMonths(row.personMonths) }}
          </template>
        </el-table-column>
        <el-table-column prop="avgCostPerPerson" label="人均成本" width="130" align="right">
          <template #default="{ row }: { row: CostHumanVO }">
            {{ formatMoney(row.avgCostPerPerson) }}
          </template>
        </el-table-column>
        <el-table-column prop="yoyGrowthRate" label="同比增长率" width="120" align="right">
          <template #default="{ row }: { row: CostHumanVO }">
            <span :class="growthRateClass(row.yoyGrowthRate)">
              {{ formatGrowthRate(row.yoyGrowthRate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="momGrowthRate" label="环比增长率" width="120" align="right">
          <template #default="{ row }: { row: CostHumanVO }">
            <span :class="growthRateClass(row.momGrowthRate)">
              {{ formatGrowthRate(row.momGrowthRate) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- B. Tab 2 项目成本明细 -->
    <el-card v-show="activeTab === 'project'" shadow="never" class="table-card">
      <el-table
        v-loading="loading"
        :data="projectData"
        stripe
        border
        :max-height="tableMaxHeight"
        empty-text="暂无数据"
        :row-key="getProjectRowKey"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="projectName" label="项目" min-width="160" show-overflow-tooltip />
        <el-table-column prop="deptName" label="部门" min-width="120" show-overflow-tooltip>
          <template #default="{ row }: { row: CostProjectVO }">
            {{ row.deptName ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="bizLineName" label="业务线" min-width="120" show-overflow-tooltip>
          <template #default="{ row }: { row: CostProjectVO }">
            {{ row.bizLineName ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="costPeriod" label="月份" width="100" align="center" />
        <el-table-column prop="budget" label="预算" width="130" align="right">
          <template #default="{ row }: { row: CostProjectVO }">
            {{ formatMoney(row.budget) }}
          </template>
        </el-table-column>
        <el-table-column prop="actualCost" label="实际消耗" width="130" align="right">
          <template #default="{ row }: { row: CostProjectVO }">
            {{ formatMoney(row.actualCost) }}
          </template>
        </el-table-column>
        <el-table-column prop="progressPercent" label="进度%" width="100" align="right">
          <template #default="{ row }: { row: CostProjectVO }">
            {{ formatPercent(row.progressPercent) }}
          </template>
        </el-table-column>
        <el-table-column prop="budgetRatio" label="预算占比" width="100" align="right">
          <template #default="{ row }: { row: CostProjectVO }">
            {{ formatPercent(row.budgetRatio) }}
          </template>
        </el-table-column>
        <el-table-column prop="estimatedFinalCost" label="预计最终成本" width="140" align="right">
          <template #default="{ row }: { row: CostProjectVO }">
            {{ formatMoney(row.estimatedFinalCost) }}
          </template>
        </el-table-column>
        <el-table-column prop="estimatedOverrun" label="预计超支" width="130" align="right">
          <template #default="{ row }: { row: CostProjectVO }">
            {{ formatMoney(row.estimatedOverrun) }}
          </template>
        </el-table-column>
        <el-table-column prop="isOverrun" label="是否超支" width="100" align="center">
          <template #default="{ row }: { row: CostProjectVO }">
            <el-tag :type="row.isOverrun ? 'danger' : 'success'" effect="light">
              {{ row.isOverrun ? '超支' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="yoyGrowthRate" label="同比增长率" width="120" align="right">
          <template #default="{ row }: { row: CostProjectVO }">
            <span :class="growthRateClass(row.yoyGrowthRate)">
              {{ formatGrowthRate(row.yoyGrowthRate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="momGrowthRate" label="环比增长率" width="120" align="right">
          <template #default="{ row }: { row: CostProjectVO }">
            <span :class="growthRateClass(row.momGrowthRate)">
              {{ formatGrowthRate(row.momGrowthRate) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- C. 导入对话框 -->
    <ImportDialog v-model:visible="importVisible" @success="handleImportSuccess" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight, Upload, Download, ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import {
  listHuman,
  listProject,
  exportCost,
  listDeptOptions,
  listBizLineOptions,
  listProjectOptions
} from '@/api/cost'
import {
  HUMAN_ROLE_OPTIONS,
  HUMAN_ROLE_MAP,
  COMPARE_TYPE_OPTIONS,
  EXPORT_FORMAT_OPTIONS
} from '@/constants/cost'
import {
  formatMoney,
  formatPercent,
  formatGrowthRate,
  currentMonth,
  monthsAgo
} from '@/utils/format'
import type {
  CostHumanVO,
  CostProjectVO,
  CompareType,
  HumanRoleCode,
  ExportFormat,
  DeptOption,
  BizLineOption,
  ProjectOption,
  NullableNumber
} from '@/types/cost'
import ImportDialog from '@/components/cost/ImportDialog.vue'

const authStore = useAuthStore()

/** 表格最大高度（滚动） */
const tableMaxHeight = 560

/** 当前激活 tab */
const activeTab = ref<'human' | 'project'>('human')

/** 下拉选项 */
const deptOptions = ref<DeptOption[]>([])
const projectOptions = ref<ProjectOption[]>([])
const bizLineOptions = ref<BizLineOption[]>([])

/** 表格数据 */
const humanData = ref<CostHumanVO[]>([])
const projectData = ref<CostProjectVO[]>([])

/** 加载/导出状态 */
const loading = ref(false)
const exporting = ref(false)

/** 导入对话框可见性 */
const importVisible = ref(false)

/** 筛选条件 */
interface CostFilter {
  deptId: number | undefined
  projectId: number | undefined
  bizLineId: number | undefined
  personName: string | undefined
  roleCode: HumanRoleCode | undefined
  startMonth: string | undefined
  endMonth: string | undefined
  compareType: CompareType | undefined
  onlyOverrun: boolean
}

function createDefaultFilter(): CostFilter {
  return {
    deptId: undefined,
    projectId: undefined,
    bizLineId: undefined,
    personName: undefined,
    roleCode: undefined,
    startMonth: monthsAgo(5),
    endMonth: currentMonth(),
    compareType: undefined,
    onlyOverrun: false
  }
}

const filter = reactive<CostFilter>(createDefaultFilter())

/** 加载下拉选项 */
async function loadOptions(): Promise<void> {
  const [dept, bizLine, project] = await Promise.all([
    listDeptOptions(),
    listBizLineOptions(),
    listProjectOptions()
  ])
  deptOptions.value = dept
  bizLineOptions.value = bizLine
  projectOptions.value = project
}

/** 构造人力查询参数 */
function buildHumanParams() {
  return {
    deptId: filter.deptId,
    projectId: filter.projectId,
    bizLineId: filter.bizLineId,
    personName: filter.personName?.trim() || undefined,
    roleCode: filter.roleCode,
    startMonth: filter.startMonth,
    endMonth: filter.endMonth,
    compareType: filter.compareType
  }
}

/** 构造项目查询参数 */
function buildProjectParams() {
  return {
    deptId: filter.deptId,
    projectId: filter.projectId,
    bizLineId: filter.bizLineId,
    startMonth: filter.startMonth,
    endMonth: filter.endMonth,
    onlyOverrun: filter.onlyOverrun
  }
}

/** 查询人力明细 */
async function fetchHuman(): Promise<void> {
  loading.value = true
  try {
    humanData.value = await listHuman(buildHumanParams())
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败'
    ElMessage.error(message)
    humanData.value = []
  } finally {
    loading.value = false
  }
}

/** 查询项目明细 */
async function fetchProject(): Promise<void> {
  loading.value = true
  try {
    projectData.value = await listProject(buildProjectParams())
  } catch (err) {
    const message = err instanceof Error ? err.message : '查询失败'
    ElMessage.error(message)
    projectData.value = []
  } finally {
    loading.value = false
  }
}

/** 查询按钮 */
async function handleSearch(): Promise<void> {
  if (activeTab.value === 'human') {
    await fetchHuman()
  } else {
    await fetchProject()
  }
}

/** tab 切换：重新查询对应数据 */
async function handleTabChange(name: string | number): Promise<void> {
  const tab = String(name) as 'human' | 'project'
  activeTab.value = tab
  if (tab === 'human') {
    await fetchHuman()
  } else {
    await fetchProject()
  }
}

/** 重置筛选 */
function handleReset(): void {
  Object.assign(filter, createDefaultFilter())
}

/** 打开导入对话框 */
function handleOpenImport(): void {
  importVisible.value = true
}

/** 导入成功回调：刷新当前表格 */
async function handleImportSuccess(): Promise<void> {
  if (activeTab.value === 'human') {
    await fetchHuman()
  } else {
    await fetchProject()
  }
}

/** 导出报表 */
async function handleExport(format: ExportFormat): Promise<void> {
  exporting.value = true
  try {
    const type = activeTab.value
    await exportCost({
      type,
      format,
      deptId: filter.deptId,
      projectId: filter.projectId,
      bizLineId: filter.bizLineId,
      personName: filter.personName?.trim() || undefined,
      roleCode: type === 'human' ? filter.roleCode : undefined,
      startMonth: filter.startMonth,
      endMonth: filter.endMonth,
      compareType: type === 'human' ? filter.compareType : undefined,
      onlyOverrun: type === 'project' ? filter.onlyOverrun : undefined
    })
    ElMessage.success('导出成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '导出失败'
    ElMessage.error(message)
  } finally {
    exporting.value = false
  }
}

/** 人月数格式化（保留 2 位小数，null 返回 -） */
function formatPersonMonths(val: NullableNumber | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return '-'
  }
  return val.toFixed(2)
}

/** 增长率样式类 */
function growthRateClass(val: NullableNumber | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return ''
  }
  if (val > 0) return 'growth-up'
  if (val < 0) return 'growth-down'
  return ''
}

/** 人力表格行 key */
function getHumanRowKey(row: CostHumanVO): string {
  return `${row.personName}-${row.costPeriod}-${row.roleCode}`
}

/** 项目表格行 key */
function getProjectRowKey(row: CostProjectVO): string {
  return `${row.projectName}-${row.costPeriod}`
}

onMounted(async () => {
  try {
    await loadOptions()
    await fetchHuman()
  } catch (err) {
    const message = err instanceof Error ? err.message : '初始化失败'
    ElMessage.error(message)
  }
})
</script>

<style scoped>
.cost-analysis {
  padding: 16px;
}
.filter-card {
  margin-bottom: 12px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}
.action-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cost-tabs {
  flex: 1;
}
.cost-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.action-buttons {
  display: flex;
  gap: 8px;
  padding-bottom: 4px;
}
.table-card {
  margin-bottom: 12px;
}
.growth-up {
  color: var(--el-color-danger);
}
.growth-down {
  color: var(--el-color-success);
}
</style>
