import type { Selector } from './types'

/**
 * Resolves selector type for a regular expression alternative.
 *
 * @param parameters - Alternative alias metadata.
 * @returns Selector describing the alternative.
 */
export function getSelector({
  alternativeAlias,
}: {
  alternativeAlias: string | null
}): Selector {
  return alternativeAlias ? 'alias' : 'pattern'
}
