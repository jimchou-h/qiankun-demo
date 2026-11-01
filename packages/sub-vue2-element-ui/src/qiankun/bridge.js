/**
 * qiankun 全局状态桥接（bridge.ts 的 JS 版）。
 *
 * 子应用在 `mount(props)` 时登记 qiankun 注入的 setGlobalState，供组件内上报状态
 * （如 Home.vue 的 report to parent 按钮）；独立运行时没有父应用，上报为 no-op。
 * unmount 时 MUST 注销，避免持有已销毁沙箱的引用。
 */

let actions = null
let latestState = {}

/** mount(props) 时登记；独立运行模式传 null */
export function bindGlobalActions(next) {
  actions = next
}

/** unmount 时注销 */
export function unbindGlobalActions() {
  actions = null
  latestState = {}
}

/** 缓存最近一次全局 state，供上报时基于旧值自增 */
export function cacheGlobalState(state) {
  latestState = state
}

/** 上报消息数（子→父）：在子应用侧自增，父应用 onGlobalStateChange 收到后更新徽标 */
export function reportMsgNum() {
  if (actions) actions.setGlobalState({ msgNum: Number(latestState.msgNum ?? 0) + 1 })
}
