/**
 * 性能打点骨架（本 change 仅 console 输出）。
 * 采集项在本 change 只覆盖子应用 mount 耗时与 FCP；
 * 防抖批量 + sendBeacon 上报、父应用 FCP、错误率见 REQUIREMENTS 8.6，后续 change 补。
 */

/** mount 起始 mark 名，main.js 在 mount 入口（含 standalone 入口）打点 */
export const MOUNT_START_MARK = 'sub-vue2-element-ui-mount-start'

const MOUNT_MEASURE_NAME = 'sub-vue2-element-ui-mount'
const FCP_MEASURE_NAME = 'sub-vue2-element-ui-fcp'
const FCP_ENTRY_NAME = 'first-contentful-paint'

/** 打点结果输出（后续 change 换成防抖批量 sendBeacon） */
export function reportPerf(name, duration) {
  console.log(`[perf] ${name}=${Math.round(duration)}ms`)
}

/** mount 完成：measure 出 MOUNT_START_MARK 到当前的耗时 */
export function markMount() {
  const measure = performance.measure(MOUNT_MEASURE_NAME, MOUNT_START_MARK)
  reportPerf('mount', measure.duration)
}

/**
 * 首次内容绘制打点。
 * 用 PerformanceObserver 而非同步读 performance.getEntriesByName：FCP 是浏览器异步产生的
 * paint entry，standalone 模式调用时通常尚未触发；`buffered: true` 还能取到 observer 注册前
 * 已产生的 entry（qiankun 集成模式下子应用共享父文档的 FCP）。
 */
export function markFCP() {
  if (typeof PerformanceObserver === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    const fcp = list.getEntries().find((entry) => entry.name === FCP_ENTRY_NAME)
    if (!fcp) return
    // FCP entry 的 startTime 即相对 timeOrigin 的绘制时刻，measure 从 0 到该时刻得到耗时
    const measure = performance.measure(FCP_MEASURE_NAME, { start: 0, end: fcp.startTime })
    reportPerf('fcp', measure.duration)
    observer.disconnect()
  })
  observer.observe({ type: 'paint', buffered: true })
}
