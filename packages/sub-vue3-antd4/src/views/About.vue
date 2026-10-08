<template>
  <a-space direction="vertical" style="width: 100%">
    <a-card title="About">
      <a-space direction="vertical" style="width: 320px">
        <a-input v-model:value="keyword" placeholder="输入关键字" />
        <a-select
          v-model:value="city"
          style="width: 100%"
          placeholder="选择城市"
          :options="options"
        />
      </a-space>
    </a-card>
  </a-space>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const keyword = ref('')
const city = ref<string | undefined>(undefined)

const options = [
  { value: 'beijing', label: '北京' },
  { value: 'shanghai', label: '上海' },
  { value: 'shenzhen', label: '深圳' }
]
</script>
