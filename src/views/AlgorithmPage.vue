<script setup lang="ts">
import { ref } from 'vue'
import HelloWorldTab from '@/components/HelloWorldTab.vue'
import HashTab from '@/components/HashTab.vue'
import BubbleSortTab from '@/components/BubbleSortTab.vue'

// AlgorithmPage：三 Tab 容器（spec design.md 前端组件树）
// Tab 1 HelloWorld | Tab 2 哈希算法 | Tab 3 冒泡排序
const activeTab = ref<'helloworld' | 'hash' | 'bubble-sort'>('helloworld')

const tabs = [
  { key: 'helloworld', label: 'HelloWorld' },
  { key: 'hash', label: '哈希算法' },
  { key: 'bubble-sort', label: '冒泡排序' }
] as const
</script>

<template>
  <div class="algorithm-page">
    <h2>算法演示</h2>
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-content">
      <HelloWorldTab v-if="activeTab === 'helloworld'" />
      <HashTab v-else-if="activeTab === 'hash'" />
      <BubbleSortTab v-else-if="activeTab === 'bubble-sort'" />
    </div>
  </div>
</template>

<style scoped>
.algorithm-page { background: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
h2 { margin: 0 0 16px; font-size: 18px; }
.tab-bar { display: flex; border-bottom: 2px solid #e0e0e0; margin-bottom: 8px; }
.tab {
  padding: 8px 20px; border: none; background: transparent; cursor: pointer;
  font-size: 14px; color: #6e7681; border-bottom: 2px solid transparent; margin-bottom: -2px;
}
.tab.active { color: #1f6feb; border-bottom-color: #1f6feb; font-weight: 600; }
.tab-content { min-height: 200px; }
</style>
