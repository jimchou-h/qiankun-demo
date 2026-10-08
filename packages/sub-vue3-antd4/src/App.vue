<template>
  <!-- prefix-cls="a4-" 把 antd4 的 ant-* class 改为 a4-*（CSS 隔离第 2 层） -->
  <a-config-provider prefix-cls="a4-">
    <div class="sub-app-root">
      <nav class="sub-nav">
        <router-link to="/home">Home</router-link>
        <router-link to="/about">About</router-link>
      </nav>
      <main class="sub-main">
        <router-view />
      </main>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
// sub-vue3-antd4 根组件
</script>

<style>
.sub-app-root {
  padding: 12px;
}

.sub-nav {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}
</style>
