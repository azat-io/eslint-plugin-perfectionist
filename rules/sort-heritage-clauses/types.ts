import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

export type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

export const ORDER_ERROR_ID = 'unexpectedHeritageClausesOrder'
export const GROUP_ORDER_ERROR_ID = 'unexpectedHeritageClausesGroupOrder'
export const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenHeritageClauses'
export const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenHeritageClauses'

export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all heritage clause names.
       * The rule is only applied when all names match this pattern.
       */
      allNamesMatchPattern?: RegexOption
    }
  } & AllCommonOptions<
    TypeOption,
    AdditionalSortOptions,
    CustomGroupMatchOptions
  >
>[]

/**
 * Match options for a custom group.
 */
type CustomGroupMatchOptions = object

type AdditionalSortOptions = object
