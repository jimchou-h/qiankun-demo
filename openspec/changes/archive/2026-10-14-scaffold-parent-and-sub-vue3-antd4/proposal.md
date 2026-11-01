## Why

作为 qiankun 微前端 demo 项目的**第一个端到端 tracer bullet**，需要把"父应用骨架 + 第一个子应用（sub-vue3-antd4）"这条最小路径完整打通：父应用 Vite+antd4 启动、qiankun 注册 + 沙箱、子应用生命周期接入、PostCSS 前缀隔离、antd4 namespace、弹窗 getContainer、z-index 堆叠隔离、history base path 注入、父子通信骨架、子应用独立访问 fallback、双 build 策略。

跑通这条切片后，后续 sub-vue2-antd1 / sub-vue3-element-plus / sub-vue2-element-ui 可按同一脚手架模式批量接入，主题切换 / i18n / 错误处理 / 性能监控 / prod 部署 等横切能力可作为独立 change 增量补完。本 change 不涉及这些后续能力。

完整需求见 `docs/REQUIREMENTS.md`（19 章），本 change 只覆盖其中"父骨架 + sub-vue3-antd4"切片。

## What Changes

- 新建 pnpm workspace（根 `package.json` + `pnpm-workspace.yaml` + `overrides` 强制统一 Vue 版本号），聚合 dev/build/install 脚本
- 新建父应用（Vue3 + Vite 4 + Ant Design Vue 4 + Pinia + Vue Router 4 + history 模式），含：
  - `src/qiankun/index.ts` 子应用列表（仅 sub-vue3-antd4 一条），dev 用 `http://localhost:5801`，prod 用 `/qiankun-demo/microapp/sub-vue3-antd4/`
  - `src/qiankun/register.ts` `registerMicroApps + start({ sandbox: true, prefetch: false, singular: true })`，CSS 隔离不配（既不 `strictStyleIsolation` 也不 `experimentalStyleIsolation`），挂 `addGlobalUncaughtErrorHandler` 简版错误上报
  - `src/layouts/MainLayout.vue` 写死导航菜单 + `#sub-app-container` 挂载点
  - `src/server/customAxios.ts` 父应用 axios 实例（拟通过 props 注入子应用）
  - 父根 div `data-app="root"` + `z-index: 1000` 基数
- 新建 sub-vue3-antd4 子应用（Vue3 + Vite + vite-plugin-qiankun + Ant Design Vue 4 + Vue Router 4 + Pinia），含：
  - `src/main.ts` qiankun 生命周期（`bootstrap` / `mount(props)` / `unmount`），mount 时把 qiankun 注入的 `base` 设给 router，独立运行 fallback `/`
  - `src/App.vue` 根 div `data-app="sub-vue3-antd4"` + `position: relative; z-index: 2000`，外层 `a-config-provider` 设 `prefix-cls="a4-"` + theme + locale
  - `postcss.config.js` 用 `postcss-prefix-selector` 给所有选择器加 `[data-app="sub-vue3-antd4"]` 前缀（跳过 `body/html/:root/*`）+ `postcss-rename-keyframes` 加 `sub-vue3-antd4-` 前缀
  - `src/utils/setupAntd.ts` 仿参考项目 builder 的 `antd.js`：批量改 `Modal/Drawer/Tooltip/Popover/Dropdown/Select/DatePicker/Cascader/TreeSelect/Popconfirm` 的 `getContainer` 默认值为 `() => document.querySelector('[data-app="sub-vue3-antd4"]')`
  - `src/utils/perf.ts` 子应用 FCP + mount 耗时打点骨架（先 console，后期接 sendBeacon）
  - `vite.config.ts` 双 build 配置：`build:standalone` 不 external Vue；`build:qiankun` external Vue + 用 `vite-plugin-qiankun` 注入 lifecycle；dev 端口 5801
  - `src/locales/` 简版 i18n 文件骨架（zh-CN/en-US），监听父应用 `initGlobalState` 的 `lang` 事件切换 vue-i18n + antd locale
- 子应用 demo 页面（路由 `/sub-vue3-antd4/home` + `/sub-vue3-antd4/about`），含一个 antd Modal 演示弹窗挂载到子应用根容器（验证 portal 隔离有效）

## Capabilities

### New Capabilities

- `microfrontend-shell`: qiankun 父应用骨架——子应用注册/启动/沙箱、Layout 布局与导航、`#sub-app-container` 挂载点、history 路由占位、父应用 axios 实例、全局错误兜底
- `parent-child-state`: 父子通信机制——父→子通过 qiankun props 注入（base/userInfo/tenant/permission/axios/BASE_URL/theme/lang），子→父/子→子通过 `initGlobalState` 广播（msgNum/theme/lang/logoutSignal）
- `subapp-css-isolation`: 子应用 CSS 隔离与弹窗挂载——PostCSS 选择器前缀 + keyframes 改名、UI 库 namespace（antd4 `a4-`）、子应用根容器 `data-app` 属性、独立 z-index 基数隔离 stacking context、portal 类组件 getContainer 改到子应用根容器
- `sub-vue3-antd4`: sub-vue3-antd4 子应用——qiankun 生命周期（bootstrap/mount/unmount + cleanupList）、独立访问 fallback、双 build 策略（standalone / qiankun external）、props 与 initGlobalState 消费、demo 页面

### Modified Capabilities

<!-- 无（首个 change，openspec/specs/ 为空） -->

## Impact

- **新增代码**：项目根 `package.json` / `pnpm-workspace.yaml` / `vite.config.ts` / `index.html` / `src/`；`packages/sub-vue3-antd4/` 整套子应用代码
- **依赖**：Vue 3.4.21、Vue Router 4.2.5、Ant Design Vue 4、Pinia、qiankun 2.10+、vite-plugin-qiankun、postcss-prefix-selector、vue-i18n 9、axios、npm-run-all2、pnpm 10+（keyframes 改名用子应用内维护的本地 PostCSS 插件，不引入 npm 包）
- **版本约束**：根 `pnpm.overrides` 强制 `vue@^3` = 3.4.21（后续 sub2/sub4 接入时再补 `vue@^2` = 2.7.14、`vue-router@^3` = 3.6.5）
- **不受影响**：sub-vue2-antd1 / sub-vue3-element-plus / sub-vue2-element-ui 子应用（后续 change）、主题切换运行时实现、i18n 完整文案库、错误处理 10s 超时重试、性能监控 sendBeacon 上报、prod 部署
- **风险点**：vite-plugin-qiankun 与 Vite 4 兼容性、antd4 在 `prefix-cls="a4-"` + PostCSS 双重前缀下样式完整性、portal 类组件 getContainer 改造在 antd4 全组件覆盖度
