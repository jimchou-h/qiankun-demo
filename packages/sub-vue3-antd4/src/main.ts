import { createApp, type App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { renderWithQiankun, qiankunWindow, type QiankunProps } from 'vite-plugin-qiankun/dist/helper'

import App from './App.vue'
import { createAppRouter } from './router'
import { createAppI18n } from './locales'

let app: VueApp<Element> | null = null

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
}

// qiankun 生命周期（由 vite-plugin-qiankun 挂到 window，供 qiankun 调用）
renderWithQiankun({
  bootstrap() {
    console.log('[sub-vue3-antd4] bootstrap')
  },
  mount(props: QiankunProps) {
    console.log('[sub-vue3-antd4] mount', props)
    render(props)
  },
  unmount() {
    console.log('[sub-vue3-antd4] unmount')
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
