import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { register } from './qiankun/register'

// 父应用入口
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

app.mount('#app')

// qiankun 注册必须在挂载之后：#sub-app-container 由 MainLayout 渲染
register()
