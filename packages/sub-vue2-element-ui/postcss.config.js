const prefixSelector = require('postcss-prefix-selector')
const prefixKeyframes = require('./postcss-prefix-keyframes.cjs')

const APP_SELECTOR = '[data-app="sub-vue2-element-ui"]'
const GLOBAL_SELECTORS = ['body', 'html', ':root', '*']

module.exports = {
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
    prefixKeyframes({ prefix: 'sub-vue2-element-ui-' })
  ]
}
