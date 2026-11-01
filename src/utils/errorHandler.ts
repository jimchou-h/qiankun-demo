/**
 * 错误处理工具：结构化错误描述 + 子应用加载超时常量。
 * 使用方：src/qiankun/register.ts（全局错误兜底）、src/components/SubAppContainer.vue（10s 超时）。
 */

/** 子应用加载超时阈值：10s 后未 afterMount 视为失败（AGENTS.md 错误处理约束） */
export const SUB_LOAD_TIMEOUT = 10_000

/**
 * 把 qiankun 的 `addGlobalUncaughtErrorHandler` 回调实参（可能是 ErrorEvent /
 * PromiseRejectionEvent / 字符串）统一结构化为可日志、可上报的对象。
 */
export function describeUncaughtError(event: Event | string): Record<string, unknown> {
  if (event instanceof ErrorEvent) {
    return {
      kind: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }
  }
  if (event instanceof PromiseRejectionEvent) {
    return { kind: 'unhandledrejection', reason: event.reason }
  }
  return { kind: typeof event, event }
}
