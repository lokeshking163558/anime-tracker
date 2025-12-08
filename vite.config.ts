import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Standard base path for Vercel/Netlify
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Removed rollupOptions to ensure all dependencies (including framer-motion) 
    // are bundled directly into the app, preventing runtime errors on Vercel.
  },
  define: {
    // Define process.env.API_KEY so it works in the browser and satisfies the SDK requirement
    'process.env.API_KEY': JSON.stringify("AIzaSyCurlCDVh1EQZXWUEuWqZMhAlzE1SQA5g0")
  }
})