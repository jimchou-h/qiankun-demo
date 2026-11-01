import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// 父应用 prod 复用 window 上的 Vue3 / VueRouter（UMD 加载），与子应用 qiankun 集成包共用同一份
// Vue 实例；dev 不 external，走 Vite 本地 ESM 解析。
// 注意：output.globals 仅对 umd/iife 格式生效，ES 格式下会被静默忽略 → prod 产物 MUST 为 UMD。
// vue 全局映射为 window.Vue3（而非 window.Vue）：见 design D7 修正——
// Vue2 子应用（sub2/sub4）的 vue-router@3 / vue-i18n@8 自带 `window.Vue && window.Vue.use(...)`
// 自动安装逻辑，window.Vue 必须留给 Vue2 用；Vue3 系（父/sub1/sub3）统一从稳定的 window.Vue3 取。
const EXTERNAL_GLOBALS = { vue: 'Vue3', 'vue-router': 'VueRouter' }

// 仅 build 阶段注入 UMD <script>（dev 不加载，避免与本地 ESM Vue 重复）。
// 经典脚本先于入口 <script type="module">（defer 语义）执行，故 window.Vue 在父 bundle 求值前就绪。
const VUE_UMD_SRCS = [
  'https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js',
  'https://unpkg.com/vue-router@4.2.5/dist/vue-router.global.prod.js'
]

// Vue3 UMD 就绪后立即改名为 window.Vue3（Vue3 系外链的稳定全局）。
// 必须在父 bundle 求值前执行：父 UMD 工厂从 window.Vue3 取 Vue。
const VUE3_RENAME = `(function () {
  if (window.Vue && !window.__VUE3_RENAMED__) {
    window.Vue3 = window.Vue
    window.__VUE3_RENAMED__ = true
    console.log('[qiankun-demo] Vue3 UMD -> window.Vue3')
  }
})()`

// Vue2 UMD（供 sub2/sub4 qiankun 集成包 external {vue:'Vue2'} 使用）。
// Vue2 UMD 会挂到 window.Vue（与 Vue3 同名冲突，见 design D7 修正）：
// 轮询等待 Vue3 就绪并已改名为 window.Vue3 → 加载 Vue2 → 捕获 window.Vue（Vue2）改名为 window.Vue2。
// 关键：成功后【不】把 window.Vue 恢复为 Vue3——Vue2 子应用的 vue-router@3/vue-i18n@8
// 自动安装逻辑读取 window.Vue，必须让它指到 Vue2；Vue3 系全部走 window.Vue3，互不干扰。
// 共用 Vue2 的 Vue.prototype 上的 vue-router 重复安装问题，由父应用 src/qiankun/vue2UseGuard.ts
// 在 qiankun beforeLoad 阶段给 Vue.use 打补丁处理（内联脚本时机不可控，故不放在这里）。
const VUE2_UMD_LOADER = `(function () {
  var tries = 0
  var s = document.createElement('script')
  s.src = 'https://unpkg.com/vue@2.7.14/dist/vue.runtime.min.js'
  function start() {
    if (window.__VUE3_RENAMED__ && !window.__VUE2_LOADED__) {
      s.onload = function () {
        window.Vue2 = window.Vue
        window.__VUE2_LOADED__ = true
        console.log('[qiankun-demo] Vue2 UMD -> window.Vue2 (window.Vue stays Vue2 for Vue2 subapps)')
      }
      s.onerror = function () { window.__VUE2_LOADED__ = false }
      document.head.appendChild(s)
    } else if (tries++ < 200) {
      setTimeout(start, 50)
    }
  }
  start()
})()`

function injectVueUmd(): Plugin {
  return {
    name: 'inject-vue-umd',
    apply: 'build',
    transformIndexHtml() {
      return [
        ...VUE_UMD_SRCS.map((src) => ({
          tag: 'script',
          attrs: { src },
          injectTo: 'head-prepend' as const
        })),
        {
          tag: 'script',
          children: VUE3_RENAME,
          injectTo: 'head-prepend' as const
        },
        {
          tag: 'script',
          children: VUE2_UMD_LOADER,
          injectTo: 'head-prepend' as const
        }
      ]
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
