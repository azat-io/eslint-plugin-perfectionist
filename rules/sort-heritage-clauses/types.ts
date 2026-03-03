import type { AllCommonOptions } from '../../types/all-common-options'
import type { TypeOption } from '../../types/common-options'

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
  AllCommonOptions<TypeOption, AdditionalSortOptions, CustomGroupMatchOptions>
>[]

/**
 * Match options for a custom group.
 */
type CustomGroupMatchOptions = object

type AdditionalSortOptions = object
