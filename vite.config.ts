import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5188,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3188',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4188,
    host: '0.0.0.0',
  },
})
