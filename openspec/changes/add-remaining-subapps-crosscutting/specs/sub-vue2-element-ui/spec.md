## ADDED Requirements

### Requirement: sub-vue2-element-ui 独立骨架与手写生命周期

sub-vue2-element-ui SHALL 是 Vue2 + Element UI 2.x 子应用，用 Vue CLI 5（Webpack 5）构建，手写 qiankun 生命周期。`main.js` SHALL 判断 `window.__POWERED_BY_QIANKUN__`，qiankun 模式设置 `__webpack_public_path__` 后导出生命周期，独立运行直接 `render()`。

#### Scenario: sub-vue2-element-ui 独立 dev 启动

- **WHEN** 执行 `pnpm dev:sub-vue2-element-ui`，浏览器访问 `http://localhost:5804/home`
- **THEN** element-ui Button + Dialog 正常渲染，无 qiankun 依赖

#### Scenario: sub-vue2-element-ui qiankun 模式生命周期

- **WHEN** 父应用通过 qiankun 加载 sub-vue2-element-ui
- **THEN** mount(props) 用 `props.base` 重建 router，unmount 执行 cleanupList + `instance.$destroy()`

### Requirement: sub-vue2-element-ui CSS 隔离与弹窗挂载

sub-vue2-element-ui SHALL 用 PostCSS 给所有选择器加 `[data-app="sub-vue2-element-ui"]` 前缀（跳过全局选择器），keyframes 名加前缀。根 div SHALL 带 `data-app="sub-vue2-element-ui"` + `position: relative; z-index: 5000`。element-ui 为静态编译 CSS（无 CSS 变量），无需 namespace。

弹窗类组件 SHALL 在业务代码逐个配置 `append-to-body=false`（Dialog/Drawer）、`popper-append-to-body=false`（Select/Cascader/DatePicker）；Message/Notification/MessageBox 全局方法 SHALL 包装 `appendTo` 指定子应用根容器。

#### Scenario: Dialog 与 Select 下拉挂载到子应用根容器

- **WHEN** 打开 Dialog 或展开 Select 下拉
- **THEN** 弹窗/下拉 DOM 在 `[data-app="sub-vue2-element-ui"]` 内部而非 body

#### Scenario: Message 挂载到子应用根容器

- **WHEN** 触发 `this.$message.success`
- **THEN** Message DOM 在子应用根容器内部

### Requirement: sub-vue2-element-ui 双 build 与独立访问

sub-vue2-element-ui SHALL 双 build：`build:standalone`（自带 Vue）+ `build:qiankun`（external Vue，UMD + `jsonpFunction` 唯一化）。独立访问零配置。

#### Scenario: build:qiankun 产物 external Vue

- **WHEN** 执行 `pnpm --filter sub-vue2-element-ui build:qiankun`
- **THEN** `dist-qiankun/` 产物 external `vue`，集成模式从父 `window.Vue`（Vue2 UMD）取
