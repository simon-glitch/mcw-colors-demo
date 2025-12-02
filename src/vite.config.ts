import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  server: {
    open: false,
  },
  build: {
    outDir: '../compiled',
    emptyOutDir: true,
  },
})
