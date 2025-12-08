import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Standard base path for Vercel/Netlify
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Externalize dependencies that are provided via CDN in index.html (importmap)
      // This prevents double-loading and reduces bundle size.
      external: ['framer-motion']
    }
  },
  define: {
    // Define process.env.API_KEY so it works in the browser and satisfies the SDK requirement
    'process.env.API_KEY': JSON.stringify("AIzaSyCurlCDVh1EQZXWUEuWqZMhAlzE1SQA5g0")
  }
})