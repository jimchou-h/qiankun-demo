import prefixSelector from 'postcss-prefix-selector'
import prefixKeyframes from './postcss-prefix-keyframes.cjs'

// CSS 隔离第 1 层：给所有选择器加 [data-app="sub-vue3-antd4"] 前缀
const APP_SELECTOR = '[data-app="sub-vue3-antd4"]'

// 全局选择器不能被加前缀（加了匹配不上），原样保留
const GLOBAL_SELECTORS = ['body', 'html', ':root', '*']

export default {
  plugins: [
    prefixSelector({
      prefix: APP_SELECTOR,
      // 自定义 transform 以覆盖默认的 body/html/:root 替换逻辑：
      // 精确匹配全局选择器则跳过，已带前缀的选择器（幂等）也跳过
      transform(prefix, selector, prefixedSelector) {
        const trimmed = selector.trim()
        if (GLOBAL_SELECTORS.includes(trimmed)) return selector
        if (trimmed.includes(APP_SELECTOR)) return selector
        return prefixedSelector
      }
    }),
    // CSS 隔离附加层：给 @keyframes 名加子应用前缀，避免动画名跨子应用冲突
    prefixKeyframes({ prefix: 'sub-vue3-antd4-' })
  ]
}
