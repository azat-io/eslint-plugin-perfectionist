import { prettierFormat } from 'vite-plugin-prettier-format'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: [
        path.resolve(import.meta.dirname, 'index.ts'),
        path.resolve(import.meta.dirname, 'utils', 'alphabet.ts'),
      ],
      fileName: (_format, entryName) => `${entryName}.js`,
      name: 'eslint-plugin-perfectionist',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        exports: 'auto',
      },
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
    },
    minify: false,
  },
  plugins: [
    dts({
      include: [
        path.join(import.meta.dirname, 'index.ts'),
        path.join(import.meta.dirname, 'types'),
        path.join(import.meta.dirname, 'rules'),
        path.join(import.meta.dirname, 'utils'),
      ],
      insertTypesEntry: true,
      copyDtsFiles: true,
      strictOutput: true,
    }),
    prettierFormat(),
  ],
})
