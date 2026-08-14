<template>
  <div class="employee-form">
    <form @submit.prevent="onSubmit">
      <div class="form-grid">
        <div class="form-group">
          <label>姓名 <span class="required">*</span></label>
          <input
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ 'is-error': errors.name }"
            placeholder="请输入姓名"
          />
          <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label>部门 <span class="required">*</span></label>
          <input
            v-model="formData.department"
            type="text"
            class="form-input"
            :class="{ 'is-error': errors.department }"
            placeholder="请输入部门"
          />
          <span v-if="errors.department" class="error-msg">{{ errors.department }}</span>
        </div>

        <div class="form-group">
          <label>职位 <span class="required">*</span></label>
          <input
            v-model="formData.position"
            type="text"
            class="form-input"
            :class="{ 'is-error': errors.position }"
            placeholder="请输入职位"
          />
          <span v-if="errors.position" class="error-msg">{{ errors.position }}</span>
        </div>

        <div class="form-group">
          <label>电话</label>
          <input
            v-model="formData.phone"
            type="text"
            class="form-input"
            placeholder="请输入电话"
          />
        </div>

        <div class="form-group">
          <label>邮箱</label>
          <input
            v-model="formData.email"
            type="email"
            class="form-input"
            placeholder="请输入邮箱"
          />
        </div>

        <div class="form-group">
          <label>入职日期 <span class="required">*</span></label>
          <input
            v-model="formData.hireDate"
            type="date"
            class="form-input"
            :class="{ 'is-error': errors.hireDate }"
          />
          <span v-if="errors.hireDate" class="error-msg">{{ errors.hireDate }}</span>
        </div>

        <div class="form-group">
          <label>状态</label>
          <select v-model="formData.status" class="form-input">
            <option value="ACTIVE">在职</option>
            <option value="INACTIVE">停职</option>
            <option value="TERMINATED">离职</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? '提交中...' : isEdit ? '更新' : '创建' }}
        </button>
        <button type="button" class="btn btn-default" @click="$emit('cancel')">取消</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import type { EmployeeRequest, EmployeeStatus } from '@/types/employee'

const props = withDefaults(defineProps<{
  initialData?: Partial<EmployeeRequest>
  isEdit?: boolean
  submitting?: boolean
}>(), {
  initialData: () => ({}),
  isEdit: false,
  submitting: false,
})

const emit = defineEmits<{
  (e: 'submit', data: EmployeeRequest): void
  (e: 'cancel'): void
}>()

const errors = reactive<Record<string, string>>({})

const formData = reactive<EmployeeRequest>({
  name: '',
  department: '',
  position: '',
  phone: '',
  email: '',
  hireDate: '',
  status: 'ACTIVE',
})

onMounted(() => {
  if (props.initialData) {
    Object.assign(formData, props.initialData)
  }
})

function validate(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key])

  if (!formData.name.trim()) {
    errors.name = '请输入姓名'
  }
  if (!formData.department.trim()) {
    errors.department = '请输入部门'
  }
  if (!formData.position.trim()) {
    errors.position = '请输入职位'
  }
  if (!formData.hireDate) {
    errors.hireDate = '请选择入职日期'
  }

  return Object.keys(errors).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...formData })
}
</script>

<style scoped>
.employee-form {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
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
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #409eff;
}

.form-input.is-error {
  border-color: #f56c6c;
}

.error-msg {
  font-size: 12px;
  color: #f56c6c;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
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