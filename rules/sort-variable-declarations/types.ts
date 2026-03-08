import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'
import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

import { buildCustomGroupSelectorJsonSchema } from '../../utils/json-schemas/common-groups-json-schemas'

export type MessageId =
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

export const ORDER_ERROR_ID = 'unexpectedVariableDeclarationsOrder'
export const GROUP_ORDER_ERROR_ID = 'unexpectedVariableDeclarationsGroupOrder'
export const EXTRA_SPACING_ERROR_ID =
  'extraSpacingBetweenVariableDeclarationsMembers'
export const MISSED_SPACING_ERROR_ID =
  'missedSpacingBetweenVariableDeclarationsMembers'
export const DEPENDENCY_ORDER_ERROR_ID =
  'unexpectedVariableDeclarationsDependencyOrder'

/**
 * Configuration options for the sort-variable-declarations rule.
 *
 * Controls how multiple variable declarations in a single statement are sorted,
 * such as `const a = 1, b, c = 3;`.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all variable declarator
       * names. The rule is only applied when all names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * AST selector to match against VariableDeclaration nodes.
       */
      matchesAstSelector?: string
    }

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

export type SortVariableDeclarationsSortingNode =
  SortingNodeWithDependencies<SortVariableDeclarationsNode>

export type SortVariableDeclarationsNode =
  TSESTree.VariableDeclaration['declarations'][number]

/**
 * Union type of all available selectors for variable declarations.
 *
 * Distinguishes between variables with and without initial values.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Match options for a custom group.
 */
interface CustomGroupMatchOptions {
  /**
   * The selector type this group matches. Can be 'initialized' for variables
   * with values or 'uninitialized' for variables without.
   */
  selector?: Selector
}

type AdditionalSortOptions = object

/**
 * Array of all available selectors for variable declarations.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors = ['initialized', 'uninitialized'] as const

/**
 * Additional custom group match options JSON schema. Used by ESLint to validate
 * rule options at configuration time.
 */
export let additionalCustomGroupMatchOptionsJsonSchema: Record<
  string,
  JSONSchema4
> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
