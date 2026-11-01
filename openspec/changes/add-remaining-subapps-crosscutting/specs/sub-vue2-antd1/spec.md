## ADDED Requirements

### Requirement: sub-vue2-antd1 独立骨架与手写生命周期

sub-vue2-antd1 SHALL 是 Vue2 + Ant Design Vue 1.7.5 子应用，用 Vue CLI 5（Webpack 5）构建，手写 qiankun 生命周期（`bootstrap`/`mount`/`unmount`）。`main.js` SHALL 判断 `window.__POWERED_BY_QIANKUN__`：qiankun 模式设置 `window.__webpack_public_path__` 后导出生命周期函数；独立运行（非 qiankun）直接 `render()` 零配置 fallback。

#### Scenario: sub-vue2-antd1 独立 dev 启动

- **WHEN** 执行 `pnpm dev:sub-vue2-antd1`，浏览器访问 `http://localhost:5802/home`
- **THEN** antd1 Button + Modal 正常渲染，无 qiankun 依赖，可直接独立运行

#### Scenario: sub-vue2-antd1 qiankun 模式生命周期

- **WHEN** 父应用通过 qiankun 加载 sub-vue2-antd1
- **THEN** 生命周期函数被调用，mount 时用 `props.base` 重建 Vue Router（`createWebHistory(base)`），unmount 时 `instance.$destroy()` + 清空容器 + 执行 cleanupList

### Requirement: sub-vue2-antd1 CSS 隔离与弹窗挂载

sub-vue2-antd1 SHALL 用 PostCSS 给所有 CSS 选择器加 `[data-app="sub-vue2-antd1"]` 前缀（跳过 body/html/:root/* 全局选择器），keyframes 名加 `sub-vue2-antd1-` 前缀。根 div SHALL 带 `data-app="sub-vue2-antd1"` + `position: relative; z-index: 3000`。antd1 为静态 Less 编译 CSS（无 CSS 变量、无 cssinjs），不需要 namespace 配置。

#### Scenario: 独立访问时 antd1 样式正确

- **WHEN** 访问 `http://localhost:5802/home`
- **THEN** antd1 Button 文字/背景正常（不被 PostCSS 前缀抬高特异性破坏），`[data-app="sub-vue2-antd1"]` 前缀生效

#### Scenario: sub-vue2-antd1 弹窗挂载到子应用根容器

- **WHEN** 点击 Modal/Drawer/Dropdown/Select 等弹窗组件
- **THEN** 弹窗 DOM 挂载到 `[data-app="sub-vue2-antd1"]` 内部而非 body（经 `src/components/antd.js` 批量修改 `getContainer`/`getPopupContainer` 默认值）

### Requirement: sub-vue2-antd1 双 build 与独立访问

sub-vue2-antd1 SHALL 双 build：`build:standalone`（自带 Vue，`dist-standalone/`，独立部署）+ `build:qiankun`（external Vue，`dist-qiankun/`，从父应用 `window.Vue` 取）。Webpack 输出 SHALL 为 UMD（`library: 'sub-vue2-antd1'` + `jsonpFunction` 唯一化，避免跨应用 webpack runtime 冲突），独立访问零配置。

#### Scenario: build:standalone 产物自带 Vue

- **WHEN** 执行 `pnpm --filter sub-vue2-antd1 build:standalone`
- **THEN** `dist-standalone/` 产物包含 Vue 运行时，单独部署可访问

#### Scenario: build:qiankun 产物 external Vue

- **WHEN** 执行 `pnpm --filter sub-vue2-antd1 build:qiankun`
- **THEN** `dist-qiankun/` 产物 external `vue`，从 `window.Vue` 取，与父应用共享同一份 Vue2 实例
