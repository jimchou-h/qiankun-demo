import Vue from 'vue'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import App from './App.vue'
import { createBaseRouter } from './router'
import { createAppI18n } from './locales'
import { Button, Card, Dialog, Drawer, Input, Select, Option } from 'element-ui'
// 显式引入主题样式：babel-plugin-import 的 styleLibraryName 在本工程未实际注入 CSS，
// 导致 .el-button 等基础样式缺失（按钮回落为浏览器默认灰样式）
import 'element-ui/lib/theme-chalk/index.css'
import { setupElementUI } from './utils/setupElementUI'
import { bindGlobalActions, cacheGlobalState, unbindGlobalActions } from './qiankun/bridge'
import { switchElementUILocale } from './store'
import { MOUNT_START_MARK, markFCP, markMount } from './utils/perf'

// Vue2 运行时由父应用全局共享（window.Vue2），sub2/sub4 共用同一个 Vue.prototype；
// 重复安装 vue-router 的报错由父应用对 Vue.use 打的补丁统一兜住
// （见父应用 src/qiankun/vue2UseGuard.ts），这里直接 use 即可。
Vue.use(VueRouter)
Vue.use(VueI18n)
;[Button, Card, Dialog, Drawer, Input, Select, Option].forEach((c) => Vue.use(c))
setupElementUI(Vue) // 挂载 $message/$msgbox/$notify 到根容器 + Vue.prototype

let instance = null
// 当前语言：props.lang 是父应用注册时的快照，真实初值以全局状态回调为准
let currentLang = 'zh-CN'
const cleanupList = []

function runCleanup() {
  for (let i = cleanupList.length - 1; i >= 0; i--) cleanupList[i]()
  cleanupList.length = 0
}

function render(props = {}) {
  const { container, base = '/' } = props
  const mountTarget = container ? container.querySelector('#app') : '#app'
  const router = createBaseRouter(base)
  // 用 currentLang 而非 props.lang：props 是父应用注册时的快照，
  // 运行期切换过语言的话它是旧值，真实初值由下面的全局状态回调给出
  const i18n = createAppI18n(currentLang)
  instance = new Vue({ router, i18n, render: (h) => h(App) }).$mount(mountTarget)
  markMount()
  markFCP()
  const timer = setInterval(() => {}, 1000)
  const controller = new AbortController()
  cleanupList.push(() => { clearInterval(timer); console.log('[sub-vue2-element-ui] cleanup: clearInterval') })
  cleanupList.push(() => { controller.abort(); console.log('[sub-vue2-element-ui] cleanup: abort axios') })
}

if (window.__POWERED_BY_QIANKUN__) {
  window.__webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}

export async function bootstrap() {}
export async function mount(props) {
  performance.mark(MOUNT_START_MARK)
  console.log('[sub-vue2-element-ui] mount props keys:', Object.keys(props).join(','))
  bindGlobalActions(typeof props.setGlobalState === 'function' ? { setGlobalState: props.setGlobalState } : null)
  // qiankun 的 fireImmediately 传的是 callback(cloneState, cloneState)，
  // prev 与 state 是同一对象，用 prev 判等会让首帧永远跳过 → 改为与本地当前语言比较
  currentLang = props.lang || 'zh-CN'
  props.onGlobalStateChange?.((state) => {
    cacheGlobalState(state)
    if (state.lang && state.lang !== currentLang) {
      currentLang = state.lang
      if (instance) instance.$i18n.locale = currentLang
      switchElementUILocale(currentLang) // 见 store.js
    }
  }, true)
  render(props)
}
export async function unmount() {
  console.log('[sub-vue2-element-ui] unmount')
  unbindGlobalActions()
  runCleanup()
  if (instance) { instance.$destroy(); instance = null }
}

if (!window.__POWERED_BY_QIANKUN__) {
  performance.mark(MOUNT_START_MARK)
  console.log('[sub-vue2-element-ui] standalone 模式启动')
  render({})
}
