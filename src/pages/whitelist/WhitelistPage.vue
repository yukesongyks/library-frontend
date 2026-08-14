<template>
  <div class="whitelist-page">
    <div class="page-header">
      <h2>白名单管理</h2>
    </div>

    <WhitelistTypeToggle v-model="activeType" @update:model-value="onTypeChange" />

    <LoadingSpinner :loading="store.loading" />

    <WhitelistTable
      v-if="!store.loading"
      :entries="store.entries"
      @remove="onRemove"
    />

    <AddToWhitelistForm
      :submitting="submitting"
      @submit="onAdd"
      @batch-add="onBatchAdd"
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
import { ref, watch, onMounted } from 'vue'
import { useWhitelistStore } from '@/stores/whitelistStore'
import type { WhitelistType, WhitelistRequest } from '@/types/whitelist'
import WhitelistTypeToggle from '@/components/whitelist/WhitelistTypeToggle.vue'
import WhitelistTable from '@/components/whitelist/WhitelistTable.vue'
import AddToWhitelistForm from '@/components/whitelist/AddToWhitelistForm.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Notification from '@/components/common/Notification.vue'

const store = useWhitelistStore()

const activeType = ref<WhitelistType>('IMPORT')
const submitting = ref(false)
const notificationVisible = ref(false)
const notificationType = ref<'success' | 'error'>('success')
const notificationMessage = ref('')

onMounted(() => {
  store.fetchEntries(activeType.value)
})

watch(activeType, (val) => {
  store.setType(val)
  store.fetchEntries(val)
})

function onTypeChange(type: WhitelistType) {
  activeType.value = type
}

async function onAdd(data: WhitelistRequest) {
  submitting.value = true
  try {
    await store.addEntry({ ...data, type: activeType.value })
    showNotification('success', '添加成功')
  } catch {
    showNotification('error', '添加失败')
  } finally {
    submitting.value = false
  }
}

async function onBatchAdd() {
  showNotification('info', '批量添加功能请使用 API 接口')
}

async function onRemove(id: number) {
  try {
    await store.removeEntry(id)
    showNotification('success', '移除成功')
  } catch {
    showNotification('error', '移除失败')
  }
}

function showNotification(type: 'success' | 'error' | 'info', message: string) {
  notificationType.value = type === 'info' ? 'success' : type
  notificationMessage.value = message
  notificationVisible.value = true
  setTimeout(() => {
    notificationVisible.value = false
  }, 3000)
}
</script>

<style scoped>
.whitelist-page {
  max-width: 1000px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}
</style>