import { prettierFormat } from 'vite-plugin-prettier-format'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'node:path'

export default defineConfig({
  plugins: [
    dts({
      beforeWriteFile: (filePath, content) => ({
        content: content.replaceAll(
          /(?<importPath>(?:from|import\s*\()\s*["']\..*?)(?<quote>["'])/gu,
          (...replaceArguments) => {
            let { importPath, quote } = replaceArguments.at(-1) as {
              importPath: string
              quote: string
            }
            if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
              return `${importPath}${quote}`
            }
            return `${importPath}.js${quote}`
          },
        ),
        filePath,
      }),
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
})
