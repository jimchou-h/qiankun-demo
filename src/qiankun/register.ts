import { addGlobalUncaughtErrorHandler, initGlobalState, registerMicroApps, start } from 'qiankun'

import { microApps } from './index'
import { useAppStateStore } from '@/stores/appState'

/** 全局 state 初值：父应用是唯一初始化方，子应用通过 props 读写同一份 */
const INITIAL_GLOBAL_STATE = {
  msgNum: 0,
  theme: 'light',
  lang: 'zh-CN',
  logoutSignal: false
}

/**
 * qiankun 的 `addGlobalUncaughtErrorHandler` 即 window 的 `error` + `unhandledrejection`
 * 监听器（见 `qiankun/es/errorHandler.js`），故回调实参可能是 ErrorEvent（运行时异常）、
 * PromiseRejectionEvent（子应用加载 promise 被拒）或字符串。统一结构化后交给 console，
 * 便于后续接错误上报（10s 超时 / 无限重试在后续 change 补）。
 */
function describeUncaughtError(event: Event | string): Record<string, unknown> {
  if (event instanceof ErrorEvent) {
    return {
      kind: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }
  }
  if (event instanceof PromiseRejectionEvent) {
    return { kind: 'unhandledrejection', reason: event.reason }
  }
  return { kind: typeof event, event }
}

/**
 * 注册子应用并启动 qiankun。
 *
 * MUST 在父应用 `app.mount('#app')` 之后调用：`#sub-app-container` 由
 * MainLayout 渲染，父应用未挂载时容器还不存在。
 */
export function register(): void {
  registerMicroApps(microApps, {
    beforeLoad: async (app) => {
      console.log('[qiankun] beforeLoad', app.name)
    },
    beforeMount: async (app) => {
      console.log('[qiankun] beforeMount', app.name)
    },
    afterMount: async (app) => {
      console.log('[qiankun] afterMount', app.name)
    },
    afterUnmount: async (app) => {
      console.log('[qiankun] afterUnmount', app.name)
    }
  })

  // 全局状态：父应用初始化 → 子应用 props.setGlobalState 上报 → 父应用此处回调写入 Pinia
  // （父子不共享 Pinia，这里只做单向镜像；qiankun 会把 actions 合进各子应用的 mount props）
  const actions = initGlobalState(INITIAL_GLOBAL_STATE)
  const appState = useAppStateStore()
  actions.onGlobalStateChange((state) => {
    appState.setMsgNum(Number(state.msgNum ?? 0))
  }, true)

  // CSS 隔离全关（第 1/2/3 层由子应用 PostCSS 前缀 + antd namespace + z-index 基数承担）；
  // JS 沙箱开启，隔离全局变量 / 定时器 / 事件监听
  start({ sandbox: true, prefetch: false, singular: true })

  // 简版全局错误兜底：子应用加载失败不中断父应用主流程（超时/重试在后续 change 补齐）
  addGlobalUncaughtErrorHandler((event) => {
    console.error('[qiankun 全局错误]', describeUncaughtError(event))
  })

  if (import.meta.env.DEV) {
    // dev 调试桥：控制台手动广播全局状态，如 __qiankunActions.setGlobalState({ lang: 'en-US' })
    ;(window as unknown as Record<string, unknown>).__qiankunActions = actions
  }
}
