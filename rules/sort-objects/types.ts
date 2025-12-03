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
 * Configuration options for the sort-objects rule.
 *
 * Controls how object properties and methods are sorted within object literals
 * and object patterns in JavaScript/TypeScript.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching. Allows applying the
     * rule only when specific conditions are met.
     */
    useConfigurationIf: {
      /**
       * Specifies whether to only match destructured objects or regular
       * objects.
       */
      objectType?: 'non-destructured' | 'destructured'

      /**
       * Regular expression pattern to match against the comment associated to
       * the name of the object.
       */
      declarationCommentMatchesPattern?: RegexOption

      /**
       * Regular expression pattern to match against the name of the function
       * that contains this object. Useful for applying different sorting rules
       * to objects passed to specific functions.
       */
      callingFunctionNamePattern?: RegexOption

      /**
       * Regular expression pattern to match against the object's declaration
       * name. The rule is only applied to declarations with matching names.
       */
      declarationMatchesPattern?: RegexOption

      /**
       * Regular expression pattern to match against all property names. The
       * rule is only applied when all property names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * Specifies whether to only match objects that have exclusively numeric
       * keys.
       */
      hasNumericKeysOnly?: boolean
    }

    /**
     * Regular expression pattern to ignore certain objects from sorting.
     * Objects with names matching this pattern will not be sorted.
     */
    ignorePattern: RegexOption

    /**
     * Whether to sort styled-components CSS properties. When true, sorts CSS
     * properties within styled-components template literals.
     *
     * @default true
     */
    styledComponents: boolean
  } & CommonGroupsOptions<
    SingleCustomGroup,
    Record<string, never>,
    TypeOption
  > &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

/**
 * Union type of all available modifiers for object members.
 *
 * Modifiers provide additional context about member characteristics, such as
 * whether they are optional, required, or span multiple lines.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Union type of all available selectors for object members.
 *
 * Selectors identify the type of object member for grouping and sorting
 * purposes.
 */
export type Selector = (typeof allSelectors)[number]

/** Additional configuration for a single custom group. */
interface SingleCustomGroup {
  /**
   * Regular expression pattern to match against the member's value. Only
   * applicable to properties with literal values.
   */
  elementValuePattern?: RegexOption

  /**
   * Array of modifiers that members must have to match this group. Only
   * modifiers allowed for the specified selector type are valid.
   */
  modifiers?: Modifier[]

  /**
   * The selector type this group matches. Determines what kind of object
   * members belong to this group.
   */
  selector?: Selector
}

/**
 * Array of all available selectors for object members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors = ['member', 'method', 'property'] as const

/**
 * Array of all available modifiers for object members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allModifiers = ['optional', 'required', 'multiline'] as const

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the sort-objects rule.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementValuePattern: regexJsonSchema,
}
