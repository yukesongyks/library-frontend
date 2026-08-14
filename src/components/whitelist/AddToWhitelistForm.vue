<template>
  <div class="add-to-whitelist-form">
    <h4>添加白名单</h4>
    <form @submit.prevent="onSubmit">
      <div class="form-row">
        <div class="form-group">
          <label>员工编号 <span class="required">*</span></label>
          <input v-model="formData.employeeId" type="text" class="form-input" placeholder="请输入员工编号" />
        </div>
        <div class="form-group">
          <label>姓名 <span class="required">*</span></label>
          <input v-model="formData.name" type="text" class="form-input" placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label>备注</label>
          <input v-model="formData.note" type="text" class="form-input" placeholder="备注信息" />
        </div>
        <div class="form-group form-actions-inline">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '添加中...' : '添加' }}
          </button>
          <button type="button" class="btn btn-default" @click="$emit('batch-add')">批量添加</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { WhitelistRequest } from '@/types/whitelist'

withDefaults(defineProps<{
  submitting?: boolean
}>(), {
  submitting: false,
})

const emit = defineEmits<{
  (e: 'submit', data: WhitelistRequest): void
  (e: 'batch-add'): void
}>()

const formData = reactive({
  employeeId: '',
  name: '',
  note: '',
})

function onSubmit() {
  if (!formData.employeeId.trim() || !formData.name.trim()) return
  emit('submit', {
    employeeId: formData.employeeId.trim(),
    name: formData.name.trim(),
    note: formData.note.trim() || undefined,
  })
  formData.employeeId = ''
  formData.name = ''
  formData.note = ''
}
</script>

<style scoped>
.add-to-whitelist-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  margin-top: 20px;
}

.add-to-whitelist-form h4 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #303133;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
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

.form-actions-inline {
  flex-direction: row;
  gap: 8px;
  align-items: flex-end;
  padding-bottom: 2px;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  white-space: nowrap;
}

.btn-primary {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.btn-primary:hover {
  background-color: #337ecc;
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
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