<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay" @click.self="onCancel">
      <div class="confirm-dialog">
        <div class="confirm-header">
          <h3>{{ title }}</h3>
        </div>
        <div class="confirm-body">
          <p>{{ message }}</p>
        </div>
        <div class="confirm-footer">
          <button class="btn btn-cancel" @click="onCancel">取消</button>
          <button
            class="btn btn-confirm"
            :class="{ 'btn-danger': danger }"
            @click="onConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  visible: boolean
  title?: string
  message?: string
  confirmText?: string
  danger?: boolean
}>(), {
  visible: false,
  title: '确认操作',
  message: '确定要执行此操作吗？',
  confirmText: '确定',
  danger: false,
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background-color: #fff;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.confirm-header {
  padding: 20px 20px 0;
}

.confirm-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.confirm-body {
  padding: 16px 20px;
}

.confirm-body p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.confirm-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #f2f2f2;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
}

.btn-cancel {
  background-color: #fff;
  color: #606266;
}

.btn-confirm {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.btn-danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
}
</style>