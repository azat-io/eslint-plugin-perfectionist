import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'

export type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

export const ORDER_ERROR_ID = 'unexpectedNamedExportsOrder'
export const GROUP_ORDER_ERROR_ID = 'unexpectedNamedExportsGroupOrder'
export const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenNamedExports'
export const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenNamedExports'

/**
 * Configuration options for the sort-named-exports rule.
 *
 * Controls how named exports are sorted within export statements.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all named export element
       * names. The rule is only applied when all names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * AST selector to match against ExportNamedDeclaration nodes.
       */
      matchesAstSelector?: string
    }

    /**
     * Whether to ignore export aliases when sorting. When true, sorts by the
     * original name rather than the alias.
     *
     * @default false
     */
    ignoreAlias: boolean
  } & AllCommonOptions<
    TypeOption,
    AdditionalSortOptions,
    CustomGroupMatchOptions
  >
>[]

/**
 * Extended sorting node for named export specifiers.
 */
export type SortNamedExportsSortingNode = SortingNode<TSESTree.ExportSpecifier>

/**
 * Union type of all available modifiers for named exports.
 *
 * Modifiers distinguish between type exports and value exports.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Union type of all available selectors for named exports.
 *
 * Currently only includes the 'export' selector.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Match options for a custom group.
 */
interface CustomGroupMatchOptions {
  /**
   * Array of modifiers that exports must have to match this group. Can include
   * 'type' for type exports or 'value' for value exports.
   */
  modifiers?: Modifier[]

  /**
   * The selector type this group matches. Currently only 'export' is available
   * for named exports.
   */
  selector?: Selector
}

type AdditionalSortOptions = object

/**
 * Array of all available selectors for named exports.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors = ['export'] as const

/**
 * Array of all available modifiers for named exports.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allModifiers = ['value', 'type'] as const

/**
 * Additional custom group match options JSON schema. Used by ESLint to validate
 * rule options at configuration time.
 */
export let additionalCustomGroupMatchOptionsJsonSchema: Record<
  string,
  JSONSchema4
> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
