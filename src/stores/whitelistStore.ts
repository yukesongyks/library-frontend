import { defineStore } from 'pinia'
import { ref } from 'vue'
import { whitelistApi } from '@/api/whitelistApi'
import type { WhitelistEntry, WhitelistRequest, BatchWhitelistRequest, WhitelistType } from '@/types/whitelist'

export const useWhitelistStore = defineStore('whitelist', () => {
  const entries = ref<WhitelistEntry[]>([])
  const activeType = ref<WhitelistType>('IMPORT')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEntries(type?: WhitelistType) {
    loading.value = true
    error.value = null
    try {
      const res = await whitelistApi.list(type ?? activeType.value)
      entries.value = res.data
    } catch (e: any) {
      error.value = e.message || '获取白名单列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addEntry(data: WhitelistRequest) {
    error.value = null
    try {
      const res = await whitelistApi.add(data)
      await fetchEntries()
      return res.data
    } catch (e: any) {
      error.value = e.message || '添加白名单失败'
      throw e
    }
  }

  async function batchAdd(data: BatchWhitelistRequest) {
    error.value = null
    try {
      const res = await whitelistApi.batchAdd(data)
      await fetchEntries()
      return res.data
    } catch (e: any) {
      error.value = e.message || '批量添加白名单失败'
      throw e
    }
  }

  async function removeEntry(id: number) {
    error.value = null
    try {
      await whitelistApi.remove(id)
      await fetchEntries()
    } catch (e: any) {
      error.value = e.message || '移除白名单失败'
      throw e
    }
  }

  function setType(type: WhitelistType) {
    activeType.value = type
  }

  return {
    entries,
    activeType,
    loading,
    error,
    fetchEntries,
    addEntry,
    batchAdd,
    removeEntry,
    setType,
  }
})