import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      fileName: (format, entryName) => {
        let directory = ''

        if (entryName.startsWith('recommended')) {
          directory = 'configs/'
        }

        return `${directory}${entryName}.${format === 'es' ? 'mjs' : 'js'}`
      },
      entry: [
        path.resolve(__dirname, 'configs/recommended-alphabetical.ts'),
        path.resolve(__dirname, 'configs/recommended-line-length.ts'),
        path.resolve(__dirname, 'configs/recommended-natural.ts'),
        path.resolve(__dirname, 'index.ts'),
      ],
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
    },
  },
})
