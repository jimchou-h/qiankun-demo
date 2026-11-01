<template>
  <!--
    子应用路由占位 + 加载/失败状态组件：
    - loading：显示 loading 态（qiankun beforeLoad 触发后）
    - failed：显示 a-result fallback + 无限手动重试按钮
    - ok / idle：渲染空（真实内容由 qiankun 挂到 MainLayout 的 #sub-app-container）
    10s 超时：路由进入子应用后若 afterMount 未触发，置为 failed（见 utils/errorHandler.ts）
  -->
  <div
    class="sub-app-status"
    :class="{ 'has-status': status === 'loading' || status === 'failed' }"
  >
    <a-spin v-if="status === 'loading'" class="sub-status-loading" tip="子应用加载中..." />
    <a-result
      v-else-if="status === 'failed'"
      status="error"
      title="子应用加载失败"
      :sub-title="`${appName} 加载超时或出错，请确认子应用 dev 服务（5801-5804）已启动，或点击重试。`"
    >
      <template #extra>
        <a-button type="primary" @click="retry">重试</a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useAppStateStore } from '@/stores/appState'
import { microApps } from '@/qiankun/index'
import { SUB_LOAD_TIMEOUT } from '@/utils/errorHandler'

const route = useRoute()
const router = useRouter()
const appState = useAppStateStore()
const { statuses } = storeToRefs(appState)

/** 当前路由命中的子应用名（microApps 的 activeRule 前缀匹配） */
const appName = computed(() => {
  const path = route.path
  return (
    microApps.find((app) => typeof app.activeRule === 'string' && path.startsWith(app.activeRule))
      ?.name ?? ''
  )
})

const status = computed(() =>
  appName.value ? (statuses.value[appName.value] ?? 'loading') : 'idle'
)

/** 10s 超时：进入子应用路由后若一直没到 ok，置 failed（无限手动重试由重试按钮承担） */
let timeoutId: number | undefined

function armTimeout() {
  clearTimeout(timeoutId)
  timeoutId = window.setTimeout(() => {
    if (appName.value && status.value === 'loading') {
      console.warn(`[qiankun] ${appName.value} 加载超时（${SUB_LOAD_TIMEOUT}ms），置为 failed`)
      appState.setStatus(appName.value, 'failed')
    }
  }, SUB_LOAD_TIMEOUT)
}

watch(
  () => route.path,
  () => {
    if (!appName.value) return
    if (status.value === 'idle') {
      appState.setStatus(appName.value, 'loading')
    }
    armTimeout()
  },
  { immediate: true }
)

watch(status, (next) => {
  if (next === 'ok' || next === 'failed') clearTimeout(timeoutId)
})

onBeforeUnmount(() => clearTimeout(timeoutId))

/**
 * 无限手动重试：先导航离开（qiankun 把该子应用置为 inactive / NOT_LOADED），
 * 再导航回来重新触发 activeRule 加载。load 失败的应用在 inactive 后会被 single-spa
 * 重置为 NOT_LOADED，下次导航重新拉取入口。
 */
function retry() {
  if (appName.value) {
    appState.setStatus(appName.value, 'loading')
  }
  const target = route.fullPath
  router
    .replace('/')
    .then(() => {
      window.setTimeout(() => router.replace(target), 50)
    })
    .catch(() => {})
}
</script>

<style scoped>
.sub-app-status {
  /* 仅在 loading / failed 时占位；ok / idle 时为 0 高度，
     否则 240px 占位会把下方 #sub-app-container 的子应用内容顶到页面中部 */
  display: none;
}

.sub-app-status.has-status {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sub-status-loading {
  padding: 48px 0;
}
</style>
