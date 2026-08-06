<template>
  <div class="page">
    <h1 class="page-title">算法演示</h1>
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-panel">
      <HelloTab v-show="activeTab === 'hello'" />
      <HashTab v-show="activeTab === 'hash'" />
      <BubbleSortTab v-show="activeTab === 'bubble'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HelloTab from '../components/HelloTab.vue'
import HashTab from '../components/HashTab.vue'
import BubbleSortTab from '../components/BubbleSortTab.vue'

const tabs = [
  { key: 'hello', label: 'HelloWorld' },
  { key: 'hash', label: '哈希算法' },
  { key: 'bubble', label: '冒泡排序' }
]
const activeTab = ref('hello')
</script>

<style scoped>
.page { max-width: 900px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
.page-title { padding: 20px; font-size: 22px; border-bottom: 1px solid #f0f0f0; }
.tabs { display: flex; border-bottom: 1px solid #f0f0f0; }
.tab-btn { flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-size: 15px; color: #666; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab-btn:hover { color: #1890ff; }
.tab-btn.active { color: #1890ff; border-bottom-color: #1890ff; }
.tab-panel { min-height: 300px; }
</style>
