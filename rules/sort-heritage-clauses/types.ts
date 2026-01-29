import type { AllCommonOptions } from '../../types/all-common-options'
import type { TypeOption } from '../../types/common-options'

export type Options = Partial<
  AllCommonOptions<TypeOption, AdditionalSortOptions, CustomGroupMatchOptions>
>[]

/**
 * Match options for a custom group.
 */
type CustomGroupMatchOptions = object

type AdditionalSortOptions = object
