import type ts from 'typescript'

import { createRequire } from 'node:module'

let cachedImport: typeof ts | undefined
let hasTriedLoadingTypescript = false

/**
 * Dynamically loads the typescript module if it's available and caches it.
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
  } catch (_error) {
    return null
  }
  return cachedImport
}
