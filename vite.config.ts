import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      fileName: (format, entryName) => {
        let path = ''

        if (entryName === 'recommended-line-length' || entryName === 'recommended-natural') {
          path = 'configs/'
        }

        return `${path}${entryName}.${format === 'es' ? 'mjs' : 'js'}`
      },
      entry: [
        path.resolve(__dirname, 'index.ts'),
        path.resolve(__dirname, 'configs/recommended-line-length.ts'),
        path.resolve(__dirname, 'configs/recommended-natural.ts'),
      ],
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
