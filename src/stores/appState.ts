import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 子应用加载状态机：idle → loading → ok / failed
 * - beforeLoad → loading
 * - afterMount → ok
 * - addGlobalUncaughtErrorHandler 命中 / 10s 超时 → failed
 * - afterUnmount → idle
 */
export type SubAppStatus = 'idle' | 'loading' | 'ok' | 'failed'

/**
 * 父应用全局状态 store。
 *
 * 数据源是 qiankun `initGlobalState` 的全局 state（见 src/qiankun/register.ts）：
 * 子应用通过 props.setGlobalState 上报 → 父应用 onGlobalStateChange 回调写入这里 → UI 响应。
 * 父子之间不共享 Pinia 实例，此处只做「单向镜像」。
 */
export const useAppStateStore = defineStore('appState', () => {
  const msgNum = ref(0)

  /** 各子应用加载状态，key 为子应用 name（如 sub-vue2-antd1） */
  const statuses = ref<Record<string, SubAppStatus>>({})

  function setMsgNum(value: number) {
    msgNum.value = value
  }

  function setStatus(name: string, status: SubAppStatus) {
    statuses.value[name] = status
  }

  return { msgNum, statuses, setMsgNum, setStatus }
})
