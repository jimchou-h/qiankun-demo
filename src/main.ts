import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'

// 父应用入口
// 注意：qiankun 的 registerMicroApps + start 在 ticket 05 接入，此处先保证父应用骨架可独立运行
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

app.mount('#app')
