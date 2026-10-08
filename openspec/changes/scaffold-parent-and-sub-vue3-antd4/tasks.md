## 1. 项目骨架 + 父应用 Vite+antd4 启动

端到端目标：`pnpm dev` 启动父应用，访问 `http://localhost:5173/qiankun-demo/` 显示 Layout（顶部导航含 sub-vue3-antd4 入口）+ 空 `#sub-app-container`。无子应用激活。

- [x] 1.1 `git init` + 创建 `.gitignore`（`node_modules/`、`dist/`、`.scratch/`、`.trae/`、`*.log`）
- [x] 1.2 创建根 `package.json`（workspace root，scripts 含 `dev`/`dev:sub-vue3-antd4`/`dev:all`/`build`/`build:all`/`build:sub-vue3-antd4`/`install:all`，devDependencies 含 `vite`/`@vitejs/plugin-vue`/`vue-tsc`/`npm-run-all2`，`pnpm.overrides` 强制 `vue@^3` = 3.4.21、`vue-router@^4` = 4.2.5）
- [x] 1.3 创建 `pnpm-workspace.yaml`（`packages: ['.', 'packages/*']`）
- [x] 1.4 创建 `vite.config.ts`（端口 5173，`base: '/qiankun-demo/'`，`@vitejs/plugin-vue`）
- [x] 1.5 创建 `index.html`（挂载点 `<div id="app">`，引入 `/src/main.ts`）
- [x] 1.6 创建 `src/main.ts`（创建 Vue3 app + Pinia + Router，挂载到 `#app`，根 div 带 `data-app="root"`）
- [x] 1.7 创建 `src/App.vue`（根 div `data-app="root"` + inline style `position: relative; z-index: 1000`，渲染 `<MainLayout />`）
- [x] 1.8 创建 `src/layouts/MainLayout.vue`（顶部导航写死 sub-vue3-antd4 入口指向 `/sub-vue3-antd4/home`，内容区含 `<div id="sub-app-container"></div>`）
- [x] 1.9 创建 `src/router/index.ts`（`createWebHistory('/qiankun-demo/')`，路由表含 `/` 重定向到 Layout）
- [x] 1.10 验收：`pnpm install` + `pnpm dev` 启动，浏览器访问根路径显示 Layout + 空 `#sub-app-container`，DevTools 检查根 div 有 `data-app="root"` + z-index=1000

## 2. sub-vue3-antd4 独立骨架 + 独立 dev

端到端目标：`pnpm dev:sub-vue3-antd4` 独立启动子应用，访问 `http://localhost:5801/home` 显示 antd4 Button + Modal 触发器，零 qiankun 依赖。

- [x] 2.1 创建 `packages/sub-vue3-antd4/package.json`（name=`sub-vue3-antd4`，dependencies 含 `vue@^3.4.21`、`vue-router@^4.2.5`、`pinia`、`ant-design-vue@^4`、`vue-i18n@^9`、`axios`，devDependencies 含 `vite`、`@vitejs/plugin-vue`、`vite-plugin-qiankun`、`postcss`、`postcss-prefix-selector`）
- [x] 2.2 创建 `packages/sub-vue3-antd4/vite.config.ts`（端口 5801，`server.headers['Access-Control-Allow-Origin']='*'`，`vite-plugin-qiankun` 配 `useDevMode: true`；mainSPId 由插件首个参数传入子应用 name）
- [x] 2.3 创建 `packages/sub-vue3-antd4/index.html`（挂载点 `<div id="app">`，引入 `/src/main.ts`）
- [x] 2.4 创建 `src/main.ts`（判断 `__POWERED_BY_QIANKUN__`：standalone 直接 createApp + mount；qiankun 模式 export `bootstrap/mount/unmount` 生命周期函数）
- [x] 2.5 创建 `src/App.vue`（根 div + `<a-config-provider prefix-cls="a4-">` 包裹 `<router-view />`）
- [x] 2.6 创建 `src/views/Home.vue`（`<a-button>open modal</a-button>` + `<a-modal v-model:open="visible">demo</a-modal>`）
- [x] 2.7 创建 `src/views/About.vue`（`<a-input />` + `<a-select />` 含若干选项）
- [x] 2.8 创建 `src/router/index.ts`（`createAppRouter(base='/')` 工厂封装 `createWebHistory(base)`，路由表 `/home` → Home.vue、`/about` → About.vue；base 便于后续 qiankun 集成模式注入）
- [x] 2.9 验收：`pnpm install` + `pnpm dev:sub-vue3-antd4` 启动，访问 `:5801/home` 显示 antd4 Button，点击弹出 Modal（此时 Modal 挂到 body，**未做隔离**，下一个 task 修复）

## 3. sub-vue3-antd4 CSS 隔离三层防护

端到端目标：CSS 选择器被 `[data-app="sub-vue3-antd4"]` 前缀改写，antd4 class 带 `a4-` 前缀，keyframes 名加 `sub-vue3-antd4-` 前缀，全局选择器（body/html/:root/*）跳过；子应用根 div 有 `data-app="sub-vue3-antd4"` + z-index=2000 stacking context。

- [x] 3.1 创建 `packages/sub-vue3-antd4/postcss.config.js`（`postcss-prefix-selector` 配 `prefix: '[data-app="sub-vue3-antd4"]'`，`transform` 跳过 `body/html/:root/*`；keyframes 改名用本地插件 `postcss-prefix-keyframes.cjs`，前缀 `sub-vue3-antd4-`，幂等）
- [x] 3.1b 创建 `packages/sub-vue3-antd4/postcss-prefix-keyframes.cjs`（约 15 行：遍历 `@keyframes` atRule 改名 + 同步改写 `animation`/`animation-name` 声明引用，已带前缀则跳过）
- [x] 3.2 在 `App.vue` 根 div 加 `data-app="sub-vue3-antd4"` 属性 + inline style `position: relative; z-index: 2000`
- [x] 3.3 在 `Home.vue` 加一个 `<div class="demo-card">` 验证业务选择器前缀
- [x] 3.4 在 `Home.vue` 加 `@keyframes fadeIn` + 引用 `animation: fadeIn` 验证 keyframes 改名
- [x] 3.5 验收：`pnpm dev:sub-vue3-antd4` + DevTools Elements 检查根 div 有 `data-app="sub-vue3-antd4"` + computed style `position: relative` + `z-index: 2000`
- [x] 3.6 验收：DevTools 检查 `<a-button>` 的 class 含 `a4-btn` 不含 `ant-btn`
- [x] 3.7 验收：DevTools 检查 `Network → main.css`（或 `<style>` 标签）产物中 `.demo-card` 被改写为 `[data-app="sub-vue3-antd4"] .demo-card`
- [x] 3.8 验收：DevTools 检查产物 CSS 中 `@keyframes` 名为 `sub-vue3-antd4-fadeIn`，`animation` 引用同步改名
- [x] 3.9 验收：DevTools 检查产物 CSS 中 `body { ... }`、`html { ... }`、`:root { ... }`、`* { ... }` 全局选择器原样保留不加前缀

## 4. sub-vue3-antd4 弹窗 getContainer 改造

端到端目标：Home 路由的 Modal、About 路由的 Select 下拉、Drawer 等弹窗 DOM 挂载到 `[data-app="sub-vue3-antd4"]` 内部，不挂到 body；Modal z-index 计算基数为 2000，不穿透到父应用。

- [ ] 4.1 创建 `packages/sub-vue3-antd4/src/utils/setupAntd.ts`，遍历 `Modal`/`Drawer`/`Tooltip`/`Popover`/`Dropdown`/`Select`/`DatePicker`/`Cascader`/`TreeSelect`/`Popconfirm` 组件，修改各自 `props.getContainer.default` 为 `() => document.querySelector('[data-app="sub-vue3-antd4"]') || document.body`
- [ ] 4.2 在 `main.ts` 的 `mount`（qiankun 模式）和 standalone 分支都调用 `setupAntd()`
- [ ] 4.3 在 `App.vue` 用 `<a-config-provider>` 包裹时配置 `App.useApp()` 模式给 message/notification/Modal.confirm 函数式 API 提供 appContext
- [ ] 4.4 在 `Home.vue` 加一个 Drawer 验证挂载目标
- [ ] 4.5 验收：访问 `:5801/home`，点击 Button 弹出 Modal，DevTools Elements 检查 Modal DOM 在 `[data-app="sub-vue3-antd4"]` 内部而非 body
- [ ] 4.6 验收：访问 `:5801/about`，展开 Select 下拉，DevTools 检查下拉面板 DOM 在 `[data-app="sub-vue3-antd4"]` 内部
- [ ] 4.7 验收：访问 `:5801/home` 打开 Drawer，DevTools 检查 Drawer DOM 在 `[data-app="sub-vue3-antd4"]` 内部

## 5. sub-vue3-antd4 qiankun 集成模式接入

端到端目标：父应用访问 `:5173/qiankun-demo/sub-vue3-antd4/home` 加载 sub-vue3-antd4 子应用，路由切换 `/about` 正常，切回父路由 unmount 干净。

- [ ] 5.1 创建 `src/qiankun/index.ts`（`microApps` 数组含一条 sub-vue3-antd4：name/entry（dev `http://localhost:5801`，prod `/qiankun-demo/microapp/sub-vue3-antd4/`）/container=`#sub-app-container`/activeRule=`/sub-vue3-antd4`/props 占位 8 字段）
- [ ] 5.2 创建 `src/qiankun/register.ts`（`registerMicroApps(microApps, { beforeLoad, beforeMount, afterMount, afterUnmount })` + `start({ sandbox: true, prefetch: false, singular: true })` + `addGlobalUncaughtErrorHandler` 简版 console）
- [ ] 5.3 在父 `src/main.ts` 调用 `register()`
- [ ] 5.4 在 sub-vue3-antd4 `main.ts` 的 `mount(props)` 用 `props.base` 重建 router（dev qiankun 模式 base 由父注入，非 qiankun 模式 fallback `/`）
- [ ] 5.5 在 sub-vue3-antd4 `unmount(props)` 初始化 `cleanupList` + 反向遍历执行（占位清理函数 `() => console.log('cleanup demo')`）
- [ ] 5.6 验收：`pnpm dev` + `pnpm dev:sub-vue3-antd4` 并行启动，浏览器访问 `:5173/qiankun-demo/sub-vue3-antd4/home`，sub-vue3-antd4 加载并显示 Home 路由
- [ ] 5.7 验收：浏览器 URL 切换到 `/sub-vue3-antd4/about`，About 路由正常显示
- [ ] 5.8 验收：浏览器 URL 切回父根 `/qiankun-demo/`，sub-vue3-antd4 `unmount` 执行，DevTools 检查 `#sub-app-container` innerHTML 为空，控制台输出 `cleanup demo`
- [ ] 5.9 验收：DevTools 检查 sub-vue3-antd4 子应用 sandbox 生效（在子应用代码里 `window.__test__ = 1`，切回父路由后 `window.__test__` 为 undefined）

## 6. 父子通信骨架

端到端目标：父通过 props 注入 axios/userInfo/tenant/permission/BASE_URL/theme/lang/base 给 sub-vue3-antd4；sub-vue3-antd4 通过 `setGlobalState({msgNum})` 上报，父 Layout 显示 msgNum 徽标；sub-vue3-antd4 `onGlobalStateChange` 监听 lang 切换（占位 console）。

- [ ] 6.1 创建 `src/server/customAxios.ts`（axios 实例 + `baseURL` + `interceptors.request`/`interceptors.response` 占位）
- [ ] 6.2 在 `src/qiankun/index.ts` 的 sub-vue3-antd4 props 注入 `axios`、`userInfo`（mock `{id:1,name:'demo'}`）、`tenant`（mock `{id:1}`）、`permission`（mock `['home:view']`）、`BASE_URL`（`'/api'`）、`theme`（`'light'`）、`lang`（`'zh-CN'`）、`base`
- [ ] 6.3 在 `src/qiankun/register.ts` 调用 `initGlobalState({ msgNum: 0, theme: 'light', lang: 'zh-CN', logoutSignal: false })`，`onGlobalStateChange` 把 `msgNum` 同步到父 Pinia store
- [ ] 6.4 创建 `src/stores/appState.ts`（Pinia store 含 `msgNum` 状态 + setter）
- [ ] 6.5 在 `src/layouts/MainLayout.vue` 显示 `msgNum` 徽标（顶部导航右侧 `<a-badge :count="msgNum" />`）
- [ ] 6.6 在 sub-vue3-antd4 `Home.vue` 加按钮 `report to parent`，点击调用 `props.setGlobalState({ msgNum: <prev+1> })`
- [ ] 6.7 在 sub-vue3-antd4 `main.ts` 的 `mount(props)` 调用 `props.onGlobalStateChange((state) => console.log('[sub] lang changed:', state.lang))`
- [ ] 6.8 验收：父 + 子 dev 启动，访问 `:5173/qiankun-demo/sub-vue3-antd4/home`，点击 `report to parent` 按钮，父 Layout 徽标 +1
- [ ] 6.9 验收：父控制台调用 `setGlobalState({lang:'en-US'})`（mock 父切换语言），sub-vue3-antd4 控制台输出 `[sub] lang changed: en-US`

## 7. 双 build 策略

端到端目标：`pnpm --filter sub-vue3-antd4 build:standalone` 产物含 Vue（>200KB）；`pnpm --filter sub-vue3-antd4 build:qiankun` 产物 external Vue（<50KB）；父应用 `pnpm build` 产出 dist/，prod 模式 index.html 通过 UMD 加载 Vue3/VueRouter/Pinia 到 window。

- [ ] 7.1 在 sub-vue3-antd4 `vite.config.ts` 用 `mode` 区分 `build:standalone`（默认）和 `build:qiankun`，qiankun 模式 `build.rollupOptions.external = ['vue', 'vue-router', 'pinia']` + `output.globals` 映射到 `Vue`/`VueRouter`/`Pinia`
- [ ] 7.2 在 sub-vue3-antd4 `package.json` scripts 加 `build:standalone: vite build`、`build:qiankun: vite build --mode qiankun`，根 package.json scripts `build:sub-vue3-antd4` 改为 `pnpm --filter sub-vue3-antd4 build:qiankun`（默认 qiankun 集成模式）
- [ ] 7.3 在父应用 `index.html` 加 prod-only UMD script tag 加载 Vue3/VueRouter/Pinia（用 `vite-plugin-html` 或在 `index.html` prod 模板区分）
- [ ] 7.4 在父应用 `vite.config.ts` prod 模式 `build.rollupOptions.external = ['vue', 'vue-router', 'pinia']` + `output.globals`
- [ ] 7.5 在根 `package.json` scripts `build:all` 改为 `npm-run-all2 --parallel build build:sub-vue3-antd4`（其余子应用后续 change 补）
- [ ] 7.6 验收：`pnpm --filter sub-vue3-antd4 build:standalone` 产物 `dist/assets/*.js` 含 Vue 实例代码，体积 > 200KB
- [ ] 7.7 验收：`pnpm --filter sub-vue3-antd4 build:qiankun` 产物 `dist/assets/*.js` 不含 Vue 实例代码，体积 < 50KB
- [ ] 7.8 验收：`pnpm build` 父应用 dist 产出，`dist/index.html` 含 Vue3/VueRouter/Pinia UMD script tag
- [ ] 7.9 验收：用 `vite preview` 预览父应用 prod 模式，访问 `/qiankun-demo/sub-vue3-antd4/home` 子应用加载正常（验证 qiankun 集成模式 prod 跑通）

## 8. 性能打点骨架 + 全局错误简版

端到端目标：sub-vue3-antd4 mount 后 console 输出 `[perf] mount=Xms`，FCP 后 console 输出 `[perf] fcp=Yms`；模拟子应用加载错误（关掉 sub dev server），父控制台输出 `[qiankun 全局错误]`。

- [ ] 8.1 创建 `packages/sub-vue3-antd4/src/utils/perf.ts`（`markMount` 用 `Performance.mark` + `measure` 计算 mount 耗时；`markFCP` 用 `PerformanceObserver` 监听 `paint` entry name=`first-contentful-paint`；`reportPerf` 仅 `console.log`）
- [ ] 8.2 在 sub-vue3-antd4 `main.ts` `mount` 起始调用 `performance.mark('sub-vue3-antd4-mount-start')`，mount 完成后调用 `markMount` + 首次 render 后 `markFCP`
- [ ] 8.3 在父 `src/qiankun/register.ts` 的 `addGlobalUncaughtErrorHandler` 输出 `[qiankun 全局错误]` + 错误对象（结构化 console）
- [ ] 8.4 验收：父 + 子 dev 启动，访问 `:5173/qiankun-demo/sub-vue3-antd4/home`，sub-vue3-antd4 console 输出 `[perf] mount=<X>ms` 和 `[perf] fcp=<Y>ms`
- [ ] 8.5 验收：关闭 sub-vue3-antd4 dev server，刷新父应用，访问 `/qiankun-demo/sub-vue3-antd4/home`，父控制台输出 `[qiankun 全局错误]` + 错误对象，主流程不被中断
