import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 前端单页应用在开发环境下仍然通过 Vite dev server 提供，
  // 生产环境下会将构建产物输出到 Spring Boot 的 static/app 目录，
  // 由 Nginx 或 Spring Boot 直接以静态资源方式提供。
  base: '/app/',
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
    // 直接输出到后端 static/app 目录，方便 Nginx/Spring Boot 统一托管
    outDir: '../src/main/resources/static/app',
    emptyOutDir: true,
  },
})
