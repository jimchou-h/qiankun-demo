<template>
  <a-space direction="vertical" style="width: 100%">
    <a-card title="About">
      <a-space direction="vertical" style="width: 320px">
        <a-input v-model="keyword" placeholder="输入关键字" />
        <a-select
          v-model="city"
          style="width: 100%"
          placeholder="选择城市"
          :options="options"
          :get-popup-container="getContainer"
        />
      </a-space>
    </a-card>
  </a-space>
</template>

<script>
import { getContainer } from '../components/antd'

export default {
  name: 'About',
  data() {
    return {
      // 下拉弹层挂到子应用根容器（函数形式，调用时根容器一定已存在）
      getContainer,
      keyword: '',
      city: undefined,
      options: [
        { value: 'beijing', label: '北京' },
        { value: 'shanghai', label: '上海' },
        { value: 'shenzhen', label: '深圳' }
      ]
    }
  }
}
</script>
