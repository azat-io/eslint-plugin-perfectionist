import type {
  CharacterUnicodePropertyCharacterSet,
  CharacterClassElement,
  CharacterClassRange,
  CharacterClass,
  CharacterSet,
  Alternative,
} from '@eslint-community/regexpp/ast'

import type {
  CharacterMatcherCharacterClass,
  CharacterMatcherCharacterSet,
  FirstCharacterPath,
  CharacterMatcher,
} from './get-first-character-paths'

import {
  isLowercaseCharacter,
  isUppercaseCharacter,
  isDigitCharacter,
} from './get-character-class-element-category'
import { doesAlternativeShadowOther } from './does-alternative-shadow-other'
import { getFirstCharacterPaths } from './get-first-character-paths'

interface MatcherEvaluationContext {
  dotAll: boolean
}

/**
 * Checks whether the provided alternatives contain shadowing pairs.
 *
 * @param parameters - Alternatives to analyze.
 * @returns True when at least one alternative shadows another one.
 */
export function hasShadowingAlternatives({
  alternatives,
  flags,
}: {
  alternatives: Alternative[]
  flags: string
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

  let matcherContext: MatcherEvaluationContext = {
    dotAll: flags.includes('s'),
  }

  if (
    hasFirstCharacterShadowing({
      matcherContext,
      alternatives,
    })
  ) {
    return true
  }

  return false
}

function isComplementaryCharacterClass(
  characterClass: CharacterClass,
): boolean {
  // Unicode set aware classes never map into character-class matchers.
  /* c8 ignore next 3 */
  if (characterClass.unicodeSets) {
    return false
  }

  let { elements } = characterClass as {
    elements?: CharacterClass['elements']
  }

  if (!elements) {
    return false
  }

  // Empty-negated classes (e.g. `[^]`) are normalized before reaching here.
  /* c8 ignore next 3 */
  if (characterClass.negate && elements.length === 0) {
    return true
  }

  let seen = new Map<string, boolean>()

  for (let element of elements) {
    if (element.type !== 'CharacterSet') {
      continue
    }

    let identifier = getCharacterSetIdentifier(element)

    // String-based property escapes are filtered earlier.
    /* c8 ignore next 3 */
    if (!identifier) {
      continue
    }

    let previousNegation = seen.get(identifier)

    if (previousNegation === undefined) {
      seen.set(identifier, element.negate)
      continue
    }

    if (previousNegation !== element.negate) {
      return true
    }
  }

  return false
}

function hasShadowingDirection({
  matcherContext,
  shorterPaths,
  longerPaths,
}: {
  matcherContext: MatcherEvaluationContext
  shorterPaths: FirstCharacterPath[]
  longerPaths: FirstCharacterPath[]
}): boolean {
  for (let longerPath of longerPaths) {
    if (!longerPath.requiresMore && !longerPath.canMatchMore) {
      continue
    }

    let longerNeedsWildcardOverlap = longerPath.matcher.type !== 'character'

    for (let shorterPath of shorterPaths) {
      if (shorterPath.requiresMore) {
        continue
      }

      if (shorterPath.canMatchMore) {
        continue
      }

      if (shorterPath.matcher.type === 'character') {
        continue
      }

      if (longerNeedsWildcardOverlap) {
        if (isWildcardMatcher(shorterPath.matcher)) {
          return true
        }

        continue
      }

      if (
        doMatchersOverlap({
          right: shorterPath.matcher,
          left: longerPath.matcher,
          matcherContext,
        })
      ) {
        return true
      }
    }
  }

  return false
}

function characterSetContainsCodePoint({
  matcherContext,
  characterSet,
  codePoint,
}: {
  matcherContext: MatcherEvaluationContext
  characterSet: CharacterSet
  codePoint: number
}): boolean | null {
  switch (characterSet.kind) {
    case 'property': {
      if (characterSet.strings) {
        return null
      }

      let matches = unicodePropertyContainsCodePoint({
        propertySet: characterSet,
        codePoint,
      })

      if (matches === null) {
        return null
      }

      return applyNegation(characterSet, matches)
    }
    case 'digit': {
      return applyNegation(characterSet, isDigitCharacter(codePoint))
    }
    case 'space': {
      return applyNegation(characterSet, isWhitespaceCharacter(codePoint))
    }
    case 'word': {
      return applyNegation(characterSet, isWordCharacter(codePoint))
    }
    case 'any': {
      return matchesAnyCharacterSet({
        matcherContext,
        codePoint,
      })
    }
    default: {
      return null
    }
  }
}

function hasFirstCharacterShadowing({
  matcherContext,
  alternatives,
}: {
  matcherContext: MatcherEvaluationContext
  alternatives: Alternative[]
}): boolean {
  let firstCharacterPaths = alternatives.map(alternative =>
    getFirstCharacterPaths(alternative),
  )

  for (let index = 0; index < firstCharacterPaths.length; index++) {
    let current = firstCharacterPaths[index]!

    if (current.length === 0) {
      continue
    }

    for (
      let offset = index + 1;
      offset < firstCharacterPaths.length;
      offset++
    ) {
      let other = firstCharacterPaths[offset]!

      if (other.length === 0) {
        continue
      }

      if (
        hasShadowingDirection({
          longerPaths: current,
          shorterPaths: other,
          matcherContext,
        }) ||
        hasShadowingDirection({
          shorterPaths: current,
          longerPaths: other,
          matcherContext,
        })
      ) {
        return true
      }
    }
  }

  return false
}

function unicodePropertyContainsCodePoint({
  propertySet,
  codePoint,
}: {
  propertySet: CharacterUnicodePropertyCharacterSet
  codePoint: number
}): boolean | null {
  let cacheKey = `${propertySet.key}:${propertySet.value ?? ''}:${
    propertySet.negate ? '1' : '0'
  }`
  let cached = unicodePropertyRegexCache.get(cacheKey)

  if (!cached) {
    try {
      let identifier =
        propertySet.value === null
          ? propertySet.key
          : `${propertySet.key}=${propertySet.value}`
      cached = new RegExp(String.raw`\p{${identifier}}`, 'u')
      unicodePropertyRegexCache.set(cacheKey, cached)
    } catch {
      return null
    }
  }

  return cached.test(String.fromCodePoint(codePoint))
}

function doMatchersOverlap({
  matcherContext,
  right,
  left,
}: {
  right: CharacterMatcherCharacterClass | CharacterMatcherCharacterSet
  matcherContext: MatcherEvaluationContext
  left: CharacterMatcher
}): boolean {
  // Left is always a literal character in reachable flows.
  /* c8 ignore next 3 */
  if (left.type !== 'character') {
    return false
  }

  if (right.type === 'character-class') {
    return matcherContainsCharacter({
      characterClass: right.value,
      codePoint: left.value,
      matcherContext,
    })
  }

  return (
    characterSetContainsCodePoint({
      characterSet: right.value,
      codePoint: left.value,
      matcherContext,
    }) ?? false
  )
}

function classElementContainsCodePoint({
  matcherContext,
  codePoint,
  element,
}: {
  matcherContext: MatcherEvaluationContext
  element: CharacterClassElement
  codePoint: number
}): boolean | null {
  switch (element.type) {
    case 'CharacterClassRange': {
      return characterClassRangeContainsCodePoint({
        range: element,
        codePoint,
      })
    }
    case 'CharacterSet': {
      return characterSetContainsCodePoint({
        characterSet: element,
        matcherContext,
        codePoint,
      })
    }
    case 'Character': {
      return element.value === codePoint
    }
    default: {
      return null
    }
  }
}

function characterClassContainsCodePoint({
  characterClass,
  matcherContext,
  codePoint,
}: {
  matcherContext: MatcherEvaluationContext
  characterClass: CharacterClass
  codePoint: number
}): boolean | null {
  if (characterClass.unicodeSets) {
    return null
  }

  let isMatched = false

  for (let element of characterClass.elements) {
    if (
      classElementContainsCodePoint({
        matcherContext,
        codePoint,
        element,
      })
    ) {
      isMatched = true
      break
    }
  }

  return characterClass.negate ? !isMatched : isMatched
}

function getCharacterSetIdentifier(characterSet: CharacterSet): string | null {
  switch (characterSet.kind) {
    case 'property': {
      if (characterSet.strings) {
        return null
      }

      return `${characterSet.key}:${characterSet.value ?? ''}`
    }
    case 'digit':
    case 'space':
    case 'word':
    case 'any': {
      return characterSet.kind
    }
    default: {
      return null
    }
  }
}

function matcherContainsCharacter({
  matcherContext,
  characterClass,
  codePoint,
}: {
  matcherContext: MatcherEvaluationContext
  characterClass: CharacterClass
  codePoint: number
}): boolean {
  return (
    characterClassContainsCodePoint({
      characterClass,
      matcherContext,
      codePoint,
    }) ?? false
  )
}

function isWildcardMatcher(
  matcher: CharacterMatcherCharacterClass | CharacterMatcherCharacterSet,
): boolean {
  if (matcher.type === 'character-set') {
    return matcher.value.kind === 'any'
  }

  return isComplementaryCharacterClass(matcher.value)
}

function matchesAnyCharacterSet({
  matcherContext,
  codePoint,
}: {
  matcherContext: MatcherEvaluationContext
  codePoint: number
}): boolean {
  if (matcherContext.dotAll) {
    return true
  }

  return !isLineTerminator(codePoint)
}

function isWordCharacter(codePoint: number): boolean {
  return (
    isDigitCharacter(codePoint) ||
    isLowercaseCharacter(codePoint) ||
    isUppercaseCharacter(codePoint) ||
    codePoint === UNDERSCORE_CODE_POINT
  )
}

function characterClassRangeContainsCodePoint({
  codePoint,
  range,
}: {
  range: CharacterClassRange
  codePoint: number
}): boolean {
  return range.min.value <= codePoint && codePoint <= range.max.value
}

function isLineTerminator(codePoint: number): boolean {
  return (
    codePoint === 0x0a ||
    codePoint === 0x0d ||
    codePoint === 0x2028 ||
    codePoint === 0x2029
  )
}

function isWhitespaceCharacter(codePoint: number): boolean {
  return WHITESPACE_PATTERN.test(String.fromCodePoint(codePoint))
}

function applyNegation(node: { negate?: boolean }, result: boolean): boolean {
  return node.negate ? !result : result
}

const WHITESPACE_PATTERN = /\s/u
const UNDERSCORE_CODE_POINT = '_'.codePointAt(0)!
let unicodePropertyRegexCache = new Map<string, RegExp>()
