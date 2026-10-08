import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ParentHome from '@/views/ParentHome.vue'
import SubAppSlot from '@/components/SubAppSlot.vue'

// 父应用路由
// - history 模式，base 与 vite base / prod 部署路径一致：/qiankun-demo/
// - 子应用路由统一由 SubAppSlot 占位，真实内容由 qiankun 渲染到 #sub-app-container
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
        // 子应用路由占位：qiankun 的 activeRule 命中后负责真正的渲染
        {
          path: 'sub-vue3-antd4/:pathMatch(.*)*',
          name: 'sub-vue3-antd4',
          component: SubAppSlot
        }
      ]
    }
  ]
})

export default router
