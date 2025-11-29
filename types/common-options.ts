/**
 * Core sorting configuration options used across all Perfectionist rules.
 *
 * Provides a comprehensive set of options to control how elements are sorted,
 * including the sorting algorithm, character handling, locale settings, and
 * sort direction. These options form the foundation for all sorting operations
 * in the plugin.
 *
 * @example
 *   const options: CommonOptions = {
 *     type: 'natural',
 *     order: 'asc',
 *     ignoreCase: true,
 *     alphabet: '',
 *     locales: 'en-US',
 *     specialCharacters: 'keep',
 *     fallbackSort: {
 *       type: 'alphabetical',
 *       order: 'asc',
 *     },
 *   }
 */
export interface CommonOptions<CustomTypeOption extends string = string> {
  /**
   * Secondary sorting method applied when primary comparison returns equal.
   * Ensures stable and predictable sorting when elements have identical primary
   * values.
   */
  fallbackSort: FallbackSortOption<CustomTypeOption>

  /**
   * Specifies how to handle special characters during sorting.
   *
   * - 'keep': Preserve special characters in their original positions
   * - 'trim': Remove leading special characters before sorting
   * - 'remove': Remove all special characters before sorting.
   */
  specialCharacters: SpecialCharactersOption

  /**
   * Locale(s) to use for locale-aware string comparison. Affects how characters
   * are ordered according to language-specific rules. Can be a string locale
   * code or array of locale codes for fallback behavior.
   */
  locales: NonNullable<Intl.LocalesArgument>

  /**
   * Sorting algorithm to use for ordering elements. Each algorithm has
   * different behavior for handling numbers and special characters.
   */
  type: CustomTypeOption

  /**
   * Determines whether to perform case-insensitive comparison. When true, 'a'
   * and 'A' are treated as equivalent during sorting.
   */
  ignoreCase: boolean

  /**
   * Sort direction for ordering elements.
   *
   * - 'asc': Ascending order (A to Z, 0 to 9)
   * - 'desc': Descending order (Z to A, 9 to 0).
   */
  order: OrderOption

  /**
   * Custom alphabet string for 'custom' sort type. Defines the exact character
   * order to use when type is 'custom'. Characters not in the alphabet are
   * sorted after those in the alphabet.
   */
  alphabet: string
}

/**
 * Sorting algorithm type that determines how elements are ordered.
 *
 * Each algorithm has specific characteristics for handling different types of
 * content and use cases.
 *
 * @example
 *   // Natural sorting for version numbers
 *   const type: TypeOption = 'natural'
 *   // Sorts: ['v1.0', 'v2.0', 'v10.0'] (not ['v1.0', 'v10.0', 'v2.0'])
 *
 * @example
 *   // Line length for visual hierarchy
 *   const type: TypeOption = 'line-length'
 *   // Shorter lines appear before longer lines
 */
export type TypeOption =
  /**
   * Traditional alphabetical sorting using locale-aware comparison. Best for
   * standard text sorting where consistency is important.
   */
  | 'alphabetical'

  /**
   * Sort by the character length of each line. Useful for creating visual
   * hierarchies or grouping by complexity.
   */
  | 'line-length'

  /**
   * Preserves the original order without sorting. Used when you want to apply
   * other features (like grouping) without reordering.
   */
  | 'unsorted'

  /**
   * Natural order sorting that handles numbers intelligently. Treats numeric
   * portions as numbers rather than strings (e.g., 'item2' before 'item10').
   */
  | 'natural'

  /**
   * Uses a user-defined alphabet for determining sort order. Requires the
   * 'alphabet' option to specify character precedence.
   */
  | 'custom'

/**
 * Configuration for handling special characters during string comparison.
 *
 * Determines how non-alphanumeric characters are processed when sorting,
 * allowing control over whether special characters affect sort order.
 *
 * @example
 *   // With 'remove': '_abc' and 'abc' are treated as identical
 *   const option: SpecialCharactersOption = 'remove'
 *
 * @example
 *   // With 'trim': '_abc' becomes 'abc', but 'a_bc' stays 'a_bc'
 *   const option: SpecialCharactersOption = 'trim'
 */
export type SpecialCharactersOption =
  /**
   * Remove all special characters before comparison. Only alphanumeric
   * characters are considered for sorting.
   */
  | 'remove'

  /**
   * Remove leading special characters only. Useful for sorting names that may
   * have underscore or other prefixes.
   */
  | 'trim'

  /**
   * Keep all special characters in their original positions. Special characters
   * participate in the sort comparison.
   */
  | 'keep'

/**
 * Configuration for fallback sorting when primary comparison returns equal.
 *
 * Provides a secondary sorting method to ensure stable and predictable ordering
 * when elements have identical values according to the primary sort algorithm.
 * Commonly used to sort by declaration order or another algorithm as a
 * tiebreaker.
 *
 * @example
 *   const fallback: FallbackSortOption = {
 *     type: 'alphabetical',
 *     order: 'asc',
 *   }
 */
export interface FallbackSortOption<CustomTypeOption extends string> {
  /**
   * Sorting algorithm to use as the fallback method. Applied only when the
   * primary sort comparison returns equal.
   */
  type: CustomTypeOption

  /**
   * Sort direction for the fallback comparison. If not specified, inherits from
   * the primary sort order.
   */
  order?: OrderOption
}

/**
 * Sort direction that determines the ordering of elements.
 *
 * Controls whether elements are arranged from smallest to largest (ascending)
 * or largest to smallest (descending) according to the chosen sorting
 * algorithm.
 *
 * @example
 *   // Ascending: A → Z, 0 → 9
 *   const order: OrderOption = 'asc'
 *
 * @example
 *   // Descending: Z → A, 9 → 0
 *   const order: OrderOption = 'desc'
 */
export type OrderOption =
  /**
   * Descending order - from largest to smallest. Letters: Z to A, Numbers: 9 to
   * 0, Length: longest to shortest.
   */
  | 'desc'

  /**
   * Ascending order - from smallest to largest. Letters: A to Z, Numbers: 0 to
   * 9, Length: shortest to longest.
   */
  | 'asc'

/**
 * Regular expression pattern configuration for matching strings.
 *
 * Supports multiple formats for flexibility in pattern definition, from simple
 * string patterns to complex regular expressions with flags.
 *
 * @example
 *   // Simple string pattern
 *   const pattern: RegexOption = '^TODO:'
 *
 * @example
 *   // Pattern with flags
 *   const pattern: RegexOption = {
 *     pattern: '^(TODO|FIXME):',
 *     flags: 'i',
 *   }
 *
 * @example
 *   // Multiple patterns (OR logic)
 *   const patterns: RegexOption = [
 *     '^TODO:',
 *     { pattern: '^FIXME:', flags: 'i' },
 *   ]
 */
export type RegexOption = SingleRegexOption[] | SingleRegexOption

/**
 * Single regular expression pattern configuration.
 *
 * Can be either a simple string pattern or an object with pattern and flags for
 * more complex matching requirements.
 *
 * @internal
 */
type SingleRegexOption =
  | {
      /**
       * The regular expression pattern string. Will be compiled into a RegExp
       * for matching.
       */
      pattern: string

      /**
       * Optional RegExp flags to modify pattern matching behavior. Common
       * flags: 'i' (case-insensitive), 'g' (global), 'm' (multiline).
       */
      flags?: string
    }
  | string
