<template>
  <!-- namespace="ep"：组件类名 ep-*、运行时内联 CSS 变量 --ep-*（与 element.scss 编译产物一致） -->
  <el-config-provider :namespace="'ep'">
    <!-- 根容器 data-app 作为 PostCSS 前缀锚点 + 弹层挂载目标；data-theme 驱动暗色变量覆盖 -->
    <div
      class="sub-app-root"
      :data-theme="theme"
      data-app="sub-vue3-element-plus"
      style="position: relative; z-index: 4000"
    >
      <nav class="sub-nav">
        <router-link to="/home">Home</router-link>
        <router-link to="/about">About</router-link>
      </nav>
      <main class="sub-main">
        <router-view />
      </main>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { theme } from './theme'

// 根容器暗色覆盖：--ep-* 变量切换（子应用仅 sub3 响应主题，见分档约束）
</script>

<style>
/* 根元素自身带 data-app，PostCSS 前缀后的后代选择器（[data-app] .sub-app-root）匹配不到自身；
   故根容器规则写成 属性+类 复合选择器（含 APP_SELECTOR 时前缀插件会跳过，保持原样） */
[data-app="sub-vue3-element-plus"].sub-app-root {
  padding: 12px;
  /* 撑满父应用内容区剩余高度（变量由父应用在 :root 定义）；独立运行回退 100vh */
  min-height: var(--qk-subapp-min-height, 100vh);
  box-sizing: border-box;
  background: var(--qk-subapp-bg, #fff);
}

.sub-nav {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

/* 暗色主题：覆盖 element-plus 核心变量（PostCSS 会跳过已含 data-app 的选择器，保持幂等） */
[data-app="sub-vue3-element-plus"][data-theme="dark"] {
  --ep-color-primary: #409eff;
  --ep-bg-color: #141414;
  --ep-bg-color-page: #0a0a0a;
  --ep-bg-color-overlay: #1d1e1f;
  --ep-text-color-primary: #e5eaf3;
  --ep-text-color-regular: #cfd3dc;
  --ep-border-color: #4c4d4f;
  --ep-border-color-light: #414243;
  --ep-fill-color-blank: #141414;
  --ep-fill-color-light: #1d1e1f;
}
</style>
