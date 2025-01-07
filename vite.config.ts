import type { Plugin } from 'vite'

import { resolveConfig, format } from 'prettier'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import fs from 'node:fs/promises'
import path from 'node:path'

let getAllFiles = async (directory: string): Promise<string[]> => {
  let entries = await fs.readdir(directory, { withFileTypes: true })

  let childPathsPromises = entries.map(async entry => {
    let filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return getAllFiles(filePath)
    } else if (entry.isFile()) {
      return [filePath]
    }
    return []
  })

  let nestedPaths = await Promise.all(childPathsPromises)
  return nestedPaths.flat()
}

let prettierPlugin = (): Plugin => {
  let outputDirectory: string = 'dist'
  return {
    closeBundle: async () => {
      let resolvedOutputDirectory = path.resolve(outputDirectory)

      if (!resolvedOutputDirectory) {
        console.warn(
          'Output directory or file is not specified in the bundle options.',
        )
        return
      }

      let files = await getAllFiles(resolvedOutputDirectory)

      await Promise.all(
        files.map(async file => {
          let fileContent = await fs.readFile(file, 'utf8')
          let prettierConfig = await resolveConfig(file)
          let formattedContent = await format(fileContent, {
            ...prettierConfig,
            filepath: file,
          })
          await fs.writeFile(file, formattedContent, 'utf8')
        }),
      )
    },
    configResolved: config => {
      outputDirectory = config.build.outDir
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
