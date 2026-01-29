import type ts from 'typescript'

import * as path from 'node:path'
import * as fs from 'node:fs'

import { getTypescriptImport } from './get-typescript-import'

/**
 * Heavily inspired from:
 * https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-estree/src/parseSettings/getProjectConfigFiles.ts.
 */

/**
 * Parsed TypeScript configuration with compiler options and module resolution
 * cache.
 */
export interface ReadClosestTsConfigByPathValue {
  /**
   * TypeScript compiler options including path mappings and module resolution
   * settings.
   */
  compilerOptions: ts.CompilerOptions
  /**
   * Module resolution cache for efficient repeated resolutions.
   */
  cache: ts.ModuleResolutionCache
}

/**
 * Cache mapping directories to their nearest tsconfig file path. Speeds up
 * config resolution for files in the same directory.
 */
export let directoryCacheByPath = new Map<string, string>()

/**
 * Cache mapping file paths to their parsed tsconfig content. Prevents
 * re-parsing the same config files multiple times.
 */
export let contentCacheByPath = new Map<
  string,
  ReadClosestTsConfigByPathValue
>()

/**
 * Finds and parses the closest tsconfig.json file in the directory hierarchy.
 *
 * Searches upward from the file's directory until finding a tsconfig file or
 * reaching the configured root directory. Results are cached for performance.
 *
 * @param options - Configuration options.
 * @param options.tsconfigFilename - Name of the config file to search for
 *   (e.g., 'tsconfig.json').
 * @param options.tsconfigRootDir - Root directory to stop searching at.
 * @param options.contextCwd - Current working directory for module resolution.
 * @param options.filePath - Path of the file to find config for.
 * @returns Parsed TypeScript configuration or null if TypeScript is
 *   unavailable.
 * @throws {Error} If no tsconfig file is found within the root directory.
 */
export function readClosestTsConfigByPath({
  tsconfigFilename,
  tsconfigRootDir,
  contextCwd,
  filePath,
}: {
  tsconfigFilename: string
  tsconfigRootDir: string
  contextCwd: string
  filePath: string
}): ReadClosestTsConfigByPathValue | null {
  let typescriptImport = getTypescriptImport()
  if (!typescriptImport) {
    return null
  }

  let directory = path.dirname(filePath)
  let checkedDirectories = [directory]

  do {
    let tsconfigPath = path.join(directory, tsconfigFilename)
    let cachedDirectory = directoryCacheByPath.get(directory)

    if (!cachedDirectory && fs.existsSync(tsconfigPath)) {
      cachedDirectory = tsconfigPath
    }

    if (cachedDirectory) {
      for (let checkedDirectory of checkedDirectories) {
        directoryCacheByPath.set(checkedDirectory, cachedDirectory)
      }
      return getCompilerOptions(typescriptImport, contextCwd, cachedDirectory)
    }

    directory = path.dirname(directory)
    checkedDirectories.push(directory)
  } while (directory.length > 1 && directory.length >= tsconfigRootDir.length)

  throw new Error(
    `Couldn't find any ${tsconfigFilename} relative to '${filePath}' within '${tsconfigRootDir}'.`,
  )
}

/**
 * Parses a TypeScript configuration file and extracts compiler options.
 *
 * Reads and validates the tsconfig file, then creates a module resolution cache
 * for efficient import resolution. Results are cached to avoid re-parsing.
 *
 * @param typescriptImport - TypeScript library import.
 * @param contextCwd - Current working directory for resolution.
 * @param filePath - Path to the tsconfig file to parse.
 * @returns Parsed compiler options and resolution cache.
 * @throws {Error} If the config file cannot be read or parsed.
 */
function getCompilerOptions(
  typescriptImport: typeof ts,
  contextCwd: string,
  filePath: string,
): ReadClosestTsConfigByPathValue {
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
      // eslint-disable-next-line typescript/no-unsafe-member-access
      parsedContent.raw.config.compilerOptions,
      path.dirname(filePath),
    )

  if (compilerOptionsConverted.errors.length > 0) {
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

  let output: ReadClosestTsConfigByPathValue = {
    compilerOptions: compilerOptionsConverted.options,
    cache,
  }

  contentCacheByPath.set(filePath, output)

  return output
}
