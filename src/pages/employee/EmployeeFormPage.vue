<template>
  <div class="employee-form-page">
    <h2>{{ isEdit ? '编辑员工' : '添加员工' }}</h2>
    <EmployeeForm
      :initial-data="initialData"
      :is-edit="isEdit"
      :submitting="submitting"
      @submit="onSubmit"
      @cancel="onCancel"
    />

    <Notification
      :visible="notificationVisible"
      :type="notificationType"
      :message="notificationMessage"
      @close="notificationVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/employeeStore'
import type { EmployeeRequest } from '@/types/employee'
import EmployeeForm from '@/components/employee/EmployeeForm.vue'
import Notification from '@/components/common/Notification.vue'

const route = useRoute()
const router = useRouter()
const store = useEmployeeStore()

const isEdit = computed(() => !!route.params.id && route.params.id !== 'new')
const submitting = ref(false)
const initialData = ref<Partial<EmployeeRequest>>({})
const notificationVisible = ref(false)
const notificationType = ref<'success' | 'error'>('success')
const notificationMessage = ref('')

onMounted(async () => {
  if (isEdit.value) {
    try {
      const emp = await store.fetchEmployeeById(route.params.id as string)
      if (emp) {
        initialData.value = {
          name: emp.name,
          department: emp.department,
          position: emp.position,
          phone: emp.phone,
          email: emp.email,
          hireDate: emp.hireDate,
          status: emp.status,
        }
      }
    } catch {
      showNotification('error', '获取员工信息失败')
    }
  }
})

async function onSubmit(data: EmployeeRequest) {
  submitting.value = true
  try {
    if (isEdit.value) {
      await store.updateEmployee(route.params.id as string, data)
      showNotification('success', '员工信息更新成功')
    } else {
      await store.createEmployee(data)
      showNotification('success', '员工创建成功')
    }
    setTimeout(() => {
      router.push('/employees')
    }, 1000)
  } catch {
    showNotification('error', isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

function onCancel() {
  router.push('/employees')
}

function showNotification(type: 'success' | 'error', message: string) {
  notificationType.value = type
  notificationMessage.value = message
  notificationVisible.value = true
  setTimeout(() => {
    notificationVisible.value = false
  }, 3000)
}
</script>

<style scoped>
.employee-form-page {
  max-width: 800px;
}

.employee-form-page h2 {
  margin: 0 0 20px;
  font-size: 20px;
  color: #303133;
}
</style>