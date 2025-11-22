import type {
  CapturingGroup,
  CharacterClass,
  CharacterSet,
  Alternative,
  Quantifier,
  Element,
  Group,
} from '@eslint-community/regexpp/ast'

const MAX_FIRST_CHARACTER_PATHS = 32

/** Represents a deterministic path for the first character of an alternative. */
export interface FirstCharacterPath {
  /** Matcher that consumes the first character along the path. */
  matcher: CharacterMatcher

  /** Indicates whether additional characters must follow to complete the match. */
  requiresMore: boolean

  /**
   * Indicates whether the alternative can consume more characters after the
   * prefix.
   */
  canMatchMore: boolean
}

/** Matcher produced from a character class AST node. */
export interface CharacterMatcherCharacterClass {
  /** Identifies the matcher as a character class. */
  type: 'character-class'

  /** AST node that defines the character class. */
  value: CharacterClass
}

/** Matcher produced from a character set AST node. */
export interface CharacterMatcherCharacterSet {
  /** Identifies the matcher as a character set. */
  type: 'character-set'

  /** AST node that defines the character set. */
  value: CharacterSet
}

/** Matcher that describes a literal character code point. */
export interface CharacterMatcherCharacter {
  /** Identifies the matcher as a literal character. */
  type: 'character'

  /** Unicode code point matched by the literal. */
  value: number
}

/**
 * Describes a matcher capable of consuming the first character of an
 * alternative.
 */
export type CharacterMatcher =
  | CharacterMatcherCharacterClass
  | CharacterMatcherCharacterSet
  | CharacterMatcherCharacter

/** Tracks shared analysis state while traversing the AST. */
interface AnalysisContext {
  /** Cache storing computed minimum lengths for AST nodes. */
  minLengthCache: WeakMap<object, LengthResult>

  /** Cache storing computed maximum lengths for AST nodes. */
  maxLengthCache: WeakMap<object, LengthResult>

  /** Alternatives currently on the recursion stack. */
  minLengthActiveAlternatives: Set<Alternative>

  /** Alternatives on the recursion stack for maximum-length calculation. */
  maxLengthActiveAlternatives: Set<Alternative>

  /** Indicates whether collection exceeded the maximum allowed paths. */
  limitExceeded: boolean

  /** Count of collected paths used for enforcing the limit. */
  pathCount: number
}

/** Internal extension that includes metadata needed during traversal. */
interface FirstCharacterPathInternal extends FirstCharacterPath {
  /** Mirrors the public flags for convenience when mutating paths. */
  requiresMore: boolean
  canMatchMore: boolean
}

type LengthResult = LengthInfo | null

type LengthInfo = 0 | 1 | 2

/**
 * Computes all deterministic first-character paths for the given alternative.
 *
 * @param alternative - Alternative to analyze.
 * @returns Collection of first-character matchers with information whether more
 *   characters are required afterwards.
 */
export function getFirstCharacterPaths(
  alternative: Alternative,
): FirstCharacterPath[] {
  let context: AnalysisContext = {
    minLengthActiveAlternatives: new Set(),
    maxLengthActiveAlternatives: new Set(),
    minLengthCache: new WeakMap(),
    maxLengthCache: new WeakMap(),
    limitExceeded: false,
    pathCount: 0,
  }

  let paths = collectFirstCharacterPathsFromAlternative(alternative, context)

  if (context.limitExceeded) {
    return []
  }

  return paths
}

/**
 * Computes the maximum possible length for an element.
 *
 * @param element - AST element to analyze.
 * @param context - Shared traversal context.
 * @returns Maximum length in characters, `2` for "two or more", or `null` if
 *   unknown.
 */
function getElementMaxLength(
  element: Element,
  context: AnalysisContext,
): LengthResult {
  // Defensive guard triggers only when traversal exceeded path limit earlier.
  /* c8 ignore next 3 */
  if (context.limitExceeded) {
    return null
  }

  let cached = context.maxLengthCache.get(element)

  if (cached !== undefined) {
    return cached
  }

  let result: LengthResult = null

  switch (element.type) {
    case 'CharacterClass':
    case 'CharacterSet':
    case 'Character': {
      result = 1
      break
    }
    case 'CapturingGroup':
    case 'Group': {
      result = getGroupMaxLength(element, context)
      break
    }
    case 'Backreference': {
      result = null
      break
    }
    case 'Quantifier': {
      let innerLength = getElementMaxLength(element.element, context)

      if (innerLength === null) {
        result = null
        break
      }

      // Numerical sentinels are unreachable with current AST inputs.
      /* c8 ignore start */
      if (innerLength === 0 || element.max === 0) {
        result = 0
        break
      }

      if (element.max === Infinity) {
        result = 2
        break
      }
      /* c8 ignore stop */

      result = multiplyLength(innerLength, element.max)
      break
    }
    case 'Assertion': {
      result = 0
      break
    }
    default: {
      result = null
    }
  }

  context.maxLengthCache.set(element, result)

  return result
}

/**
 * Collects deterministic first-character paths that originate from the provided
 * element.
 *
 * @param element - AST element to analyze.
 * @param context - Shared traversal context.
 * @returns Paths that can begin with the provided element.
 */
function collectFirstCharacterPathsFromElement(
  element: Element,
  context: AnalysisContext,
): FirstCharacterPathInternal[] {
  switch (element.type) {
    case 'CharacterClass': {
      if (element.unicodeSets) {
        return []
      }

      return [
        {
          matcher: { type: 'character-class', value: element },
          requiresMore: false,
          canMatchMore: false,
        },
      ]
    }
    case 'CapturingGroup':
    case 'Group': {
      return element.alternatives.flatMap(alternative =>
        collectFirstCharacterPathsFromAlternative(alternative, context),
      )
    }
    case 'CharacterSet': {
      if (element.kind === 'property' && element.strings) {
        return []
      }

      return [
        {
          matcher: { type: 'character-set', value: element },
          requiresMore: false,
          canMatchMore: false,
        },
      ]
    }
    case 'Quantifier': {
      return collectFirstCharacterPathsFromQuantifier(element, context)
    }
    case 'Character': {
      return [
        {
          matcher: { value: element.value, type: 'character' },
          requiresMore: false,
          canMatchMore: false,
        },
      ]
    }
    default: {
      return []
    }
  }
}

/**
 * Collects all first-character paths for an alternative.
 *
 * @param alternative - Alternative whose elements should be inspected.
 * @param context - Shared traversal context.
 * @returns Paths describing all deterministic prefixes.
 */
function collectFirstCharacterPathsFromAlternative(
  alternative: Alternative,
  context: AnalysisContext,
): FirstCharacterPathInternal[] {
  let results: FirstCharacterPathInternal[] = []
  let { elements } = alternative

  for (let index = 0; index < elements.length; index++) {
    if (context.limitExceeded) {
      break
    }

    let element = elements[index]!

    if (element.type === 'Assertion') {
      continue
    }

    let elementPaths = collectFirstCharacterPathsFromElement(element, context)

    if (elementPaths.length > 0) {
      let restLength = getElementsMinLength(elements, index + 1, context)
      let restMaxLength = getElementsMaxLength(elements, index + 1, context)

      if (restLength !== null) {
        let restCanMatchMore = restMaxLength !== 0

        for (let path of elementPaths) {
          addPath(results, context, {
            canMatchMore: path.canMatchMore || restCanMatchMore,
            requiresMore: path.requiresMore || restLength > 0,
            matcher: path.matcher,
          })
        }
      }
    }

    if (!canElementMatchEmpty(element, context)) {
      break
    }
  }

  return results
}

/**
 * Expands quantifiers into their potential first-character paths.
 *
 * @param quantifier - Quantifier node to analyze.
 * @param context - Shared traversal context.
 * @returns Paths contributed by the quantified expression.
 */
function collectFirstCharacterPathsFromQuantifier(
  quantifier: Quantifier,
  context: AnalysisContext,
): FirstCharacterPathInternal[] {
  let innerPaths = collectFirstCharacterPathsFromElement(
    quantifier.element,
    context,
  )

  if (innerPaths.length === 0 || context.limitExceeded) {
    return []
  }

  let innerMinLength = getElementMinLength(quantifier.element, context)
  if (innerMinLength === null) {
    return []
  }

  let innerMaxLength = getElementMaxLength(quantifier.element, context)
  let requiresAdditionalIterations = quantifier.min > 1 && innerMinLength > 0
  let elementCanConsumeCharacters = innerMaxLength !== 0
  let allowsAdditionalIterations =
    elementCanConsumeCharacters &&
    (quantifier.max === Infinity || quantifier.max > 1)

  return innerPaths.map(path => ({
    requiresMore: path.requiresMore || requiresAdditionalIterations,
    canMatchMore: path.canMatchMore || allowsAdditionalIterations,
    matcher: path.matcher,
  }))
}

/**
 * Computes the minimum possible length for the provided element.
 *
 * @param element - AST element to analyze.
 * @param context - Shared traversal context.
 * @returns Minimum length in characters, `2` for "two or more", or `null` if
 *   unknown.
 */
function getElementMinLength(
  element: Element,
  context: AnalysisContext,
): LengthResult {
  if (context.limitExceeded) {
    return null
  }

  let cached = context.minLengthCache.get(element)

  if (cached !== undefined) {
    return cached
  }

  let result: LengthResult = null

  switch (element.type) {
    case 'CharacterClass':
    case 'CharacterSet':
    case 'Character': {
      result = 1
      break
    }
    case 'CapturingGroup':
    case 'Group': {
      result = getGroupMinLength(element, context)
      break
    }
    case 'Backreference': {
      result = null
      break
    }
    case 'Quantifier': {
      let innerLength = getElementMinLength(element.element, context)

      result = multiplyLength(innerLength, element.min)
      break
    }
    case 'Assertion': {
      result = 0
      break
    }
    default: {
      result = null
    }
  }

  context.minLengthCache.set(element, result)

  return result
}

/**
 * Computes the maximum possible length for an alternative.
 *
 * @param alternative - Alternative whose elements should be measured.
 * @param context - Shared traversal context.
 * @returns Maximum length for the entire alternative.
 */
function getAlternativeMaxLength(
  alternative: Alternative,
  context: AnalysisContext,
): LengthResult {
  let cached = context.maxLengthCache.get(alternative)

  // Cache reuse only occurs for recursive alternatives, which tests do not create.
  /* c8 ignore next 3 */
  if (cached !== undefined) {
    return cached
  }

  if (context.maxLengthActiveAlternatives.has(alternative)) {
    return null
  }

  context.maxLengthActiveAlternatives.add(alternative)

  let length = getElementsMaxLength(alternative.elements, 0, context)

  context.maxLengthActiveAlternatives.delete(alternative)
  context.maxLengthCache.set(alternative, length)

  return length
}

/**
 * Computes the minimum possible length for an alternative.
 *
 * @param alternative - Alternative whose elements should be measured.
 * @param context - Shared traversal context.
 * @returns Minimum length for the entire alternative.
 */
function getAlternativeMinLength(
  alternative: Alternative,
  context: AnalysisContext,
): LengthResult {
  let cached = context.minLengthCache.get(alternative)

  if (cached !== undefined) {
    return cached
  }

  if (context.minLengthActiveAlternatives.has(alternative)) {
    return null
  }

  context.minLengthActiveAlternatives.add(alternative)

  let length = getElementsMinLength(alternative.elements, 0, context)

  context.minLengthActiveAlternatives.delete(alternative)
  context.minLengthCache.set(alternative, length)

  return length
}

/**
 * Computes the maximum length of a suffix of elements.
 *
 * @param elements - Sequence of elements belonging to an alternative.
 * @param startIndex - Index from which the suffix begins.
 * @param context - Shared traversal context.
 * @returns Maximum length for the suffix.
 */
function getElementsMaxLength(
  elements: Alternative['elements'],
  startIndex: number,
  context: AnalysisContext,
): LengthResult {
  let length: LengthResult = 0

  for (let index = startIndex; index < elements.length; index++) {
    let element = elements[index]!
    let elementLength = getElementMaxLength(element, context)

    length = addLengths(length, elementLength)

    if (length === null) {
      return null
    }

    if (length === 2) {
      return 2
    }
  }

  return length
}

/**
 * Computes the minimum length of a suffix of elements.
 *
 * @param elements - Sequence of elements belonging to an alternative.
 * @param startIndex - Index from which the suffix begins.
 * @param context - Shared traversal context.
 * @returns Minimum length for the suffix.
 */
function getElementsMinLength(
  elements: Alternative['elements'],
  startIndex: number,
  context: AnalysisContext,
): LengthResult {
  let length: LengthResult = 0

  for (let index = startIndex; index < elements.length; index++) {
    let element = elements[index]!
    let elementLength = getElementMinLength(element, context)

    length = addLengths(length, elementLength)

    if (length === null) {
      return null
    }

    if (length === 2) {
      return 2
    }
  }

  return length
}

/**
 * Computes the minimum length among the alternatives contained in a group.
 *
 * @param group - Capturing or non-capturing group to analyze.
 * @param context - Shared traversal context.
 * @returns Minimum length across the group's alternatives.
 */
function getGroupMinLength(
  group: CapturingGroup | Group,
  context: AnalysisContext,
): LengthResult {
  let minLength: LengthResult = 2

  for (let alternative of group.alternatives) {
    let alternativeLength = getAlternativeMinLength(alternative, context)

    if (alternativeLength === null) {
      return null
    }

    if (alternativeLength < minLength) {
      minLength = alternativeLength
    }

    if (minLength === 0) {
      break
    }
  }

  return minLength
}

/**
 * Computes the maximum length among the alternatives contained in a group.
 *
 * @param group - Capturing or non-capturing group to analyze.
 * @param context - Shared traversal context.
 * @returns Maximum length across the group's alternatives.
 */
function getGroupMaxLength(
  group: CapturingGroup | Group,
  context: AnalysisContext,
): LengthResult {
  let maxLength: LengthResult = 0

  for (let alternative of group.alternatives) {
    let alternativeLength = getAlternativeMaxLength(alternative, context)

    if (alternativeLength === null) {
      return null
    }

    if (alternativeLength > maxLength) {
      maxLength = alternativeLength
    }

    if (maxLength === 2) {
      break
    }
  }

  return maxLength
}

/* c8 ignore start */
/**
 * Multiplies a minimum length by a quantifier count while respecting sentinel
 * values.
 *
 * @param length - Minimum length of the repeated element.
 * @param count - Minimum number of repetitions.
 * @returns Combined minimum length or `null` when unknown.
 */
function multiplyLength(length: LengthResult, count: number): LengthResult {
  if (length === null) {
    return null
  }

  if (length === 0 || count === 0) {
    return 0
  }

  if (length === 2) {
    return 2
  }

  if (count === 1) {
    return length
  }

  return 2
}
/* c8 ignore stop */

/**
 * Adds a collected path to the results while accounting for the safety limit.
 *
 * @param results - Accumulated path list.
 * @param context - Shared traversal context.
 * @param path - Path to add.
 */
function addPath(
  results: FirstCharacterPathInternal[],
  context: AnalysisContext,
  path: FirstCharacterPathInternal,
): void {
  results.push(path)
  context.pathCount += 1

  if (context.pathCount > MAX_FIRST_CHARACTER_PATHS) {
    context.limitExceeded = true
  }
}

/**
 * Adds two maximum-length values together, preserving sentinel semantics.
 *
 * @param a - First length operand.
 * @param b - Second length operand.
 * @returns Sum of the operands, clamped to the sentinel space.
 */
function addLengths(a: LengthResult, b: LengthResult): LengthResult {
  if (a === null || b === null) {
    return null
  }

  if (a === 2 || b === 2) {
    return 2
  }

  let sum = a + b

  if (sum >= 2) {
    return 2
  }

  return sum as LengthInfo
}

/**
 * Determines whether a given element can match an empty string.
 *
 * @param element - AST element to inspect.
 * @param context - Shared traversal context.
 * @returns True when the element can match zero characters.
 */
function canElementMatchEmpty(
  element: Element,
  context: AnalysisContext,
): boolean {
  let length = getElementMinLength(element, context)
  return length === 0
}
