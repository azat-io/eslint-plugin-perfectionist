import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  CommonOptions,
  RegexOption,
  TypeOption,
} from '../../types/common-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'
import { regexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

/**
 * Configuration options for the sort-modules rule.
 *
 * This rule enforces consistent ordering of module-level declarations (classes,
 * interfaces, functions, types, enums) to improve code organization.
 */
export type SortModulesOptions = [
  Partial<
    CommonGroupsOptions<SingleCustomGroup, Record<string, never>, TypeOption> &
      CommonOptions<TypeOption> &
      CommonPartitionOptions
  >,
]

/**
 * Union type of all available module member selectors. Used to categorize
 * different types of module-level declarations.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Union type of all available module member modifiers. Used to identify
 * specific characteristics of module declarations.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Additional configuration for a single custom group.
 *
 * Custom groups allow fine-grained control over how module members are grouped
 * and sorted based on their types, modifiers, and patterns.
 */
interface SingleCustomGroup {
  /**
   * Regular expression pattern to match decorator names. Members with
   * decorators matching this pattern will be included in this custom group.
   */
  decoratorNamePattern?: RegexOption

  /** List of modifiers that members must have to be included in this group. */
  modifiers?: Modifier[]

  /** The type of module member this group applies to. */
  selector?: Selector
}

/**
 * Complete list of available module member selectors. Used for validation and
 * JSON schema generation.
 */
export let allSelectors = [
  'enum',
  'function',
  'interface',
  // 'module',
  // 'namespace',
  'type',
  'class',
] as const

/**
 * Complete list of available module member modifiers. Used for validation and
 * JSON schema generation.
 */
export let allModifiers = [
  'async',
  'declare',
  'decorated',
  'default',
  'export',
] as const

/**
 * Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  decoratorNamePattern: regexJsonSchema,
}
