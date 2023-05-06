import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'index.ts'),
      fileName: format => `index.${format}.js`,
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: ['@typescript-eslint/utils', '@typescript-eslint/types'],
    },
  },
  resolve: {
    alias: {
      '~': __dirname,
    },
    extensions: ['.ts'],
  },
})
