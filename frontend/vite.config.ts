import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ★★★ 計画書通り、プロキシ設定を実装します ★★★
    // これにより、開発時のCORSエラーを回避できます。
    proxy: {
      // フロントエンドのコードで '/api' で始まるURLにリクエストした場合、
      // 自動的にバックエンドの 'http://backend:8000' に転送されます。
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        // '/api/posts' へのリクエストを '/posts' に書き換えて転送します
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    // Dockerコンテナ内でViteを正常に動かすため、host設定を追加します
    host: true, 
  },
})