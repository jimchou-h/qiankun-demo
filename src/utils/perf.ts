/**
 * 性能监控（REQUIREMENTS 8.6，4 项核心指标）：
 * - parent_fcp            父应用首次内容绘制
 * - sub_load_<name>       子应用 beforeLoad → afterMount 加载耗时
 * - sub_fcp_<name>        子应用 FCP（子应用 markFCP 后 console，父侧由子应用自行上报）
 * - sub_error_<name>      子应用加载错误计数
 *
 * 上报策略：防抖批量（满 5 条或 30s 一次），页面隐藏时立即 flush；
 * 通道：navigator.sendBeacon('/api/perf/report')，不支持时降级 fetch keepalive。
 * demo 无实体后端，sendBeacon 会静默 404（不抛错不阻塞），保留实现待接后端。
 */

const REPORT_URL = '/api/perf/report'
const MAX_BUFFER = 5
const FLUSH_INTERVAL = 30_000

const buffer: Array<Record<string, unknown>> = []
let flushTimer: number | undefined

/** 入队一条指标；达到缓冲上限立即上报 */
export function reportPerf(metric: Record<string, unknown>): void {
  buffer.push({ ts: Date.now(), ...metric })
  console.log(`[perf] buffered(${buffer.length})`, metric)
  if (buffer.length >= MAX_BUFFER) {
    flush()
  }
}

/** 上报并清空缓冲（幂等：空缓冲直接返回） */
export function flush(): void {
  if (buffer.length === 0) return
  const batch = buffer.splice(0, buffer.length)
  const payload = JSON.stringify(batch)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(REPORT_URL, new Blob([payload], { type: 'application/json' }))
  } else {
    fetch(REPORT_URL, { method: 'POST', body: payload, keepalive: true }).catch(() => {})
  }
  console.log(`[perf] flushed(${batch.length}) → ${REPORT_URL}`)
}

/** 父应用入口调用：注册 FCP 采集 + 30s 定时 flush + visibilitychange 兜底 */
export function initPerf(): void {
  if (typeof PerformanceObserver !== 'undefined') {
    const observer = new PerformanceObserver((list) => {
      const fcp = list.getEntries().find((entry) => entry.name === 'first-contentful-paint')
      if (!fcp) return
      reportPerf({ parent_fcp: Math.round(fcp.startTime) })
      observer.disconnect()
    })
    observer.observe({ type: 'paint', buffered: true })
  }

  flushTimer = window.setInterval(flush, FLUSH_INTERVAL)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

/** 供 register.ts 计算子应用加载耗时 */
export function markNameOf(appName: string): string {
  return `sub_load_start_${appName}`
}
