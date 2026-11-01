## Why

sub-vue3-antd4 端到端切片已验收并归档，qiankun 脚手架模式（PostCSS 前缀隔离 / 弹窗挂载点改造 / 生命周期 / 双 build / props+initGlobalState 通信）已验证可复制。剩余 3 个子应用（sub-vue2-antd1、sub-vue3-element-plus、sub-vue2-element-ui）与父应用完整注册、以及主题分档 / i18n 广播 / 错误处理 / 性能监控 / prod 部署等横切能力尚未落地，本 change 一次性开发完，交付可验收的完整 4 子应用 demo。

## What Changes

- 新建 **sub-vue2-antd1**（Vue2 + Ant Design Vue 1.7.5，Vue CLI 5 + Webpack 5，手写 `bootstrap/mount/unmount` 生命周期）：
  - `vue.config.js` 双 build（`build:standalone` 自带 Vue / `build:qiankun` external Vue，UMD + `jsonpFunction` 隔离）
  - `postcss.config.js` 选择器加 `[data-app="sub-vue2-antd1"]` 前缀 + keyframes 前缀（antd1 静态 CSS 无 CSS 变量，无需 namespace）
  - `src/components/antd.js` 弹窗 getContainer 默认值改造（仿参考项目 builder）
  - 根 div `data-app="sub-vue2-antd1"` + z-index 3000；路由 base 经 qiankun props 动态注入
- 新建 **sub-vue3-element-plus**（Vue3 + Element Plus，Vite + vite-plugin-qiankun）：
  - `namespace="ep"` 把 `--el-*` 变量改为 `--ep-*`（CSS 变量源头隔离，仅此子应用）
  - 弹窗类组件业务代码逐个 `append-to-body=false` / `teleported=false`；全局 API（Message/Notification/MessageBox）`appendTo` 指定子应用根容器
  - 根 div `data-app="sub-vue3-element-plus"` + z-index 4000；双 build + 路由 base 注入
- 新建 **sub-vue2-element-ui**（Vue2 + Element UI 2.x，Vue CLI 5 + Webpack 5，手写生命周期）：
  - `vue.config.js` 双 build（同 sub2 模式）
  - `postcss.config.js` 选择器前缀（element-ui 静态 CSS 无 CSS 变量）
  - 弹窗/下拉组件业务代码逐个 `append-to-body=false` / `popper-append-to-body=false`；Message/Notification/MessageBox 全局方法包装 appendTo
  - 根 div `data-app="sub-vue2-element-ui"` + z-index 5000
- **父应用**：注册 3 个子应用（entry dev `http://localhost:5802/5803/5804`，prod `/qiankun-demo/microapp/<name>/`），导航菜单补 4 项，根脚本补 `dev:sub-*` / `build:sub-*` 与 `dev:all`/`build:all` 聚合，`pnpm.overrides` 补 `vue@^2` = 2.7.14、`vue-router@^3` = 3.6.5
- **跨切能力**：
  - 主题分档运行时切换：父 + sub1 + sub3 跟随 `theme` 全局状态切换；sub2/sub4 维持 light（父给 `documentElement` 加 class 有限覆盖）
  - i18n：子应用各自维护 locale 文件（Vue2 用 vue-i18n@8，Vue3 用 vue-i18n@9），父应用通过 `initGlobalState` 广播 `lang`
  - 错误处理：子应用加载 10s 超时判失败 + fallback UI 无限次手动重试 + unmount 异常忽略继续加载下一个 + 各子应用 cleanupList 全量登记（ECharts/WebSocket/Worker/axios abort 等占位到真实资源）
  - 性能监控：4 项核心指标（父 FCP / 子加载耗时 / 子 FCP / 错误率），防抖（5 条或 30s）+ `navigator.sendBeacon` 批量上报
  - prod 部署：父应用 prod 加载 Vue3+Vue2 UMD 到 window，`vite preview` 复验同域部署集成

## Capabilities

### New Capabilities

- `sub-vue2-antd1`: sub2 子应用——Vue2+antd1.7.5，Vue CLI 5 双 build + 手写生命周期 + 弹窗 getContainer 改造 + 独立访问 fallback
- `sub-vue3-element-plus`: sub3 子应用——Vue3+element-plus，namespace ep 的 CSS 变量隔离 + 弹窗 append-to-body/teleported 逐个配置 + 双 build + 独立访问 fallback
- `sub-vue2-element-ui`: sub4 子应用——Vue2+element-ui 2.x，Vue CLI 5 双 build + 手写生命周期 + 弹窗 append-to-body 逐个配置 + 独立访问 fallback
- `crosscutting-theme-i18n`: 主题分档（父+sub1+sub3 运行时切换，sub2/sub4 维持 light）+ i18n（子应用各自 locale，父广播 lang）
- `crosscutting-error-perf`: 错误处理（10s 超时 + 无限手动重试 + unmount 异常忽略 + cleanupList 清理）+ 性能监控（4 指标防抖批量 sendBeacon）

### Modified Capabilities

- `microfrontend-shell`: 父应用注册扩展到 4 个子应用（新增 sub2/sub3/sub4 三条 entry），导航菜单 4 项，根脚本/端口/overrides 补全，错误处理升级为 10s 超时 + fallback UI 重试
- `parent-child-state`: theme/lang 从占位 console 升级为完整广播——父 `toggleTheme`/`switchLang` 通过 `initGlobalState` 广播，各子应用 `onGlobalStateChange` 消费
- `subapp-css-isolation`: 新增 element-plus namespace（`--el-*` → `--ep-*`）与 sub2/sub4 静态 CSS 无变量的隔离约定；element 系弹窗配置方式补充
- `sub-vue3-antd4`: sub1 支持主题运行时切换（themeConfig 跟随）+ lang 切换（vue-i18n + antd locale 同步）

## Impact

- **新增代码**：`packages/sub-vue2-antd1/`、`packages/sub-vue3-element-plus/`、`packages/sub-vue2-element-ui/` 整套子应用；父应用 `src/qiankun/index.ts`（+3 条）、`src/layouts/MainLayout.vue`（+3 导航项 + 主题/语言切换 UI）、`src/utils/perf.ts`（sendBeacon 上报）、`src/utils/errorHandler.ts`（10s 超时重试）、根 `package.json`/`pnpm-workspace.yaml`/`vite.config.ts`
- **依赖新增**：Vue2 2.7.14、vue-router 3.6.5、vue-i18n 8、element-plus、element-ui、ant-design-vue@1.7.5、@vue/cli-service、webpack、vue-template-compiler（Vue2 必须配 `vue@^2` overrides）、cross-env
- **版本约束**：根 `pnpm.overrides` 补 `vue@^2` = 2.7.14、`vue-router@^3` = 3.6.5（Vue2 子应用与父 Vue3 并存）
- **不受影响**：sub-vue3-antd4 现有功能（仅增量加主题/lang 切换）、已归档 specs
- **风险点**：Vue CLI 5 与 pnpm workspace 的 peer 依赖解析、antd1/element-ui 在 PostCSS 前缀下的样式完整性、element-plus `--ep-*` namespace 与 PostCSS 双前缀叠加、Vue2/Vue3 共存时 `vue-demi` 版本解析
