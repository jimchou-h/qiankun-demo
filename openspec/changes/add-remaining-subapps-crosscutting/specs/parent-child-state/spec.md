## MODIFIED Requirements

### Requirement: 主题广播完整实现

父应用 `toggleTheme(newTheme)` SHALL：`setGlobalState({ theme })` 广播 + 父自身 themeConfig 切换 + `document.documentElement.className` 更新 + `localStorage.setItem('theme')`。支持主题切换的子应用（sub1 antd4、sub3 element-plus）SHALL 在 `onGlobalStateChange` 监听 `theme` 变化并更新自身主题（antd4 改 ConfigProvider theme token；element-plus 覆盖 `--ep-color-primary` 等变量）。sub2/sub4 不响应 `theme` 变化，维持 light。

#### Scenario: sub1 跟随主题切换

- **WHEN** 父广播 `theme: 'dark'`
- **THEN** sub-vue3-antd4 ConfigProvider theme token 切换为 dark，界面变暗

#### Scenario: sub3 跟随主题切换

- **WHEN** 父广播 `theme: 'dark'`
- **THEN** sub-vue3-element-plus 覆盖 `--ep-*` 变量切换为 dark

#### Scenario: sub2/sub4 不响应

- **WHEN** 父广播 `theme: 'dark'`
- **THEN** sub-vue2-antd1 / sub-vue2-element-ui 界面维持 light

### Requirement: 语言广播完整实现

父应用 `switchLang(lang)` SHALL：`setGlobalState({ lang })` 广播 + 父自身 i18n 切换 + `localStorage.setItem('lang')`。所有子应用 SHALL 在 `onGlobalStateChange` 监听 `lang` 并更新自身 i18n locale 与 UI 库 locale（antd4 的 `zhCN`/`enUS`、element-plus 的 `zhCn`/`en`）。

#### Scenario: 全部子应用跟随语言切换

- **WHEN** 父广播 `lang: 'en-US'`
- **THEN** 4 个子应用文案与 UI 库自带文案切换为英文
