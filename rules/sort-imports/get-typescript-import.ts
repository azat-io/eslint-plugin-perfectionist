import type ts from 'typescript'

import { createRequire } from 'node:module'

/**
 * Cached reference to the TypeScript module.
 */
let cachedImport: typeof ts | undefined

/**
 * Indicates whether an attempt to load the TypeScript module has already been
 * made.
 */
let hasTriedLoadingTypescript: boolean = false

let requiredTypescriptAttributes = [
  'convertCompilerOptionsFromJson',
  'createModuleResolutionCache',
  'isExternalModuleNameRelative',
  'parseJsonConfigFileContent',
  'readConfigFile',
  'resolveModuleName',
  'sys',
] as const satisfies (keyof typeof ts)[]
export type TypescriptImport = Pick<
  typeof ts,
  (typeof requiredTypescriptAttributes)[number]
>

/**
 * Dynamically loads the typescript module if it's available and caches it.
 *
 * @returns The TypeScript module or null if it's not available.
 */
export function getTypescriptImport(): TypescriptImport | null {
  if (cachedImport) {
    return cachedImport
  }
  if (hasTriedLoadingTypescript) {
    return null
  }
  hasTriedLoadingTypescript = true
  try {
    let tsImport = createRequire(import.meta.url)('typescript') as typeof ts
    if (!isSupportedTypescriptVersion(tsImport)) {
      return null
    }

    cachedImport = tsImport
    return cachedImport
    // eslint-disable-next-line sonarjs/no-ignored-exceptions
  } catch (_error) {
    return null
  }
}

function isSupportedTypescriptVersion(typescriptImport: typeof ts): boolean {
  return requiredTypescriptAttributes.every(attribute =>
    Object.hasOwn(typescriptImport, attribute),
  )
}
