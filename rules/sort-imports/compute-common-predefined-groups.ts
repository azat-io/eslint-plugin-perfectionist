import { builtinModules } from 'node:module'

import type { ReadClosestTsConfigByPathValue } from './read-closest-ts-config-by-path'
import type { RegexOption } from '../../types/common-options'

import { getTypescriptImport } from './get-typescript-import'
import { matches } from '../../utils/matches'

export let computeCommonPredefinedGroups = ({
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
}): string[] => {
  let matchesInternalPattern = (value: string): boolean | number =>
    options.internalPattern.some(pattern => matches(value, pattern))

  let internalExternalGroup = matchesInternalPattern(name)
    ? 'internal'
    : getInternalOrExternalGroup({
        tsConfigOutput,
        filename,
        name,
      })

  let predefinedGroups: string[] = []

  if (isIndex(name)) {
    predefinedGroups.push('index')
  }

  if (isSibling(name)) {
    predefinedGroups.push('sibling')
  }

  if (isParent(name)) {
    predefinedGroups.push('parent')
  }

  if (internalExternalGroup === 'internal') {
    predefinedGroups.push('internal')
  }

  if (isCoreModule(name, options.environment)) {
    predefinedGroups.push('builtin')
  }

  if (internalExternalGroup === 'external') {
    predefinedGroups.push('external')
  }

  return predefinedGroups
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
let isCoreModule = (value: string, environment: 'node' | 'bun'): boolean => {
  let valueToCheck = value.startsWith('node:') ? value.split('node:')[1] : value
  return (
    (!!valueToCheck && nodeBuiltinModules.has(valueToCheck)) ||
    builtinPrefixOnlyModules.has(value) ||
    (environment === 'bun' ? bunModules.has(value) : false)
  )
}

let isParent = (value: string): boolean => value.startsWith('..')

let isSibling = (value: string): boolean => value.startsWith('./')

let isIndex = (value: string): boolean =>
  [
    './index.d.js',
    './index.d.ts',
    './index.js',
    './index.ts',
    './index',
    './',
    '.',
  ].includes(value)

let getInternalOrExternalGroup = ({
  tsConfigOutput,
  filename,
  name,
}: {
  tsConfigOutput: ReadClosestTsConfigByPathValue | null
  filename: string
  name: string
}): 'internal' | 'external' | null => {
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
