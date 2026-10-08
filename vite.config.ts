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
    port: 5800,
    // 端口被占用时直接报错，避免 Vite 静默改用其它端口导致父应用 URL 漂移
    strictPort: true
  }
})
