# parent-child-state

## Purpose

定义 qiankun 微前端父子应用之间的通信规范：父→子通过 props 注入（base/userInfo/tenant/permission/axios/BASE_URL/theme/lang），子→父/子→子通过 initGlobalState 广播，且父子应用之间不共享 Pinia。

## Requirements

### Requirement: 父→子通过 qiankun props 注入

父应用 SHALL 通过 `registerMicroApps` 的 `props` 字段向 sub-vue3-antd4 注入以下字段：`base`（子应用**路由前缀**，dev/prod 均为 `/qiankun-demo/sub-vue3-antd4`，与 activeRule 同源；注意区别于 `entry` 的**资源路径** `/qiankun-demo/microapp/sub-vue3-antd4/`）、`userInfo`（mock 用户对象）、`tenant`（mock 租户）、`permission`（mock 权限码数组）、`axios`（父应用 axios 实例）、`BASE_URL`（API 基址）、`theme`（默认 `'light'`）、`lang`（默认 `'zh-CN'`）。

#### Scenario: 子应用 mount 时收到完整 props 注入

- **WHEN** qiankun 调用 sub-vue3-antd4 的 `mount(props)` 生命周期
- **THEN** `props` 对象包含 `base`、`userInfo`、`tenant`、`permission`、`axios`、`BASE_URL`、`theme`、`lang` 八个字段，且 `axios` 是父应用创建的实例（非子应用自己创建）

### Requirement: 子→父/子→子通过 initGlobalState 广播

父应用 SHALL 通过 qiankun `initGlobalState` 初始化全局 state，含 `msgNum`（子应用上报的消息数）、`theme`（主题）、`lang`（语言）、`logoutSignal`（登出信号）四个字段。sub-vue3-antd4 子应用在 `mount` 时拿到 `props.onGlobalStateChange` 与 `props.setGlobalState`，SHALL 用 `setGlobalState` 上报 `msgNum` 给父，SHALL 用 `onGlobalStateChange` 监听父广播的 `lang` 切换事件。

#### Scenario: 子应用上报 msgNum 给父

- **WHEN** sub-vue3-antd4 内用户触发某个动作（如点击按钮），子应用调用 `props.setGlobalState({ msgNum: <num> })`
- **THEN** 父应用 `onGlobalStateChange` 回调被触发，收到更新后的 `msgNum` 值，可在父 Layout 显示徽标

#### Scenario: 子应用监听父广播的 lang 切换

- **WHEN** 父应用调用 `setGlobalState({ lang: 'en-US' })` 广播语言切换
- **THEN** sub-vue3-antd4 的 `onGlobalStateChange` 回调被触发，参数含 `lang: 'en-US'`，子应用据此切换 vue-i18n 实例 locale + antd4 ConfigProvider locale

#### Scenario: 子→子通信经父中转

- **WHEN** sub-vue3-antd4 调用 `setGlobalState({ msgNum: <num> })` 想通知未来接入的 sub-vue2-antd1
- **THEN** 父应用 `onGlobalStateChange` 收到该值，父应用负责再次广播给所有子应用（sub-vue2-antd1 后续接入后也会收到）

### Requirement: 不共享 Pinia

父子应用之间 SHALL NOT 共享 Pinia 实例。父应用用 Pinia（Vue3），sub-vue3-antd4 子应用独立创建自己的 Pinia 实例。跨应用状态走 `props` + `initGlobalState`，禁止通过共享 Pinia store 传递。

#### Scenario: 子应用创建独立 Pinia 实例

- **WHEN** sub-vue3-antd4 `mount(props)` 执行
- **THEN** 子应用内部 `createPinia()` 创建一个**新的** Pinia 实例并 install 到子应用 Vue 实例，**不**从 `props` 接收父应用的 Pinia 实例

#### Scenario: 父应用不向子应用注入 Pinia

- **WHEN** 父应用配置 qiankun `registerMicroApps` 的 props
- **THEN** props 字段中**不**包含 `pinia` 或类似 Pinia store 字段（仅有 `base` / `userInfo` / `tenant` / `permission` / `axios` / `BASE_URL` / `theme` / `lang`）
