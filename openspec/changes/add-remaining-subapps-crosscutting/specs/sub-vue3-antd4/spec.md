## MODIFIED Requirements

### Requirement: sub-vue3-antd4 主题运行时切换

sub-vue3-antd4 SHALL 在 `App.vue` 用 `theme` 响应式值驱动 `<a-config-provider :theme>`（light/dark token），`mount(props)` 时经 `onGlobalStateChange` 监听 `theme` 变化并更新。初始值取 `props.theme`（父注入）。

#### Scenario: sub1 监听 theme 广播并切换

- **WHEN** 父应用广播 `theme: 'dark'`
- **THEN** sub-vue3-antd4 ConfigProvider theme token 切换为 dark，按钮/卡片变暗

### Requirement: sub-vue3-antd4 语言切换

sub-vue3-antd4 SHALL 在 `onGlobalStateChange` 监听 `lang`，同步更新 vue-i18n locale 与 antd4 locale（`zhCN`/`enUS`），初始值取 `props.lang`。独立运行时从 `localStorage.getItem('lang')` 读取（默认 zh-CN）。

#### Scenario: sub1 监听 lang 广播并切换

- **WHEN** 父应用广播 `lang: 'en-US'`
- **THEN** sub-vue3-antd4 界面文案与 antd4 组件内置文案（确定/取消）切换为英文
