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

const route = useRoute()
const router = useRouter()

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

.main-content {
  padding: 16px;
}

.sub-app-container {
  min-height: 400px;
}
</style>
