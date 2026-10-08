<template>
  <a-card title="父应用首页" :bordered="false">
    <p>这是 qiankun 父应用（Vue3 + Ant Design Vue 4）。</p>
    <p>点击顶部导航的 <strong>sub-vue3-antd4</strong> 可加载对应子应用（子应用接入见 ticket 05）。</p>
    <a-alert
      type="info"
      show-icon
      message="当前仅完成项目骨架与父应用启动"
      description="子应用挂载容器 #sub-app-container 已就位，等待 qiankun 注册后接管。"
    />
  </a-card>
</template>

<script setup lang="ts">
// 父应用首页占位
</script>
