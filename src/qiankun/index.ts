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
const PARENT_BASE = '/qiankun-demo'

/** 4 个子应用的路由前缀 + 端口（dev 直连各子应用 dev server，prod 走同源部署路径） */
const SUB_APPS = [
  { name: 'sub-vue3-antd4', port: 5801 },
  { name: 'sub-vue2-antd1', port: 5802 },
  { name: 'sub-vue3-element-plus', port: 5803 },
  { name: 'sub-vue2-element-ui', port: 5804 }
]

function baseOf(name: string): string {
  return `${PARENT_BASE}/${name}`
}

function entryOf(name: string, port: number): string {
  return import.meta.env.DEV ? `http://localhost:${port}` : `${PARENT_BASE}/microapp/${name}/`
}

/** 父→子注入的 API 基址 */
const API_BASE_URL = '/api'

/** 统一的 8 字段 props（AGENTS.md 通信约束）：base + 业务上下文 + 全局能力 */
function makeProps(name: string): Record<string, unknown> {
  return {
    // base 是**路由前缀**（与 activeRule 同源），不是 entry 的资源路径
    base: baseOf(name),
    // 共享 axios 实例：子应用复用父应用的 baseURL 与拦截器
    axios: customAxios,
    userInfo: { id: 1, name: 'demo' },
    tenant: { id: 1 },
    permission: ['home:view'],
    BASE_URL: API_BASE_URL,
    // props 是注册时的快照，运行期切换主题/语言不会同步进来；
    // 这里取与 INITIAL_GLOBAL_STATE 相同的来源（localStorage），保证首帧两处一致，
    // 运行期变更由子应用侧 onGlobalStateChange 的 fireImmediately 回调纠偏
    theme: (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
    lang: localStorage.getItem('lang') ?? 'zh-CN'
  }
}

export const microApps: RegistrableApp<Record<string, unknown>>[] = SUB_APPS.map(({ name, port }) => ({
  name,
  entry: entryOf(name, port),
  container: '#sub-app-container',
  activeRule: baseOf(name),
  props: makeProps(name)
}))
