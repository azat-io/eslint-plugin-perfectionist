import { builtinModules } from 'node:module'

import type { ReadClosestTsConfigByPathValue } from './read-closest-ts-config-by-path'
import type { RegexOption } from '../../types/common-options'
import type { Selector } from './types'

import { matchesTsconfigPaths } from './matches-tsconfig-paths'
import { getTypescriptImport } from './get-typescript-import'
import { matches } from '../../utils/matches'

/**
 * Common import selector types that categorize imports by their
 * characteristics.
 *
 * These selectors are used to identify and group imports based on their module
 * path patterns and resolution characteristics.
 */
type CommonSelector = Extract<
  Selector,
  | 'tsconfig-path'
  | 'external'
  | 'internal'
  | 'builtin'
  | 'sibling'
  | 'subpath'
  | 'parent'
  | 'index'
>

/**
 * Computes all applicable selectors for an import based on its module path.
 *
 * Analyzes an import's module specifier to determine which categories it
 * belongs to, such as external package, internal module, relative import, or
 * Node.js builtin. These selectors are used for grouping and sorting imports
 * according to user configuration.
 *
 * @param options - Configuration options.
 * @param options.tsConfigOutput - TypeScript configuration for path resolution.
 * @param options.filename - Current file path for relative import resolution.
 * @param options.options - Rule options including internal patterns and
 *   environment.
 * @param options.name - Import module specifier to analyze.
 * @returns Array of matching selectors for the import.
 */
export function computeCommonSelectors({
  tsConfigOutput,
  filename,
  options,
  name,
}: {
  options: {
    internalPattern: RegexOption[]
    environment: 'node' | 'bun'
  }
  tsConfigOutput: ReadClosestTsConfigByPathValue | null
  filename: string
  name: string
}): CommonSelector[] {
  function matchesInternalPattern(value: string): boolean | number {
    return options.internalPattern.some(pattern => matches(value, pattern))
  }

  let internalExternalGroup = matchesInternalPattern(name)
    ? 'internal'
    : getInternalOrExternalGroup({
        tsConfigOutput,
        filename,
        name,
      })

  let commonSelectors: CommonSelector[] = []

  if (
    tsConfigOutput &&
    matchesTsconfigPaths({
      tsConfigOutput,
      name,
    })
  ) {
    commonSelectors.push('tsconfig-path')
  }

  if (isIndex(name)) {
    commonSelectors.push('index')
  }

  if (isSibling(name)) {
    commonSelectors.push('sibling')
  }

  if (isParent(name)) {
    commonSelectors.push('parent')
  }

  if (isSubpath(name)) {
    commonSelectors.push('subpath')
  }

  if (internalExternalGroup === 'internal') {
    commonSelectors.push('internal')
  }

  if (isCoreModule(name, options.environment)) {
    commonSelectors.push('builtin')
  }

  if (internalExternalGroup === 'external') {
    commonSelectors.push('external')
  }

  return commonSelectors
}

let bunModules = new Set([
  'detect-libc',
  'bun:sqlite',
  'bun:test',
  'bun:wrap',
  'bun:ffi',
  'bun:jsc',
  'undici',
  'bun',
  'ws',
])

let nodeBuiltinModules = new Set(builtinModules)

let builtinPrefixOnlyModules = new Set(['node:sqlite', 'node:test', 'node:sea'])

/**
 * Determines whether an import is internal or external to the project.
 *
 * Uses TypeScript's module resolution to accurately classify imports based on
 * whether they resolve to external libraries (node_modules) or internal project
 * files. Falls back to path-based heuristics when TypeScript is unavailable.
 *
 * @param options - Options for determining the group.
 * @param options.tsConfigOutput - TypeScript configuration for module
 *   resolution.
 * @param options.filename - Current file path for resolution context.
 * @param options.name - Import module specifier to classify.
 * @returns 'internal' for project modules, 'external' for dependencies, null
 *   for relative imports.
 */
function getInternalOrExternalGroup({
  tsConfigOutput,
  filename,
  name,
}: {
  tsConfigOutput: ReadClosestTsConfigByPathValue | null
  filename: string
  name: string
}): 'external' | 'internal' | null {
  let typescriptImport = getTypescriptImport()
  if (!typescriptImport) {
    return !name.startsWith('.') && !name.startsWith('/') ? 'external' : null
  }

  let isRelativeImport = typescriptImport.isExternalModuleNameRelative(name)
  if (isRelativeImport) {
    return null
  }
  if (!tsConfigOutput) {
    return 'external'
  }

  let resolution = typescriptImport.resolveModuleName(
    name,
    filename,
    tsConfigOutput.compilerOptions,
    typescriptImport.sys,
    tsConfigOutput.cache,
  )
  // If the module can't be resolved, assume it is external.
  if (typeof resolution.resolvedModule?.isExternalLibraryImport !== 'boolean') {
    return 'external'
  }

  return resolution.resolvedModule.isExternalLibraryImport
    ? 'external'
    : 'internal'
}

/**
 * Checks if a module is a Node.js or Bun builtin module.
 *
 * Handles various formats including 'node:' prefixed modules and subpath
 * imports (e.g., 'fs/promises'). Also supports Bun-specific modules when in Bun
 * environment.
 *
 * @param value - Module specifier to check.
 * @param environment - Runtime environment ('node' or 'bun').
 * @returns True if the module is a builtin module.
 */
function isCoreModule(value: string, environment: 'node' | 'bun'): boolean {
  function clean(string_: string): string {
    return string_.replace(/^(?:node:){1,2}/u, '')
  }
  let [basePath] = value.split('/')

  let cleanValue = clean(value)
  let cleanBase = clean(basePath!)

  if (nodeBuiltinModules.has(cleanValue) || nodeBuiltinModules.has(cleanBase)) {
    return true
  }

  if (
    builtinPrefixOnlyModules.has(value) ||
    builtinPrefixOnlyModules.has(`node:${cleanValue}`) ||
    builtinPrefixOnlyModules.has(basePath!) ||
    builtinPrefixOnlyModules.has(`node:${cleanBase}`)
  ) {
    return true
  }

  return environment === 'bun' && bunModules.has(value)
}

/**
 * Checks if an import is an index file import.
 *
 * @param value - Import path to check.
 * @returns True if importing an index file.
 */
function isIndex(value: string): boolean {
  return [
    './index.d.js',
    './index.d.ts',
    './index.js',
    './index.ts',
    './index',
    './',
    '.',
  ].includes(value)
}

/**
 * Checks if an import is a sibling module (same directory).
 *
 * @param value - Import path to check.
 * @returns True if importing from the same directory.
 */
function isSibling(value: string): boolean {
  return value.startsWith('./')
}

/**
 * Checks if an import is from a parent directory.
 *
 * @param value - Import path to check.
 * @returns True if importing from a parent directory.
 */
function isParent(value: string): boolean {
  return value.startsWith('..')
}

/**
 * Checks if an import is a Node.js subpath import.
 *
 * Subpath imports start with '#' and are defined in package.json imports field.
 *
 * @param value - Import path to check.
 * @returns True if using subpath import syntax.
 */
function isSubpath(value: string): boolean {
  return value.startsWith('#')
}
