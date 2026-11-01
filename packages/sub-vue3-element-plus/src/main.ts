import { createApp, type App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import type { I18n } from 'vue-i18n'
import {
  ElButton,
  ElCard,
  ElConfigProvider,
  ElDialog,
  ElDrawer,
  ElInput,
  ElOption,
  ElSelect
} from 'element-plus'
import { renderWithQiankun, qiankunWindow, type QiankunProps } from 'vite-plugin-qiankun/dist/helper'

// 必须先于 App 渲染加载：编译 ep namespace 的 theme-chalk 样式（含 base/icon/各组件）
import './styles/element.scss'
import App from './App.vue'
import { createAppRouter } from './router'
import { createAppI18n } from './locales'
import { bindGlobalActions, cacheGlobalState, unbindGlobalActions } from './qiankun/bridge'
import { MOUNT_START_MARK, markFCP, markMount } from './utils/perf'
import { applyTheme, theme as uiTheme } from './theme'

/**
 * element-plus 按需注册：逐个 use 只打包用到的组件。
 * 新增组件时在此登记，否则模板中的 `<el-xxx>` 会解析失败。
 * ElMessage / ElNotification 等函数式 API 不走 app.use，直接 import 使用。
 */
const elementComponents = [
  ElButton,
  ElCard,
  ElConfigProvider,
  ElDialog,
  ElDrawer,
  ElInput,
  ElOption,
  ElSelect
]

let app: VueApp<Element> | null = null

/** 模块级 i18n 实例：供 mount 生命周期里父应用 lang 广播切换 locale */
let i18n: I18n | null = null

/** 当前语言：props.lang 是父应用注册时的快照，真实初值以全局状态回调为准 */
let currentLang = 'zh-CN'

/**
 * 资源清理登记表：登记第三方库实例（ECharts / 视频 / 地图 / BPMN.js）、
 * WebSocket、Web Worker、未完成 axios 请求等清理函数。
 * 本轮登记：定时器 / AbortController（fetch）/ WebSocket。
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
 *  - lang：初始语言（独立运行 fallback 'zh-CN'）
 */
function render(props: QiankunProps = {}) {
  const { container, base } = props
  const mountTarget = container ? container.querySelector('#app') : '#app'

  i18n = createAppI18n(currentLang)
  app = createApp(App)
  app.use(createPinia())
  app.use(createAppRouter(base ?? '/'))
  app.use(i18n)
  elementComponents.forEach((component) => app!.use(component))
  app.mount(mountTarget as Element | string)

  // mount 完成 + 首帧渲染后打点（骨架：仅 console）
  markMount()
  markFCP()

  // 真实资源清理登记（unmount 时反向执行）：
  // 1. 定时器
  const timer = setInterval(() => {
    console.log('[sub-vue3-element-plus] heartbeat timer tick')
  }, 1000)
  cleanupList.push(() => clearInterval(timer))

  // 2. 未完成请求（AbortController）
  const controller = new AbortController()
  fetch('/api/noop', { signal: controller.signal }).catch(() => {
    /* 演示请求：失败/中断均被信号量捕获，无需处理 */
  })
  cleanupList.push(() => controller.abort())

  // 3. WebSocket（演示 close 清理；连不上的连接 close() 后即释放）
  const ws = new WebSocket('ws://127.0.0.1:1')
  cleanupList.push(() => ws.close())

  // 验证 qiankun JS 沙箱桥接：全局变量 MUST 经 qiankunWindow（= window.proxy）写入沙箱，
  // 而非裸 window。dev 模式下 vite-plugin-qiankun 用 ESM 动态 import() 加载入口，
  // 模块代码里的裸 window 即真实 window、不经代理沙箱，故此处必须走 helper 桥接。
  ;(qiankunWindow as unknown as Record<string, unknown>).__test__ = 1
}

// qiankun 生命周期（由 vite-plugin-qiankun 挂到 window，供 qiankun 调用）
renderWithQiankun({
  bootstrap() {
    console.log('[sub-vue3-element-plus] bootstrap')
  },
  mount(props: QiankunProps) {
    // mount 起始打点，与 render() 末尾的 markMount 配对
    performance.mark(MOUNT_START_MARK)

    console.log('[sub-vue3-element-plus] mount props keys:', Object.keys(props).join(','))

    // 子→父/子→子：登记 qiankun 全局状态操作，供组件内上报（Home.vue 的 report to parent）
    bindGlobalActions(
      typeof props.setGlobalState === 'function' ? { setGlobalState: props.setGlobalState } : null
    )

    // 初始主题：随父应用注入值（无则 light）；App.vue 根容器 :data-theme 同步。
    // 必须在注册广播之前执行——props 是注册时快照，运行期切换过主题的话它是旧值，
    // 若放在广播之后会把首帧刚拿到的真实主题又覆盖回去。
    applyTheme((props.theme as 'light' | 'dark') ?? 'light')

    // 父→子广播：监听全局 state 变化（fireImmediately=true 首帧取父应用当前值）。
    // 注意 qiankun 的 fireImmediately 传的是 callback(cloneState, cloneState)，
    // prev 与 state 是同一对象，用 prev 判等会让首帧永远跳过 → 改为与本地当前值比较。
    // 首帧回调发生在 render() 之前，故 lang 先落到模块级 currentLang，再交给 render 建 i18n。
    currentLang = (props.lang as string) ?? 'zh-CN'
    props.onGlobalStateChange?.(
      (state: Record<string, unknown>) => {
        cacheGlobalState(state)
        if (state.lang && state.lang !== currentLang) {
          currentLang = state.lang as string
          console.log('[sub-vue3-element-plus] lang changed:', currentLang)
          if (i18n) {
            i18n.global.locale.value = currentLang
          }
        }
        if (state.theme && state.theme !== uiTheme.value) {
          console.log('[sub-vue3-element-plus] theme changed:', state.theme)
          applyTheme(state.theme as 'light' | 'dark')
        }
      },
      true
    )

    render(props)
  },
  unmount() {
    console.log('[sub-vue3-element-plus] unmount')
    unbindGlobalActions()
    // 先释放外部资源（定时器 / 请求 / 实例），再销毁组件树
    runCleanup()
    app?.unmount()
    app = null
    i18n = null
  },
  update() {
    // 本 change 不使用 qiankun 的 update 生命周期
  }
})

// 独立访问：非 qiankun 环境直接启动
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  performance.mark(MOUNT_START_MARK)
  console.log('[sub-vue3-element-plus] standalone 模式启动')
  render({})
}
