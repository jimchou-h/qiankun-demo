<template>
  <!--
    子应用路由占位组件：故意留空。
    子应用接入后，真实内容由 qiankun 挂载到 MainLayout 内的 #sub-app-container，
    此占位仅用于让父应用 router 有匹配的 route，避免出现 “No match found” 警告。
  -->
  <div class="sub-app-slot"></div>
</template>

<script setup lang="ts">
// 空占位组件
</script>

<style scoped>
.sub-app-slot {
  display: none;
}
</style>
