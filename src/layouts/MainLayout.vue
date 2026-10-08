<template>
  <a-layout class="main-layout">
    <a-layout-header class="main-header">
      <div class="main-logo">qiankun-demo</div>
      <!-- 导航菜单写死，不动态拉取（见 REQUIREMENTS 第 14 条） -->
      <a-menu
        class="main-menu"
        mode="horizontal"
        theme="dark"
        :selected-keys="selectedKeys"
        @click="onMenuClick"
      >
        <a-menu-item key="/">父应用首页</a-menu-item>
        <a-menu-item key="/sub-vue3-antd4/home">sub-vue3-antd4</a-menu-item>
      </a-menu>

      <!-- 子应用上报的 msgNum 徽标（数据源：qiankun initGlobalState → props.setGlobalState） -->
      <a-badge class="main-msg-badge" :count="msgNum" :overflow-count="99">
        <span class="main-msg-label">子应用消息</span>
      </a-badge>
    </a-layout-header>

    <a-layout-content class="main-content">
      <!-- 父应用自身路由出口（子应用路由渲染空占位组件） -->
      <router-view />

      <!-- qiankun 子应用统一挂载点：子应用由 activeRule 匹配后挂载到这里 -->
      <div id="sub-app-container" class="sub-app-container"></div>
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useAppStateStore } from '@/stores/appState'

const route = useRoute()
const router = useRouter()

// msgNum 由 register.ts 的 onGlobalStateChange 写入 store，这里只读
const { msgNum } = storeToRefs(useAppStateStore())

// 菜单选中项跟随当前路径
const selectedKeys = computed(() => [route.path])

function onMenuClick({ key }: { key: string | number }) {
  router.push(String(key))
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.main-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.main-logo {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.main-menu {
  flex: 1;
  min-width: 0;
}

.main-msg-label {
  color: #fff;
  white-space: nowrap;
}

.main-content {
  padding: 16px;
}

.sub-app-container {
  min-height: 400px;
}
</style>
