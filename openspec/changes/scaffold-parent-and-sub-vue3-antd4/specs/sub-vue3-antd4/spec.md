## ADDED Requirements

### Requirement: qiankun 生命周期接入

sub-vue3-antd4 SHALL 在 `src/main.ts` 导出 qiankun 生命周期函数：`bootstrap`（仅做一次初始化，可空实现）、`mount(props)`（创建子应用 Vue 实例 + Pinia + Router，挂载到 `props.container`）、`unmount(props)`（销毁 Vue 实例 + 清空 `props.container` innerHTML）。SHALL 使用 `vite-plugin-qiankun` 自动注入 lifecycle globals（`__POWERED_BY_QIANKUN__`）。

#### Scenario: 父应用挂载子应用

- **WHEN** qiankun 调用 sub-vue3-antd4 的 `mount({ container, ...props })`
- **THEN** 子应用 Vue 实例创建并挂载到 `props.container.querySelector('#app')` 或 `props.container`，根 div 带 `data-app="sub-vue3-antd4"`，子应用内部路由初始化

#### Scenario: 父应用卸载子应用

- **WHEN** qiankun 调用 sub-vue3-antd4 的 `unmount({ container })`
- **THEN** 子应用 Vue 实例 `app.unmount()`，`props.container` innerHTML 清空，无残留 DOM

#### Scenario: 独立运行时不导出 lifecycle

- **WHEN** sub-vue3-antd4 通过 `pnpm dev:sub-vue3-antd4` 独立启动（非 qiankun 环境，`__POWERED_BY_QIANKUN__` 为 false）
- **THEN** main.ts 走 standalone 分支，直接创建 Vue 实例挂载到 `#app`，不导出 lifecycle 函数

### Requirement: 独立访问零配置 fallback

sub-vue3-antd4 SHALL 支持独立 `pnpm dev:sub-vue3-antd4` 启动并直接访问 `http://localhost:5801`，无需任何额外配置（不依赖父应用、不依赖 qiankun runtime）。

#### Scenario: 独立启动后访问根路径

- **WHEN** 执行 `pnpm dev:sub-vue3-antd4`，浏览器访问 `http://localhost:5801/`
- **THEN** sub-vue3-antd4 渲染 demo 页面（home 路由），无 qiankun 依赖，无 CORS 错误，无 console error

#### Scenario: 独立启动时 base 为根路径

- **WHEN** sub-vue3-antd4 在 standalone 模式创建 Vue Router
- **THEN** router base 为 `/`（不依赖父应用 props.base 注入）

### Requirement: 双 build 策略

sub-vue3-antd4 SHALL 提供两条 build 命令：
- `build:standalone`：构建独立部署包，`vite build` 默认配置，**不** external Vue/Vue Router/Pinia，bundle 含完整 Vue 实例，可独立部署到任意静态服务器
- `build:qiankun`：构建 qiankun 集成包，`build.rollupOptions.external = ['vue', 'vue-router', 'pinia']`，运行时从父应用 `window.Vue` / `window.VueRouter` / `window.Pinia` 取（父应用 prod `index.html` 通过 UMD 加载这些库到 window）

antd4 MUST NOT external（保按需 import tree-shaking，体积可控）。vue-i18n MUST NOT external（子应用各自维护 locale）。

#### Scenario: standalone build 产物含 Vue

- **WHEN** 执行 `pnpm --filter sub-vue3-antd4 build:standalone`
- **THEN** 产物 `dist/assets/*.js` 含 Vue3 实例代码，体积预估 > 200KB（含 Vue 运行时 + Router + Pinia），可直接部署到 nginx 单跑

#### Scenario: qiankun build 产物 external Vue

- **WHEN** 执行 `pnpm --filter sub-vue3-antd4 build:qiankun`
- **THEN** 产物 `dist/assets/*.js` 不含 Vue 实例代码，体积预估 < 50KB（仅业务代码 + antd4 按需 import），`rollupOptions.external` 列出 `vue`、`vue-router`、`pinia`

### Requirement: sub-vue3-antd4 demo 页面

sub-vue3-antd4 SHALL 提供两个 demo 路由：
- `/home`：展示 `<a-button>` + `<a-modal>`（验证 antd4 namespace + 弹窗 getContainer）
- `/about`：展示 `<a-input>` + `<a-select>`（验证 form 控件 portal 挂载到子应用根容器）

#### Scenario: 访问 home 路由

- **WHEN** 在父应用集成模式下访问 `/qiankun-demo/sub-vue3-antd4/home` 或独立模式访问 `http://localhost:5801/home`
- **THEN** 页面渲染一个 antd4 Button + Modal 触发器，点击 Button 弹出 Modal，Modal DOM 挂载到 `[data-app="sub-vue3-antd4"]` 内部

#### Scenario: 访问 about 路由

- **WHEN** 访问 `/about` 路由
- **THEN** 页面渲染一个 antd4 Input + Select，展开 Select 下拉时下拉面板 DOM 挂载到 `[data-app="sub-vue3-antd4"]` 内部

### Requirement: cleanupList 框架占位（仅骨架）

sub-vue3-antd4 SHALL 在 `mount` 时初始化 `cleanupList: (() => void)[] = []`，在 `unmount` 时反向遍历执行所有清理函数。本 change 仅在骨架里 register 一个占位清理函数（如 `() => console.log('cleanup demo')`）。完整清理（ECharts/视频/地图/BPMN.js/WebSocket/Web Worker/未完成 axios 请求）在后续 change 补。

#### Scenario: unmount 时反向遍历执行 cleanupList

- **WHEN** qiankun 调用 sub-vue3-antd4 的 `unmount`
- **THEN** cleanupList 中的清理函数按 register 顺序的反向被调用，控制台输出 `cleanup demo`

### Requirement: 子应用性能打点骨架

sub-vue3-antd4 SHALL 在 `src/utils/perf.ts` 提供 `markMount` / `markFCP` / `reportPerf` 工具函数，基于 `Performance.mark/measure`。本 change 仅在 console 输出（`[perf] mount=Xms, fcp=Yms`），不实现 sendBeacon 上报、批量防抖、看板（后续 change 补）。

#### Scenario: 子应用 mount 时打点

- **WHEN** qiankun 调用 sub-vue3-antd4 的 `mount`
- **THEN** Performance.mark `sub-vue3-antd4-mount-start`，mount 完成后 `markMount`，console 输出 `[perf] mount=<X>ms`

#### Scenario: 子应用 FCP 打点

- **WHEN** sub-vue3-antd4 首次内容绘制（FCP）触发
- **THEN** `markFCP` 调用 Performance.measure 计算 FCP 耗时，console 输出 `[perf] fcp=<Y>ms`
