## ADDED Requirements

### Requirement: 父应用启动与 qiankun 子应用注册

父应用 SHALL 在 `src/main.ts` 中完成 Vue3 app 实例化、Pinia、Vue Router（history 模式，base `/qiankun-demo/`）挂载后，调用 `src/qiankun/register.ts` 注册子应用并 `start()`。子应用列表在 `src/qiankun/index.ts` 中以数组形式定义，每条目包含 `name`、`entry`、`container`、`activeRule`、`props`。

#### Scenario: 父应用 dev 启动后访问根路径

- **WHEN** 开发者执行 `pnpm dev`，浏览器访问 `http://localhost:5800/qiankun-demo/`
- **THEN** 父应用 Layout 渲染，导航菜单可见，`#sub-app-container` 容器存在但为空（无子应用激活）

#### Scenario: 父应用通过 qiankun 注册并启动 sub-vue3-antd4

- **WHEN** 浏览器 URL 切换到 `/qiankun-demo/sub-vue3-antd4/home`
- **THEN** qiankun 根据 `activeRule` 匹配 sub-vue3-antd4，从 `entry`（dev 用 `http://localhost:5801`，prod 用 `/qiankun-demo/microapp/sub-vue3-antd4/`）加载子应用 HTML/JS，挂载到 `#sub-app-container`

#### Scenario: qiankun sandbox 开启 / CSS 隔离关闭

- **WHEN** qiankun `start()` 被调用
- **THEN** `sandbox: true` 生效（子应用 `window` 写入被 proxy 拦截，不污染父全局），`prefetch: false`，`singular: true`，且 `strictStyleIsolation` 与 `experimentalStyleIsolation` 均**未配置**（CSS 隔离由 PostCSS 自主方案解决，不依赖 qiankun 内置）

### Requirement: 父应用 prod 模式 UMD 依赖加载

父应用 SHALL 在 prod 构建时 external `vue` / `vue-router`，并通过 `output.format = 'umd'` + `output.globals`（`vue → Vue`、`vue-router → VueRouter`）+ `inlineDynamicImports: true` 让父 bundle 复用 `window.Vue` / `window.VueRouter`，避免与子应用 qiankun 集成包产生双份 Vue 实例。`output.globals` 仅对 umd/iife 格式生效，故父应用 prod 产物 MUST 为 UMD 格式（dev 不生效，dev 走本地 ESM Vue）。

父应用 `index.html` prod 产物 MUST 在 `<head>` 前部注入加载 `window.Vue` / `window.VueRouter` 的 UMD `<script>`，且位于入口 `<script type="module">` 之前（module script 为 defer 语义，故 UMD 经典脚本天然先执行）。注入由 `vite.config.ts` 内联的 build-only 插件（`apply: 'build'` + `transformIndexHtml`）完成，不引入 `vite-plugin-html` 依赖。

#### Scenario: prod 产物 index.html 含 UMD 依赖

- **WHEN** 执行 `pnpm build`
- **THEN** `dist/index.html` 的 `<head>` 含 Vue3 与 VueRouter 的 UMD `<script src>`，且位于入口 `<script type="module">` 之前

#### Scenario: 父应用与子应用集成包共用同一份 Vue

- **WHEN** prod 模式（`vite preview`）下访问 `/qiankun-demo/sub-vue3-antd4/home`
- **THEN** 父应用与 sub-vue3-antd4 均从 `window.Vue` 取 Vue，页面正常渲染，无重复 Vue 实例导致的渲染异常

### Requirement: 父应用 Layout 与导航菜单

父应用 SHALL 在 `src/layouts/MainLayout.vue` 中实现写死的导航菜单（不动态拉取）+ `#sub-app-container` 挂载点。导航项 MUST 包含 sub-vue3-antd4 入口（指向 `/sub-vue3-antd4/home`）。

#### Scenario: 访问父根路径显示 Layout

- **WHEN** 访问 `/qiankun-demo/`
- **THEN** MainLayout 渲染顶部导航 + 内容区，内容区含 `<div id="sub-app-container"></div>`

#### Scenario: 点击导航切换到 sub-vue3-antd4 路由

- **WHEN** 用户点击导航中 sub-vue3-antd4 项
- **THEN** Vue Router push 到 `/sub-vue3-antd4/home`，qiankun 监听 URL 变化激活子应用

### Requirement: 父应用根容器属性与 z-index 基数

父应用根 div SHALL 带 `data-app="root"` 属性，并设置 `position: relative; z-index: 1000` 创建独立 stacking context，作为父应用 z-index 基数（其他子应用基数分别为 2000/3000/4000/5000）。

#### Scenario: 父根 div 属性可验证

- **WHEN** 在父应用页面打开 DevTools 检查根 div
- **THEN** 该 div 有 `data-app="root"` 属性，computed style `position: relative`、`z-index: 1000`

### Requirement: 父应用全局错误处理（简版）

父应用 SHALL 调用 qiankun `addGlobalUncaughtErrorHandler` 捕获全局未处理异常，本 change 仅 `console.error` 输出 + 简版结构化日志。10s 加载超时 / 无限重试 / cleanupList 完整清理在后续 change 补。

#### Scenario: 子应用加载失败被全局错误处理器捕获

- **WHEN** sub-vue3-antd4 加载过程抛出未捕获异常（如 entry 404、JS 执行错误）
- **THEN** `addGlobalUncaughtErrorHandler` 回调被触发，控制台输出 `[qiankun 全局错误]` + 错误对象，主流程不被中断

### Requirement: 父应用 axios 实例

父应用 SHALL 在 `src/server/customAxios.ts` 创建一个 axios 实例（含 `baseURL`、`interceptors.request`、`interceptors.response`），并通过 qiankun `props.axios` 注入给 sub-vue3-antd4 子应用。

#### Scenario: 子应用通过 props 接收父应用 axios 实例

- **WHEN** sub-vue3-antd4 `mount(props)` 被调用
- **THEN** `props.axios` 是父应用创建的 axios 实例（与父应用共享同一份 baseURL、interceptors 配置）
