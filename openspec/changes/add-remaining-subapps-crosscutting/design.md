## Context

已归档 change `scaffold-parent-and-sub-vue3-antd4` 跑通端到端切片：pnpm workspace + 父应用 Vite+antd4 + sub1（Vite + vite-plugin-qiankun）的 PostCSS 前缀隔离 / antd4 prefix-cls / ConfigProvider 单点 getContainer / 双 build / props+initGlobalState 通信 / 10s 超时等占位。本 change 补齐剩余 3 个子应用 + 父注册 + 跨切能力。

技术栈基线：
- 已跑通：父 Vue3.4.21 + Vite4 + antd4；sub1 Vue3 + Vite + vite-plugin-qiankun + antd4（prefix-cls=a4，UMD 双 build）
- 新增：sub2 Vue2.7.14 + Vue CLI 5(Webpack5) + antd1.7.5；sub3 Vue3 + Vite + vite-plugin-qiankun + element-plus（namespace=ep）；sub4 Vue2.7.14 + Vue CLI 5 + element-ui 2.x
- 横切：vue-i18n（9 / 8）、主题分档、错误 10s 超时重试、性能 4 指标 sendBeacon、prod UMD（Vue2+Vue3）

约束来源：`AGENTS.md` Hard Constraints + `docs/REQUIREMENTS.md` 4-16 章 + 已归档 design（D1-D10，其中 D2 已定 sub2/sub4 用 Vue CLI 手写生命周期、D4 已定 CSS 三层、D6 已定通信、D7 已定路由 base 注入）。

## Goals / Non-Goals

**Goals:**
- 4 个子应用全部可 `dev:sub-*` 独立启动 + `build:standalone`/`build:qiankun` 双产物
- 父应用注册 4 子应用，导航 4 项，dev:all / build:all 聚合 5 应用
- 主题分档：父+sub1+sub3 运行时切换，sub2/sub4 维持 light
- i18n：父广播 lang，4 子应用各自 locale 跟随（含 UI 库 locale）
- 错误：10s 超时 + fallback 无限重试 + unmount 异常忽略 + 各子应用 cleanupList 登记
- 性能：4 指标防抖批量 sendBeacon
- prod：父 index.html 注入 Vue2+Vue3 UMD，preview 复验 4 子应用集成

**Non-Goals:**
- 不做看板/告警（后端实现）、不升级 Sentry、不做 CI/CD
- sub2/sub4 不做运行时主题切换（维持 light，`.dark` class 有限覆盖由父维护）
- 不做 i18n 文案统一治理（各自 locale，CR 治理）

## Decisions

### D1: sub2/sub4 用 Vue CLI 5 + Webpack 5，双 build 用环境变量区分

**选择**：Vue2 子应用用 `@vue/cli-service`（`vue.config.js`），`process.env.VUE_APP_QIANKUN === 'true'` 区分 `build:qiankun`（`vue-cli-service build --mode qiankun`）与 `build:standalone`（默认）。产物输出：
- `outputDir`: `dist-qiankun` / `dist-standalone`
- `publicPath`: `/qiankun-demo/microapp/<name>/`（qiankun）/ `/`（standalone）
- `configureWebpack.output`: `library: '<name>'` + `libraryTarget: 'umd'` + `jsonpFunction: 'webpackJsonp_<name>'`（Webpack5 用 `chunkLoadingGlobal`，Vue CLI5 已内部处理；jsonpFunction 唯一化避免多 webpack 运行时冲突）
- `externals`: qiankun 模式 `{ vue: 'Vue' }`，standalone 不 external

**理由**：Vue2 + Webpack 生态无官方 qiankun plugin，手写生命周期 + UMD 输出是最稳路径；Vue CLI 5 支持 `--mode` 切环境变量。**Vue2 专用依赖**：`vue-template-compiler`（必须与 vue 2.7.14 精确匹配）、`@vue/cli-plugin-babel`、`babel-plugin-import`（antd1/element-ui 按需）。

**风险**：Vue CLI 5 在 pnpm workspace 下 peer 依赖解析（`vue-template-compiler` 必须显式装进子应用 devDeps）。

### D2: Vue2 子应用 main.js 生命周期 + base 注入

**选择**：`main.js` 结构（两子应用一致）：
```js
let instance = null
function render(props = {}) {
  const { container, base = '/' } = props
  const router = new VueRouter({ mode: 'history', base, routes })
  instance = new Vue({ router, render: h => h(App) })
    .$mount(container ? container.querySelector('#app') : '#app')
}
if (window.__POWERED_BY_QIANKUN__) {
  window.__webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
if (!window.__POWERED_BY_QIANKUN__) { render() }   // 独立运行
export async function bootstrap() {}
export async function mount(props) { render(props) }
export async function unmount() {
  instance && instance.$destroy(); instance = null
}
```
**要点**：Vue2 `vue-router@3` 用 `new VueRouter({ mode:'history', base })`；独立运行不导出即不渲染（`window.__POWERED_BY_QIANKUN__` 未定义时直接 render）。子应用需处理 root 挂载点（qiankun 传入 `container` 时 `querySelector('#app')`）。

### D3: element-plus namespace 隔离（--el-* → --ep-*）

**选择**：sub3 `App.vue` 用 `<el-config-provider :namespace="'ep'">` 包裹，element-plus 组件 class 变 `ep-*`、CSS 变量变 `--ep-*`。配合 PostCSS 选择器前缀（第 1 层）双防护。**仅 sub3 需要**：element-plus 是唯一使用 CSS 变量的 UI 库；antd1/element-ui 静态编译无变量。

**注意**：namespace 只作用于 `el-config-provider` 子树内的组件；Message/Notification 等全局 API 用 `ElConfigProvider` 或手动传 `namespace`（或接受其 DOM 挂根容器内、变量仅影响自身）。子应用禁止写 `:root { --xxx }`。

**风险**：element-plus 全局组件（ElMessage）不带 namespace 时仍用 `--el-*` —— 挂载在子应用根容器内 + PostCSS 前缀下，`--el-*` 变量定义也带前缀作用域，实测确认即可。

### D4: sub3 双 build 沿用 sub1 模式（UMD + globals + inlineDynamicImports）

**选择**：sub3 `vite.config.ts` 与 sub1 相同：`--mode qiankun` 时 `base: '/qiankun-demo/microapp/sub-vue3-element-plus/'`、`external: ['vue','vue-router']`、`format: 'umd'`、`name: 'sub-vue3-element-plus'`、`globals: { vue:'Vue', 'vue-router':'VueRouter' }`、`inlineDynamicImports: true`。element-plus 不 external（按需 import 保持 tree-shaking）。pinia/vue-i18n 不 external（沿用 sub1 结论）。

### D5: 错误处理 10s 超时 + fallback 重试实现位置

**选择**：父应用不换 `loadMicroApp` 手动加载（保持 `registerMicroApps + start` 注册制）。超时重试在 `src/qiankun/register.ts` 用**生命周期钩子 + 状态机**实现：
- 方案 A（简单，采用）：利用 qiankun 加载失败会触发 `addGlobalUncaughtErrorHandler`（`unhandledrejection`），在 handler 里把失败子应用名写入 `appStateStore.failedApp`，MainLayout 在 `#sub-app-container` 渲染 fallback UI（a-result + 重试按钮）；重试按钮调 `router.replace` 到该子应用路径重新触发 activeRule + `location.reload()`？——reload 太重。
- 方案 B（采用，更准）：父应用提供 `SubAppContainer.vue` fallback 状态管理：监听路由变化，目标子应用 path 命中 activeRule 后启动 10s 定时器，若 `afterMount` 未触发则显示 fallback；重试按钮 = `router.replace(当前路径)` 让 qiankun 重新触发加载。需要 qiankun 生命周期回调（afterMount/afterUnmount）与 store 联动。

**实现（最终）**：父 `register.ts` 生命周期回调（beforeLoad → 置 `loading`，afterMount → 置 `ok`，`addGlobalUncaughtErrorHandler` → 置 `failed`）写入 Pinia `appState`；`SubAppContainer.vue`（父路由表的子应用占位组件）读取状态渲染 loading / fallback（含重试按钮，点击 `router.replace(route.fullPath)` 重新触发）+ 10s 超时。**unmount 异常**：`afterUnmount` 回调 try/catch 包住（qiankun 内部已 catch，此处仅日志），不中断后续。

### D6: 性能监控落点

**选择**：父 `src/utils/perf.ts` 实现 `reportPerf`（防抖 5 条/30s + visibilitychange flush + `sendBeacon('/api/perf/report')` fallback axios.post）。数据源：
- `parent_fcp`：父入口 PerformanceObserver `first-contentful-paint`
- `sub_load_<name>`：qiankun `beforeLoad`→`afterMount` 的 performance.measure
- `sub_fcp_<name>`：子应用入口 markFCP 后经 `props` 或 `setGlobalState` 上报父（子应用独立时仅 console）
- `sub_error_<name>`：`addGlobalUncaughtErrorHandler` 命中时 `reportPerf({ sub_error_<name>: 1 })`
后端 `/api/perf/report` 无实体后端，demo 下 sendBeacon 到同源会 404 —— 用 `navigator.sendBeacon` 静默失败（不阻塞），保留实现。

### D7: 父 prod 加载 Vue2 UMD

**选择**：父 `vite.config.ts` build-only 插件注入 3 个 UMD script（Vue3、VueRouter、Vue2），均指向 `unpkg` 固定版本（`vue@3.4.21/dist/vue.global.prod.js`、`vue-router@4.2.5/dist/vue-router.global.prod.js`、`vue@2.7.14/dist/vue.runtime.min.js`）。**注意**：`window.Vue` 在 Vue2 子应用代码里被引用（`externals: { vue: 'Vue' }`），Vue2 UMD 挂 `window.Vue`——**与 Vue3 UMD 同名冲突**！

**关键冲突处理**：Vue3 UMD 与 Vue2 UMD 都挂 `window.Vue`。方案：
- **改加载时序**：Vue3 子应用（sub1/sub3）在父应用渲染期间需要 `window.Vue`（Vue3）；Vue2 子应用（sub2/sub4）在 qiankun 加载时才需要 `window.Vue`（Vue2）。qiankun 集成模式下子应用 JS 经 import-html-entry 的 `execScripts` 在沙箱 proxy 上执行，`window` 引用被代理——**在 sandbox 内预先注入 `window.Vue = Vue2`**，不影响外部 window.Vue（Vue3）。
- 采用方案：**dev 用 qiankun sandbox 预处理**——在 `register.ts` 里给每个 Vue2 子应用加 `loader`/或利用 qiankun 的 `beforeLoad` 在沙箱 window 上放 Vue2？qiankun 提供 `start({ sandbox })` 的 per-app `sandbox` 选项有限。**更稳**：Vue2 子应用 external Vue 时用**独立全局名**，改 `vue.config.js` 的 `externals: { vue: 'Vue2' }` + 父加载 Vue2 UMD 到 `window.Vue2`；Vue2 子应用产物引用 `window.Vue2`。Vue3 保持 `window.Vue`。**零冲突，确定性最高**，采用。

### D8: 主题分档 sub2/sub4 维持 light

**选择**：sub2/sub4 不响应 `theme` 广播（不注册 theme handler）。父应用 `toggleTheme` 给 `document.documentElement.classList.toggle('dark')`，sub2/sub4 业务 CSS 可写 `.dark .xxx` 覆盖（demo 不强制）。sub1 antd4：`ConfigProvider :theme` 由 `themeConfig` 响应式驱动。sub3 element-plus：覆盖 `--ep-color-primary` 等变量（在根 div 上动态 setProperty 或给 `<el-config-provider>` 传 theme）。demo 简化：sub3 主题切换 = 根容器 `data-theme` class + `--ep-*` 变量覆盖。

### D9: cleanupList 全量登记（占位→真实）

**选择**：4 个子应用统一 `cleanupList` 模式：`mount` 时 push 清理函数（demo 页用真实资源占位：一个 WebSocket 关闭 + 一个定时器 + 一个 axios AbortController 示例 + ECharts dispose 示例（sub 内已引入 echarts 则注册），无第三方库的子应用至少登记定时器/事件监听），`unmount` 反向遍历执行。父 `afterUnmount` 打印日志验证。

### D10: pnpm overrides 补 Vue2 约束

根 `package.json` `pnpm.overrides` 补：`vue@^2: 2.7.14`、`vue-router@^3: 3.6.5`。Vue2 子应用 devDeps 显式装 `vue-template-compiler: 2.7.14`（与 vue 精确同版）。**注意**：overrides 键 `vue@^2` 与已有 `vue@^3` 并存合法。

## Risks / Trade-offs

- **[Risk] Vue CLI 5 在 pnpm workspace 的依赖解析** → sub2/sub4 显式声明 `vue-template-compiler`（精确 2.7.14）、`@vue/cli-service`、`@vue/cli-plugin-babel`；若有 peer 冲突用 pnpm `overrides`/`.npmrc` `strict-peer-dependencies=false`
- **[Risk] element-plus ElMessage 等全局 API 的 namespace** → 挂载点 root 容器 + PostCSS 前缀兜底；验收实测
- **[Risk] Vue2/Vue3 UMD 同名 window.Vue 冲突** → D7 采用 `window.Vue2` 独立全局名，确定性规避
- **[Risk] sendBeacon 无后端 404** → 静默失败不阻塞（sendBeacon 不抛错），保留实现待接后端
- **[Trade-off] 10s 超时用路由占位组件 + store 状态机** → 比 loadMicroApp 手动模式复杂，但保留 registerMicroApps 注册制（REQUIREMENTS 3.3 强制）
