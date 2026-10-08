import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// 父应用 prod 复用 window 上的 Vue3 / VueRouter（UMD 加载），与子应用 qiankun 集成包共用同一份
// Vue 实例；dev 不 external，走 Vite 本地 ESM 解析。
// 注意：output.globals 仅对 umd/iife 格式生效，ES 格式下会被静默忽略 → prod 产物 MUST 为 UMD。
const EXTERNAL_GLOBALS = { vue: 'Vue', 'vue-router': 'VueRouter' }

// 仅 build 阶段注入 UMD <script>（dev 不加载，避免与本地 ESM Vue 重复）。
// 经典脚本先于入口 <script type="module">（defer 语义）执行，故 window.Vue 在父 bundle 求值前就绪。
const VUE_UMD_SRCS = [
  'https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js',
  'https://unpkg.com/vue-router@4.2.5/dist/vue-router.global.prod.js'
]

function injectVueUmd(): Plugin {
  return {
    name: 'inject-vue-umd',
    apply: 'build',
    transformIndexHtml() {
      return VUE_UMD_SRCS.map((src) => ({
        tag: 'script',
        attrs: { src },
        injectTo: 'head-prepend' as const
      }))
    }
  }
}

// 父应用 Vite 配置
// base 使用 /qiankun-demo/，与 prod 部署路径、qiankun activeRule 前缀保持一致
export default defineConfig(({ command }) => ({
  base: '/qiankun-demo/',
  plugins: [vue(), injectVueUmd()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build:
    command === 'build'
      ? {
          rollupOptions: {
            external: Object.keys(EXTERNAL_GLOBALS),
            output: {
              format: 'umd',
              name: 'qiankun-demo',
              globals: EXTERNAL_GLOBALS,
              // UMD 不支持 code splitting；父应用路由全静态 import，无损失
              inlineDynamicImports: true
            }
          }
        }
      : {},
  server: {
    port: 5800,
    // 端口被占用时直接报错，避免 Vite 静默改用其它端口导致父应用 URL 漂移
    strictPort: true
  }
}))
