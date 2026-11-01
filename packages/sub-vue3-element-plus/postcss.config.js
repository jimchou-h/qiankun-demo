import prefixSelector from 'postcss-prefix-selector'
import prefixKeyframes from './postcss-prefix-keyframes.cjs'

const APP_SELECTOR = '[data-app="sub-vue3-element-plus"]'
const GLOBAL_SELECTORS = ['body', 'html', ':root', '*']

export default {
  plugins: [
    prefixSelector({
      prefix: APP_SELECTOR,
      transform(prefix, selector, prefixedSelector) {
        const trimmed = selector.trim()
        if (GLOBAL_SELECTORS.includes(trimmed)) return selector
        if (trimmed.includes(APP_SELECTOR)) return selector
        return prefixedSelector
      }
    }),
    prefixKeyframes({ prefix: 'sub-vue3-element-plus-' })
  ]
}
