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
import { buildRegexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

/**
 * Configuration options for the sort-classes rule.
 *
 * This rule enforces consistent ordering of class members (properties, methods,
 * constructors, etc.) to improve code readability and maintainability.
 */
export type SortClassesOptions = [
  Partial<
    {
      /**
       * Regex patterns for function names whose callback argument dependencies
       * are ignored during class-member sorting. Dependencies inside these
       * callbacks won't influence the ordering.
       */
      ignoreCallbackDependenciesPatterns: RegexOption
    } & CommonGroupsOptions<
      CustomGroupMatchOptions,
      Record<string, never>,
      TypeOption
    > &
      CommonOptions<TypeOption> &
      CommonPartitionOptions
  >,
]

/**
 * Union type of all available class member selectors. Used to identify and
 * categorize different types of class members.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Union type of all available class member modifiers. Includes access
 * modifiers, async, static, abstract, and other TypeScript modifiers.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Defines a custom group configuration for class members.
 *
 * Allows categorizing class members based on their selector type (method,
 * property, etc.) and various patterns matching their names, values, or
 * decorators.
 */
interface CustomGroupMatchOptions {
  /** Pattern to match decorator names (e.g., '@Component'). */
  decoratorNamePattern?: RegexOption

  /**
   * Pattern to match the value of the member (for properties with
   * initializers).
   */
  elementValuePattern?: RegexOption

  /** List of modifiers that members must have to be included in this group. */
  modifiers?: Modifier[]

  /** The type of class member this group applies to. */
  selector?: Selector
}

/**
 * Complete list of available class member selectors. Used for validation and
 * JSON schema generation.
 */
export let allSelectors = [
  'accessor-property',
  'index-signature',
  'constructor',
  'static-block',
  'get-method',
  'set-method',
  'function-property',
  'property',
  'method',
] as const

/**
 * Complete list of available class member modifiers. Used for validation and
 * JSON schema generation.
 */
export let allModifiers = [
  'async',
  'protected',
  'private',
  'public',
  'static',
  'abstract',
  'override',
  'readonly',
  'decorated',
  'declare',
  'optional',
] as const

/**
 * Additional custom group match options JSON schema. Used by ESLint to validate
 * rule options at configuration time.
 *
 * Note: Ideally, we should generate as many schemas as there are selectors,
 * and ensure that users do not enter invalid modifiers for a given selector.
 */
export let customGroupMatchOptionsJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  decoratorNamePattern: buildRegexJsonSchema(),
  elementValuePattern: buildRegexJsonSchema(),
}
