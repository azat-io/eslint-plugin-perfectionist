import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'
import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'

/**
 * Configuration options for the sort-constructor-parameters rule.
 *
 * This rule enforces the sorting of constructor parameters, ensuring consistent
 * ordering for better readability and maintainability.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all constructor parameter
       * names. The rule is only applied when all names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * AST selector to match against MethodDefinition nodes.
       */
      matchesAstSelector?: string
    }
  } & AllCommonOptions<
    TypeOption,
    AdditionalSortOptions,
    CustomGroupMatchOptions
  >
>[]

export type SortConstructorParametersSortingNode =
  SortingNodeWithDependencies<TSESTree.Parameter>

/**
 * Represents the type of constructor parameter selector. Note: Rest elements
 * are not sorted and act as partition boundaries.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Union type of all available constructor parameter modifiers.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Additional configuration for a single custom group.
 *
 * Custom groups allow fine-grained control over how constructor parameters are
 * grouped and sorted based on their names and types.
 *
 * @example
 *
 * ```ts
 * {
 *   "selector": "parameter"
 * }
 * ```
 */
interface CustomGroupMatchOptions {
  /**
   * List of modifiers that constructor parameters must have to be included in
   * this group.
   */
  modifiers?: Modifier[]

  /**
   * Specifies the type of constructor parameters to include in this group. Only
   * 'parameter' is available since rest elements create partition boundaries
   * and are not sorted.
   */
  selector?: Selector
}

type AdditionalSortOptions = object

/**
 * Complete list of available selectors for constructor parameters. Used for
 * validation and JSON schema generation.
 */
export let allSelectors = ['parameter'] as const

/**
 * Complete list of available constructor parameter modifiers. Used for
 * validation and JSON schema generation.
 */
export let allModifiers = [
  'decorated',
  'override',
  'readonly',
  'protected',
  'private',
  'public',
  'optional',
] as const

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
