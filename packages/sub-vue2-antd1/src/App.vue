<template>
  <a-config-provider :locale="locale">
    <div data-app="sub-vue2-antd1" class="sub-app-root" style="position: relative; z-index: 3000">
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

<script>
import { antdLocale } from './store'

export default {
  name: 'App',
  computed: {
    locale() {
      return antdLocale.value
    }
  }
}
</script>

<style>
/* 根元素自身带 data-app，PostCSS 前缀后的后代选择器（[data-app] .sub-app-root）匹配不到自身；
   故根容器规则写成 属性+类 复合选择器（含 APP_SELECTOR 时前缀插件会跳过，保持原样） */
[data-app="sub-vue2-antd1"].sub-app-root {
  padding: 16px;
  /* 撑满父应用内容区剩余高度（变量由父应用在 :root 定义）；独立运行回退 100vh */
  min-height: var(--qk-subapp-min-height, 100vh);
  box-sizing: border-box;
  /* 主题分档：sub2/sub4 维持 light，不跟随父应用 dark 变量 */
  --qk-subapp-bg: #fff;
  background: var(--qk-subapp-bg);
}
.sub-nav {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.sub-nav a {
  color: #1890ff;
  text-decoration: none;
}
.sub-nav a.router-link-active {
  font-weight: 500;
}
</style>
