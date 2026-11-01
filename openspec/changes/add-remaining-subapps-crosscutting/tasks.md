# add-remaining-subapps-crosscutting Tasks

## 1. workspace 扩展（overrides / 聚合脚本 / Vue2 依赖）

端到端目标：根 pnpm workspace 可管理 Vue2/Vue3 混合栈，`pnpm install:all` 一次装齐，`dev:all`/`build:all` 聚合 5 应用。

- [x] 1.1 根 `package.json` `pnpm.overrides` 补 `vue@^2: 2.7.14`、`vue-router@^3: 3.6.5`（保留已有 vue@^3/vue-router@^4）
- [x] 1.2 根 `package.json` scripts 补 `dev:sub-vue2-antd1` / `dev:sub-vue3-element-plus` / `dev:sub-vue2-element-ui`，`dev:all` 改聚合 5 应用；补 `build:sub-*`，`build:all` 改聚合 5 应用
- [x] 1.3 根 `.npmrc` 或 pnpm 配置：允许 Vue2 子应用 peer 依赖解析（`strict-peer-dependencies=false` 兜底）
- [x] 1.4 验收：`pnpm install:all` 成功，`pnpm --filter sub-vue2-antd1 ls vue` 输出 2.7.14

## 2. sub-vue2-antd1 独立骨架 + 独立 dev

端到端目标：`pnpm dev:sub-vue2-antd1` 独立启动，访问 `:5802/home` 显示 antd1 Button + Modal。

- [x] 2.1 创建 `packages/sub-vue2-antd1/package.json`（name=sub-vue2-antd1，deps：vue@^2.7.14、vue-router@^3、ant-design-vue@1.7.5、vue-i18n@^8；devDeps：@vue/cli-service、@vue/cli-plugin-babel、vue-template-compiler@2.7.14、babel-plugin-import、cross-env）
- [x] 2.2 创建 `vue.config.js`（devServer 5802 + CORS headers；`VUE_APP_QIANKUN` 区分 publicPath/outputDir；UMD output `library:'sub-vue2-antd1'` + `libraryTarget:'umd'` + `jsonpFunction:'webpackJsonp_sub-vue2-antd1'`；qiankun 模式 externals `{vue:'Vue'}`）
- [x] 2.3 创建 `postcss.config.js`（`postcss-prefix-selector` 前缀 `[data-app="sub-vue2-antd1"]` 跳过 body/html/:root/* + 本地 keyframes 前缀插件，拷贝 sub1 的 `postcss-prefix-keyframes.cjs`）
- [x] 2.4 创建 `babel.config.js`（`babel-plugin-import` 配 ant-design-vue 按需 `style: 'css'`）
- [x] 2.5 创建 `public/index.html`（`<div id="app">`）
- [x] 2.6 创建 `src/main.js`（手写 bootstrap/mount/unmount + `__POWERED_BY_QIANKUN__` 判断 + 独立运行 render fallback，见 design D2）
- [x] 2.7 创建 `src/App.vue`（根 div `data-app="sub-vue2-antd1"` + `position:relative; z-index:3000` + 顶部 nav + `<router-view/>`）
- [x] 2.8 创建 `src/router/index.js`（VueRouter mode history + `createBaseRouter(base)` 工厂）
- [x] 2.9 创建 `src/views/Home.vue`（a-button open modal + a-modal + demo-card 验证前缀/keyframes）与 `src/views/About.vue`（a-input + a-select）
- [x] 2.10 验收：`pnpm dev:sub-vue2-antd1`，`:5802/home` 渲染 antd1 按钮，点击弹 Modal

## 3. sub-vue2-antd1 CSS 隔离 + 弹窗挂载

端到端目标：产物 CSS 选择器带 `[data-app="sub-vue2-antd1"]` 前缀，Modal/Drawer/Dropdown/Select 弹层 DOM 落根容器内。

- [x] 3.1 创建 `src/components/antd.js`（仿参考项目 builder：Modal/Drawer/message/notification/Dropdown/Popconfirm/Popover/TreeSelect/Cascader/Select/Tooltip/DatePicker 的 getContainer/getPopupContainer 默认值改 `() => document.querySelector('[data-app="sub-vue2-antd1"]')`）
- [x] 3.2 main.js import `./components/antd`（独立与 qiankun 模式都生效）
- [x] 3.3 Home.vue 加 Drawer 验证弹层挂载目标
- [x] 3.4 验收：`:5802/home` 打开 Modal/Drawer，DevTools 断言 DOM 在 `[data-app="sub-vue2-antd1"]` 内部
- [x] 3.5 验收：产物 CSS `.ant-btn` 被改写为 `[data-app="sub-vue2-antd1"] .ant-btn`，`@keyframes` 名前缀 `sub-vue2-antd1-`

## 4. sub-vue2-antd1 集成 + 通信 + 双 build

端到端目标：父应用 `:5800/qiankun-demo/sub-vue2-antd1/home` 加载 sub2；props.base 注入路由；setGlobalState 上报 msgNum；双 build 产物。

- [x] 4.1 父 `src/qiankun/index.ts` 加 sub-vue2-antd1 条目（entry dev `http://localhost:5802` / prod `/qiankun-demo/microapp/sub-vue2-antd1/`，activeRule `/qiankun-demo/sub-vue2-antd1`，props 8 字段 base=`/qiankun-demo/sub-vue2-antd1`）
- [x] 4.2 父路由表 + MainLayout 导航补 sub-vue2-antd1 项（归入父注册票一并做，此处只验子侧）
- [x] 4.3 sub2 `mount(props)` 用 props.base 建 router + 注册 onGlobalStateChange（theme/lang 占位）+ bindGlobalActions（拷贝 sub1 bridge 模式，改 JS 版）
- [x] 4.4 Home.vue 加 `report to parent` 按钮（setGlobalState msgNum +1）
- [x] 4.5 `package.json` scripts：`build:standalone`（默认）/ `build:qiankun`（`cross-env VUE_APP_QIANKUN=true vue-cli-service build`）
- [x] 4.6 验收：父+子 dev 并行，`:5800/qiankun-demo/sub-vue2-antd1/home` 加载 sub2，`report to parent` 父徽标 +1
- [x] 4.7 验收：`build:standalone` 产物 dist-standalone 含 Vue；`build:qiankun` 产物 dist-qiankun 头部 UMD、不含 Vue 运行时特征

## 5. sub-vue3-element-plus 独立骨架 + 独立 dev

端到端目标：`pnpm dev:sub-vue3-element-plus` 独立启动，`:5803/home` 显示 element-plus Button + Dialog。

- [x] 5.1 创建 `packages/sub-vue3-element-plus/package.json`（deps：vue@^3.4.21、vue-router@^4、element-plus、pinia、vue-i18n@^9；devDeps：vite、@vitejs/plugin-vue、vite-plugin-qiankun、postcss、postcss-prefix-selector）
- [x] 5.2 创建 `vite.config.ts`（端口 5803 + CORS；qiankun plugin `useDevMode`；双 build 模式同 sub1：`--mode qiankun` external vue/vue-router + UMD + globals + inlineDynamicImports，`dist-qiankun`/`dist-standalone`）
- [x] 5.3 创建 `postcss.config.js`（前缀 `[data-app="sub-vue3-element-plus"]` + 本地 keyframes 插件前缀 `sub-vue3-element-plus-`）
- [x] 5.4 创建 `index.html` + `src/main.ts`（renderWithQiankun 生命周期，同 sub1 模式）
- [x] 5.5 创建 `src/App.vue`（`<el-config-provider :namespace="'ep'">` 包裹 + 根 div `data-app="sub-vue3-element-plus"` + z-index 4000）
- [x] 5.6 创建 `src/router/index.ts`（createAppRouter(base) 工厂）+ `src/views/Home.vue`（el-button + el-dialog + demo-card + keyframes）+ `About.vue`（el-input + el-select）
- [x] 5.7 验收：`:5803/home` 渲染 element-plus 按钮，点击弹 Dialog

## 6. sub-vue3-element-plus CSS 变量隔离 + 弹窗挂载

端到端目标：CSS 变量为 `--ep-*` 而非 `--el-*`；Dialog/Drawer/Select 弹层与 Message 全局 API 落根容器内。

- [x] 6.1 业务代码逐个配置：Dialog/Drawer `append-to-body=false`、Select/Cascader/DatePicker/Popover/Dropdown/Tooltip `teleported=false`
- [x] 6.2 Home.vue 加 Message 触发（`ElMessage.success({ appendTo: () => document.querySelector('[data-app="sub-vue3-element-plus"]') })`）
- [x] 6.3 验收：`:5803/home` DevTools 断言 Dialog/Select 下拉/Message DOM 在 `[data-app="sub-vue3-element-plus"]` 内部
- [x] 6.4 验收：根容器内 CSS 变量名 `--ep-*`，无裸 `--el-*`；产物 `.el-button` → `[data-app="sub-vue3-element-plus"] .el-button`

## 7. sub-vue3-element-plus 集成 + 通信 + 双 build

端到端目标：父 `:5800/qiankun-demo/sub-vue3-element-plus/home` 加载 sub3；msgNum 上报；双 build 产物。

- [x] 7.1 父 `src/qiankun/index.ts` 加 sub-vue3-element-plus 条目（dev `:5803`）
- [x] 7.2 sub3 `main.ts` mount 时 props.base 建 router + bridge + onGlobalStateChange（theme/lang 监听，theme 写根容器 class 触发 `--ep-*` 变量切换）
- [x] 7.3 Home.vue 加 `report to parent` 按钮
- [x] 7.4 验收：`:5800/qiankun-demo/sub-vue3-element-plus/home` 加载 sub3，report 父徽标 +1
- [x] 7.5 验收：`build:standalone`/`build:qiankun` 双产物（qiankun 包 UMD + external Vue）

## 8. sub-vue2-element-ui 独立骨架 + 独立 dev

端到端目标：`pnpm dev:sub-vue2-element-ui` 独立启动，`:5804/home` 显示 element-ui Button + Dialog。

- [x] 8.1 创建 `packages/sub-vue2-element-ui/package.json`（deps：vue@^2.7.14、vue-router@^3、element-ui@2.x、vue-i18n@^8；devDeps：同 sub2 模式）
- [x] 8.2 创建 `vue.config.js`（5804 + CORS；双 build + UMD `library:'sub-vue2-element-ui'` + `jsonpFunction:'webpackJsonp_sub-vue2-element-ui'`；qiankun externals `{vue:'Vue2'}`——见 design D7 全局名规避冲突）
- [x] 8.3 创建 `postcss.config.js`（前缀 `[data-app="sub-vue2-element-ui"]` + keyframes 前缀）+ `babel.config.js`（babel-plugin-import element-ui 按需）
- [x] 8.4 创建 `public/index.html` + `src/main.js`（手写生命周期同 sub2）+ `src/App.vue`（根 div `data-app="sub-vue2-element-ui"` + z-index 5000）+ router/Home/About（el-button + el-dialog + demo-card）
- [x] 8.5 验收：`:5804/home` 渲染 element-ui 按钮，点击弹 Dialog

## 9. sub-vue2-element-ui CSS 隔离 + 弹窗挂载

- [x] 9.1 业务代码逐个配置：Dialog/Drawer `append-to-body=false` + `modal-append-to-body=false`、Select/Cascader/DatePicker `popper-append-to-body=false`
- [x] 9.2 创建 `src/utils/setupElementUI.js` 包装 Message/Notification/MessageBox（`appendTo` 根容器），main.js 注册到 Vue.prototype
- [x] 9.3 验收：`:5804/home` DevTools 断言 Dialog/Select 下拉/Message DOM 在根容器内
- [x] 9.4 验收：产物 CSS `.el-dialog` → `[data-app="sub-vue2-element-ui"] .el-dialog`

## 10. sub-vue2-element-ui 集成 + 通信 + 双 build

- [x] 10.1 父 `src/qiankun/index.ts` 加 sub-vue2-element-ui 条目（dev `:5804`）
- [x] 10.2 sub4 `mount(props)` props.base 建 router + bridge + onGlobalStateChange（lang 监听；theme 不响应）+ `report to parent` 按钮
- [x] 10.3 `package.json` scripts 双 build（`VUE_APP_QIANKUN=true`）
- [x] 10.4 验收：父集成加载 sub4，report 父徽标 +1；双 build 产物（qiankun 包 external `Vue2` 全局名）

## 11. 父应用注册 + 导航 + 脚本/端口收口

端到端目标：父导航 4 项，4 子应用 dev 集成均可加载；`dev:all`/`build:all` 聚合。

- [x] 11.1 父 `src/qiankun/index.ts` 补齐 4 条目（含 SUB_APP_BASE/ENTRY 各子应用常量）
- [x] 11.2 父 `src/router/index.ts` 路由表补 sub2/sub3/sub4 占位（`SubAppContainer`）
- [x] 11.3 父 `MainLayout.vue` 导航 4 项 + 菜单点击跳转
- [x] 11.4 根 `package.json` scripts 收口（见任务 1.2）
- [x] 11.5 验收：`pnpm dev:all` 一次起 5 服务，导航逐个点击 4 子应用均加载（5800-5804）

## 12. 主题分档运行时切换（父 + sub1 + sub3）

端到端目标：父 Layout 主题开关切换 dark，父 + sub1 + sub3 跟随，sub2/sub4 维持 light。

- [x] 12.1 父 `MainLayout.vue` 加主题切换控件（light/dark），`toggleTheme` 写 localStorage + `documentElement.classList` + `setGlobalState({theme})`
- [x] 12.2 父自身 themeConfig 跟随（antd4 ConfigProvider 已接，补 dark token）
- [x] 12.3 sub1 `App.vue` themeConfig 响应式 + `onGlobalStateChange` 监听 theme（初始 props.theme）
- [x] 12.4 sub3 根容器 `data-theme` class + `--ep-*` 变量覆盖切换 dark（onGlobalStateChange 监听）
- [x] 12.5 验收：父切 dark，sub1 按钮/卡片变暗、sub3 背景/主色切换，sub2/sub4 维持 light

## 13. i18n 父广播语言切换

端到端目标：父语言开关切换 zh-CN/en-US，4 子应用 + 父文案与 UI 库文案跟随。

- [x] 13.1 父 `MainLayout.vue` 语言切换控件 + `switchLang`（localStorage + setGlobalState({lang}) + 父 i18n 切换）
- [x] 13.2 父接入 vue-i18n（或已有：补父自身 i18n + antd4 locale）
- [x] 13.3 sub1/sub3（vue-i18n@9）：各子维护 locales/zh-CN|en-US，监听 lang 更新 i18n locale + UI 库 locale（antd4 zhCN/enUS、element-plus zhCn/en）；独立运行 localStorage 读取
- [x] 13.4 sub2/sub4（vue-i18n@8）：各自 locales + 监听 lang；独立运行 localStorage 读取
- [x] 13.5 验收：父切 en-US，父 + 4 子应用界面文案与 UI 库自带按钮文案（确定/取消）切换英文

## 14. 错误处理（10s 超时 + 无限重试 + unmount 忽略 + cleanupList）

端到端目标：子应用加载失败/超时显示 fallback UI + 无限手动重试；unmount 异常不中断；子应用 unmount 清理资源。

- [x] 14.1 父 `src/utils/errorHandler.ts`：超时工具 + 结构化错误；`register.ts` 生命周期回调（beforeLoad→loading、afterMount→ok、全局错误→failed）写 `appState` store
- [x] 14.2 父 `SubAppContainer.vue`：监听路由 + store 状态渲染 loading / fallback（a-result + 重试按钮，点击 `router.replace(route.fullPath)` 重触发加载）+ 10s 超时置 failed
- [x] 14.3 `afterUnmount` 异常 try/catch 忽略（日志），不中断
- [x] 14.4 4 个子应用 cleanupList 补真实登记示例：定时器 clearInterval、WebSocket close、axios AbortController（各子应用 mount 时登记，unmount 反向遍历执行）
- [x] 14.5 验收：关掉 sub2 dev server 访问其路由 → fallback UI 显示，启动后点重试成功；unmount 切换子应用无残留（容器 innerHTML 空）

## 15. 性能监控 4 指标防抖批量 sendBeacon

端到端目标：父 FCP/子加载/子 FCP/错误 4 指标采集，5 条或 30s 防抖，visibilitychange 立即 sendBeacon。

- [x] 15.1 父 `src/utils/perf.ts`：`reportPerf` 防抖缓冲（5 条/30s）+ `sendBeacon('/api/perf/report')` fallback axios.post + visibilitychange flush
- [x] 15.2 父入口注册 PerformanceObserver FCP → reportPerf({parent_fcp})；qiankun beforeLoad/afterMount 计算 `sub_load_<name>`；全局错误 → `sub_error_<name>`
- [x] 15.3 子应用（4 个）markFCP 后经 bridge 上报父（`setGlobalState({perf})` 或 props 回调）；独立运行时 console
- [x] 15.4 验收：dev 控制台观测 buffer 聚合（console 占位日志），visibilitychange/满 5 条触发 sendBeacon（无后端 404 静默）

## 16. prod 部署验证（UMD Vue2+Vue3 + preview 集成）

端到端目标：父 prod index.html 注入 Vue3/VueRouter/Vue2 三个 UMD（Vue2 挂 `window.Vue2`），preview 复验 4 子应用集成加载。

- [x] 16.1 父 `vite.config.ts` build-only 插件注入 3 个 UMD script（Vue3/VueRouter → window.Vue/VueRouter；Vue2 → window.Vue2）
- [x] 16.2 sub2/sub4 `vue.config.js` externals 改 `{ vue: 'Vue2' }`（与 8.2/10 对齐）；父 external 清单不含 vue2 但需确认父自身不用 Vue2
- [x] 16.3 `pnpm build:all` 后拷贝各子应用 `dist-qiankun` 到 `dist/microapp/<name>/`，`vite preview --port 4180`
- [x] 16.4 验收：`:4180/qiankun-demo/` 首页 + 逐个访问 4 子应用路径均正常渲染（含 window.Vue2 供 Vue2 子应用复用）
- [x] 16.5 验收：独立访问 —— 各子应用 `dist-standalone` 单独起静态服务可访问（抽查 sub2/sub4 各一）

---

### 验证记录（开发期填写）

#### 2026-10-28 样式问题根因修复（prod 集成复验）

修复的三处真实缺陷：

1. **sub4 element-ui 主题 CSS 完全未打包**
   - 现象：`dist-qiankun/css/app.css` 仅 0.5KB，`.el-button` 出现 0 次；按钮回落为浏览器默认灰底黑边黑字
   - 根因：`babel-plugin-import` 的 `styleLibraryName: 'theme-chalk'` 在本工程未实际注入 CSS
   - 修复：`packages/sub-vue2-element-ui/src/main.js` 显式 `import 'element-ui/lib/theme-chalk/index.css'`
   - 结果：产物新增 `chunk-vendors.*.css` 335.6KB，`.el-button` 222 处

2. **sub2/sub4 的 UI 库 CSS（chunk-vendors）完全未加 `[data-app]` 前缀**
   - 现象：业务样式 `app.css` 有前缀，但 antd1/element-ui 的 chunk-vendors CSS `data-app` 出现 0 次，样式全局泄漏、隔离失效
   - 根因：pnpm 真实路径位于仓库根 `node_modules/.pnpm/...`，`postcss-loader` 向上查找配置时命中不到子应用目录下的 `postcss.config.js`
   - 修复：`packages/sub-vue2-antd1|sub-vue2-element-ui/vue.config.js` 增加 `css.loaderOptions.postcss.postcssOptions.plugins`，显式传入前缀插件与 keyframes 插件（插件本身幂等，与原有配置重复执行安全）
   - 结果：sub2 chunk-vendors 227.3KB / `data-app` 2726 处 / `.ant-btn` 945 处；sub4 335.6KB / 3334 处 / `.el-button` 222 处；`.ant-modal` 39/54、`.el-dialog` 15/20、`.el-message` 60/76 为前缀形式

3. **sub2/sub4 的 reset.css 在 prod 集成下 404**
   - 现象：浏览器请求 `/reset.css`（根路径）返回 404
   - 根因：`public/index.html` 使用相对路径 `reset.css`，被浏览器按父应用 document baseURI 解析
   - 修复：改为 `<%= BASE_URL %>reset.css`（Vue CLI 模板变量随 `publicPath` 切换：qiankun 集成 → `/qiankun-demo/microapp/<name>/reset.css`，独立 → `/reset.css`）

#### prod 集成实测（vite preview :4180）

- 全局注入：`window.Vue3` / `window.Vue2` / `window.VueRouter` 均存在；`window.Vue` 保持 Vue2，`window.Vue.use` 为 function
- sub1 `/qiankun-demo/sub-vue3-antd4/home`：渲染正常，无样式异常
- sub2 `/qiankun-demo/sub-vue2-antd1/home`：主按钮 `background-color: rgb(24, 144, 255)`、白字、`height: 32px`；Modal 挂载在 `[data-app="sub-vue2-antd1"]` 内部
- sub3 `/qiankun-demo/sub-vue3-element-plus/home`：渲染正常，主按钮 `rgb(64, 158, 255)`，无黑底白字异常
- sub4 `/qiankun-demo/sub-vue2-element-ui/home`：主按钮 `rgb(64, 158, 255)`（element-ui 品牌蓝）；Dialog 挂载在 `[data-app="sub-vue2-element-ui"]` 内部
- console：仅 perf/report 网络错误与 ResizeObserver 警告，无 JS 运行时错误；`window.Vue.use is not a function` 已消除

#### standalone 产物实测

- sub2 `dist-standalone`：channel CSS 227.3KB、`data-app` 2726 处；`reset.css` 引用为 `/reset.css`
- sub4 `dist-standalone`：channel CSS 335.6KB、`data-app` 3334 处；`reset.css` 引用为 `/reset.css`

#### 2026-10-28 二轮验收修复（高度 / sub4 崩溃 / antd1 Drawer）

1. **子应用内容被顶到页面中部**
   - 根因：`SubAppContainer.vue` 的 `.sub-app-status` 在 ok 状态仍占 `min-height:240px` + `align-items:center`
   - 修复：默认 `display:none`，仅 `loading`/`failed` 时加 `.has-status` 占位
   - 结果：4 个子应用根元素 `rect.top` 均为 80px（紧贴 header）

2. **sub4 加载中崩溃 `TypeError: Cannot redefine property: $router`**
   - 根因：sub2/sub4 共用父应用全局 `window.Vue2` 的同一个 `Vue.prototype`，vue-router@3 的 `install` 无条件 `Object.defineProperty(Vue.prototype,'$router')`，第二个 Vue2 子应用再 `Vue.use(VueRouter)` 即抛错
   - 修复：两个子应用 `main.js` 改为 `if (!Object.prototype.hasOwnProperty.call(Vue.prototype,'$router')) Vue.use(VueRouter)`
   - 结果：sub4 正常渲染，无报错

3. **sub2 antd1 Drawer 打不开 + 弹层挂到 body**
   - 根因一：antd1 的 Drawer 未声明 `model: { prop: 'visible' }`（Modal 才有），`v-model` 绑到不存在的 `value` prop，`visible` 永远不变化
   - 根因二：仅改 `props.getContainer.default` 不够——Vue2 在组件创建时就执行 default，此时根容器尚未插入文档，`querySelector` 返回 null → 回退 `document.body`
   - 修复：Drawer 显式 `:visible` + `@close`；Drawer/Modal/Select 统一显式绑定 `:get-container` / `:get-popup-container`（传函数，由弹层打开时再调用）
   - 结果：Drawer 面板在右侧 256px、遮罩覆盖整屏、DOM 在 `[data-app="sub-vue2-antd1"]` 内；Modal 与 Select 下拉同样在根容器内且有背景色

#### 2026-10-29 三轮验收修复（sub4 `$router` 再次报错）

1. **sub4 重新报 `Cannot redefine property: $router`（第二轮判重失效）**
   - 现象：先加载 sub2 再加载 sub4 时，sub4 在 `LOADING_SOURCE_CODE` 阶段死亡，早于 `main.js` 的判重代码
   - 根因一：`vue-router@3` 的模块末尾有 `if (inBrowser && window.Vue) window.Vue.use(VueRouter)` 自动安装；`Vue.use` 只按插件对象身份去重，sub2/sub4 各打包了一份 vue-router，插件不是同一对象 → 自动安装阶段就重复 `defineProperty`
   - 根因二：子应用源码里做任何前置守卫都无效——webpack 会把入口的所有 `require` 提前执行，源码 import 顺序不决定执行顺序
   - 修复：补丁只能打在父应用侧。新增 `src/qiankun/vue2UseGuard.ts`，在 `register()` 与每次 `beforeLoad` 时给共用的 `window.Vue2.use` 包一层 try/catch
   - 判重策略修正：不能"已安装过就跳过"——vue-router 的 `install` 是先 `_Vue = Vue` 再 `defineProperty`，跳过会让第二份 vue-router 的模块级 `_Vue` 一直是 undefined，后续 `resolveAsyncComponents` 里 `_Vue.extend(...)` 抛 `Cannot read properties of undefined (reading 'extend')`。因此保持 install 正常执行，只吞掉重复定义 `$router`/`$route` 的错误
   - 结果：sub2 → sub4、sub4 → sub2 两个顺序均无任何 console error；sub4 根容器 `top=80 / height=160`、sub2 `top=80 / height=258`；切回 sub4 时 `.el-button` 正常、旧 sub2 DOM 已卸载
   - 弹层复验：sub4 Dialog（`.el-dialog` + `.el-dialog__wrapper`）与 sub2 Drawer（`.ant-drawer` + `.ant-drawer-content-wrapper`）均在各自 `[data-app]` 内，`body` 下无残留弹层

#### 2026-10-29 四轮验收修复（sub4 下拉被裁剪 + 子应用高度铺满页面）

1. **sub4「选择城市」下拉面板只见一条白边**
   - 现象：面板定位正常（贴输入框下方 12px、左对齐、宽 320），`bodyPopper=0`（确实挂在根容器内），但三条选项全看不到
   - 根因：`el-select` 用 `popper-append-to-body=false` 把面板放进 `.el-card` 内部，而 element-ui 的 `.el-card` 默认 `overflow: hidden`，面板只有顶部约 9px 落在卡片边界内
   - 修复：`About.vue` 给卡片加 `.about-card { overflow: visible }`（前缀后特异性 `(0,2,0)` > `.el-card` 的 `(0,1,0)`）。不改弹层挂载策略，仍满足「弹层必须在根容器内」
   - 结果：面板 `237→353` 完整显示，3 个选项 `visible=3`，选中「上海」后输入框正确回显

2. **4 个子应用根容器高度不铺满、`padding` 也没生效**
   - 根因：PostCSS 前缀把 `.sub-app-root` 改写成 `[data-app="xxx"] .sub-app-root`（**后代**选择器），而 `data-app` 就在根元素自身上，规则永远匹配不到 → 连原有的 `padding` 一直没生效
   - 修复：根容器规则改用属性+类复合选择器 `[data-app="xxx"].sub-app-root`（含 APP_SELECTOR 时 `postcss-prefix-selector` 的 `transform` 会跳过，保持原样）
   - 高度方案：父应用在**非 scoped** 的 `<style>` 里定义 `:root { --qk-subapp-min-height: calc(100vh - 96px) }`（视口 − header 64 − content 上下 padding 32），4 个子应用根容器 `min-height: var(--qk-subapp-min-height, 100vh)`；独立运行无该变量时回退 100vh
   - 底色：父应用给 `--qk-subapp-bg`（light `#fff` / `html.dark` `#141414`），sub1/sub3 用 `var()` 跟随；sub2/sub4 在根容器内本地覆盖为 `#fff`，维持 light 分档
   - 注意：`:root` 不能写进 scoped 块（会被编译成 `:root[data-v-xxx]`）
   - 结果：606×651 视口下 4 个子应用均为 `top=80 / height=555`、`min-height=555px`、`padding` 12/16/12/16px、白底，`scrollHeight == innerHeight` 无纵向滚动
   - 主题复验：切 dark 后 sub1/sub3 根容器 `rgb(20,20,20)`，sub2/sub4 仍 `rgb(255,255,255)`；sub4 下拉 `count=3 / visible=3`，全程无 console error

3. **子应用内切到 /about 时父菜单高亮消失**
   - 根因：`selectedKeys` 直接取 `[route.path]` 与菜单 key（`/sub-xxx/home`）做全等比较；子应用内跳到 `/sub-xxx/about` 后没有任何 key 命中
   - 修复：`MainLayout.vue` 增加 `MENU_KEYS`，按 base 前缀匹配归一到对应一级菜单 key
   - 结果：`/sub-vue2-element-ui/about`、`/sub-vue3-antd4/about` 下高亮均保持在所属子应用菜单；回父首页恢复 Parent Home

4. **父应用切暗色/英文后，首次进入 sub1/sub3 仍是亮色/中文**
   - 根因一：qiankun 的 `onGlobalStateChange(cb, true)` 首帧回调是 `cb(cloneState, cloneState)`——`prev` 与 `state` 是**同一对象**，子应用用 `state.theme !== prev.theme` 判等，首帧恒为 false 被跳过
   - 根因二：`props.theme` / `props.lang` 是父应用 `registerMicroApps` 时的快照（写死 `light` / `zh-CN`），运行期切换不会同步
   - 修复（4 个子应用统一）：回调改为与**本地当前值**比较（sub1/sub3 比 `uiTheme` / `uiLang` / `currentLang`，sub2/sub4 比模块级 `currentLang`）；`render` 不再用 `props.lang` 建 i18n，改用回调落下的当前值；sub3 的 `applyTheme(props.theme)` 挪到注册广播**之前**，否则会把首帧拿到的真实主题覆盖回旧值
   - 父应用侧：`makeProps` 的 `theme`/`lang` 改从 `localStorage` 取，与 `INITIAL_GLOBAL_STATE` 同源，避免首帧两处矛盾
   - 结果：暗色下首次进入 sub1 `.a4-card` = `rgb(20,20,20)`、文字 `rgba(255,255,255,.85)`；sub3 根容器 `data-theme=dark`、`.ep-card` = `rgb(20,20,20)`；sub2 维持 `rgb(255,255,255)`（分档约束）；二次进入 sub1 仍为暗色（不依赖重新切换）
   - 语言复验：EN 下 sub4 弹窗按钮 `Cancel`/`OK`，切回「中文」变 `取消`/`确定`（由 `$t` 驱动，说明 i18n 已跟随）


