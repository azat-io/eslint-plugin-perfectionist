import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

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
  } & CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

/**
 * Configuration for a single custom group in object sorting.
 *
 * Allows defining custom groups based on member selectors, modifiers, and
 * patterns for fine-grained control over object member sorting.
 */
export interface SingleCustomGroup {
  /**
   * Regular expression pattern to match against the member's value. Only
   * applicable to properties with literal values.
   */
  elementValuePattern?: RegexOption

  /**
   * Regular expression pattern to match against member names. Only members with
   * names matching this pattern will be included in the group.
   */
  elementNamePattern?: RegexOption

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
 * Union type of all available modifiers for object members.
 *
 * Modifiers provide additional context about member characteristics, such as
 * whether they are optional, required, or span multiple lines.
 */
export type Modifier = MultilineModifier | RequiredModifier | OptionalModifier

/**
 * Union type of all available selectors for object members.
 *
 * Selectors identify the type of object member for grouping and sorting
 * purposes.
 */
export type Selector = PropertySelector | MemberSelector | MethodSelector

/**
 * Modifier indicating a member spans multiple lines.
 *
 * Applied to members whose definition extends across multiple lines in the
 * source code.
 */
type MultilineModifier = 'multiline'

/**
 * Modifier indicating a required member.
 *
 * Applied to object members that are always present (in TypeScript context).
 */
type RequiredModifier = 'required'

/**
 * Modifier indicating an optional member.
 *
 * Applied to object members that may not be present (in TypeScript context).
 */
type OptionalModifier = 'optional'

/**
 * Selector for property members.
 *
 * Matches regular property declarations in objects, including shorthand
 * properties and computed properties.
 */
type PropertySelector = 'property'

/**
 * Selector for generic members.
 *
 * A catch-all selector that matches any object member type.
 */
type MemberSelector = 'member'

/**
 * Selector for method members.
 *
 * Matches method definitions in objects, including both regular methods and
 * async methods.
 */
type MethodSelector = 'method'

/**
 * Array of all available selectors for object members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors: Selector[] = ['member', 'method', 'property']

/**
 * Array of all available modifiers for object members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allModifiers: Modifier[] = ['optional', 'required', 'multiline']

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the sort-objects rule,
 * extending the base custom group schema with element patterns.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementValuePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
}
