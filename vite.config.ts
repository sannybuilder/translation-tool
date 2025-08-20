import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Provide browser-compatible versions of Node.js modules
      buffer: 'buffer',
    },
  },
  define: {
    // Define global for browser compatibility
    global: 'globalThis',
    // Provide process.versions for iconv-lite
    'process.versions': JSON.stringify({ node: '16.0.0' }),
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
