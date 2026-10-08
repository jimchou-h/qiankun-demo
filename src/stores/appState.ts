import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 父应用全局状态 store。
 *
 * 数据源是 qiankun `initGlobalState` 的全局 state（见 src/qiankun/register.ts）：
 * 子应用通过 props.setGlobalState 上报 → 父应用 onGlobalStateChange 回调写入这里 → UI 响应。
 * 父子之间不共享 Pinia 实例，此处只做「单向镜像」。
 */
export const useAppStateStore = defineStore('appState', () => {
  const msgNum = ref(0)

  function setMsgNum(value: number) {
    msgNum.value = value
  }

  return { msgNum, setMsgNum }
})
