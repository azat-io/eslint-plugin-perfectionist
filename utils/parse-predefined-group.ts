/**
 * A predefined group name split into its selector and modifiers.
 */
interface ParsedPredefinedGroup<
  Selector extends string,
  Modifier extends string,
> {
  /**
   * Modifiers of the group, ordered as in `allModifiers`.
   */
  modifiers: Modifier[]

  /**
   * Selector of the group.
   */
  selector: Selector
}

/**
 * Parses a predefined group name into its selector and modifiers.
 *
 * The name is read from right to left. The longest selector (up to 3 words)
 * comes first, then the longest modifiers. Every word must belong to a selector
 * or a modifier, and a modifier must not repeat.
 *
 * @example
 *
 * ```ts
 * parsePredefinedGroup({
 *   allSelectors: ['get-method', 'method'],
 *   allModifiers: ['static', 'async'],
 *   name: 'async-static-get-method',
 * })
 * // Returns: { selector: 'get-method', modifiers: ['static', 'async'] }
 * ```
 *
 * @param params - Parameters object.
 * @param params.allSelectors - Available selectors for the rule.
 * @param params.allModifiers - Available modifiers for the rule.
 * @param params.name - Group name to parse.
 * @returns The parsed group, or null if the name is not a predefined group.
 */
export function parsePredefinedGroup<
  Selector extends string,
  Modifier extends string,
>({
  allSelectors,
  allModifiers,
  name,
}: {
  allSelectors: readonly Selector[]
  allModifiers: readonly Modifier[]
  name: string
}): ParsedPredefinedGroup<Selector, Modifier> | null {
  let elementsSeparatedWithDash = name.split('-')

  let longestAllowedSelector = computeLongestAllowedWord({
    allowedValues: allSelectors,
    elementsSeparatedWithDash,
  })
  if (!longestAllowedSelector) {
    return null
  }

  let modifiersToParse = elementsSeparatedWithDash.slice(
    0,
    -longestAllowedSelector.wordCount,
  )
  let parsedModifiers = new Set<Modifier>()
  while (modifiersToParse.length > 0) {
    let longestAllowedModifier = computeLongestAllowedWord({
      elementsSeparatedWithDash: modifiersToParse,
      allowedValues: allModifiers,
    })
    if (!longestAllowedModifier) {
      return null
    }
    if (parsedModifiers.has(longestAllowedModifier.word)) {
      return null
    }
    parsedModifiers.add(longestAllowedModifier.word)
    modifiersToParse = modifiersToParse.slice(
      0,
      -longestAllowedModifier.wordCount,
    )
  }

  return {
    modifiers: allModifiers.filter(modifier => parsedModifiers.has(modifier)),
    selector: longestAllowedSelector.word,
  }
}

/**
 * Finds the longest allowed word at the end of a dash-separated array.
 *
 * Tries 3-word, 2-word, then 1-word combinations from the end of the array.
 *
 * @example
 *
 * ```ts
 * computeLongestAllowedWord({
 *   elementsSeparatedWithDash: ['static', 'get', 'method'],
 *   allowedValues: ['method', 'get-method', 'property'],
 * })
 * // Returns: { word: 'get-method', wordCount: 2 }
 * ```
 *
 * @param params - Parameters object.
 * @param params.elementsSeparatedWithDash - Words of the group name.
 * @param params.allowedValues - Values the word may match.
 * @returns The matched word with its word count, or null if no match.
 */
function computeLongestAllowedWord<T extends string>({
  elementsSeparatedWithDash,
  allowedValues,
}: {
  elementsSeparatedWithDash: string[]
  allowedValues: readonly T[]
}): { wordCount: number; word: T } | null {
  for (
    let wordCount = Math.min(3, elementsSeparatedWithDash.length);
    wordCount > 0;
    wordCount--
  ) {
    let candidate = elementsSeparatedWithDash.slice(-wordCount).join('-')
    let word = allowedValues.find(value => value === candidate)
    if (word) {
      return { wordCount, word }
    }
  }

  return null
}
