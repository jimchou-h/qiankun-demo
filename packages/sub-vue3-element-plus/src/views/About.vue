<template>
  <el-card title="About">
    <div class="about-form">
      <el-input v-model="keyword" placeholder="输入关键字" />
      <!-- teleported=false：Select 下拉不挂 body，挂到根容器内部 -->
      <el-select v-model="city" :teleported="false" placeholder="选择城市">
        <el-option v-for="o in options" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
    </div>
  </el-card>
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

<style>
.about-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 320px;
}
</style>
