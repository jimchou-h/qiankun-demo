## MODIFIED Requirements

### Requirement: 父应用启动与 qiankun 子应用注册

父应用 SHALL 在 `src/qiankun/index.ts` 中注册全部 4 个子应用：sub-vue3-antd4（dev `http://localhost:5801`，prod `/qiankun-demo/microapp/sub-vue3-antd4/`）、sub-vue2-antd1（dev `http://localhost:5802`，prod `/qiankun-demo/microapp/sub-vue2-antd1/`）、sub-vue3-element-plus（dev `http://localhost:5803`，prod `/qiankun-demo/microapp/sub-vue3-element-plus/`）、sub-vue2-element-ui（dev `http://localhost:5804`，prod `/qiankun-demo/microapp/sub-vue2-element-ui/`）。`activeRule` 各自为 `/qiankun-demo/<name>`，props 注入公共 8 字段（base/axios/userInfo/tenant/permission/BASE_URL/theme/lang）。

#### Scenario: 注册并加载 sub-vue2-antd1

- **WHEN** 浏览器 URL 切到 `/qiankun-demo/sub-vue2-antd1/home`
- **THEN** qiankun 从 `http://localhost:5802`（dev）加载 sub-vue2-antd1，挂载到 `#sub-app-container`

#### Scenario: 注册并加载 sub-vue3-element-plus

- **WHEN** 浏览器 URL 切到 `/qiankun-demo/sub-vue3-element-plus/home`
- **THEN** qiankun 从 `http://localhost:5803`（dev）加载 sub-vue3-element-plus，挂载到 `#sub-app-container`

#### Scenario: 注册并加载 sub-vue2-element-ui

- **WHEN** 浏览器 URL 切到 `/qiankun-demo/sub-vue2-element-ui/home`
- **THEN** qiankun 从 `http://localhost:5804`（dev）加载 sub-vue2-element-ui，挂载到 `#sub-app-container`

### Requirement: 父应用 Layout 与导航菜单

父应用导航菜单 SHALL 包含 4 个子应用入口（sub-vue3-antd4 / sub-vue2-antd1 / sub-vue3-element-plus / sub-vue2-element-ui）+ 父应用首页。菜单点击 `router.push` 到对应子应用路径。

#### Scenario: 导航菜单含 4 个子应用项

- **WHEN** 访问父应用首页
- **THEN** 导航菜单显示 4 个子应用项，点击各自跳转到 `/sub-<name>/home`

### Requirement: 父应用全局错误处理（升级为超时重试）

父应用 SHALL 实现子应用加载 10s 超时判失败 + `#sub-app-container` 内 fallback UI（错误提示 + 无限次手动重试按钮）。`addGlobalUncaughtErrorHandler` 保留结构化上报。

#### Scenario: 加载失败/超时显示 fallback 与重试

- **WHEN** 子应用加载失败或超过 10s
- **THEN** 容器内显示错误 UI + 重试按钮，点击重新加载，无限次

## ADDED Requirements

### Requirement: 父应用 prod 加载 Vue2 与 Vue3 UMD

父应用 prod 构建的 `index.html` SHALL 注入 Vue3 + VueRouter UMD（`window.Vue`/`window.VueRouter`）**和 Vue2 UMD**（`vue@2.7.14`，供 sub-vue2-antd1 / sub-vue2-element-ui 的 build:qiankun 产物复用）。注入 SHALL 由 `vite.config.ts` 内联 build-only 插件完成，位于入口 module script 之前。

#### Scenario: prod 产物含 Vue2+Vue3 UMD

- **WHEN** 执行 `pnpm build`
- **THEN** `dist/index.html` `<head>` 含 Vue3/VueRouter/Vue2 三个 UMD script，位于入口 module script 之前

### Requirement: 父应用主题与语言切换入口

父应用 SHALL 在 Layout 提供主题切换（light/dark）与语言切换（zh-CN/en-US）控件，调用 `initGlobalState` 广播 `theme`/`lang`，同时写 `localStorage`。

#### Scenario: 切换主题广播到子应用

- **WHEN** 用户在父应用切换主题
- **THEN** `actions.setGlobalState({ theme })` 广播，父自身同步切换并给 `documentElement` 加 class

#### Scenario: 切换语言广播到子应用

- **WHEN** 用户在父应用切换语言
- **THEN** `actions.setGlobalState({ lang })` 广播，父自身 i18n 同步切换
