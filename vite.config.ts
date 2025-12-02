import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for assets
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    // Polyfill process.env.API_KEY for the Gemini SDK
    'process.env.API_KEY': JSON.stringify("AIzaSyCurlCDVh1EQZXWUEuWqZMhAlzE1SQA5g0")
  }
})