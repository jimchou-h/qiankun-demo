<template>
  <!-- 父应用 antd4 ConfigProvider 单点：主题（dark algorithm）+ UI locale 跟随语言切换 -->
  <a-config-provider :locale="antdLocale" :theme="themeConfig">
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
          <a-menu-item key="/">{{ t('menu.home') }}</a-menu-item>
          <a-menu-item key="/sub-vue3-antd4/home">{{ t('menu.sub1') }}</a-menu-item>
          <a-menu-item key="/sub-vue2-antd1/home">{{ t('menu.sub2') }}</a-menu-item>
          <a-menu-item key="/sub-vue3-element-plus/home">{{ t('menu.sub3') }}</a-menu-item>
          <a-menu-item key="/sub-vue2-element-ui/home">{{ t('menu.sub4') }}</a-menu-item>
        </a-menu>

        <!-- 语言切换：本地存储 + qiankun 全局广播（子应用各自监听 lang） -->
        <a-select
          v-model:value="lang"
          class="main-lang"
          size="small"
          style="width: 96px"
          @change="onLangChange"
        >
          <a-select-option value="zh-CN">中文</a-select-option>
          <a-select-option value="en-US">EN</a-select-option>
        </a-select>

        <!-- 主题切换：父 + sub1 + sub3 跟随，sub2/sub4 维持 light（分档约束） -->
        <a-button size="small" class="main-theme" @click="toggleTheme">
          {{ theme === 'dark' ? '☾' : '☀' }}
        </a-button>

        <!-- 子应用上报的 msgNum 徽标（数据源：qiankun initGlobalState → props.setGlobalState） -->
        <a-badge class="main-msg-badge" :count="msgNum" :overflow-count="99">
          <span class="main-msg-label">{{ t('badge') }}</span>
        </a-badge>
      </a-layout-header>

      <a-layout-content class="main-content">
        <!-- 父应用自身路由出口（子应用路由渲染 SubAppContainer 状态组件） -->
        <router-view />

        <!-- qiankun 子应用统一挂载点：子应用由 activeRule 匹配后挂载到这里 -->
        <div id="sub-app-container" class="sub-app-container"></div>
      </a-layout-content>
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { theme as antdTheme } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'
import { useI18n } from 'vue-i18n'

import { useAppStateStore } from '@/stores/appState'
import { setGlobalState } from '@/qiankun/register'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

// msgNum 由 register.ts 的 onGlobalStateChange 写入 store，这里只读
const { msgNum } = storeToRefs(useAppStateStore())

const theme = ref<'light' | 'dark'>(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light')
const lang = ref(localStorage.getItem('lang') ?? 'zh-CN')

// 主题分档：父应用 antd4 dark algorithm；sub1/sub3 通过 qiankun 广播响应
const themeConfig = computed(() =>
  theme.value === 'dark' ? { algorithm: antdTheme.darkAlgorithm } : {}
)
const antdLocale = computed(() => (lang.value === 'en-US' ? enUS : zhCN))

// 菜单 key 指向子应用首页（/sub-xxx/home），但子应用内部切到 /about 时父路由会变成
// /sub-xxx/about，全等比较会匹配不到任何 key → 高亮消失。这里按 base 前缀归一到一级菜单。
const MENU_KEYS = [
  '/sub-vue3-antd4/home',
  '/sub-vue2-antd1/home',
  '/sub-vue3-element-plus/home',
  '/sub-vue2-element-ui/home'
]

const selectedKeys = computed(() => {
  const path = route.path
  if (path === '/') return ['/']
  const hit = MENU_KEYS.find((key) => path.startsWith(`${key.slice(0, key.lastIndexOf('/'))}/`))
  return [hit ?? path]
})

function onMenuClick({ key }: { key: string | number }) {
  router.push(String(key))
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  setGlobalState({ theme: theme.value })
}

function onLangChange(value: string) {
  locale.value = value
  localStorage.setItem('lang', value)
  setGlobalState({ lang: value })
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.main-header {
  display: flex;
  align-items: center;
  gap: 12px;
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

<style>
/* 下传给 4 个子应用的根容器最小高度（各自 .sub-app-root 用 var() 读取）：
   视口 - 顶部 header(64) - content 上下 padding(16×2) = 100vh - 96px。
   子应用独立运行（无父应用）时变量不存在，回退 100vh。
   注意不能写在 scoped 块里：scoped 会把 :root 编译成 :root[data-v-xxx]，永远不匹配。 */
:root {
  --qk-subapp-min-height: calc(100vh - 96px);
  /* 子应用整页底色：light 白 / dark 深色（sub2/sub4 主题分档维持 light，在各自根容器内覆盖） */
  --qk-subapp-bg: #fff;
}

html.dark {
  --qk-subapp-bg: #141414;
}
</style>
