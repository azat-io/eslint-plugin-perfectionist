import { prettierFormat } from 'vite-plugin-prettier-format'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: [
        path.resolve(__dirname, 'index.ts'),
        path.resolve(__dirname, 'utils', 'alphabet.ts'),
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
        path.join(__dirname, 'index.ts'),
        path.join(__dirname, 'types'),
        path.join(__dirname, 'rules'),
        path.join(__dirname, 'utils'),
      ],
      insertTypesEntry: true,
      copyDtsFiles: true,
      strictOutput: true,
    }),
    prettierFormat(),
  ],
  test: {
    coverage: {
      thresholds: {
        100: true,
      },
      all: false,
    },
  },
})
