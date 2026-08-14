<template>
  <div class="budget-form">
    <h4>{{ isEdit ? '编辑预算' : '新增预算' }}</h4>
    <form @submit.prevent="onSubmit">
      <div class="form-group">
        <label>年份 <span class="required">*</span></label>
        <input v-model="formData.year" type="number" class="form-input" min="2020" max="2035" />
      </div>

      <div class="form-group">
        <label>季度</label>
        <select v-model="formData.quarter" class="form-input">
          <option :value="null">-- 不选择 --</option>
          <option value="1">第一季度</option>
          <option value="2">第二季度</option>
          <option value="3">第三季度</option>
          <option value="4">第四季度</option>
        </select>
      </div>

      <div class="form-group">
        <label>月份</label>
        <select v-model="formData.month" class="form-input">
          <option :value="null">-- 不选择 --</option>
          <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
        </select>
      </div>

      <div class="form-group">
        <label>预算金额 <span class="required">*</span></label>
        <input
          v-model="formData.budgetAmount"
          type="number"
          step="0.01"
          class="form-input"
          placeholder="请输入预算金额"
        />
      </div>

      <div class="form-group">
        <label>已使用金额</label>
        <input
          v-model="formData.usedAmount"
          type="number"
          step="0.01"
          class="form-input"
          placeholder="请输入已使用金额"
        />
      </div>

      <div class="form-group">
        <label>备注</label>
        <textarea
          v-model="formData.note"
          class="form-input form-textarea"
          placeholder="备注信息"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">{{ isEdit ? '更新' : '创建' }}</button>
        <button type="button" class="btn btn-default" @click="$emit('cancel')">取消</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import type { BudgetRequest, Budget } from '@/types/budget'

const props = withDefaults(defineProps<{
  initialData?: Partial<Budget>
  isEdit?: boolean
}>(), {
  initialData: () => ({}),
  isEdit: false,
})

const emit = defineEmits<{
  (e: 'submit', data: BudgetRequest): void
  (e: 'cancel'): void
}>()

const formData = reactive<BudgetRequest>({
  year: new Date().getFullYear(),
  quarter: null,
  month: null,
  budgetAmount: 0,
  usedAmount: 0,
  note: '',
})

onMounted(() => {
  if (props.initialData && props.isEdit) {
    formData.year = props.initialData.year ?? new Date().getFullYear()
    formData.quarter = props.initialData.quarter ?? null
    formData.month = props.initialData.month ?? null
    formData.budgetAmount = props.initialData.budgetAmount ?? 0
    formData.usedAmount = props.initialData.usedAmount ?? 0
    formData.note = props.initialData.note ?? ''
  }
})

function onSubmit() {
  emit('submit', { ...formData })
}
</script>

<style scoped>
.budget-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.budget-form h4 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #303133;
}

.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.required {
  color: #f56c6c;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.form-input:focus {
  border-color: #409eff;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
}

.btn-primary {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.btn-primary:hover {
  background-color: #337ecc;
}

.btn-default {
  background-color: #fff;
  color: #606266;
}

.btn-default:hover {
  color: #409eff;
  border-color: #409eff;
}
</style>