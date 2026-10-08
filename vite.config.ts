import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 父应用 Vite 配置
// base 使用 /qiankun-demo/，与 prod 部署路径、qiankun activeRule 前缀保持一致
export default defineConfig({
  base: '/qiankun-demo/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173
  }
})
