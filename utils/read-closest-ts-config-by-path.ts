import type ts from 'typescript'

import * as path from 'node:path'
import * as fs from 'node:fs'

import { getTypescriptImport } from './get-typescript-import'

// Heavily inspired from https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-estree/src/parseSettings/getProjectConfigFiles.ts

interface InputProps {
  tsConfigRootDir: string
  filePath: string
}

export const directoryCacheByPath = new Map<string, string>()
export const contentCacheByPath = new Map<string, ts.CompilerOptions>()

export const readClosestTsConfigByPath = (
  input: InputProps,
): ts.CompilerOptions | null => {
  let typescriptImport = getTypescriptImport()
  if (!typescriptImport) {
    return null
  }

  let directory = path.dirname(input.filePath)
  let checkedDirectories = [directory]

  do {
    let tsconfigPath = path.join(directory, 'tsconfig.json')
    let cachedDirectory = directoryCacheByPath.get(directory)
    if (!cachedDirectory && fs.existsSync(tsconfigPath)) {
      cachedDirectory = tsconfigPath
    }

    if (cachedDirectory) {
      for (let dir of checkedDirectories) {
        directoryCacheByPath.set(dir, cachedDirectory)
      }
      return getCompilerOptions(typescriptImport, cachedDirectory)
    }

    directory = path.dirname(directory)
    checkedDirectories.push(directory)
  } while (
    directory.length > 1 &&
    directory.length >= input.tsConfigRootDir.length
  )

  throw new Error(
    `Couldn't find any tsconfig.json relative to '${input.filePath}' within '${input.tsConfigRootDir}'.`,
  )
}

const getCompilerOptions = (typescriptImport: typeof ts, filePath: string) => {
  if (contentCacheByPath.has(filePath)) {
    return contentCacheByPath.get(filePath)!
  }
  let configFileRead = typescriptImport.readConfigFile(
    filePath,
    typescriptImport.sys.readFile,
  )
  if (configFileRead.error) {
    throw new Error(
      'Error reading tsconfig file: ' + JSON.stringify(configFileRead.error),
    )
  }
  let parsedContent = typescriptImport.parseJsonConfigFileContent(
    configFileRead,
    typescriptImport.sys,
    './',
  )
  let compilerOptionsConverted =
    typescriptImport.convertCompilerOptionsFromJson(
      parsedContent.raw.config.compilerOptions,
      './',
    )
  if (compilerOptionsConverted.errors.length) {
    throw new Error(
      'Error getting compiler options: ' +
        JSON.stringify(compilerOptionsConverted.errors),
    )
  }
  contentCacheByPath.set(filePath, compilerOptionsConverted.options)
  return compilerOptionsConverted.options
}
