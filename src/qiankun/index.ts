import type { RegistrableApp } from 'qiankun'

import customAxios from '@/server/customAxios'

/**
 * 子应用路由前缀 = 父应用 base + 子应用名。
 *
 * 注意：single-spa 用**完整** `location.pathname` 匹配 activeRule
 * （`href.replace(origin, '').replace(search, '')`），因此这里 MUST 带上
 * 父应用 base `/qiankun-demo`，否则 dev URL
 * `/qiankun-demo/sub-vue3-antd4/home` 永远无法命中。
 */
const SUB_APP_BASE = '/qiankun-demo/sub-vue3-antd4'

/** 子应用 entry（资源路径）：dev 直连子应用 dev server（5801），prod 走同源部署路径 */
const SUB_APP_ENTRY = import.meta.env.DEV
  ? 'http://localhost:5801'
  : '/qiankun-demo/microapp/sub-vue3-antd4/'

/** 父→子注入的 API 基址 */
const API_BASE_URL = '/api'

export const microApps: RegistrableApp<Record<string, unknown>>[] = [
  {
    name: 'sub-vue3-antd4',
    entry: SUB_APP_ENTRY,
    container: '#sub-app-container',
    activeRule: SUB_APP_BASE,
    props: {
      // base 是**路由前缀**（与 activeRule 同源），不是 entry 的资源路径
      base: SUB_APP_BASE,
      // 共享 axios 实例：子应用复用父应用的 baseURL 与拦截器
      axios: customAxios,
      userInfo: { id: 1, name: 'demo' },
      tenant: { id: 1 },
      permission: ['home:view'],
      BASE_URL: API_BASE_URL,
      theme: 'light',
      lang: 'zh-CN'
    }
  }
]
