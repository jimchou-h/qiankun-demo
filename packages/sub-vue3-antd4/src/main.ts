import { createApp, type App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import {
  App as AntdApp,
  Button,
  Card,
  ConfigProvider,
  Drawer,
  Input,
  Modal,
  Select,
  Space
} from 'ant-design-vue'
import { renderWithQiankun, qiankunWindow, type QiankunProps } from 'vite-plugin-qiankun/dist/helper'

import App from './App.vue'
// 弹层样式覆盖（非 scoped、带 data-app 前缀），见文件内说明
import './styles/popup-overrides.css'
import { createAppRouter } from './router'
import { createAppI18n, type AppI18n } from './locales'
import { applyLang, applyTheme, lang as uiLang, theme as uiTheme, type ThemeName } from './theme'
import { bindGlobalActions, cacheGlobalState, unbindGlobalActions } from './qiankun/bridge'
import { MOUNT_START_MARK, markFCP, markMount } from './utils/perf'

/**
 * antd4 按需注册（REQUIREMENTS 8.5）：逐个 use 只打包用到的组件，
 * 避免 `app.use(Antd)` 全量引入（产物 1.5MB+）。
 * 新增组件时在此登记，否则模板中的 `<a-xxx>` 会解析失败。
 */
const antdComponents = [AntdApp, Button, Card, ConfigProvider, Drawer, Input, Modal, Select, Space]

let app: VueApp<Element> | null = null
let i18n: AppI18n | null = null

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

  // 用响应式 lang 而非 props.lang：props 是注册时快照，父应用后续切换语言不会同步进来
  i18n = createAppI18n(uiLang.value)

  app = createApp(App)
  app.use(createPinia())
  app.use(createAppRouter(base ?? '/'))
  app.use(i18n)
  antdComponents.forEach((component) => app!.use(component))
  app.mount(mountTarget as Element | string)

  // mount 完成 + 首帧渲染后打点（骨架：仅 console）
  markMount()
  markFCP()

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
    // mount 起始打点，与 render() 末尾的 markMount 配对
    performance.mark(MOUNT_START_MARK)

    console.log('[sub-vue3-antd4] mount props keys:', Object.keys(props).join(','))

    // 主题/语言初值：qiankun 集成模式取父应用 props，独立模式取 localStorage。
    // props 是父应用注册时的快照，父应用运行期切换过主题/语言的话这里的值已经过期，
    // 真实初值以紧接着的 onGlobalStateChange(fireImmediately) 回调为准。
    applyTheme((props.theme as ThemeName) ?? 'light')
    applyLang((props.lang as string) ?? 'zh-CN')

    // 子→父/子→子：登记 qiankun 全局状态操作，供组件内上报（Home.vue 的 report to parent）
    bindGlobalActions(
      typeof props.setGlobalState === 'function' ? { setGlobalState: props.setGlobalState } : null
    )

    // 父→子广播：监听全局 state 变化（lang 驱动 i18n/UI locale，theme 驱动 antd4 dark algorithm）
    // 注意 qiankun 的 fireImmediately 传的是 callback(cloneState, cloneState)，
    // prev 与 state 是同一对象，用 prev 判等会让首帧永远跳过 → 改为与本地当前值比较
    props.onGlobalStateChange?.(
      (state: Record<string, unknown>) => {
        cacheGlobalState(state)
        if (state.lang && state.lang !== uiLang.value) {
          const nextLang = String(state.lang)
          applyLang(nextLang)
          // 可选链不能作赋值目标（esbuild 严格语法），先判空再赋值
          if (i18n) i18n.global.locale.value = nextLang
        }
        if (state.theme && state.theme !== uiTheme.value) {
          applyTheme(state.theme as ThemeName)
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
  performance.mark(MOUNT_START_MARK)
  console.log('[sub-vue3-antd4] standalone 模式启动')
  applyTheme((localStorage.getItem('theme') as ThemeName) ?? 'light')
  applyLang(localStorage.getItem('lang') ?? 'zh-CN')
  render({})
}
