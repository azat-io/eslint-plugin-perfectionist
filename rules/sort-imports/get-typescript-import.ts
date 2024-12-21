import type ts from 'typescript'

import { createRequire } from 'node:module'

/**
 * Cached reference to the TypeScript module.
 * @type {typeof ts | undefined}
 */
let cachedImport: typeof ts | undefined

/**
 * Indicates whether an attempt to load the TypeScript module has already been
 * made.
 * @type {boolean}
 */
let hasTriedLoadingTypescript: boolean = false

/**
 * Dynamically loads the typescript module if it's available and caches it.
 * @returns {typeof ts | null} The TypeScript module or null if it's not
 * available.
 */
export let getTypescriptImport = (): typeof ts | null => {
  if (cachedImport) {
    return cachedImport
  }
  if (hasTriedLoadingTypescript) {
    return null
  }
  hasTriedLoadingTypescript = true
  try {
    cachedImport = createRequire(import.meta.url)('typescript') as typeof ts
    // eslint-disable-next-line sonarjs/no-ignored-exceptions
  } catch (_error) {
    return null
  }
  return cachedImport
}
