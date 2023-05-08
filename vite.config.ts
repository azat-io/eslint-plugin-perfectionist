import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      fileName: format => `index.${format === 'es' ? 'mjs' : 'js'}`,
      entry: path.resolve(__dirname, 'index.ts'),
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: ['@typescript-eslint/utils', '@typescript-eslint/types', 'natural-compare-lite'],
    },
  },
  resolve: {
    alias: {
      '~': __dirname,
    },
    extensions: ['.ts'],
  },
})
