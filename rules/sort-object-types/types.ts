import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  FallbackSortOption,
  CommonOptions,
  RegexOption,
} from '../../types/common-options'
import type {
  CommonGroupsOptions,
  CustomGroupsOption,
} from '../../types/common-groups-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Configuration options for the sort-object-types rule.
 *
 * Controls how object type properties, methods, and index signatures are sorted
 * within TypeScript type literals and interfaces.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching. Allows applying the
     * rule only when specific conditions are met.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against the comment declaration.
       * The rule is only applied to declaration comments with matching names.
       */
      declarationCommentMatchesPattern?: RegexOption

      /**
       * Regular expression pattern to match against the type declaration name.
       * The rule is only applied to declarations with matching names.
       */
      declarationMatchesPattern?: RegexOption

      /**
       * Regular expression pattern to match against all member names. The rule
       * is only applied when all member names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * Specifies whether to only match types that have exclusively numeric
       * keys.
       */
      hasNumericKeysOnly?: boolean
    }

    /** Custom groups for organizing object type members. */
    customGroups: CustomGroupsOption<
      SingleCustomGroup,
      {
        /** Fallback sorting configuration for elements within custom groups. */
        fallbackSort?: { sortBy?: 'value' | 'name' } & FallbackSortOption
      }
    >

    /**
     * Fallback sorting configuration for elements that don't match any group.
     * Includes an additional option to sort by member value or name.
     */
    fallbackSort: { sortBy?: 'value' | 'name' } & FallbackSortOption

    /**
     * Determines what to sort by when comparing object type members.
     *
     * - 'name': Sort by the member's property/method name
     * - 'value': Sort by the member's type annotation value.
     *
     * @default 'name'
     */
    sortBy: 'value' | 'name'
  } & Omit<CommonGroupsOptions<SingleCustomGroup>, 'customGroups'> &
    Omit<CommonOptions, 'fallbackSort'> &
    CommonPartitionOptions
>[]

/**
 * Union type of all available selectors for object type members.
 *
 * Selectors identify the type of object member for grouping and sorting
 * purposes.
 */
export type Selector =
  | IndexSignatureSelector
  | PropertySelector
  | MemberSelector
  | MethodSelector

/**
 * Union type of all available modifiers for object type members.
 *
 * Modifiers provide additional context about member characteristics, such as
 * whether they are optional, required, or span multiple lines.
 */
export type Modifier = MultilineModifier | RequiredModifier | OptionalModifier

/**
 * Configuration for a single custom group in object type sorting.
 *
 * Allows defining custom groups based on member selectors, modifiers, and
 * patterns for fine-grained control over sorting.
 */
interface SingleCustomGroup {
  /**
   * Regular expression pattern to match against the member's type annotation
   * value. Only applicable to properties.
   */
  elementValuePattern?: RegexOption

  /**
   * Override sorting method for this specific group.
   *
   * - 'name': Sort by member name
   * - 'value': Sort by type annotation value.
   */
  sortBy?: 'value' | 'name'

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
 * Selector for index signature members.
 *
 * Matches TypeScript index signatures like `[key: string]: any`.
 */
type IndexSignatureSelector = 'index-signature'

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
 * Applied to object members that are not optional (no `?` modifier).
 */
type RequiredModifier = 'required'

/**
 * Modifier indicating an optional member.
 *
 * Applied to object members marked with the `?` modifier.
 */
type OptionalModifier = 'optional'

/**
 * Selector for property members.
 *
 * Matches regular property declarations in object types, like `name: string`.
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
 * Matches method signatures in object types, like `getName(): string`.
 */
type MethodSelector = 'method'

/**
 * Array of all available selectors for object type members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors: Selector[] = [
  'index-signature',
  'member',
  'method',
  'property',
]

/**
 * Array of all available modifiers for object type members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allModifiers: Modifier[] = ['optional', 'required', 'multiline']

/**
 * JSON Schema definition for the sortBy configuration option.
 *
 * Validates the sortBy parameter in ESLint rule configuration.
 */
export let sortByJsonSchema: JSONSchema4 = {
  enum: ['name', 'value'],
  type: 'string',
}

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the sort-object-types rule,
 * extending the base custom group schema with element patterns and sorting
 * options.
 *
 * Note: Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementValuePattern: regexJsonSchema,
  sortBy: sortByJsonSchema,
}

/**
 * Extended sorting node for object type members.
 *
 * Represents an object type member with additional metadata needed for sorting,
 * including whether the member is optional/required and its type annotation
 * value.
 */
export interface SortObjectTypesSortingNode
  extends SortingNode<TSESTree.TypeElement> {
  /**
   * The string representation of the member's type annotation. Used when
   * sorting by value instead of name.
   */
  value: string
}
