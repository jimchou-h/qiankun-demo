import { createApp, type App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { renderWithQiankun, qiankunWindow, type QiankunProps } from 'vite-plugin-qiankun/dist/helper'

import App from './App.vue'
import { createAppRouter } from './router'
import { createAppI18n } from './locales'
import { bindGlobalActions, cacheGlobalState, unbindGlobalActions } from './qiankun/bridge'

let app: VueApp<Element> | null = null

/**
 * 资源清理登记表：登记第三方库实例（ECharts / 视频 / 地图 / BPMN.js）、
 * WebSocket、Web Worker、未完成 axios 请求等清理函数。
 * 本轮仅登记占位清理函数，真实资源在后续 change 中逐步补充。
 */
const cleanupList: Array<() => void> = []

/** unmount 时反向遍历执行清理函数（后登记的先清理） */
function runCleanup(): void {
  for (let i = cleanupList.length - 1; i >= 0; i--) {
    cleanupList[i]()
  }
  cleanupList.length = 0
}

/**
 * 渲染子应用
 * @param props qiankun 注入的 props；独立运行时为空对象
 *  - container：qiankun 提供的容器，子应用挂到 container 内的 #app
 *  - base：路由 base（qiankun 集成模式由父应用注入；独立运行 fallback '/'）
 */
function render(props: QiankunProps = {}) {
  const { container, base } = props
  const mountTarget = container ? container.querySelector('#app') : '#app'

  app = createApp(App)
  app.use(createPinia())
  app.use(createAppRouter(base ?? '/'))
  app.use(createAppI18n())
  app.use(Antd)
  app.mount(mountTarget as Element | string)

  // 占位清理函数：验证 cleanupList 反向遍历在 unmount 时被调用
  cleanupList.push(() => console.log('cleanup demo'))

  // 验证 qiankun JS 沙箱桥接：全局变量 MUST 经 qiankunWindow（= window.proxy）写入沙箱，
  // 而非裸 window。dev 模式下 vite-plugin-qiankun 用 ESM 动态 import() 加载入口，
  // 模块代码里的裸 window 即真实 window、不经代理沙箱，故此处必须走 helper 桥接。
  ;(qiankunWindow as unknown as Record<string, unknown>).__test__ = 1
}

// qiankun 生命周期（由 vite-plugin-qiankun 挂到 window，供 qiankun 调用）
renderWithQiankun({
  bootstrap() {
    console.log('[sub-vue3-antd4] bootstrap')
  },
  mount(props: QiankunProps) {
    console.log('[sub-vue3-antd4] mount props keys:', Object.keys(props).join(','))

    // 子→父/子→子：登记 qiankun 全局状态操作，供组件内上报（Home.vue 的 report to parent）
    bindGlobalActions(
      typeof props.setGlobalState === 'function' ? { setGlobalState: props.setGlobalState } : null
    )

    // 父→子广播：监听全局 state 变化；本 change 只验证 lang 切换事件（fireImmediately 拿初值）
    props.onGlobalStateChange?.(
      (state: Record<string, unknown>, prev: Record<string, unknown>) => {
        cacheGlobalState(state)
        if (state.lang !== prev.lang) {
          console.log('[sub] lang changed:', state.lang)
        }
      },
      true
    )

    render(props)
  },
  unmount() {
    console.log('[sub-vue3-antd4] unmount')
    unbindGlobalActions()
    // 先释放外部资源（定时器 / 请求 / 实例），再销毁组件树
    runCleanup()
    app?.unmount()
    app = null
  },
  update() {
    // 本 change 不使用 qiankun 的 update 生命周期
  }
})

// 独立访问：非 qiankun 环境直接启动
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  console.log('[sub-vue3-antd4] standalone 模式启动')
  render({})
}
