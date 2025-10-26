import type { Alternative } from '@eslint-community/regexpp/ast'

/**
 * Extracts an alias name for a given alternative, if present.
 *
 * @param alternative - Alternative to inspect.
 * @returns Alias name or null when absent.
 */
export function getAlternativeAlias(alternative: Alternative): string | null {
  let [element] = alternative.elements
  if (element && element.type === 'CapturingGroup' && element.name) {
    return element.name
  }

  if (alternative.parent.type === 'CapturingGroup' && alternative.parent.name) {
    return alternative.parent.name
  }

  return null
}
