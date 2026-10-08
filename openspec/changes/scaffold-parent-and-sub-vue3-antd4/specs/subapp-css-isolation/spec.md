## ADDED Requirements

### Requirement: PostCSS 选择器前缀（第 1 层防护）

sub-vue3-antd4 子应用 SHALL 在 `postcss.config.js` 配置 `postcss-prefix-selector`，给所有 CSS 选择器加 `[data-app="sub-vue3-antd4"]` 前缀。`transform` 函数 MUST 跳过 `body`、`html`、`:root`、`*` 全局选择器（这些加前缀后匹配不上）。配置 MUST NOT 排除 `node_modules` 里的 antd4 样式（要一起改写）。

#### Scenario: 业务选择器被加前缀

- **WHEN** sub-vue3-antd4 业务代码 SFC `<style scoped>` 写 `.demo-card { color: red }`
- **THEN** 构建产物 CSS 改写为 `[data-app="sub-vue3-antd4"] .demo-card { color: red }`

#### Scenario: antd4 选择器被加前缀

- **WHEN** antd4 内置样式 `.ant-btn` 被构建
- **THEN** 构建产物 CSS 改写为 `[data-app="sub-vue3-antd4"] .ant-btn`（注意：实际 class 名因 namespace 改为 `.a4-btn`，PostCSS 仍会再加 `[data-app]` 前缀）

#### Scenario: 全局选择器被跳过

- **WHEN** CSS 含 `body { margin: 0 }` 或 `html { font-size: 16px }` 或 `:root { --x: 1 }` 或 `* { box-sizing: border-box }`
- **THEN** 构建产物 CSS 原样保留，**不**被加 `[data-app]` 前缀（避免匹配不上全局元素）

### Requirement: PostCSS keyframes 改名

sub-vue3-antd4 SHALL 配置 `postcss-rename-keyframes`，给所有 `@keyframes` 名加 `sub-vue3-antd4-` 前缀，避免与其他子应用的动画名冲突。

#### Scenario: 业务 keyframes 被改名

- **WHEN** sub-vue3-antd4 业务 CSS 定义 `@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`，并通过 `animation: fadeIn 0.3s` 引用
- **THEN** 构建产物 CSS 中 `@keyframes` 名为 `sub-vue3-antd4-fadeIn`，且 `animation` 引用同步改为 `sub-vue3-antd4-fadeIn 0.3s`

### Requirement: antd4 namespace prefixCls（第 2 层防护）

sub-vue3-antd4 SHALL 在根 `<a-config-provider prefix-cls="a4-">` 设置 antd4 prefixCls，所有 antd4 组件 class 名从 `ant-*` 改为 `a4-*`。MUST 在 App.vue 根用 `<a-config-provider>` 包裹全部内容。

#### Scenario: antd4 组件 class 带 a4- 前缀

- **WHEN** sub-vue3-antd4 渲染 `<a-button>demo</a-button>`
- **THEN** DOM 产物 button 元素的 class 含 `a4-btn`，**不**含 `ant-btn`

#### Scenario: antd4 内置样式选择器同步改名

- **WHEN** antd4 内置 CSS 含 `.ant-btn { ... }`
- **THEN** antd4 运行时（CSS-in-JS 或预编译产物）的 class 选择器同步改 `a4-btn`（由 antd4 自身根据 prefixCls 处理），且 PostCSS 第 1 层再在前加 `[data-app]`

### Requirement: 子应用根容器 data-app 属性

sub-vue3-antd4 根 `App.vue` 的根 div SHALL 带 `data-app="sub-vue3-antd4"` 属性，作为 PostCSS 前缀匹配锚点 + 弹窗 getContainer 目标。

#### Scenario: 子应用根 div 属性可验证

- **WHEN** 在父应用页面激活 sub-vue3-antd4 后，DevTools 检查 `#sub-app-container` 内的子应用根 div
- **THEN** 该 div 有 `data-app="sub-vue3-antd4"` 属性

### Requirement: 子应用 z-index 基数隔离 stacking context

sub-vue3-antd4 根 div SHALL 设置 `position: relative; z-index: 2000`，创建独立 stacking context。子应用内部所有弹窗 z-index（如 antd4 Modal 默认 1000）MUST 在子应用 stacking context 内部计算，不穿透到父应用或其他子应用。

#### Scenario: 子应用弹窗不穿透到父应用

- **WHEN** sub-vue3-antd4 弹出一个 antd4 Modal，Modal z-index 设为 1000
- **THEN** 该 Modal DOM 挂载在 `[data-app="sub-vue3-antd4"]` 内部，Modal 实际渲染 z-index 计算基数为 2000（子应用根 z-index）+ 1000（Modal 自身 z-index）= 3000，但仅限于子应用 stacking context 内部，**不**穿透到父应用 z-index 1000 之上的其他元素

### Requirement: 弹窗 getContainer 改造（第 3 层防护）

sub-vue3-antd4 SHALL 在 `src/utils/setupAntd.ts` 中批量修改 antd4 portal 类组件的 `props.getContainer.default` 为 `() => document.querySelector('[data-app="sub-vue3-antd4"]') || document.body`。覆盖组件 MUST 包含：`Modal`、`Drawer`、`Tooltip`、`Popover`、`Dropdown`、`Select`、`DatePicker`、`Cascader`、`TreeSelect`、`Popconfirm`。函数式 API（`message`、`notification`、`Modal.confirm`）SHALL 通过 `App.useApp()` 或手动传 `getContainer` 参数处理。

#### Scenario: Modal 挂载到子应用根容器而非 body

- **WHEN** sub-vue3-antd4 业务代码 `<a-modal v-model:open="visible">demo</a-modal>` 的 `visible` 切换为 true
- **THEN** Modal DOM 挂载到 `[data-app="sub-vue3-antd4"]` 内部（子应用根 div 下），**不**挂载到 `document.body`

#### Scenario: Drawer 挂载到子应用根容器

- **WHEN** sub-vue3-antd4 业务代码渲染 `<a-drawer />` 并打开
- **THEN** Drawer DOM 挂载到 `[data-app="sub-vue3-antd4"]` 内部

#### Scenario: Select 下拉面板挂载到子应用根容器

- **WHEN** sub-vue3-antd4 业务代码渲染 `<a-select />` 并展开下拉
- **THEN** 下拉面板 DOM 挂载到 `[data-app="sub-vue3-antd4"]` 内部
