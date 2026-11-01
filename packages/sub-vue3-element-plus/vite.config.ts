import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

// sub-vue3-element-plus 子应用 Vite 配置
// - 端口 5803，开启 CORS 让父应用（5800）可直接 fetch 子应用 entry
// - vite-plugin-qiankun：注入 qiankun 生命周期 globals；useDevMode 让 dev server 下的 ESM 产物可被 qiankun 加载
// - 双 build：默认（standalone）自带 Vue；--mode qiankun external Vue 系，从父应用 window 取
export default defineConfig(({ mode }) => {
  const isQiankun = mode === 'qiankun'

  return {
    // standalone 以根路径部署；qiankun 集成包部署在 /qiankun-demo/microapp/sub-vue3-element-plus/，
    // 用绝对路径 base 让产物内资源引用可被 import-html-entry 正确解析
    base: isQiankun ? '/qiankun-demo/microapp/sub-vue3-element-plus/' : '/',
    plugins: [
      vue(),
      qiankun('sub-vue3-element-plus', {
        useDevMode: true
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // element-plus theme-chalk 源码编译（namespace ep）需要 sass 能解析 node_modules 里的 element-plus
          // 默认 includePaths 即可；若 sass 报 "Can't find stylesheet to import"，再加 includePaths: [path]
        }
      }
    },
    build: {
      // 两条产物分目录存放，互不覆盖（见 REQUIREMENTS 8.1）
      outDir: isQiankun ? 'dist-qiankun' : 'dist-standalone',
      emptyOutDir: true,
      rollupOptions: isQiankun
        ? {
            // element-plus / pinia / vue-i18n 均不 external：element-plus 无 UMD 全局，
            // pinia 的 IIFE 产物依赖额外的 VueDemi 全局，vue-i18n 同理，全部随包打入
            external: ['vue', 'vue-router'],
            output: {
              // vite-plugin-qiankun 把入口改写为内联 import('<entry>')（dev/prod 均生效），
              // 产物按真实 ES 模块加载；若保持 ES 格式，external 的裸模块说明符（import 'vue'）
              // 无法被浏览器解析，且 output.globals 对 ES 格式无效。
              // 故 MUST 产出 UMD + globals，映射到父应用注入的稳定全局 window.Vue3 / window.VueRouter
              // （不用 window.Vue：该名字被 Vue2 子应用的 vue-router@3/vue-i18n@8 自动安装占用）。
              format: 'umd',
              name: 'sub-vue3-element-plus',
              globals: {
                vue: 'Vue3',
                'vue-router': 'VueRouter'
              },
              // UMD 不支持 code splitting，强制内联动态 import
              inlineDynamicImports: true
            }
          }
        : {}
    },
    server: {
      port: 5803,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }
  }
})
