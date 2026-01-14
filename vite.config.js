import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages: set base to your repo name (e.g., '/stock-extractor/')
  // Leave as '/' if using custom domain or Netlify
  base: '/stock-extractor/',
  server: {
    port: 3000
  }
})

