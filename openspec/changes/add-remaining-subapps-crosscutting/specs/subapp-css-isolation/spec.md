## MODIFIED Requirements

### Requirement: UI 库 namespace 与 CSS 变量隔离（扩展到 element-plus）

CSS 隔离第 2/3 层 SHALL 扩展覆盖 sub3：element-plus 用 `<el-config-provider namespace="ep">` 把 `--el-*` 变量改为 `--ep-*`（第 3 层 CSS 变量源头隔离）；antd4 维持 `prefix-cls="a4"`（第 2 层）。sub2（antd1）与 sub4（element-ui）为静态编译 CSS，**无 CSS 变量**，仅靠第 1 层 PostCSS 选择器前缀。

#### Scenario: sub3 变量名为 --ep-*

- **WHEN** 检查 sub-vue3-element-plus 渲染的 CSS 变量
- **THEN** 变量名为 `--ep-*`，不出现裸 `--el-*`

### Requirement: element 系弹窗挂载配置方式

element 系子应用（sub3/sub4）弹窗隔离 SHALL 采用业务代码逐个配置：element-plus（sub3）用 `append-to-body=false`/`teleported=false`；element-ui（sub4）用 `append-to-body=false`/`popper-append-to-body=false`。全局 API（Message/Notification/MessageBox）SHALL 用 `appendTo` 指定子应用根容器。与 antd 系（getContainer 默认值批量改造）方式不同但目标一致：所有 portal DOM 落在各自 `[data-app]` 根容器内。

#### Scenario: sub3 全部弹窗组件落在根容器

- **WHEN** 打开 sub3 的 Dialog/Select/Message
- **THEN** 弹窗 DOM 均在 `[data-app="sub-vue3-element-plus"]` 内部

#### Scenario: sub4 全部弹窗组件落在根容器

- **WHEN** 打开 sub4 的 Dialog/Select/Message
- **THEN** 弹窗 DOM 均在 `[data-app="sub-vue2-element-ui"]` 内部
