## ADDED Requirements

### Requirement: 子应用加载超时与无限手动重试

父应用 SHALL 对子应用加载实现 10s 超时判失败（`Promise.race` 与 qiankun 加载 promise 竞争）。加载失败或超时时 `#sub-app-container` SHALL 显示 fallback UI（a-result error + 重试按钮），重试 SHALL 支持无限次手动点击（不自动重试）。

#### Scenario: 子应用加载失败显示 fallback

- **WHEN** 子应用 entry 不可达（如 dev server 未启动）且超过 10s 或立即失败
- **THEN** `#sub-app-container` 显示错误提示 + 重试按钮，父应用主流程不被中断

#### Scenario: 无限次手动重试

- **WHEN** 用户点击重试按钮
- **THEN** 重新尝试加载该子应用，失败后可再次点击，无次数限制

### Requirement: unmount 异常忽略与继续加载

子应用 unmount 抛异常时，父应用 SHALL 忽略该异常（qiankun 沙箱强制清理）并继续正常加载下一个子应用，不中断流程。

#### Scenario: unmount 抛异常不影响后续加载

- **WHEN** 某子应用 unmount 抛错后切换到另一子应用
- **THEN** 父应用捕获并记录该错误，另一子应用正常加载渲染

### Requirement: cleanupList 全量资源清理

每个子应用 SHALL 在 `mount` 登记外部资源清理函数到 `cleanupList`，`unmount` 时**反向遍历**执行：第三方库实例 dispose（ECharts/视频/地图/BPMN.js）、WebSocket/EventSource/Worker close/terminate、未完成 axios 请求 abort（AbortController）、动态 DOM 移除、定时器清理（沙箱双保险）。

#### Scenario: unmount 清理已登记资源

- **WHEN** 子应用 unmount
- **THEN** cleanupList 反向遍历执行，已登记的资源（如 WebSocket close、定时器 clear）全部释放

### Requirement: 性能监控 4 指标防抖批量上报

父应用 SHALL 采集 4 项核心指标：父应用首屏 FCP、子应用加载耗时、子应用首屏 FCP、错误率。上报 SHALL 防抖（累积 5 条或 30s 触发一次）+ `navigator.sendBeacon('/api/perf/report')`（不可用时 fallback axios.post），`visibilitychange` hidden 时立即 flush。

#### Scenario: 采集并批量上报

- **WHEN** 父应用 FCP 与子应用加载/FCP 打点产生，且累积达 5 条或 30s 到
- **THEN** 一次性 `sendBeacon` 批量上报，字段含 `parent_fcp` / `sub_load_<name>` / `sub_fcp_<name>` / `sub_error_<name>`

#### Scenario: 页面切走立即上报

- **WHEN** `document.visibilityState` 变为 hidden
- **THEN** 未上报的缓冲数据立即 flush（sendBeacon 在页面卸载时也能发送）
