import type {
  ScopedRegexOption,
  SingleRegexOption,
} from '../../types/scoped-regex-option'

/**
 * Partitions patterns by their scope (shallow or deep).
 *
 * @param patternOrPatterns - A single pattern or an array of patterns.
 * @returns An object containing arrays of shallow and deep scope patterns.
 */
export function partitionPatternsByScope(
  patternOrPatterns: ScopedRegexOption,
): {
  shallowScopePatterns: SingleRegexOption[]
  deepScopePatterns: SingleRegexOption[]
} {
  if (!Array.isArray(patternOrPatterns)) {
    let isDeepScopePattern = isDeepScopedPattern(patternOrPatterns)
    return {
      shallowScopePatterns: isDeepScopePattern ? [] : [patternOrPatterns],
      deepScopePatterns: isDeepScopePattern ? [patternOrPatterns] : [],
    }
  }

  let deepScopedPatterns: SingleRegexOption[] = []
  let shallowScopedPatterns: SingleRegexOption[] = []
  for (let pattern of patternOrPatterns) {
    let isDeepScopePattern = isDeepScopedPattern(pattern)
    if (isDeepScopePattern) {
      deepScopedPatterns.push(pattern)
    } else {
      shallowScopedPatterns.push(pattern)
    }
  }

  return {
    shallowScopePatterns: shallowScopedPatterns,
    deepScopePatterns: deepScopedPatterns,
  }
}

function isDeepScopedPattern(pattern: SingleRegexOption): boolean {
  if (typeof pattern !== 'object') {
    return false
  }
  if (!('scope' in pattern)) {
    return false
  }

  return pattern.scope === 'deep'
}
