import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    headers: { 'Cache-Control': 'no-store' },
  },
  preview: {
    port: 3000,
    strictPort: true,
    headers: { 'Cache-Control': 'no-store' },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|use-sync-external-store)[\\/]/,
            },
            {
              name: 'motion-vendor',
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
            },
            {
              name: 'charts-vendor',
              test: /node_modules[\\/](recharts|victory-vendor|d3-[a-z]+)[\\/]/,
            },
            {
              name: 'dnd-vendor',
              test: /node_modules[\\/]@dnd-kit[\\/]/,
            },
          ],
        },
      },
    },
  },
})
