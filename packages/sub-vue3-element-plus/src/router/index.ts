import { createRouter, type Router } from 'vue-router'
import { createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'

/**
 * 创建子应用路由
 * @param base 路由 base：独立运行时为 '/'；qiankun 集成模式由父应用 props 注入
 *             （如 '/qiankun-demo/microapp/sub-vue3-element-plus/'）
 */
export function createAppRouter(base = '/'): Router {
  return createRouter({
    history: createWebHistory(base),
    routes: [
      { path: '/', redirect: '/home' },
      { path: '/home', name: 'home', component: Home },
      { path: '/about', name: 'about', component: About }
    ]
  })
}
