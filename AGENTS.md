# AGENTS.md

本仓库的 Agent 协作约定。供 engineering skills（`setup-matt-pocock-skills` / `to-tickets` / `tdd` / `triage` / `unified-dev-workflow` 等）读取。

## Agent skills

### Issue tracker

Issues 作为本地 markdown 文件存放于 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，无远程 tracker。See `docs/agents/issue-tracker.md`.

### Triage labels

使用五个 canonical triage roles，label 字符串与 role 同名：`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`。See `docs/agents/triage-labels.md`.

### Domain docs

Single-context 布局：repo 根目录 `CONTEXT.md` + `docs/adr/`。当前两者均未创建，将在 domain terms / decisions 实际产生时由 `/grill-with-docs` 懒创建。See `docs/agents/domain.md`.

## Project context

qiankun 微前端 demo 项目（父应用 Vue3+antd4 + 4 个子应用 Vue2/Vue3 + antd1/antd4/element-plus/element-ui）。完整需求见 `docs/REQUIREMENTS.md`。

### Hard Constraints（来自 project_memory）

- 不使用 qiankun 的 CSS 隔离方案，采用子应用根容器 `data-app` 属性 + PostCSS 构建时前缀
- 启用 qiankun 的 JS 沙箱隔离全局变量、定时器和事件监听
- 子应用弹窗必须挂载到各自根容器内（不挂 body）
- 路由 history 模式，子应用 base path 通过 qiankun props 动态注入
- 子应用独立访问要求：支持单独打开 URL 运行，零配置 fallback
- 依赖版本：pnpm workspace overrides 强制统一 Vue 版本号
- 通信：父→子 qiankun props 注入（userInfo/tenant/permission/axios/BASE_URL/theme/lang）；子→父/子→子 initGlobalState，不共享 Pinia
- 双 build：每子应用 `build:standalone`（自带 Vue）+ `build:qiankun`（external Vue）
- 4 个 Vue 子应用（sub1-sub4），无纯 HTML/jQuery
- 主题分档：父+sub1+sub3 运行时切换，sub2/sub4 维持 light
- i18n：子应用各自维护 locale 文件，父通过 initGlobalState 广播
- 错误处理：10s 超时 + 无限手动重试 + cleanupList 清理
- 性能监控：4 项核心指标，防抖批量 + sendBeacon

### Engineering Conventions

- 子应用根容器 `data-app="sub-xxx"` + PostCSS prefix
- 语义化 base path：父 `/qiankun-demo/`，子 `/qiankun-demo/microapp/<name>/`
- z-index 基数：父 1000 / sub1 2000 / sub2 3000 / sub3 4000 / sub4 5000
- PostCSS：跳过 body/html/:root/* 全局选择器，keyframes 名加子应用前缀
- CSS 变量：仅 sub3（element-plus）用 namespace 把 `--el-*` 改 `--ep-*`，其他子应用无 CSS 变量
- 弹窗：antd 系改 props 默认值统一 getContainer，element 系业务代码逐个 append-to-body=false/teleported=false
- cleanupList：unmount 反向遍历执行清理函数（ECharts/视频/地图/BPMN.js/WebSocket/Web Worker/axios）
