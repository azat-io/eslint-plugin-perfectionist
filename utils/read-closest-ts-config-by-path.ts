import type ts from 'typescript'

import * as path from 'node:path'
import * as fs from 'node:fs'

import { getTypescriptImport } from './get-typescript-import'

/**
 * Heavily inspired from:
 * https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-estree/src/parseSettings/getProjectConfigFiles.ts
 */

interface InputProps {
  tsconfigRootDir: string
  contextCwd: string
  filePath: string
}

interface OutputProps {
  compilerOptions: ts.CompilerOptions
  cache: ts.ModuleResolutionCache
}

export let directoryCacheByPath = new Map<string, string>()
export let contentCacheByPath = new Map<string, OutputProps>()

export let readClosestTsConfigByPath = (
  input: InputProps,
): OutputProps | null => {
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
      for (let checkedDirectory of checkedDirectories) {
        directoryCacheByPath.set(checkedDirectory, cachedDirectory)
      }
      return getCompilerOptions(
        typescriptImport,
        input.contextCwd,
        cachedDirectory,
      )
    }

    directory = path.dirname(directory)
    checkedDirectories.push(directory)
  } while (
    directory.length > 1 &&
    directory.length >= input.tsconfigRootDir.length
  )

  throw new Error(
    `Couldn't find any tsconfig.json relative to '${input.filePath}' within '${input.tsconfigRootDir}'.`,
  )
}

let getCompilerOptions = (
  typescriptImport: typeof ts,
  contextCwd: string,
  filePath: string,
): OutputProps => {
  if (contentCacheByPath.has(filePath)) {
    return contentCacheByPath.get(filePath)!
  }
  let configFileRead = typescriptImport.readConfigFile(
    filePath,
    typescriptImport.sys.readFile,
  )
  if (configFileRead.error) {
    throw new Error(
      `Error reading tsconfig file: ${JSON.stringify(configFileRead.error)}`,
    )
  }
  let parsedContent = typescriptImport.parseJsonConfigFileContent(
    configFileRead,
    typescriptImport.sys,
    path.dirname(filePath),
  )
  let compilerOptionsConverted =
    typescriptImport.convertCompilerOptionsFromJson(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      parsedContent.raw.config.compilerOptions,
      path.dirname(filePath),
    )
  if (compilerOptionsConverted.errors.length) {
    throw new Error(
      `Error getting compiler options: ${JSON.stringify(
        compilerOptionsConverted.errors,
      )}`,
    )
  }
  let cache = typescriptImport.createModuleResolutionCache(
    contextCwd,
    fileName => typescriptImport.sys.resolvePath(fileName),
    compilerOptionsConverted.options,
  )
  let output: OutputProps = {
    compilerOptions: compilerOptionsConverted.options,
    cache,
  }
  contentCacheByPath.set(filePath, output)
  return output
}
