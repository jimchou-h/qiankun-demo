## ADDED Requirements

### Requirement: sub-vue3-element-plus 独立骨架与 qiankun 生命周期

sub-vue3-element-plus SHALL 是 Vue3 + Element Plus 子应用，用 Vite + vite-plugin-qiankun 构建，`main.ts` 用 `renderWithQiankun` 暴露生命周期。根 div SHALL 带 `data-app="sub-vue3-element-plus"` + `position: relative; z-index: 4000`，外层 `<el-config-provider :namespace="'ep'">` 包裹。独立运行（非 qiankun）直接 `render({})` 零配置 fallback。

#### Scenario: sub-vue3-element-plus 独立 dev 启动

- **WHEN** 执行 `pnpm dev:sub-vue3-element-plus`，浏览器访问 `http://localhost:5803/home`
- **THEN** element-plus Button + Dialog 正常渲染，无 qiankun 依赖

#### Scenario: sub-vue3-element-plus qiankun 模式

- **WHEN** 父应用通过 qiankun 加载 sub-vue3-element-plus
- **THEN** mount(props) 用 `props.base` 重建 router，unmount 执行 cleanupList + `app.unmount()`

### Requirement: sub-vue3-element-plus CSS 变量隔离（namespace ep）

sub-vue3-element-plus SHALL 通过 `<el-config-provider namespace="ep">` 把 element-plus 的 CSS 变量 `--el-*` 改为 `--ep-*`（CSS 隔离第 3 层），配合 PostCSS 给所有选择器加 `[data-app="sub-vue3-element-plus"]` 前缀（第 1 层）。子应用代码禁止写 `:root { --xxx }`；自定义 CSS 变量定义在子应用根 div 上。

#### Scenario: element-plus 变量被改写为 --ep-*

- **WHEN** 访问 `:5803/home`，DevTools 检查根容器内 CSS 变量
- **THEN** 变量名为 `--ep-*` 而非 `--el-*`，与其他子应用/父应用互不污染

#### Scenario: 选择器带 data-app 前缀

- **WHEN** 检查产物 CSS
- **THEN** `.el-button` 等被改写为 `[data-app="sub-vue3-element-plus"] .el-button`

### Requirement: sub-vue3-element-plus 弹窗挂载隔离

sub-vue3-element-plus 的弹窗类组件（Dialog/Drawer/Tooltip/Popover/Dropdown/Select/DatePicker/Cascader）SHALL 在业务代码逐个配置 `append-to-body=false` 或 `teleported=false`；Message/Notification/MessageBox 全局 API SHALL 通过 `appendTo` 指定子应用根容器。element-plus 无全局 getContainer 配置项。

#### Scenario: Dialog 挂载到子应用根容器

- **WHEN** 点击打开 Dialog
- **THEN** Dialog DOM 在 `[data-app="sub-vue3-element-plus"]` 内部而非 body

#### Scenario: Message 挂载到子应用根容器

- **WHEN** 触发 ElMessage.success
- **THEN** Message DOM 在子应用根容器内部

### Requirement: sub-vue3-element-plus 双 build 与独立访问

sub-vue3-element-plus SHALL 双 build：`build:standalone`（自带 Vue，`dist-standalone/`）+ `build:qiankun`（external `vue`/`vue-router`，UMD + globals + `inlineDynamicImports`，`dist-qiankun/`，从父 `window.Vue` 取）。pinia/vue-i18n/element-plus 不 external（各自打包）。

#### Scenario: build:qiankun 产物为 UMD 且 external Vue

- **WHEN** 执行 `pnpm --filter sub-vue3-element-plus build:qiankun`
- **THEN** `dist-qiankun/` 产物头部为 UMD 包装，无 Vue 运行时特征，集成模式从 `window.Vue` 取
