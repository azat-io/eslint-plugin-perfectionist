import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'
import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

import { buildRegexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

export type MessageId =
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

export const ORDER_ERROR_ID = 'unexpectedEnumsOrder'
export const GROUP_ORDER_ERROR_ID = 'unexpectedEnumsGroupOrder'
export const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenEnumsMembers'
export const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenEnumsMembers'
export const DEPENDENCY_ORDER_ERROR_ID = 'unexpectedEnumsDependencyOrder'

/**
 * Configuration options for the sort-enums rule.
 *
 * This rule enforces consistent ordering of TypeScript enum members to improve
 * code readability and maintainability.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all enum element names. The
       * rule is only applied when all names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * AST selector to match against TSEnumDeclaration nodes.
       */
      matchesAstSelector?: string
    }

    /**
     * Whether to sort enum members by their values instead of names. When
     * "always", compares enum values; when "never", compares enum member
     * names.
     *
     * @default ifNumericEnum
     */
    sortByValue: 'ifNumericEnum' | 'always' | 'never'

    /**
     * Enables experimental dependency detection.
     */
    useExperimentalDependencyDetection: boolean
  } & AllCommonOptions<
    TypeOption,
    AdditionalSortOptions,
    CustomGroupMatchOptions
  >
>[]

export interface SortEnumsSortingNode extends SortingNodeWithDependencies<TSESTree.TSEnumMember> {
  numericValue: number | null
  value: string | null
}

/**
 * Match options for a custom group.
 */
interface CustomGroupMatchOptions {
  /**
   * Regular expression pattern to match enum member values. Members with values
   * matching this pattern will be included in this custom group.
   */
  elementValuePattern?: RegexOption
}

type AdditionalSortOptions = object

export let allSelectors = [] as const
export type Selector = (typeof allSelectors)[number]

export let allModifiers = [] as const
export type Modifier = (typeof allModifiers)[number]

/**
 * Additional custom group match options JSON schema. Used by ESLint to validate
 * rule options at configuration time.
 */
export let additionalCustomGroupMatchOptionsJsonSchema: Record<
  string,
  JSONSchema4
> = {
  elementValuePattern: buildRegexJsonSchema(),
}
