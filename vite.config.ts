import { defineConfig } from 'vite'
import path from 'node:path'

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
      entry: path.resolve(__dirname, 'index.ts'),
      name: 'eslint-plugin-perfectionist',
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
      output: {
        preserveModules: true,
      },
    },
    minify: false,
  },
  test: {
    coverage: {
      all: false,
    },
  },
})
