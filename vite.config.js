import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Optional: Configure proxy for API requests during development
    // to mimic Netlify redirects. This is only for `vite dev`.
    // In production, Netlify handles this with netlify.toml.
    proxy: {
      '/api': {
        target: 'http://localhost:8888/.netlify/functions', // Netlify Dev default port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist', // Ensure this matches Netlify's publish directory
  },
})
