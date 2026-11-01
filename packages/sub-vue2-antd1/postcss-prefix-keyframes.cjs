/**
 * 本地 PostCSS 插件：给 @keyframes 名加子应用前缀，并同步改写 animation 引用。
 *
 * 为什么自实现：原设计指定的 postcss-rename-keyframes 在 npm 上不存在（404），
 * postcss-prefix-keyframe 仅有 0.0.1 陈旧版本，均不可用；本插件逻辑简单且完全可控。
 *
 * 幂等：已带前缀的 keyframes 名不会被重复添加前缀。
 */
const PLUGIN_NAME = 'postcss-prefix-keyframes'

module.exports = (opts = {}) => {
  const prefix = opts.prefix || ''

  return {
    postcssPlugin: PLUGIN_NAME,
    // 用 OnceExit 先收集全部 @keyframes 改名，再改写 animation 引用，
    // 避免声明出现在 @keyframes 定义之前时漏改。
    OnceExit(root) {
      if (!prefix) return

      const renamed = new Map()
      root.walkAtRules('keyframes', (atRule) => {
        const name = atRule.params.trim()
        if (!name || name.startsWith(prefix)) return
        renamed.set(name, prefix + name)
        atRule.params = prefix + name
      })

      if (renamed.size === 0) return

      root.walkDecls(/^animation(-name)?$/, (decl) => {
        decl.value = decl.value.replace(/[A-Za-z_][\w-]*/g, (token) =>
          renamed.has(token) ? renamed.get(token) : token
        )
      })
    }
  }
}

module.exports.postcss = true
