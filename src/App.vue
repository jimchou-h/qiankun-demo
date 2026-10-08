<template>
  <!--
    父应用根容器：
    - data-app="root" 作为样式隔离锚点（父应用自己的 PostCSS 前缀目标）
    - z-index: 1000 作为块级层叠基数，与子应用（2000/3000/4000/5000）隔离 stacking context
  -->
  <div class="app-root" data-app="root">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 父应用根组件：仅负责承载根容器 + 路由出口
</script>

<style>
.app-root {
  position: relative;
  /* z-index 基数：父应用 1000（子应用 sub1=2000 / sub2=3000 / sub3=4000 / sub4=5000） */
  z-index: 1000;
  min-height: 100vh;
}
</style>
