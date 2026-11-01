<template>
  <div
    data-app="sub-vue2-element-ui"
    class="sub-app-root"
    style="position: relative; z-index: 5000"
  >
    <nav class="sub-app-nav">
      <router-link to="/home">Home</router-link>
      <router-link to="/about">About</router-link>
    </nav>
    <main class="sub-main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'SubVue2ElementUiApp'
}
</script>

<style>
/* 根元素自身带 data-app，PostCSS 前缀后的后代选择器（[data-app] .sub-app-root）匹配不到自身；
   故根容器规则写成 属性+类 复合选择器（含 APP_SELECTOR 时前缀插件会跳过，保持原样） */
[data-app="sub-vue2-element-ui"].sub-app-root {
  padding: 16px;
  /* 撑满父应用内容区剩余高度（变量由父应用在 :root 定义）；独立运行回退 100vh */
  min-height: var(--qk-subapp-min-height, 100vh);
  box-sizing: border-box;
  /* 主题分档：sub2/sub4 维持 light，不跟随父应用 dark 变量 */
  --qk-subapp-bg: #fff;
  background: var(--qk-subapp-bg);
}

.sub-app-nav {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
</style>
