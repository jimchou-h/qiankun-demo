import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ParentHome from '@/views/ParentHome.vue'
import SubAppContainer from '@/components/SubAppContainer.vue'

// 父应用路由
// - history 模式，base 与 vite base / prod 部署路径一致：/qiankun-demo/
// - 子应用路由统一由 SubAppContainer 占位（含 loading/failed 状态），真实内容由 qiankun 渲染到 #sub-app-container
const router = createRouter({
  history: createWebHistory('/qiankun-demo/'),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'parent-home',
          component: ParentHome
        },
        // 4 个子应用路由占位：qiankun 的 activeRule 命中后负责真正的渲染
        {
          path: 'sub-vue3-antd4/:pathMatch(.*)*',
          name: 'sub-vue3-antd4',
          component: SubAppContainer
        },
        {
          path: 'sub-vue2-antd1/:pathMatch(.*)*',
          name: 'sub-vue2-antd1',
          component: SubAppContainer
        },
        {
          path: 'sub-vue3-element-plus/:pathMatch(.*)*',
          name: 'sub-vue3-element-plus',
          component: SubAppContainer
        },
        {
          path: 'sub-vue2-element-ui/:pathMatch(.*)*',
          name: 'sub-vue2-element-ui',
          component: SubAppContainer
        }
      ]
    }
  ]
})

export default router
