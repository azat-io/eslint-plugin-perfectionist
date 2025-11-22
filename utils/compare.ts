import { compare as createNaturalCompare } from 'natural-orderby'

import type {
  SpecialCharactersOption,
  CommonOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { convertBooleanToSign } from './convert-boolean-to-sign'
import { UnreachableCaseError } from './unreachable-case-error'

/**
 * Function that extracts a string value from a sorting node for comparison.
 *
 * @template T - Type of the sorting node.
 * @param node - The node to extract value from.
 * @returns String value to be used for comparison.
 */
export type NodeValueGetterFunction<T extends SortingNode> = (node: T) => string

/**
 * Parameters for comparing two sorting nodes.
 *
 * @template T - Type of the sorting node.
 */
interface CompareParameters<T extends SortingNode> {
  /**
   * Optional custom value getter for fallback sorting. Used when primary
   * comparison returns equal.
   */
  fallbackSortNodeValueGetter?: NodeValueGetterFunction<T> | null

  /**
   * Optional custom value getter for primary sorting. If not provided, defaults
   * to node.name.
   */
  nodeValueGetter?: NodeValueGetterFunction<T> | null

  /** Sorting options including type, order, and additional configuration. */
  options: CommonOptions

  /** First node to compare. */
  a: T

  /** Second node to compare. */
  b: T
}

/**
 * Function signature for comparing two nodes during sorting.
 *
 * @template T - Type of the sorting node.
 * @param a - First node to compare.
 * @param b - Second node to compare.
 * @returns Negative if a < b, positive if a > b, zero if equal.
 */
type SortingFunction<T extends SortingNode> = (a: T, b: T) => number

/**
 * Map of characters to their index positions in a custom alphabet. Used for
 * custom sorting to determine character priority.
 */
type IndexByCharacters = Map<string, number>
/**
 * Cache for pre-computed character index maps to avoid recalculating for the
 * same custom alphabets across multiple comparisons.
 */
let alphabetCache = new Map<string, IndexByCharacters>()

/**
 * Compares two sorting nodes according to the specified sorting options.
 *
 * Supports multiple sorting algorithms (alphabetical, natural, line-length,
 * custom) with fallback sorting when primary comparison returns equal. The
 * comparison respects various options like case sensitivity, special character
 * handling, and custom alphabets.
 *
 * @example
 *   const result = compare({
 *     a: { name: 'foo', size: 10 },
 *     b: { name: 'bar', size: 20 },
 *     options: {
 *       type: 'alphabetical',
 *       order: 'asc',
 *       ignoreCase: true,
 *       specialCharacters: 'keep',
 *       fallbackSort: { type: 'line-length' },
 *     },
 *   })
 *   // Returns: 1 (foo > bar alphabetically)
 *
 * @template T - Type of the sorting node.
 * @param params - Comparison parameters.
 * @param params.a - First node to compare.
 * @param params.b - Second node to compare.
 * @param params.options - Sorting options including type, order, and
 *   configuration.
 * @param params.nodeValueGetter - Optional function to extract comparison value
 *   from nodes.
 * @param params.fallbackSortNodeValueGetter - Optional value getter for
 *   fallback comparison.
 * @returns Comparison result: negative if a < b, positive if a > b, zero if
 *   equal.
 */
export function compare<T extends SortingNode>({
  fallbackSortNodeValueGetter,
  nodeValueGetter,
  options,
  a,
  b,
}: CompareParameters<T>): number {
  if (options.type === 'unsorted') {
    return 0
  }

  let finalNodeValueGetter = nodeValueGetter ?? ((node: T) => node.name)
  let compareValue = computeCompareValue({
    nodeValueGetter: finalNodeValueGetter,
    options,
    a,
    b,
  })

  if (compareValue) {
    return compareValue
  }

  let { fallbackSort, order } = options
  return computeCompareValue({
    options: {
      ...options,
      order: fallbackSort.order ?? order,
      type: fallbackSort.type,
    },
    nodeValueGetter: fallbackSortNodeValueGetter ?? finalNodeValueGetter,
    a,
    b,
  })
}

/**
 * Creates a sorting function that sorts based on a custom alphabet.
 *
 * Characters in the custom alphabet are sorted according to their position,
 * while characters not in the alphabet receive the lowest priority (sorted
 * last). Uses caching to avoid recomputing character indices for the same
 * alphabet.
 *
 * @template T - Type of the sorting node.
 * @param options - Options for string formatting.
 * @param options.specialCharacters - How to handle special characters ('keep',
 *   'trim', 'remove').
 * @param options.ignoreCase - Whether to perform case-insensitive comparison.
 * @param options.alphabet - Custom alphabet string defining character order.
 * @param nodeValueGetter - Function to extract comparison value from nodes.
 * @returns Sorting function that compares nodes using the custom alphabet.
 */
function getCustomSortingFunction<T extends SortingNode>(
  {
    specialCharacters,
    ignoreCase,
    alphabet,
  }: Pick<CommonOptions, 'specialCharacters' | 'ignoreCase' | 'alphabet'>,
  nodeValueGetter: NodeValueGetterFunction<T>,
): SortingFunction<T> {
  let formatString = getFormatStringFunction(ignoreCase, specialCharacters)
  let indexByCharacters = alphabetCache.get(alphabet)

  if (!indexByCharacters) {
    indexByCharacters = new Map()
    for (let [index, character] of [...alphabet].entries()) {
      indexByCharacters.set(character, index)
    }
    alphabetCache.set(alphabet, indexByCharacters)
  }

  return (aNode: T, bNode: T) => {
    let aValue = formatString(nodeValueGetter(aNode))
    let bValue = formatString(nodeValueGetter(bNode))
    let minLength = Math.min(aValue.length, bValue.length)

    /* Iterate character by character. */
    for (let i = 0; i < minLength; i++) {
      let aCharacter = aValue[i]!
      let bCharacter = bValue[i]!
      let indexOfA = indexByCharacters.get(aCharacter)
      let indexOfB = indexByCharacters.get(bCharacter)
      indexOfA ??= Infinity
      indexOfB ??= Infinity

      if (indexOfA !== indexOfB) {
        return convertBooleanToSign(indexOfA - indexOfB > 0)
      }
    }

    if (aValue.length === bValue.length) {
      return 0
    }

    return convertBooleanToSign(aValue.length - bValue.length > 0)
  }
}

/**
 * Computes the comparison value between two nodes based on the sorting type.
 *
 * Selects the appropriate sorting algorithm (alphabetical, natural,
 * line-length, custom, or unsorted) and applies it to the given nodes. The
 * result is adjusted based on the sort order (ascending or descending).
 *
 * @template T - Type of the sorting node.
 * @param params - Comparison parameters.
 * @param params.nodeValueGetter - Function to extract comparison value from
 *   nodes.
 * @param params.options - Sorting options including type and order.
 * @param params.a - First node to compare.
 * @param params.b - Second node to compare.
 * @returns Comparison result adjusted for sort order.
 * @throws {UnreachableCaseError} If an unknown sorting type is specified.
 */
function computeCompareValue<T extends SortingNode>({
  nodeValueGetter,
  options,
  a,
  b,
}: {
  nodeValueGetter: NodeValueGetterFunction<T>
  options: CommonOptions
  a: T
  b: T
}): number {
  let sortingFunction: SortingFunction<T>

  switch (options.type) {
    case 'alphabetical':
      sortingFunction = getAlphabeticalSortingFunction(options, nodeValueGetter)
      break
    case 'line-length':
      sortingFunction = getLineLengthSortingFunction()
      break
    case 'unsorted':
      return 0
    case 'natural':
      sortingFunction = getNaturalSortingFunction(options, nodeValueGetter)
      break
    case 'custom':
      sortingFunction = getCustomSortingFunction(options, nodeValueGetter)
      break
    /* v8 ignore next 2 */
    default:
      throw new UnreachableCaseError(options.type)
  }

  return convertBooleanToSign(options.order === 'asc') * sortingFunction(a, b)
}

/**
 * Creates a function that formats strings for comparison.
 *
 * Applies transformations based on the provided options:
 *
 * - Case normalization (lowercase if ignoreCase is true)
 * - Special character handling (keep, trim, or remove)
 * - Whitespace removal (always applied).
 *
 * @param ignoreCase - Whether to convert strings to lowercase.
 * @param specialCharacters - How to handle special characters:
 *
 *   - 'keep': Keep all characters as-is
 *   - 'trim': Remove leading special characters
 *   - 'remove': Remove all special characters.
 *
 * @returns Function that formats a string for comparison.
 * @throws {UnreachableCaseError} If an unknown special characters option is
 *   specified.
 */
function getFormatStringFunction(
  ignoreCase: boolean,
  specialCharacters: SpecialCharactersOption,
) {
  return (value: string) => {
    let valueToCompare = value
    if (ignoreCase) {
      valueToCompare = valueToCompare.toLowerCase()
    }
    switch (specialCharacters) {
      case 'remove':
        valueToCompare = valueToCompare.replaceAll(
          /[^a-z\u{C0}-\u{24F}\u{1E00}-\u{1EFF}]+/giu,
          '',
        )
        break
      case 'trim':
        valueToCompare = valueToCompare.replaceAll(
          /^[^a-z\u{C0}-\u{24F}\u{1E00}-\u{1EFF}]+/giu,
          '',
        )
        break
      case 'keep':
        break
      /* v8 ignore next 2 */
      default:
        throw new UnreachableCaseError(specialCharacters)
    }
    return valueToCompare.replaceAll(/\s/gu, '')
  }
}

/**
 * Creates a natural sorting function that handles numbers intelligently.
 *
 * Natural sorting treats numeric portions of strings as numbers rather than
 * character sequences, so "item2" comes before "item10". Uses the
 * natural-orderby library for comparison logic.
 *
 * @example
 *   // Natural sort: ['file1', 'file2', 'file10']
 *   // Alphabetical sort: ['file1', 'file10', 'file2']
 *
 * @template T - Type of the sorting node.
 * @param options - Options for string formatting.
 * @param options.specialCharacters - How to handle special characters.
 * @param options.ignoreCase - Whether to perform case-insensitive comparison.
 * @param options.locales - Locale(s) to use for string comparison.
 * @param nodeValueGetter - Function to extract comparison value from nodes.
 * @returns Sorting function that performs natural comparison.
 */
function getNaturalSortingFunction<T extends SortingNode>(
  {
    specialCharacters,
    ignoreCase,
    locales,
  }: Pick<CommonOptions, 'specialCharacters' | 'ignoreCase' | 'locales'>,
  nodeValueGetter: NodeValueGetterFunction<T>,
): SortingFunction<T> {
  let naturalCompare = createNaturalCompare({
    locale: locales.toString(),
  })
  let formatString = getFormatStringFunction(ignoreCase, specialCharacters)
  return (aNode: T, bNode: T) =>
    naturalCompare(
      formatString(nodeValueGetter(aNode)),
      formatString(nodeValueGetter(bNode)),
    )
}

/**
 * Creates an alphabetical sorting function using locale-aware string
 * comparison.
 *
 * Uses JavaScript's localeCompare for proper handling of different languages
 * and special characters according to the specified locale(s).
 *
 * @template T - Type of the sorting node.
 * @param options - Options for string formatting.
 * @param options.specialCharacters - How to handle special characters.
 * @param options.ignoreCase - Whether to perform case-insensitive comparison.
 * @param options.locales - Locale(s) to use for string comparison.
 * @param nodeValueGetter - Function to extract comparison value from nodes.
 * @returns Sorting function that performs alphabetical comparison.
 */
function getAlphabeticalSortingFunction<T extends SortingNode>(
  {
    specialCharacters,
    ignoreCase,
    locales,
  }: Pick<CommonOptions, 'specialCharacters' | 'ignoreCase' | 'locales'>,
  nodeValueGetter: NodeValueGetterFunction<T>,
): SortingFunction<T> {
  let formatString = getFormatStringFunction(ignoreCase, specialCharacters)
  return (aNode: T, bNode: T) =>
    formatString(nodeValueGetter(aNode)).localeCompare(
      formatString(nodeValueGetter(bNode)),
      locales,
    )
}

/**
 * Creates a sorting function that compares nodes by their size property.
 *
 * Typically used for sorting by line length where the size represents the
 * number of lines or characters in the node.
 *
 * @template T - Type of the sorting node.
 * @returns Sorting function that compares nodes by size.
 */
function getLineLengthSortingFunction<
  T extends SortingNode,
>(): SortingFunction<T> {
  return (aNode: T, bNode: T) => {
    let aSize = aNode.size
    let bSize = bNode.size
    return aSize - bSize
  }
}
