import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 前端单页应用在开发环境下由 Vite dev server 提供。
  // 生产环境直接输出到 Spring Boot/Nginx 静态根目录，使 /mall
  // 和 /admin/dashboard 能按架构图中的路径访问。
  base: '/',
  server: {
    proxy: {
      // 开发环境下将 /api 前缀代理到后端服务（默认 8080）
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 输出到后端 static 根目录；保留旧静态文件，避免清空无关资源。
    outDir: '../src/main/resources/static',
    emptyOutDir: false,
  },
})
