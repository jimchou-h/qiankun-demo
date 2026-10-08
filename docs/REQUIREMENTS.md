# qiankun 微前端项目需求文档

## 1. 项目概述

基于 qiankun 的微前端 demo 项目，包含 1 个父应用 + 4 个子应用。核心特点：**不使用 qiankun 内置的 CSS 隔离方案**（strictStyleIsolation / experimentalStyleIsolation 全关），通过子应用加前缀等方式自主解决 CSS 样式冲突、弹窗样式冲突等问题。

### 1.1 应用清单

| 应用名 | 路径 | 框架 | UI 库 | 构建 |
|---|---|---|---|---|
| 父应用 | 根目录 | Vue3 | Ant Design Vue 4 | Vite 4 |
| sub-vue3-antd4 | packages/sub-vue3-antd4 | Vue3 | Ant Design Vue 4 | Vite + vite-plugin-qiankun |
| sub-vue2-antd1 | packages/sub-vue2-antd1 | Vue2 | Ant Design Vue 1.7.5 | Vue CLI 5（Webpack）+ 手写生命周期 |
| sub-vue3-element-plus | packages/sub-vue3-element-plus | Vue3 | Element Plus | Vite + vite-plugin-qiankun |
| sub-vue2-element-ui | packages/sub-vue2-element-ui | Vue2 | Element UI 2.x | Vue CLI 5（Webpack）+ 手写生命周期 |

### 1.2 设计目标

1. **CSS 隔离**：不靠 qiankun 内置方案，自主用 PostCSS 构建时改写 + UI 库 namespace 双层防护
2. **JS 隔离**：用 qiankun sandbox（开 sandbox，关 CSS 隔离）
3. **弹窗隔离**：所有 portal 类组件 getContainer 改到子应用根容器
4. **独立访问**：每个子应用可独立 dev、独立 prod 部署访问（零配置 fallback）
5. **混合技术栈**：4 套 UI 库（antd4 / antd1 / element-plus / element-ui）共存无冲突

---

## 2. 项目结构

```
qiankun-demo/
├── package.json                  # 父应用 + workspace root
├── pnpm-workspace.yaml
├── vite.config.ts                # 父应用 Vite 配置
├── index.html                    # 父应用 HTML
├── src/                          # 父应用源码
│   ├── main.ts
│   ├── App.vue
│   ├── qiankun/
│   │   ├── index.ts              # 子应用列表配置
│   │   └── register.ts           # registerMicroApps + start
│   ├── layouts/
│   │   └── MainLayout.vue        # 导航菜单 + #sub-app-container
│   ├── components/
│   │   └── SubAppContainer.vue    # 子应用挂载容器（含 fallback UI）
│   ├── router/
│   │   └── index.ts              # 父路由表（含子应用路径占位）
│   ├── stores/                   # 父应用 pinia
│   ├── utils/
│   │   ├── perf.ts               # 性能监控
│   │   └── errorHandler.ts        # 全局错误处理
│   └── server/
│       └── customAxios.ts        # 父应用 axios 实例
├── packages/
│   ├── sub-vue3-antd4/           # sub1
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── postcss.config.js     # PostCSS 前缀配置
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.ts           # qiankun 生命周期
│   │       ├── App.vue           # 根 div 带 data-app 属性
│   │       ├── utils/
│   │       │   ├── setupAntd.ts  # 弹窗 getContainer 默认值
│   │       │   └── perf.ts       # 子应用性能打点
│   │       ├── locales/          # i18n 文件
│   │       └── ...
│   ├── sub-vue2-antd1/           # sub2
│   │   ├── package.json
│   │   ├── vue.config.js         # Vue CLI 配置 + 双 build
│   │   ├── postcss.config.js
│   │   ├── public/index.html
│   │   └── src/
│   │       ├── main.js           # 手写 bootstrap/mount/unmount
│   │       ├── App.vue
│   │       ├── components/
│   │       │   └── antd.js       # 弹窗 getContainer 默认值（仿参考项目）
│   │       └── ...
│   ├── sub-vue3-element-plus/    # sub3
│   └── sub-vue2-element-ui/      # sub4
├── docs/
│   └── REQUIREMENTS.md           # 本文档
└── pnpm-workspace.yaml
```

### 2.1 pnpm workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - '.'
  - 'packages/*'
```

### 2.2 版本统一约束

根 `package.json`：
```json
{
  "pnpm": {
    "overrides": {
      "vue@^3": "3.4.21",
      "vue@^2": "2.7.14",
      "vue-router@^4": "4.2.5",
      "vue-router@^3": "3.6.5"
    }
  }
}
```

### 2.3 聚合脚本

根 `package.json` scripts：
```json
{
  "scripts": {
    "dev": "vite",
    "dev:sub-vue3-antd4": "pnpm --filter sub-vue3-antd4 dev",
    "dev:sub-vue2-antd1": "pnpm --filter sub-vue2-antd1 dev",
    "dev:sub-vue3-element-plus": "pnpm --filter sub-vue3-element-plus dev",
    "dev:sub-vue2-element-ui": "pnpm --filter sub-vue2-element-ui dev",
    "dev:all": "npm-run-all2 --parallel dev dev:sub-vue3-antd4 dev:sub-vue2-antd1 dev:sub-vue3-element-plus dev:sub-vue2-element-ui",
    "build": "vite build",
    "build:all": "npm-run-all2 --parallel build build:sub-vue3-antd4 build:sub-vue2-antd1 build:sub-vue3-element-plus build:sub-vue2-element-ui",
    "build:sub-vue3-antd4": "pnpm --filter sub-vue3-antd4 build",
    "build:sub-vue2-antd1": "pnpm --filter sub-vue2-antd1 build",
    "build:sub-vue3-element-plus": "pnpm --filter sub-vue3-element-plus build",
    "build:sub-vue2-element-ui": "pnpm --filter sub-vue2-element-ui build",
    "install:all": "pnpm install"
  }
}
```

---

## 3. qiankun 配置

### 3.1 子应用列表

```ts
// src/qiankun/index.ts
const prodBase = '/qiankun-demo/microapp'
export const microApps = [
  {
    name: 'sub-vue3-antd4',
    entry: import.meta.env.PROD ? `${prodBase}/sub-vue3-antd4/` : 'http://localhost:5801',
    container: '#sub-app-container',
    activeRule: '/sub-vue3-antd4',
    props: { /* 公共 props */ }
  },
  {
    name: 'sub-vue2-antd1',
    entry: import.meta.env.PROD ? `${prodBase}/sub-vue2-antd1/` : 'http://localhost:5802',
    container: '#sub-app-container',
    activeRule: '/sub-vue2-antd1',
    props: { /* 公共 props */ }
  },
  {
    name: 'sub-vue3-element-plus',
    entry: import.meta.env.PROD ? `${prodBase}/sub-vue3-element-plus/` : 'http://localhost:5803',
    container: '#sub-app-container',
    activeRule: '/sub-vue3-element-plus',
    props: { /* 公共 props */ }
  },
  {
    name: 'sub-vue2-element-ui',
    entry: import.meta.env.PROD ? `${prodBase}/sub-vue2-element-ui/` : 'http://localhost:5804',
    container: '#sub-app-container',
    activeRule: '/sub-vue2-element-ui',
    props: { /* 公共 props */ }
  }
]
```

### 3.2 start 配置

```ts
// src/qiankun/register.ts
import { registerMicroApps, start, addGlobalUncaughtErrorHandler } from 'qiankun'
import { microApps } from './index'

registerMicroApps(microApps, {
  beforeLoad: [app => console.log('beforeLoad', app.name)],
  beforeMount: [app => console.log('beforeMount', app.name)],
  afterMount: [app => console.log('afterMount', app.name)],
  afterUnmount: [app => console.log('afterUnmount', app.name)]
})

start({
  sandbox: true,           // JS 沙箱开
  prefetch: false,         // 不预加载（5 个子应用规模不需要）
  singular: true           // 同时只激活一个子应用（默认值）
})

addGlobalUncaughtErrorHandler(event => {
  console.error('[qiankun 全局错误]', event)
  reportError(event)
})
```

### 3.3 关键约束

- **CSS 隔离全关**：不配 `strictStyleIsolation`、不配 `experimentalStyleIsolation`
- **JS 沙箱开**：`sandbox: true`，让 qiankun 自动隔离 window、document 事件、定时器等
- **加载方式**：用 `registerMicroApps + start`（不用手动 `loadMicroApp`）

---

## 4. CSS 隔离方案（核心）

### 4.1 三层防护

| 层 | 适用范围 | 方案 |
|---|---|---|
| 第 1 层：选择器隔离 | 4 个子应用 + 父应用 | PostCSS 构建时改写，给所有选择器加 `[data-app="sub-xxx"]` 前缀 |
| 第 2 层：class 前缀（namespace） | sub1 / sub3 | antd4 `prefixCls="a4"`（class 变 `a4-btn`/`a4-modal`）、element-plus `namespace="ep"` |
| 第 3 层：CSS 变量隔离 | 仅 sub3 | element-plus `namespace="ep"` 把 `--el-*` 改成 `--ep-*` |

### 4.2 子应用根 div

每个子应用 `App.vue` 根 div 必须写 `data-app` 属性：

```vue
<!-- sub1/src/App.vue -->
<template>
  <a-config-provider :prefix-cls="'a4'" :locale="antdLocale" :theme="themeConfig">
    <div class="sub-app-root" data-app="sub-vue3-antd4">
      <router-view />
    </div>
  </a-config-provider>
</template>
```

### 4.3 PostCSS 配置（每个子应用各自）

```js
// packages/sub-vue3-antd4/postcss.config.js
module.exports = {
  plugins: [
    require('postcss-prefix-selector')({
      prefix: '[data-app="sub-vue3-antd4"]',
      transform(prefix, selector) {
        const trimmed = selector.trim()
        // 跳过全局选择器（加前缀后匹配不上 :root/html/body/*）
        if (/^(html|body|:root|\*)/.test(trimmed)) return selector
        return `${prefix} ${selector}`
      }
    }),
    require('postcss-rename-keyframes')({
      prefix: 'sub-vue3-antd4-'
    })
  ]
}
```

**关键约束**：
- 不排除 `node_modules` 里的 antd/element 样式，要一起改写
- 子应用代码**不要写 `:root { --xxx }`**（会污染全局），改用子应用根 div 的 inline style 或 class

### 4.4 UI 库 namespace 配置

**sub1（Vue3 + antd4）**：
```vue
<a-config-provider :prefix-cls="'a4'" :theme="{ token: { colorPrimary: '#1677ff' } }">
```

> `prefixCls` 取 `a4` 而非 `a4-`：antd4 `getPrefixCls(suffix)` 返回 `` `${prefixCls}-${suffix}` ``（`es/config-provider/index.js`），传 `a4` 得到 `a4-btn`，传 `a4-` 会得到 `a4--btn`（双横线）。

**sub3（Vue3 + element-plus）**：
```vue
<el-config-provider :namespace="'ep'" :el-z-index="2000">
```

**sub2/sub4（Vue2 + 老库）**：不支持 namespace，靠第 1 层 PostCSS 覆盖

### 4.5 各 UI 库 CSS 变量情况

| 子应用 | UI 库 | 有无 CSS 变量 | 隔离方案 |
|---|---|---|---|
| sub1 | antd4 | 无（CSS-in-JS，无 `--ant-*`） | 靠 prefixCls + PostCSS 选择器前缀 |
| sub2 | antd1 | 无（Less 编译产物） | 靠 PostCSS 选择器前缀 |
| sub3 | element-plus | 有 `--el-*` | namespace="ep" 改成 `--ep-*`（源头隔离） |
| sub4 | element-ui 2.x | 无（Less/Sass 编译产物） | 靠 PostCSS 选择器前缀 |

---

## 5. 弹窗 + z-index 隔离

### 5.1 弹窗挂载目标

**所有 portal 类组件**（Modal/Dialog/Drawer/Tooltip/Popover/Dropdown/Select/DatePicker/MessageBox/Message/Notification 等）的 getContainer / append-to-body / getPopupContainer 必须改到子应用根 div。

### 5.2 各子应用配置

#### sub1（Vue3 + antd4）

```ts
// sub1/src/utils/setupAntd.ts
import { Modal, Drawer, message, notification, Dropdown, Popover, Popconfirm,
  Tooltip, Select, DatePicker, Cascader, TreeSelect } from 'ant-design-vue'

const getContainer = () =>
  document.querySelector('[data-app="sub-vue3-antd4"]') || document.body

;[Modal, Drawer].forEach(item => {
  if (item.props?.getContainer) item.props.getContainer.default = getContainer
})

;[Dropdown, Popover, Popconfirm, Tooltip, Select, DatePicker, Cascader, TreeSelect].forEach(item => {
  ;['getPopupContainer', 'getContainer'].forEach(key => {
    if (item.props && item.props[key]) item.props[key].default = getContainer
  })
})

message.config({ getContainer })
notification.config({ getContainer })
```

#### sub2（Vue2 + antd1）——仿参考项目 builder 的 antd.js

```js
// sub2/src/components/antd.js
import { Modal, Drawer, message, notification, Dropdown, Popconfirm, Popover,
  TreeSelect, Cascader, Select, Tooltip, DatePicker } from 'ant-design-vue'

const getContainer = () =>
  document.querySelector('[data-app="sub-vue2-antd1"]') || document.body

;[Modal, Drawer].forEach(item => {
  if (item.props?.getContainer) item.props.getContainer.default = getContainer
})

;[Dropdown, Popconfirm, Popover, TreeSelect, Cascader, Select, Tooltip, DatePicker].forEach(item => {
  ;['getPopupContainer', 'getContainer'].forEach(key => {
    if (item.props && item.props[key]) item.props[key].default = getContainer
  })
})

Vue.prototype.$message.config({ getContainer })
notification.config({ getContainer })
```

#### sub3（Vue3 + element-plus）

element-plus 没全局配置项，业务代码每个组件加 prop：

```vue
<!-- 业务代码 -->
<el-dialog :append-to-body="false" />
<el-drawer :append-to-body="false" />
<el-tooltip :append-to-body="false" />
<el-popover :teleported="false" />
<el-dropdown :teleported="false" />
<el-select :teleported="false" />
<el-date-picker :teleported="false" />
<el-cascader :teleported="false" />
```

Message / Notification / MessageBox（全局 API）：
```ts
import { ElMessage, ElNotification } from 'element-plus'
const target = () => document.querySelector('[data-app="sub-vue3-element-plus"]') || document.body
ElMessage.success({ message: 'xxx', appendTo: target() })
ElNotification({ appendTo: target() })
```

#### sub4（Vue2 + element-ui）

```vue
<!-- 业务代码 -->
<el-dialog :append-to-body="false" :modal-append-to-body="false" />
<el-drawer :append-to-body="false" />
<el-select :popper-append-to-body="false" />
<el-date-picker :append-to-body="false" />
<el-cascader :append-to-body="false" />
```

Message / Notification / MessageBox 全局方法包装：
```js
// sub4/src/utils/setupElementUI.js
const getContainer = () =>
  document.querySelector('[data-app="sub-vue2-element-ui"]') || document.body

import { Message, Notification, MessageBox } from 'element-ui'
const _msg = Message
Vue.prototype.$message = function(opts) {
  return _msg({ ...opts, appendTo: getContainer() })
}
// Notification / MessageBox 同理包装
```

### 5.3 z-index 隔离（stacking context）

每个子应用根 div 加专属 z-index 基数，建立独立 stacking context：

| 应用 | z-index 基数 |
|---|---|
| 父应用 | 1000 |
| sub1 | 2000 |
| sub2 | 3000 |
| sub3 | 4000 |
| sub4 | 5000 |

子应用内部 z-index 自治（用各自 UI 库默认值），互不干扰。

子应用根 div 必须设置：
```css
.sub-app-root {
  position: relative;
  z-index: <子应用专属基数>;
}
```

---

## 6. 路由

### 6.1 路由模式

**全部 history mode**（不用 hash）。

### 6.2 base path 划分

```
父应用     /
sub1       /sub-vue3-antd4
sub2       /sub-vue2-antd1
sub3       /sub-vue3-element-plus
sub4       /sub-vue2-element-ui
```

### 6.3 子应用 base 注入

子应用 base path 通过 qiankun props 注入（不用写死）：
- 集成模式：父应用 props 传 `base: '/sub-vue3-antd4'`
- 独立运行：子应用默认 `base: '/'`

```ts
// 子应用 main.ts
export async function mount(props) {
  const base = props.base || '/'
  const router = createRouter({
    history: createWebHistory(base),
    routes
  })
  // ...
}
```

### 6.4 父应用路由表

父应用路由表为每个子应用路径配一个 Layout 子路由，路径对应子应用 activeRule：

```ts
// 父应用 src/router/index.ts
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: 'sub-vue3-antd4/:pathMatch(.*)*', component: SubAppContainer },
      { path: 'sub-vue2-antd1/:pathMatch(.*)*', component: SubAppContainer },
      { path: 'sub-vue3-element-plus/:pathMatch(.*)*', component: SubAppContainer },
      { path: 'sub-vue2-element-ui/:pathMatch(.*)*', component: SubAppContainer }
    ]
  }
]
```

### 6.5 路由守卫

- **父应用统一登录守卫**：`router.beforeEach` 检查 token，未登录跳 `/login`
- **子应用内部路由各自守卫**：子应用 vue-router `beforeEach` 做页面级权限控制
- 权限数据通过 qiankun props 传：`props.permission`、`props.hasPermission`

---

## 7. 通信

### 7.1 三种通信通道

| 方向 | 通道 | 用途 |
|---|---|---|
| 父→子 | qiankun props | 注入公共数据：userInfo / tenant / permission / axios / BASE_URL / theme / lang |
| 子→父 | initGlobalState | 通知全局变化：msgNum / logoutSignal |
| 子→子 | 通过父中转 | sub1 想通知 sub2 → sub1 setGlobalState → 父监听 → 父 setGlobalState 给 sub2 |

### 7.2 父应用实现

```ts
// 父应用 src/qiankun/globalState.ts
import { initGlobalState, type MicroAppStateActions } from 'qiankun'
import { useUserInfoStore } from '@/stores'
import { useTenantStore } from '@/stores'
import customAxios from '@/server/customAxios'
import { hasPermission } from '@/permission'
import { BASE_URL } from '@/config'

const userInfoStore = useUserInfoStore()
const tenantStore = useTenantStore()

const actions: MicroAppStateActions = initGlobalState({
  msgNum: 0,
  theme: 'light',
  primaryColor: '#1677ff',
  lang: 'zh-CN',
  logoutSignal: 0
})

actions.onGlobalStateChange((state, prev) => {
  if (typeof state?.msgNum === 'number') {
    // 父应用响应消息数变化
  }
  if (state?.logoutSignal > prev?.logoutSignal) {
    // 子应用请求退出，跳登录页
    router.push('/login')
  }
})

// 给子应用的公共 props
export function getSubAppProps() {
  return {
    window,
    customAxios,
    permission: permission,
    hasPermission,
    userInfo: toRaw(userInfoStore.userInfo),
    tenant: toRaw(tenantStore.tenant),
    BASE_URL,
    setGlobalState: actions.setGlobalState,
    onGlobalStateChange: actions.onGlobalStateChange,
    offGlobalStateChange: actions.offGlobalStateChange
  }
}
```

### 7.3 子应用实现

```ts
// 子应用 main.ts
export async function mount(props) {
  const { container, customAxios, userInfo, hasPermission, BASE_URL,
    onGlobalStateChange, setGlobalState } = props

  // 监听全局状态变化
  onGlobalStateChange((state, prev) => {
    if (state.theme !== prev.theme) {
      themeConfig.value = state.theme  // 切换主题
    }
    if (state.lang !== prev.lang) {
      i18n.global.locale.value = state.lang  // 切换语言
    }
  }, true)  // true = 立即触发一次

  // 子应用自己 setGlobalState 通知父
  // setGlobalState({ msgNum: 5 })
}
```

### 7.4 不用共享 pinia

sub2/sub4 用 vuex、sub1/sub3 用 pinia、不能统一，所以**不共享状态库**。所有跨应用状态走 `initGlobalState`（普通 JS 发布订阅，框架无关）。

---

## 8. 公共依赖处理（双 build 方案）

### 8.1 双 build 策略

Vue3（sub1 / sub3）和 Vue2（sub2 / sub4）子应用都搞**双 build**：

| build 命令 | external Vue | 输出目录 | 部署场景 |
|---|---|---|---|
| `build:standalone` | ❌ 不 external，自带 Vue | dist-standalone | 独立部署访问（任意路径） |
| `build:qiankun` | ✅ external Vue，从父 window 取 | dist-qiankun | qiankun 集成部署到 `/qiankun-demo/microapp/<name>/` |

### 8.2 sub1 Vite 配置示例

```ts
// packages/sub-vue3-antd4/vite.config.ts
import qiankun from 'vite-plugin-qiankun'
import vue from '@vitejs/plugin-vue'

const isQiankun = process.env.VITE_QIANKUN === 'true'

export default defineConfig({
  base: isQiankun ? '/qiankun-demo/microapp/sub-vue3-antd4/' : '/',
  plugins: [vue(), qiankun('sub-vue3-antd4', { useDevMode: true })],
  build: {
    outDir: isQiankun ? 'dist-qiankun' : 'dist-standalone',
    rollupOptions: {
      external: isQiankun ? ['vue'] : [],
      output: { globals: { vue: 'Vue' } }
    }
  },
  server: { port: 5801, host: true }
})
```

### 8.3 package.json scripts（每个子应用）

```json
{
  "scripts": {
    "dev": "vite",
    "build:standalone": "vite build",
    "build:qiankun": "cross-env VITE_QIANKUN=true vite build",
    "build": "npm run build:qiankun && npm run build:standalone"
  }
}
```

### 8.4 父应用加载 Vue UMD 到 window

父应用 `index.html`（仅 prod）：
```html
<!-- 父应用 index.html prod 模式 -->
<script src="https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js"></script>
<!-- 如果有 Vue2 子应用，还要加载 Vue2 UMD -->
<script src="https://unpkg.com/vue@2.7.14/dist/vue.runtime.min.js"></script>
```

dev 模式父应用不加载 UMD，用本地 Vue（Vite dev 不 external）。

### 8.5 antd4 不 external

**antd4 始终各自打包**，不参与 external 共享：
- antd4 默认按需 import（`import { Button } from 'ant-design-vue'`），子应用只打包用到的组件
- 共享 UMD 会丢失按需 import 优势，包反而变大
- 配置复杂度增加，不划算

### 8.6 Vue2 子应用（sub2/sub4）Webpack 配置

```js
// packages/sub-vue2-antd1/vue.config.js
const isQiankun = process.env.VUE_APP_QIANKUN === 'true'

module.exports = {
  publicPath: isQiankun ? '/qiankun-demo/microapp/sub-vue2-antd1/' : '/',
  outputDir: isQiankun ? 'dist-qiankun' : 'dist-standalone',
  configureWebpack: {
    output: {
      library: 'sub-vue2-antd1',
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_sub-vue2-antd1`
    },
    externals: isQiankun ? { vue: 'Vue' } : {}
  },
  devServer: { port: 5802 }
}
```

### 8.7 axios 共享

父应用配好 axios 实例（token 拦截器、错误处理、BASE_URL），通过 qiankun props 注入子应用，子应用直接用，**不重复配拦截器**。

### 8.8 独立运行 fallback

- 子应用独立 dev（vite dev / vue-cli-service serve）：本地 Vue，零配置
- 子应用 prod 独立部署：用 `build:standalone` 产物，自带 Vue
- 子应用 prod 通过 qiankun 加载：用 `build:qiankun` 产物，external Vue 从父 window 取

---

## 9. 主题切换

### 9.1 分档支持（B 方案）

| 应用 | 支持运行时主题切换 |
|---|---|
| 父 + sub1（antd4）+ sub3（element-plus） | ✅ 支持 |
| sub2（antd1）+ sub4（element-ui） | ❌ 不支持，维持 light |

### 9.2 实现流程

```ts
// 父应用
function toggleTheme(newTheme: 'light' | 'dark') {
  actions.setGlobalState({ theme: newTheme })        // 广播给子
  themeConfig.value = newTheme                       // 父自己切
  document.documentElement.className = newTheme      // 给 html 加 class，老库 fallback
  localStorage.setItem('theme', newTheme)
}
```

```ts
// sub1 / sub3 监听
props.onGlobalStateChange((state) => {
  if (state.theme) {
    themeConfig.value = state.theme
    // antd4: ConfigProvider :theme
    // element-plus: Config :namespace + CSS 变量覆盖
  }
}, true)
```

### 9.3 自定义主题色（primary color）

- antd4：`ConfigProvider :theme="{ token: { colorPrimary: primaryColor } }"`
- element-plus：覆盖 `--ep-color-primary` CSS 变量
- antd1 / element-ui：不支持运行时改色（Less 编译期固定）

### 9.4 sub2/sub4 不支持切换

切到 dark 时，sub2/sub4 维持 light 主题，靠"父应用给 documentElement 加 class='dark'"做有限覆盖（业务 CSS 用 `.dark .xxx { ... }` 覆盖）。

---

## 10. i18n

### 10.1 方案

**子应用各自维护 locale 文件 + 父广播语言**。

- 父 + sub1 + sub3：vue-i18n@9
- sub2 + sub4：vue-i18n@8

### 10.2 文件结构

```
packages/sub-vue3-antd4/src/locales/
  zh-CN.json
  en-US.json
```

### 10.3 切换流程

```ts
// 父应用
function switchLang(lang: 'zh-CN' | 'en-US') {
  i18n.global.locale.value = lang
  actions.setGlobalState({ lang })
  localStorage.setItem('lang', lang)
}
```

```ts
// 子应用监听
props.onGlobalStateChange((state) => {
  if (state.lang) {
    i18n.global.locale.value = state.lang
    antdLocale.value = state.lang === 'zh-CN' ? zhCN : enUS  // antd4 locale
  }
}, true)
```

### 10.4 独立运行 fallback

子应用独立访问时，从 `localStorage.getItem('lang')` 拿语言（默认 zh-CN）。

### 10.5 文案一致性

跨子应用文案不一致（如"用户管理"在 sub1 翻译成 User Management，sub2 翻译成 User Admin）靠翻译规范文档 + Code Review 治理，不在架构上强行统一。

UI 库自带按钮文案（"确定/取消"等）由 antd/element 自带 locale 包保证一致。

---

## 11. 错误处理

### 11.1 错误场景 + 处理

| 场景 | 处理 |
|---|---|
| 子应用加载失败（entry 404 / 网络错误） | 父应用 #sub-app-container 显示 fallback UI（a-result error + 重试按钮） |
| 子应用 mount 抛异常 | 子应用 mount 函数 try/catch + setGlobalState 通知父 |
| 子应用运行时错误 | Vue3 onErrorCaptured + qiankun addGlobalUncaughtErrorHandler 收集 |
| 子应用卸载残留 | 子应用 cleanupList 模式清理第三方库实例 / WebSocket / axios abort / 动态 DOM |

### 11.2 加载超时

qiankun 没内置超时，父应用自己实现：**10s 超时判失败**。

```ts
async function loadWithTimeout(app, timeout = 10000) {
  return Promise.race([
    loadMicroApp(app),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    )
  ])
}
```

### 11.3 重试

fallback UI 上"重试"按钮，**无限次手动重试**（不自动重试）。

### 11.4 unmount 异常

子应用 unmount 抛异常时，qiankun 沙箱强制清理，**父应用忽略异常**继续加载下一个子应用。

### 11.5 子应用资源清理

子应用维护 cleanupList，unmount 时反向遍历清理：

```ts
const cleanupList: Array<() => void> = []
function addCleanup(fn: () => void) { cleanupList.push(fn) }

export async function mount(props) {
  const chart = echarts.init(dom)
  addCleanup(() => chart.dispose())  // 第三方库实例 dispose

  const ws = new WebSocket('ws://...')
  addCleanup(() => ws.close())         // WebSocket 关闭

  const controller = new AbortController()
  axios.get('/api/xxx', { signal: controller.signal })
  addCleanup(() => controller.abort()) // 取消未完成请求

  const timer = setInterval(...)
  addCleanup(() => clearInterval(timer)) // 定时器清理（沙箱也会自动清，双保险）

  const el = document.createElement('div')
  document.body.appendChild(el)
  addCleanup(() => el.remove())        // 动态 DOM 移除
}

export async function unmount() {
  while (cleanupList.length) {
    try { cleanupList.pop()() } catch (e) { console.error('[cleanup]', e) }
  }
  app.unmount()
}
```

### 11.6 监控上报（先简版）

- `console.error` + `addGlobalUncaughtErrorHandler` 收集
- 通过父应用注入的 `axios` 上报到后端 `/api/error/report`
- 后期升级 Sentry / 阿里 ARMS

---

## 12. 性能监控

### 12.1 监控指标（4 项核心）

| 指标 | 采集方式 | 上报字段 |
|---|---|---|
| 父应用首屏 FCP | PerformanceObserver `first-contentful-paint` | parent_fcp |
| 子应用加载耗时 | qiankun mount 前后 performance.mark | sub_load_<name> |
| 子应用首屏 FCP | 子应用入口 PerformanceObserver | sub_fcp_<name> |
| 错误率 | addGlobalUncaughtErrorHandler | sub_error_<name> |

### 12.2 上报策略

- 防抖：累积 5 条或 30s 上报一次
- 页面 visibilitychange（用户切走）时立即上报
- 用 `navigator.sendBeacon`（页面卸载也能发）

### 12.3 不做看板

前端只采只传，看板/告警由后端实现（错误率 > 5% 告警、加载时间 > 5s 告警）。

### 12.4 实现

```ts
// 父应用 src/utils/perf.ts
const perfBuffer: any[] = []
let reportTimer: any = null

export function reportPerf(payload: any) {
  perfBuffer.push({ ...payload, time: Date.now() })
  if (perfBuffer.length >= 5) return flushPerf()
  if (!reportTimer) {
    reportTimer = setTimeout(flushPerf, 30000)
  }
}

async function flushPerf() {
  if (!perfBuffer.length) return
  const data = perfBuffer.splice(0)
  reportTimer = null
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/perf/report', JSON.stringify(data))
  } else {
    axios.post('/api/perf/report', data).catch(() => {})
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushPerf()
})
```

---

## 13. 部署

### 13.1 同域部署

| 应用 | URL |
|---|---|
| 父应用 | https://xxx.com/qiankun-demo/ |
| sub1 | https://xxx.com/qiankun-demo/microapp/sub-vue3-antd4/ |
| sub2 | https://xxx.com/qiankun-demo/microapp/sub-vue2-antd1/ |
| sub3 | https://xxx.com/qiankun-demo/microapp/sub-vue3-element-plus/ |
| sub4 | https://xxx.com/qiankun-demo/microapp/sub-vue2-element-ui/ |

### 13.2 开发端口

| 应用 | 端口 |
|---|---|
| 父应用 | 5800 |
| sub1 | 5801 |
| sub2 | 5802 |
| sub3 | 5803 |
| sub4 | 5804 |

### 13.3 部署产物

| 场景 | 用哪个 build |
|---|---|
| qiankun 集成 | `dist-qiankun` |
| 独立访问 | `dist-standalone` |

---

## 14. 父应用导航菜单

### 14.1 菜单写死

菜单写死在父应用 Layout 组件（不从子应用动态拉菜单，避免子应用未加载时菜单延迟）。

```vue
<!-- 父应用 src/layouts/MainLayout.vue -->
<template>
  <a-layout>
    <a-layout-sider>
      <a-menu :selected-keys="selectedKeys" mode="inline" @click="onMenuClick">
        <a-menu-item key="sub-vue3-antd4">Vue3 + antd4 子应用</a-menu-item>
        <a-menu-item key="sub-vue2-antd1">Vue2 + antd1 子应用</a-menu-item>
        <a-menu-item key="sub-vue3-element-plus">Vue3 + element-plus 子应用</a-menu-item>
        <a-menu-item key="sub-vue2-element-ui">Vue2 + element-ui 子应用</a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout-content>
      <router-view />
    </a-layout-content>
  </a-layout>
</template>
```

### 14.2 菜单点击跳转

菜单点击跳转到 `/<sub-name>`，qiankun 按 activeRule 加载子应用。

---

## 15. 子应用生命周期实现

### 15.1 Vite 子应用（sub1 / sub3）

```ts
// packages/sub-vue3-antd4/src/main.ts
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import App from './App.vue'
import routes from './routes'
import { setupAntd } from './utils/setupAntd'

let app: any = null
let router: any = null

async function render(props: any = {}) {
  const { container, base = '/', customAxios, userInfo } = props

  app = createApp(App)
  router = createRouter({
    history: createWebHistory(base),
    routes
  })
  app.use(router)
  app.use(setupAntd)
  app.provide('axios', customAxios)
  app.provide('userInfo', userInfo)

  app.mount(container ? container.querySelector('#app') : '#app')
}

if (qiankunWindow.__POWERED_BY_QIANKUN__) {
  qiankunWindow.__webpack_public_path__ = qiankunWindow.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
  renderWithQiankun({
    async bootstrap() {},
    async mount(props) {
      render(props)
      props.onGlobalStateChange((state: any) => {
        // 监听主题、语言变化
      }, true)
    },
    async unmount() {
      app.unmount()
      app = null
      router = null
    }
  })
} else {
  render()  // 独立运行
}
```

### 15.2 Webpack 子应用（sub2 / sub4，仿参考项目 builder）

```js
// packages/sub-vue2-antd1/src/main.js
import Vue from 'vue'
import App from './App.vue'
import router from '@/router'
import './components/antd'  // 弹窗 getContainer 配置

let instance = null

async function render(props = {}) {
  const { container, customAxios, userInfo, tenant, permission } = props
  Vue.use(service, { customAxios })
  Vue.use(permission)
  instance = new Vue({
    router,
    render: h => h(App)
  }).$mount(container ? container.querySelector('#app') : '#app')
}

if (window.__POWERED_BY_QIANKUN__) {
  window.__webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
} else {
  render()  // 独立运行
}

export async function bootstrap() {}
export async function mount(props) { render(props) }
export async function unmount() {
  instance.$destroy()
  instance.$el.innerHTML = ''
  instance = null
}
```

---

## 16. 编码规范约束

### 16.1 CSS 规范

- 子应用代码**不要写 `:root { --xxx }`**（会污染全局）
- 子应用要定义 CSS 变量，写在子应用根 div 上：`<div data-app="xxx" style="--my-var: ...">` 或通过 class
- 子应用根 div 必须设置 `position: relative; z-index: <专属基数>;`

### 16.2 弹窗规范

- 业务代码**不要省略**弹窗的 `getContainer` / `append-to-body` 配置
- 弹窗必须挂到子应用根 div 内
- antd 系：靠全局默认值配置（setupAntd.ts / antd.js）
- element-plus/element-ui：业务代码每个组件都要显式配置

### 16.3 通信规范

- 跨子应用通信走 `initGlobalState`，**不用 window 全局变量**
- 父应用是子应用之间的中转，子应用之间不直接通信

### 16.4 资源清理规范

- 子应用 mount 时登记所有副作用到 cleanupList
- 第三方库实例必须 dispose（ECharts / 视频 / 地图 / BPMN viewer）
- WebSocket / EventSource / Worker 必须 close / terminate
- axios 请求用 AbortController 可取消

---

## 17. 验收清单

### 17.1 基础接入

- [ ] 父应用启动，导航菜单显示 4 个子应用项
- [ ] 点击每个子应用菜单，对应子应用加载并显示
- [ ] 切换子应用时旧子应用 unmount，无残留
- [ ] 每个子应用可独立 dev 访问（localhost:5801-5804）

### 17.2 CSS 隔离

- [ ] 4 个子应用同时存在时，UI 库样式不互相覆盖
- [ ] 弹窗（Modal/Dialog/Tooltip/Popover/Message）样式正确
- [ ] keyframes 动画不冲突
- [ ] 切换子应用时无样式残留

### 17.3 弹窗隔离

- [ ] sub1 antd4 Modal/Drawer/Tooltip 等挂到子应用根 div
- [ ] sub2 antd1 Modal/Dropdown 等挂到子应用根 div
- [ ] sub3 element-plus Dialog/Tooltip 等挂到子应用根 div
- [ ] sub4 element-ui Dialog/Select 等挂到子应用根 div

### 17.4 z-index 隔离

- [ ] 多个子应用弹窗同时出现时，z-index 不冲突
- [ ] 子应用弹窗不会盖住父应用导航（或按预期盖住）

### 17.5 路由

- [ ] 父应用 history mode 路由正常
- [ ] 子应用内部路由跳转正常
- [ ] 父子路由切换不互相干扰
- [ ] 浏览器刷新子应用路径能正确加载

### 17.6 通信

- [ ] 父→子 props 注入正常（axios / userInfo / permission）
- [ ] 子→父 setGlobalState 正常（msgNum 变化父能收到）
- [ ] 主题切换父+sub1+sub3 跟随
- [ ] 语言切换所有子应用跟随

### 17.7 独立运行

- [ ] 每个子应用 `build:standalone` 后独立部署访问正常
- [ ] 每个子应用 `build:qiankun` 后 qiankun 集成访问正常

### 17.8 错误处理

- [ ] 子应用加载失败时显示 fallback UI
- [ ] 加载超时 10s 后判失败
- [ ] 重试按钮可无限次重试
- [ ] unmount 异常不影响其他子应用加载

### 17.9 性能监控

- [ ] 父应用 FCP 上报正常
- [ ] 子应用加载耗时打点正常
- [ ] 错误上报正常
- [ ] 防抖批量上报正常

---

## 18. 后续演进（不在本期范围）

- 升级到 Sentry 完整监控
- 自建性能看板
- 接入 CI/CD 自动化部署
- 子应用接入测试（单元 / E2E）
- 国际化文案统一治理（翻译规范 + CR）
- sub2/sub4 支持运行时主题切换（预编译多套 CSS）
- Module Federation 替代 qiankun（如有需要）

---

## 19. 参考项目

- **smart-cloud-portal**（D:\工作\DianXin\YunYingPingTai\smart-cloud-portal）
  - monorepo + 17+ 子应用 + qiankun 2.10.16 + Vue3/Vue2 混合栈
  - CSS 隔离未启用 sandbox，靠 getContainer + 重命名全局方法解决弹窗冲突
  - builder 子应用 antd.js 是参考样板（弹窗 getContainer 默认值修改）
