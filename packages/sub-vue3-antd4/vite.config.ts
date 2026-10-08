import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

// sub-vue3-antd4 子应用 Vite 配置
// - 端口 5801，开启 CORS 让父应用（5173）可直接 fetch 子应用 entry
// - vite-plugin-qiankun：注入 qiankun 生命周期 globals；useDevMode 让 dev server 下的 ESM 产物可被 qiankun 加载
export default defineConfig({
  // 独立访问时以根路径部署；qiankun 集成模式下由父应用 props.base 提供路由 base
  base: '/',
  plugins: [
    vue(),
    qiankun('sub-vue3-antd4', {
      useDevMode: true
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5801,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
