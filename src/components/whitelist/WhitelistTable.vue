<template>
  <div class="whitelist-table">
    <table v-if="entries.length > 0">
      <thead>
        <tr>
          <th>编号</th>
          <th>员工编号</th>
          <th>姓名</th>
          <th>备注</th>
          <th>添加时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entries" :key="entry.id">
          <td>{{ entry.id }}</td>
          <td>{{ entry.employeeId }}</td>
          <td>{{ entry.name }}</td>
          <td>{{ entry.note || '-' }}</td>
          <td>{{ entry.addedAt }}</td>
          <td>
            <button class="action-btn delete" @click="$emit('remove', entry.id)">移除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <EmptyState v-else message="暂无白名单数据" />
  </div>
</template>

<script setup lang="ts">
import type { WhitelistEntry } from '@/types/whitelist'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps<{
  entries: WhitelistEntry[]
}>()

defineEmits<{
  (e: 'remove', id: number): void
}>()
</script>

<style scoped>
.whitelist-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
}

th, td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
}

th {
  background-color: #fafafa;
  color: #909399;
  font-weight: 500;
}

tr:hover {
  background-color: #f5f7fa;
}

.action-btn {
  padding: 4px 12px;
  border: 1px solid #f56c6c;
  background-color: #fff;
  color: #f56c6c;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.action-btn.delete:hover {
  background-color: #f56c6c;
  color: #fff;
}
</style>