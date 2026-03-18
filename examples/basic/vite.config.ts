import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    // 代理配置 - 用于URS接口请求
    proxy: {
      '/urs-api': {
        target: process.env.VITE_URS_SERVER_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/urs-api/, '')
      },
      '/urs-signal': {
        target: process.env.VITE_URS_SIGNAL_URL || 'ws://localhost:8080',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/urs-signal/, '')
      }
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
