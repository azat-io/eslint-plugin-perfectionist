import type { Plugin } from 'vite'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import fs from 'node:fs/promises'
import prettier from 'prettier'
import path from 'node:path'

let getAllFiles = async (dir: string) => {
  let files = await fs.readdir(dir)
  files = (await Promise.all(
    files.map(async file => {
      let filePath = path.join(dir, file)
      let stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        return getAllFiles(filePath)
      } else if (stats.isFile()) {
        return filePath
      }
      return null
    }),
  )) as string[]
  return files
    .reduce((all: string[], folderContents) => [...all, folderContents], [])
    .flat()
}

let prettierPlugin = (): Plugin => {
  let outDir: string = 'dist'
  return {
    closeBundle: async () => {
      let outputDir = path.resolve(outDir)

      if (!outputDir) {
        console.warn(
          'Output directory or file is not specified in the bundle options.',
        )
        return
      }

      let files = await getAllFiles(outputDir)

      for (let file of files) {
        let fileContent = await fs.readFile(file, 'utf8')
        let prettierConfig = await prettier.resolveConfig(file)
        let formattedContent = await prettier.format(fileContent, {
          ...prettierConfig,
          filepath: file,
        })
        await fs.writeFile(file, formattedContent, 'utf8')
      }
    },
    configResolved: config => {
      ;({ outDir } = config.build)
    },
    name: 'vite-plugin-prettier',
  }
}

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
      fileName: (_format, entryName) => `${entryName}.js`,
      entry: path.resolve(__dirname, 'index.ts'),
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
          (await fs.readFile('dist/index.d.ts'))
            .toString()
            .replace(/\nexport .+/, '') + 'export = _default',
        )
      },
      include: [
        path.join(__dirname, 'index.ts'),
        path.join(__dirname, 'typings'),
        path.join(__dirname, 'rules'),
        path.join(__dirname, 'utils'),
      ],
      insertTypesEntry: true,
      strictOutput: true,
      rollupTypes: true,
    }),
    prettierPlugin(),
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
