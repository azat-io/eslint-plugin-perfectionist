import { prettierFormat } from 'vite-plugin-prettier-format'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import fs from 'node:fs/promises'
import path from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      onwarn: (warning, warn) => {
        let suppressedCodes = ['MIXED_EXPORTS']

        if (!suppressedCodes.includes(warning.code ?? '')) {
          warn(warning)
        }
      },
      output: {
        preserveModules: true,
        exports: 'auto',
      },
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
    },
    lib: {
      entry: [
        path.resolve(__dirname, 'index.ts'),
        path.resolve(__dirname, 'utils', 'alphabet.ts'),
      ],
      fileName: (_format, entryName) => `${entryName}.js`,
      name: 'eslint-plugin-perfectionist',
      formats: ['cjs'],
    },
    minify: false,
  },
  plugins: [
    dts({
      afterBuild: async () => {
        await fs.writeFile(
          'dist/index.d.ts',
          `${(await fs.readFile('dist/index.d.ts'))
            .toString()
            .replace(/\nexport .+/u, '')}export = _default`,
        )
      },
      include: [
        path.join(__dirname, 'index.ts'),
        path.join(__dirname, 'types'),
        path.join(__dirname, 'rules'),
        path.join(__dirname, 'utils'),
      ],
      insertTypesEntry: true,
      strictOutput: true,
      rollupTypes: true,
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
