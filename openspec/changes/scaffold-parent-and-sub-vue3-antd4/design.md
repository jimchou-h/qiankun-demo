## Context

全新 qiankun 微前端 demo 项目，零代码起点。完整需求见 `docs/REQUIREMENTS.md`（19 章，含 grilling 16 轮决策记录）。本 change 是首个端到端 tracer bullet：父应用骨架 + sub-vue3-antd4 子应用接入跑通。

技术栈基线：
- 父应用：Vue3.4.21 + Vite4 + Ant Design Vue 4 + Pinia + Vue Router 4 + axios + qiankun 2.10+
- sub-vue3-antd4：Vue3.4.21 + Vite4 + vite-plugin-qiankun + Ant Design Vue 4 + Vue Router 4 + Pinia + vue-i18n 9
- 工具链：pnpm 10 workspace + npm-run-all2 + postcss-prefix-selector + 本地 keyframes 前缀插件

约束来源：`AGENTS.md` 的 Hard Constraints（不使用 qiankun CSS 隔离、JS 沙箱开、弹窗挂子应用根、history 路由 base path 注入、子应用独立访问零配置、pnpm overrides 强制版本、props+initGlobalState 通信、双 build、4 个 Vue 子应用、主题/i18n 分档、错误 10s+重试、性能 4 指标）。

参考项目：`D:\工作\DianXin\YunYingPingTai\smart-cloud-portal`（monorepo + 17+ 子应用 + qiankun 2.10.16 + Vue3/Vue2 混合栈），其 builder 子应用 `src/components/antd.js` 是 antd 弹窗 getContainer 改造样板。

## Goals / Non-Goals

**Goals:**
- 父应用可 `pnpm dev` 启动，访问 `/qiankun-demo/sub-vue3-antd4/*` 自动加载 sub-vue3-antd4 子应用
- sub-vue3-antd4 可 `pnpm dev:sub-vue3-antd4` 独立启动，访问 `http://localhost:5801` 直接运行（零配置 fallback）
- sub-vue3-antd4 demo 页面包含一个 antd Modal，验证：①Modal 挂载到 `[data-app="sub-vue3-antd4"]` 而非 body；②Modal 内 antd class 带 `a4-` 前缀；③CSS 选择器被 PostCSS 改写带 `[data-app="sub-vue3-antd4"]` 前缀
- qiankun sandbox 生效（子应用 window 写入不污染全局），CSS 隔离关闭（验证不依赖 strictStyleIsolation）
- 父子通信骨架跑通：父通过 props 注入 `base`、`userInfo`、`axios`、`theme`、`lang`；子通过 `initGlobalState` 上报 `msgNum` 给父
- 双 build 配置就位：`pnpm --filter sub-vue3-antd4 build:standalone` 产出独立部署包（含 Vue），`build:qiankun` 产出 qiankun 集成包（external Vue，从 window.Vue 取）
- 父应用根 `data-app="root"` z-index=1000，sub-vue3-antd4 根 `data-app="sub-vue3-antd4"` z-index=2000，堆叠隔离可见

**Non-Goals:**
- 不接入 sub-vue2-antd1 / sub-vue3-element-plus / sub-vue2-element-ui（后续 change）
- 不实现运行时主题切换（sub-vue3-antd4 静态 light，主题广播在后续 change）
- 不实现 i18n 完整文案库（仅骨架文件 + 监听父 `lang` 事件，文案只有 zh-CN/en-US 各一个 demo key）
- 不实现错误处理 10s 超时 + 无限重试（仅 `addGlobalUncaughtErrorHandler` 简版 console 上报）
- 不实现性能监控 sendBeacon 上报（仅 `Performance.mark/measure` 打点 console）
- 不实现 prod 部署配置（nginx 同域路由 rewrite、`base` 注入 prod 路径）
- 不实现 cleanupList 完整清理（仅 mount/unmount 基本生命周期，cleanupList 框架在后续 change 补）

## Decisions

### D1: pnpm workspace + overrides 强制版本，不用 lerna/npm

**选择**：根 `pnpm-workspace.yaml` + `package.json` 的 `pnpm.overrides` 字段强制 `vue@^3` = 3.4.21。
**理由**：pnpm workspace 原生支持 monorepo，overrides 字段是 pnpm 官方版本约束机制；lerna 在 pnpm 体系下重复造轮子，npm workspaces 不支持 overrides。
**替代方案**：lerna + npm workspaces（更通用但缺 overrides）、single package.json 把所有子应用代码塞一起（破坏子应用独立 build/部署）。

### D2: sub-vue3-antd4 用 vite-plugin-qiankun，sub2/sub4 用 Vue CLI 手写生命周期

**选择**：sub1（Vue3+Vite）用 `vite-plugin-qiankun` 自动注入 lifecycle globals（`__POWERED_BY_QIANKUN__` / `__INJECTED_PUBLIC_PATH_BY_QIANKUN__`）；sub2/sub4（Vue2+Webpack）后续 change 用 Vue CLI 手写 `bootstrap/mount/unmount`，挂到 `window['sub-vue2-antd1']`。
**理由**：Vue CLI 5 + Webpack 5 的 lifecycle 注入没有官方 plugin，必须手写；Vite 体系有成熟 plugin。本 change 只做 sub1，验证 plugin 路径可行。
**替代方案**：sub1 也手写 lifecycle（可行但需手动配 `__POWERED_BY_QIANKUN__` 全局变量 + dev server headers，plugin 已封装）。

### D3: 双 build 策略——`build:standalone` 不 external，`build:qiankun` external Vue

**选择**：sub1 `vite.config.ts` 用 `mode` 区分两条 build：
- `build:standalone`（默认）：`build.rollupOptions.external = []`，Vue 打进 bundle，独立部署可单跑
- `build:qiankun`：`build.rollupOptions.external = ['vue', 'vue-router', 'pinia']`，从父应用 `window.Vue` 取，集成部署
**理由**：父应用 prod `index.html` 通过 UMD 加载 Vue3 到 `window.Vue`，子应用 qiankun 集成模式下复用同一份 Vue 实例（避免多份 Vue 导致 `app instance` 不一致）；独立访问要求子应用自带 Vue。
**替代方案**：始终 external Vue（独立访问需先加载 Vue UMD，违背"零配置"要求）；始终打进 Vue（集成模式多份 Vue 实例，sandbox 内不一致）。
**注**：antd4 不 external（保按需 import tree-shaking，体积可控）；vue-i18n 不 external（子应用各自维护 locale，复用价值低）。

### D4: CSS 隔离三层防护——PostCSS prefix + UI namespace + z-index 基数

**选择**：
1. **PostCSS `postcss-prefix-selector`** 给所有子应用 CSS 选择器加 `[data-app="sub-xxx"]` 前缀，`transform` 函数跳过 `body/html/:root/*` 全局选择器；不排除 `node_modules` 的 antd/element 样式（要一起改写）。keyframes 名加 `sub-vue3-antd4-` 前缀（避免动画名冲突）由一个**子应用内维护的本地 PostCSS 插件** `postcss-prefix-keyframes.cjs` 完成（约 15 行，遍历 `@keyframes` atRule 改名并同步改写 `animation` / `animation-name` 声明引用）
   - **为什么不用 npm 包**：原设计指定的 `postcss-rename-keyframes` 在 npm 上不存在（404）；`postcss-prefix-keyframe` 仅有 0.0.1 陈旧版本，不可用。本地插件逻辑简单且完全可控，优于引入死包
2. **UI 库 namespace**：antd4 `<a-config-provider prefix-cls="a4-">` 把所有 `ant-*` 改 `a4-*`；element-plus 后续 change 用 `namespace="ep"` 改 `--el-*` 为 `--ep-*`
3. **z-index 基数**：父根 1000，sub1 根 2000，子应用根 div 加 `position: relative; z-index: <基数>` 创建独立 stacking context，弹窗 z-index 不会跨子应用穿透

**理由**：qiankun 内置 `strictStyleIsolation`（Shadow DOM）有兼容性问题（已被否决），`experimentalStyleIsolation` 在动态插入 body 的弹窗场景失效；自主方案可控、可调试、可独立验证。
**替代方案**：Shadow DOM（否决，组件兼容性差）、CSS Modules（改造量大，第三方 UI 库不支持）、scoped（Vue scoped 只对 SFC 内有效，对 UI 库无效）。

### D5: 弹窗挂载点改造——ConfigProvider `getPopupContainer` 单点配置

**选择**：sub1 在 `App.vue` 用 `<a-config-provider prefix-cls="a4-" :get-popup-container="getAppContainer">` 统一指定弹层挂载点，`getAppContainer = () => document.querySelector('[data-app="sub-vue3-antd4"]') || document.body`。弹层组件（`Modal` / `Drawer` / `Tooltip` / `Popover` / `Dropdown` / `Select` / `DatePicker` / `Cascader` / `TreeSelect` / `Popconfirm`）全部由此单点配置覆盖，业务代码无需逐个传参。`message` / `notification` / `Modal.confirm` 函数式 API 通过 `<a-app>` + `App.useApp()` 提供 appContext。
**理由**：实测 antd4 4.2.6 源码，`Modal` 自身 `getContainer` 未传时 fallback 到 config context 的 `getPopupContainer`（`es/modal/Modal.js`：`getContainer: getContainer || getPopupContainer?.value`），`Drawer` 同理（`es/drawer/index.js` 的 `getContainer` computed）；弹层类 8 个组件经 `useConfigInject` 读取同一 context 值（`es/select/index.js`、`es/date-picker/generatePicker/generateSinglePicker.js`、`es/tooltip/Tooltip.js`）。故单点配置即覆盖全部 10 个组件。
**替代方案**：
- 改写组件 `props.*.default`（上一版方案，已否决）：实测 `Tooltip` / `Popover` / `Dropdown` / `Popconfirm` 的 `getPopupContainer` prop 在 antd4 中是**裸 `Function` 构造器**（`es/tooltip/abstractTooltipProps.js`：`getPopupContainer: Function`），赋值 `.default` 会污染全局 `Function` 且对组件无效；只有 `Modal` / `Drawer` / `Select` / `DatePicker` / `Cascader` / `TreeSelect` 的 prop 为可写描述符，两类行为不一致，否决。
- 业务代码逐个传 `getContainer` / `getPopupContainer`：可行但漏配风险高。
- 全局 `Modal.appContext` 注入：部分组件不响应。

### D6: 通信机制——qiankun props（父→子）+ initGlobalState（子→父/子→子），不共享 Pinia

**选择**：父→子通过 `registerMicroApps(props)` 注入（`base` / `userInfo` / `tenant` / `permission` / `axios` / `BASE_URL` / `theme` / `lang`）；子→父/子→子通过 `initGlobalState({ msgNum, theme, lang, logoutSignal })`，子→子通信经父中转。
**理由**：Vue2 用 Vuex、Vue3 用 Pinia，跨版本不通用；props + initGlobalState 是 qiankun 官方机制，跨技术栈中立。
**替代方案**：共享 Pinia（Vue2/Vue3 不通用，需 polyfill）、CustomEvent（绕过 qiankun 体系，sandbox 隔离后失效）。

### D7: history 路由 + qiankun props 动态注入 base path

**选择**：父应用 `createWebHistory('/qiankun-demo/')`；sub-vue3-antd4 在 `mount(props)` 时取 `props.base`，调用 `router.options.history = createWebHistory(props.base)` 或重建 router；独立运行（非 qiankun 环境）`base` fallback `/`。
**理由**：hash 模式对 SEO 不友好，且 qiankun activeRule 匹配更复杂；history 模式语义化路径更清晰（`/qiankun-demo/microapp/sub-vue3-antd4/home`）。
**替代方案**：hash 模式（否决，SEO + 美观差）；memory 模式（无 URL，不可分享）。

### D8: 子应用 cleanupList 框架占位（仅骨架，不完整实现）

**选择**：sub1 `mount` 时初始化 `cleanupList: (() => void)[] = []`，`unmount` 时反向遍历执行；本 change 只在骨架里 register 一个 `console.log('cleanup demo')` 占位清理函数。完整清理（ECharts/视频/BPMN/WebSocket/Web Worker/axios abort）在后续 change 补。
**理由**：cleanupList 是横切到所有子应用的模式，本 change 验证模式可行即可，避免提前实现无人使用的清理逻辑。

## Risks / Trade-offs

- **[Risk] vite-plugin-qiankun 与 Vite 4 兼容性** → Mitigation：先用 Vite 4，若 plugin 报错降级到 Vite 3.x；本 change 验证 plugin 路径可行后再扩展到 sub3
- **[Risk] antd4 在 `prefix-cls="a4-"` + PostCSS 双重前缀下样式完整性** → Mitigation：手动验证 demo Modal / Button / Input / DatePicker 渲染正常；双重前缀理论无冲突（PostCSS 改选择器，prefix-cls 改 class 名），但 antd4 内部 CSS-in-JS 注入的 `<style>` 可能不被 PostCSS 处理（因 PostCSS 只处理 .css 文件），需观察实际产物
- **[Risk] antd4 `App.useApp()` 函数式 API（message/notification/Modal.confirm）的 getContainer** → Mitigation：用 `App.useApp()` 提供 appContext；仍不生效的函数式调用手动传 `getContainer` 参数
- **[Risk] sub-vue3-antd4 dev 端口 5801 CORS** → Mitigation：Vite server 配 `headers: { 'Access-Control-Allow-Origin': '*' }`，父应用 fetch 子应用 entry 不被 CORS 拦
- **[Risk] history 路由 base path 在 dev / prod 不一致** → Mitigation：dev 父用 `http://localhost:5801` 直接加载子应用，子应用 dev `base='/'`；prod 子应用 base 由父 props 注入 `/qiankun-demo/microapp/sub-vue3-antd4/`
- **[Trade-off] 双 build 配置复杂度** → 价值：保独立访问零配置 + 集成模式 Vue 单实例；代价：每子应用维护两套 build 命令，CI 需区分部署目标
- **[Trade-off] 不实现完整错误处理 / 性能监控 / 主题 / i18n** → 本 change 聚焦端到端切片跑通，横切能力延后；后续 change 可独立增量补完，不破坏已跑通骨架

## Migration Plan

全新项目无迁移。部署回滚策略：
- 父应用 `vite build` 产出 `dist/`，子应用 `build:qiankun` 产出 `packages/sub-vue3-antd4/dist/`
- 部署目录：父 `/qiankun-demo/`，子 `/qiankun-demo/microapp/sub-vue3-antd4/`
- 出问题时回滚 = 回退到上一个 git tag，重新部署父应用 + 子应用 dist
- prod nginx 同域 rewrite 配置在本 change 不实现（后续 change 补）

## Open Questions

- 无（grilling 16 轮已决策完毕，本 change 范围内的所有问题都已锁定）
