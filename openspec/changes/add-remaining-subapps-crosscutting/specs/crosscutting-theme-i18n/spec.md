## ADDED Requirements

### Requirement: 主题分档运行时切换

父应用 SHALL 提供主题切换入口（`theme: 'light' | 'dark'`），经 `initGlobalState` 广播给所有子应用。**分档支持**：父 + sub1（antd4）+ sub3（element-plus）运行时切换跟随；sub2（antd1）+ sub4（element-ui）不支持运行时切换，维持 light。父应用切换时 SHALL 给 `document.documentElement` 加 `dark` class 供 sub2/sub4 业务 CSS 有限覆盖。

#### Scenario: 父应用切换 dark，sub1/sub3 跟随

- **WHEN** 用户在父应用切换主题为 dark
- **THEN** 父 Layout 变暗，sub-vue3-antd4（antd4 ConfigProvider theme token）与 sub-vue3-element-plus（覆盖 `--ep-color-primary` 等变量）同步切换

#### Scenario: sub2/sub4 维持 light

- **WHEN** 主题切为 dark 时加载 sub-vue2-antd1 或 sub-vue2-element-ui
- **THEN** 子应用 UI 维持 light 主题（`documentElement.dark` class 由父维护，业务 CSS 可选用 `.dark` 覆盖）

### Requirement: i18n 父广播语言切换

每个子应用 SHALL 各自维护 locale 文件（Vue2 用 vue-i18n@8，Vue3 用 vue-i18n@9，zh-CN/en-US）。父应用 SHALL 提供语言切换入口，经 `initGlobalState` 广播 `lang`；子应用 `onGlobalStateChange` 监听 `lang` 变化更新自身 i18n（含 UI 库 locale：antd4 `zhCN`/`enUS`、element-plus `zhCn`/`en`）。子应用独立访问时从 `localStorage.getItem('lang')` 拿语言（默认 zh-CN）。

#### Scenario: 父广播 en-US，所有子应用跟随

- **WHEN** 父应用切换语言为 en-US
- **THEN** 父 + 4 个子应用的界面文案与 UI 库自带文案（确定/取消等）同步切换为英文

#### Scenario: 子应用独立访问时语言持久化

- **WHEN** 子应用独立打开（非 qiankun 模式）
- **THEN** 语言从 localStorage 读取（默认 zh-CN），界面正常渲染
