const isQiankun = process.env.VUE_APP_QIANKUN === 'true'

// node_modules 里的 UI 库 CSS（antd1 的 chunk-vendors）通过 pnpm 真实路径引入，
// postcss-loader 向上查找找不到本包的 postcss.config.js，导致 UI 库样式完全不加前缀。
// 这里显式传插件，保证所有 CSS（含 node_modules）都走同一套前缀规则。
const prefixSelector = require('postcss-prefix-selector')
const prefixKeyframes = require('./postcss-prefix-keyframes.cjs')

const APP_SELECTOR = '[data-app="sub-vue2-antd1"]'
const GLOBAL_SELECTORS = ['body', 'html', ':root', '*']

module.exports = {
  publicPath: isQiankun ? '/qiankun-demo/microapp/sub-vue2-antd1/' : '/',
  css: {
    loaderOptions: {
      postcss: {
        postcssOptions: {
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
            prefixKeyframes({ prefix: 'sub-vue2-antd1-' })
          ]
        }
      }
    }
  },
  outputDir: isQiankun ? 'dist-qiankun' : 'dist-standalone',
  productionSourceMap: false,
  lintOnSave: false,
  transpileDependencies: ['ant-design-vue'],
  configureWebpack: {
    output: {
      library: 'sub-vue2-antd1',
      libraryTarget: 'umd',
      chunkLoadingGlobal: 'webpackJsonp_sub-vue2-antd1'
    },
    externals: isQiankun ? { vue: 'Vue2' } : {}
  },
  devServer: {
    port: 5802,
    headers: { 'Access-Control-Allow-Origin': '*' }
  }
}
