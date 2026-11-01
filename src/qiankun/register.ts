import { addGlobalUncaughtErrorHandler, initGlobalState, registerMicroApps, start } from 'qiankun'

import { microApps } from './index'
import { patchVue2UseGuard } from './vue2UseGuard'
import { useAppStateStore } from '@/stores/appState'
import { describeUncaughtError } from '@/utils/errorHandler'
import { markNameOf, reportPerf } from '@/utils/perf'

const storedTheme = (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
const storedLang = localStorage.getItem('lang') ?? 'zh-CN'

/** 全局 state 初值：父应用是唯一初始化方，子应用通过 props 读写同一份 */
const INITIAL_GLOBAL_STATE = {
  msgNum: 0,
  theme: storedTheme,
  lang: storedLang,
  logoutSignal: false
}

// 主题初值落地到 <html>，供父/子业务 CSS 的 .dark 选择器使用
if (storedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

/** dev 调试桥 + MainLayout 主题/语言切换统一出口 */
let globalActions: { setGlobalState: (state: Record<string, unknown>) => void } | null = null

/** 父应用侧广播全局状态（theme/lang/msgNum...），qiankun 会自动合入各子应用 mount props */
export function setGlobalState(state: Record<string, unknown>): void {
  globalActions?.setGlobalState(state)
}

/**
 * 注册子应用并启动 qiankun。
 *
 * MUST 在父应用 `app.mount('#app')` 之后调用：`#sub-app-container` 由
 * MainLayout 渲染，父应用未挂载时容器还不存在。
 */
export function register(): void {
  const appState = useAppStateStore()

  // 子应用脚本执行前先给共用 Vue2 的 Vue.use 打补丁（sub2/sub4 共用 window.Vue2 的 Vue.prototype）
  patchVue2UseGuard()

  registerMicroApps(microApps, {
    beforeLoad: async (app) => {
      console.log('[qiankun] beforeLoad', app.name)
      // Vue2 可能晚于本函数首次调用才就绪（异步 UMD），每次加载前补一次，确保早于子应用脚本
      patchVue2UseGuard()
      // 错误处理状态机：loading
      appState.setStatus(app.name, 'loading')
      // 性能：子应用加载起始 mark（afterMount 处 measure）
      performance.mark(markNameOf(app.name))
    },
    beforeMount: async () => {
      // 本 change 不使用
    },
    afterMount: async (app) => {
      console.log('[qiankun] afterMount', app.name)
      // 错误处理状态机：ok
      appState.setStatus(app.name, 'ok')
      // 性能：sub_load_<name>
      try {
        const measure = performance.measure(`sub_load_${app.name}`, markNameOf(app.name))
        reportPerf({ [`sub_load_${app.name}`]: Math.round(measure.duration) })
      } catch {
        // mark 缺失（如子应用加载后立即重渲染）时静默跳过
      }
    },
    afterUnmount: async (app) => {
      console.log('[qiankun] afterUnmount', app.name)
      // unmount 不中断后续：qiankun 内部已捕获子应用 unmount 异常，此处仅日志 + 复位状态
      appState.setStatus(app.name, 'idle')
    }
  })

  // 全局状态：父应用初始化 → 子应用 props.setGlobalState 上报 → 父应用此处回调写入 Pinia
  // （父子不共享 Pinia，这里只做单向镜像；qiankun 会把 actions 合进各子应用的 mount props）
  const actions = initGlobalState(INITIAL_GLOBAL_STATE)
  globalActions = actions
  actions.onGlobalStateChange((state) => {
    appState.setMsgNum(Number(state.msgNum ?? 0))
  }, true)

  // CSS 隔离全关（第 1/2/3 层由子应用 PostCSS 前缀 + UI 库 namespace + z-index 基数承担）；
  // JS 沙箱开启，隔离全局变量 / 定时器 / 事件监听
  start({ sandbox: true, prefetch: false, singular: true })

  // 全局错误兜底：子应用加载失败 → 状态机 failed + 错误指标，父应用主流程不受影响
  addGlobalUncaughtErrorHandler((event) => {
    console.error('[qiankun 全局错误]', describeUncaughtError(event))
    const pathname = window.location.pathname
    const matched = microApps.find(
      (app) => typeof app.activeRule === 'string' && pathname.startsWith(app.activeRule)
    )
    if (matched) {
      appState.setStatus(matched.name, 'failed')
      reportPerf({ [`sub_error_${matched.name}`]: 1 })
    }
  })

  if (import.meta.env.DEV) {
    // dev 调试桥：控制台手动广播全局状态，如 __qiankunActions.setGlobalState({ lang: 'en-US' })
    ;(window as unknown as Record<string, unknown>).__qiankunActions = actions
  }
}
