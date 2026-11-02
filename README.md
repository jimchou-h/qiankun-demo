# qiankun-demo

qiankun 微前端演示工程：一个 Vue3 + Ant Design Vue 4 的父应用，挂载 4 个技术栈不同的子应用（Vue3/Vue2 × antd 4/antd 1/element-plus/element-ui），重点演示**样式隔离、弹层挂载点治理、双构建、父子通信、主题分档与国际化**。

每个子应用都支持两种运行方式：被 qiankun 集成，或单独打开 URL 独立运行。

## 技术矩阵

| 应用 | 框架 | UI 库 | 开发端口 | 独立访问 | z-index 基数 | 运行时主题切换 |
|---|---|---|---|---|---|---|
| 父应用 | Vue 3.4 | ant-design-vue 4 | 5800 | — | 1000 | 支持 |
| sub-vue3-antd4 | Vue 3.4 | ant-design-vue 4 | 5801 | 支持 | 2000 | 支持 |
| sub-vue2-antd1 | Vue 2.7 | ant-design-vue 1 | 5802 | 支持 | 3000 | 仅 light |
| sub-vue3-element-plus | Vue 3.4 | element-plus | 5803 | 支持 | 4000 | 支持 |
| sub-vue2-element-ui | Vue 2.7 | element-ui | 5804 | 支持 | 5000 | 仅 light |

依赖版本由根 `package.json` 的 `pnpm.overrides` 统一：`vue@^2 → 2.7.14`、`vue@^3 → 3.4.21`、`vue-router@^3 → 3.6.5`、`vue-router@^4 → 4.2.5`。

## 目录结构

```
.
├── src/                        父应用（Vite + Vue3 + antd4）
│   ├── qiankun/                子应用注册、生命周期回调、Vue2 Vue.use 守卫
│   ├── layouts/                布局、导航、主题/语言开关
│   ├── components/             SubAppContainer（loading / fallback / 重试）
│   └── utils/                  超时工具、性能上报
├── packages/
│   ├── sub-vue3-antd4/         Vite + postcss.config.js（前缀 + keyframes 插件）
│   ├── sub-vue2-antd1/         Vue CLI 5 + vue.config.js（显式传 PostCSS 插件）
│   ├── sub-vue3-element-plus/  Vite + Sass namespace 改写 CSS 变量
│   └── sub-vue2-element-ui/    Vue CLI 5 + element-ui
├── scripts/copy-microapps.mjs  把 4 个子应用 dist-qiankun 拷进父应用 dist
├── docs/
│   ├── blog/                   技术文章（样式隔离方案）
│   └── REQUIREMENTS.md         完整需求
└── openspec/                   规格与变更记录
```

## 快速开始

```bash
pnpm install          # 等价于 pnpm install:all
pnpm dev:all          # 一次起 5 个服务（5800-5804）
```

单独起某个应用：

```bash
pnpm dev                                # 只起父应用
pnpm dev:sub-vue3-antd4
pnpm dev:sub-vue2-antd1
pnpm dev:sub-vue3-element-plus
pnpm dev:sub-vue2-element-ui
```

访问：父应用 <http://localhost:5800/qiankun-demo/>，子应用独立访问 `http://localhost:5802/home` 等。

## 构建与预览

```bash
pnpm build:all        # 父应用 UMD + 4 个子应用 build:qiankun，结束后自动执行 copy-microapps
pnpm exec vite preview --port 4180
```

访问 <http://localhost:4180/qiankun-demo/>。产物布局：

```
dist/
├── index.html                  父应用入口（注入 Vue3 / Vue2 UMD 外链）
└── microapp/
    ├── sub-vue3-antd4/         子应用 qiankun 集成包（external Vue）
    ├── sub-vue2-antd1/
    ├── sub-vue3-element-plus/
    └── sub-vue2-element-ui/
```

子应用的双构建：

```bash
pnpm --filter sub-vue3-antd4 build:standalone   # 自带 Vue，可独立部署
pnpm --filter sub-vue3-antd4 build:qiankun      # external Vue/Vue-Router，产 UMD
```

> prod 构建会清空 `dist`，所以 `pnpm build` 之后必须运行 `node scripts/copy-microapps.mjs`；`pnpm build:all` 已通过 `postbuild:all` 自动处理。

## 路由与部署路径

父应用 base 为 `/qiankun-demo/`，子应用集成后的语义化路径：

| 子应用 | 集成路径 | 独立访问路径 |
|---|---|---|
| sub-vue3-antd4 | `/qiankun-demo/sub-vue3-antd4/home` | `:5801/home` |
| sub-vue2-antd1 | `/qiankun-demo/sub-vue2-antd1/home` | `:5802/home` |
| sub-vue3-element-plus | `/qiankun-demo/sub-vue3-element-plus/home` | `:5803/home` |
| sub-vue2-element-ui | `/qiankun-demo/sub-vue2-element-ui/home` | `:5804/home` |

子应用路由统一用 history 模式，`base` 由 qiankun props 注入（`createBaseRouter(base)` 工厂），独立运行时回落到自身 base。

## 核心设计

| 主题 | 做法 |
|---|---|
| CSS 隔离 | 不用 qiankun 的 `experimentalStyleIsolation` / `strictStyleIsolation`。子应用根容器带 `data-app="<name>"`，PostCSS 构建时为所有选择器加 `[data-app="<name>"]` 前缀，`@keyframes` 名加子应用前缀；跳过 `body` / `html` / `:root` / `*` |
| 全局 reset | 放子应用 `public/reset.css` 由 `<link>` 原样服务，**不走构建管线**（加了前缀会升一级特异性，反压 UI 库运行时样式） |
| 弹层挂载 | 所有弹层（Modal / Drawer / Select / Message / Notification）都落在子应用根容器内：antd4 用 `getPopupContainer`；antd1 显式传函数式 `getContainer`；element-plus 用 `append-to-body=false` / `teleported=false`；element-ui 用 `append-to-body=false` / `popper-append-to-body=false` |
| CSS 变量 | 仅 sub3 用 Sass `$namespace: 'ep'` 把 `--el-*` 编译成 `--ep-*`，配合 `<el-config-provider :namespace="'ep'">` |
| 运行时全局 | Vue3 UMD → `window.Vue3`，Vue2 UMD → `window.Vue2`。sub2/sub4 共用同一个 `Vue.prototype`，vue-router 重复安装由父应用 `src/qiankun/vue2UseGuard.ts` 兜住 |
| 通信 | 父→子走 qiankun props（userInfo / tenant / permission / axios / BASE_URL / theme / lang）；子→父、子→子走 `initGlobalState`，不共享 Pinia |
| 主题 | 分档：父 + sub1 + sub3 运行时切换 dark；sub2 / sub4 因 UI 库无暗色 token 固定 light。底色与最小高度由父应用用 CSS 变量下发 |
| i18n | 子应用各自维护 locale 文件，父应用通过 `initGlobalState` 广播 `lang`；子应用在 `onGlobalStateChange(cb, true)` 里与本地值比较后应用 |
| 错误处理 | 子应用加载 10s 超时 → fallback UI + 无限手动重试；unmount 异常忽略并继续；`cleanupList` 反向清理第三方实例、定时器、WebSocket、axios |
| 性能 | 采集父应用 FCP、子应用加载耗时、子应用 FCP、错误率 4 项指标，防抖批量 + `sendBeacon` 上报 |

细节与踩坑记录见 [docs/blog/qiankun-css-isolation.md](docs/blog/qiankun-css-isolation.md)。

## 已知约束

- 样式隔离依赖构建期前缀，**绕过构建管线的样式（如 public 下的 CSS）不会有前缀**，需要自己确认影响范围。
- prod 产物通过 unpkg 外链加载 Vue3 / Vue2 UMD（见 [vite.config.ts](vite.config.ts) 的 `injectVueUmd`），离线或内网环境需自行替换为本地资源。
- `pnpm build` 会清空 `dist`，改完父应用要重跑拷贝脚本，否则子应用 404。
- 验收/调试时 qiankun 用 fetch 拉入口与 CSS，浏览器可能缓存旧产物，用 `?t=<时间戳>` 开新标签页。

## 文档

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)：完整需求
- [docs/blog/qiankun-css-isolation.md](docs/blog/qiankun-css-isolation.md)：样式隔离方案与 7 个坑
- [AGENTS.md](AGENTS.md)：仓库的 Agent 协作约定（issue tracker / triage labels / 硬约束）
- `openspec/changes/`：按变更组织的 proposal / design / specs / tasks
- `openspec/specs/`：已归档变更沉淀出的主规格
