<template>
  <!-- prefix-cls="a4-" 把 antd4 的 ant-* class 改为 a4-*（CSS 隔离第 2 层）
       get-popup-container 单点指定弹层挂载点，覆盖全部 10 个弹层组件（第 3 层防护） -->
  <a-config-provider prefix-cls="a4-" :get-popup-container="getAppContainer">
    <!-- a-app 提供 appContext，供 message / notification / Modal.confirm 函数式 API 使用 -->
    <a-app>
      <!-- 根容器 data-app 作为 PostCSS 前缀锚点 + 弹层挂载目标；
           z-index 2000 创建独立 stacking context（CSS 隔离第 3 层） -->
      <div
        class="sub-app-root"
        data-app="sub-vue3-antd4"
        style="position: relative; z-index: 2000"
      >
        <nav class="sub-nav">
          <router-link to="/home">Home</router-link>
          <router-link to="/about">About</router-link>
        </nav>
        <main class="sub-main">
          <router-view />
        </main>
      </div>
    </a-app>
  </a-config-provider>
</template>

<script setup lang="ts">
/**
 * 弹层挂载点：优先子应用根容器，元素不存在时 fallback document.body。
 * antd4 中 Modal / Drawer 自身 getContainer 未传时 fallback 到此值，
 * 弹层类组件（Tooltip / Popover / Dropdown / Select / DatePicker / Cascader /
 * TreeSelect / Popconfirm）经 useConfigInject 读取同一 context 值。
 */
function getAppContainer(): HTMLElement {
  return (
    (document.querySelector('[data-app="sub-vue3-antd4"]') as HTMLElement | null) ?? document.body
  )
}
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
