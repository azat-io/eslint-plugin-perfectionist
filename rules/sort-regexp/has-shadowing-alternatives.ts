import type { Alternative } from '@eslint-community/regexpp/ast'

import { doesAlternativeShadowOther } from './does-alternative-shadow-other'

/**
 * Checks whether the provided alternatives contain shadowing pairs.
 *
 * @param parameters - Alternatives to analyze.
 * @returns True when at least one alternative shadows another one.
 */
export function hasShadowingAlternatives({
  alternatives,
}: {
  alternatives: Alternative[]
}): boolean {
  let hasNegatedCharacterClassAlternative = alternatives.some(alternative => {
    let firstElement = alternative.elements.at(0)

    if (!firstElement) {
      return false
    }

    if (
      firstElement.type === 'Quantifier' &&
      firstElement.element.type === 'CharacterClass'
    ) {
      return firstElement.element.negate
    }

    return firstElement.type === 'CharacterClass' && firstElement.negate
  })

  if (hasNegatedCharacterClassAlternative) {
    return true
  }

  let rawAlternatives = alternatives.map(alternative => alternative.raw)

  for (let index = 0; index < rawAlternatives.length; index++) {
    let current = rawAlternatives[index]!

    for (let offset = index + 1; offset < rawAlternatives.length; offset++) {
      let other = rawAlternatives[offset]!

      if (doesAlternativeShadowOther(current, other)) {
        return true
      }
    }
  }

  return false
}
