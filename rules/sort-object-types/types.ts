import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  FallbackSortOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'
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
       * Regular expression pattern to match against the type declaration name.
       * The rule is only applied to declarations with matching names.
       */
      declarationMatchesPattern?: RegexOption

      /**
       * Regular expression pattern to match against all member names. The rule
       * is only applied when all member names match this pattern.
       */
      allNamesMatchPattern?: RegexOption
    }

    /**
     * Custom groups for organizing object type members. Can be a structured
     * configuration or the deprecated format.
     */
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
     * Partition object type members by comment delimiters. Members separated by
     * specific comments are sorted independently.
     */
    partitionByComment: PartitionByCommentOption

    /**
     * Controls the placement of newlines between different groups of object
     * type members.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of object type members. Members are sorted
     * within their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition object type members by newlines. When true, members
     * separated by empty lines are sorted independently.
     */
    partitionByNewLine: boolean

    /**
     * @deprecated Will be removed in v5.0.0. Use
     *   {@link useConfigurationIf.declarationMatchesPattern} instead.
     */
    ignorePattern: RegexOption

    /**
     * Determines what to sort by when comparing object type members.
     *
     * - 'name': Sort by the member's property/method name
     * - 'value': Sort by the member's type annotation value.
     *
     * @default 'name'
     */
    sortBy: 'value' | 'name'
  } & Omit<CommonOptions, 'fallbackSort'>
>[]

/**
 * Configuration for a single custom group in object type sorting.
 *
 * Allows defining custom groups based on member selectors, modifiers, and
 * patterns for fine-grained control over sorting.
 */
export type SingleCustomGroup = (
  | ({
      /**
       * Regular expression pattern to match against the member's type
       * annotation value. Only applicable to properties.
       */
      elementValuePattern?: RegexOption
      /**
       * Override sorting method for this specific group.
       *
       * - 'name': Sort by member name
       * - 'value': Sort by type annotation value.
       */
      sortBy?: 'value' | 'name'
    } & BaseSingleCustomGroup<PropertySelector>)
  | BaseSingleCustomGroup<IndexSignatureSelector>
  | BaseSingleCustomGroup<MethodSelector>
  | BaseSingleCustomGroup<MemberSelector>
) &
  ElementNamePatternFilterCustomGroup

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
 * Maps each selector type to its allowed modifiers.
 *
 * Defines which modifiers can be applied to each type of object member
 * selector, ensuring type safety in group configurations.
 */
interface AllowedModifiersPerSelector {
  /** Property members can be multiline, optional, or required. */
  property: MultilineModifier | OptionalModifier | RequiredModifier

  /** Generic members can be multiline, optional, or required. */
  member: MultilineModifier | OptionalModifier | RequiredModifier

  /** Method members can be multiline, optional, or required. */
  method: MultilineModifier | OptionalModifier | RequiredModifier

  /** Multiline members can only be optional or required. */
  multiline: OptionalModifier | RequiredModifier

  /** Index signatures cannot have modifiers. */
  'index-signature': never
}

/**
 * Base configuration for defining custom groups.
 *
 * @template T - The selector type this group configuration applies to.
 */
interface BaseSingleCustomGroup<T extends Selector> {
  /**
   * Array of modifiers that members must have to match this group. Only
   * modifiers allowed for the specified selector type are valid.
   */
  modifiers?: AllowedModifiersPerSelector[T][]

  /**
   * The selector type this group matches. Determines what kind of object
   * members belong to this group.
   */
  selector?: T
}

/**
 * Additional filter configuration for custom groups based on element name
 * patterns.
 *
 * Allows filtering group members by their property/method names using regex
 * patterns.
 */
interface ElementNamePatternFilterCustomGroup {
  /**
   * Regular expression pattern to match against member names. Only members with
   * names matching this pattern will be included in the group.
   */
  elementNamePattern?: RegexOption
}

/**
 * Group type for index signature members.
 *
 * Represents all possible combinations of modifiers with the index-signature
 * selector, joined with dashes to form group identifiers like 'index-signature'
 * or 'required-index-signature'.
 */
type IndexSignatureGroup = JoinWithDash<
  [
    OptionalModifier,
    RequiredModifier,
    MultilineModifier,
    IndexSignatureSelector,
  ]
>

/**
 * Group type for property members.
 *
 * Represents all possible combinations of modifiers with the property selector,
 * joined with dashes to form group identifiers like 'property' or
 * 'optional-property'.
 */
type PropertyGroup = JoinWithDash<
  [OptionalModifier, RequiredModifier, MultilineModifier, PropertySelector]
>

/**
 * Union type of all possible group identifiers for object type members.
 *
 * Groups are used to organize and sort related members together. Can be
 * predefined group types, 'unknown' for unmatched members, or custom string
 * identifiers.
 */
type Group =
  | IndexSignatureGroup
  | PropertyGroup
  | MethodGroup
  | MemberGroup
  | 'unknown'
  | string

/**
 * Group type for generic member elements.
 *
 * Represents all possible combinations of modifiers with the member selector,
 * joined with dashes to form group identifiers like 'member' or
 * 'required-member'.
 */
type MemberGroup = JoinWithDash<
  [OptionalModifier, RequiredModifier, MultilineModifier, MemberSelector]
>

/**
 * Group type for method members.
 *
 * Represents all possible combinations of modifiers with the method selector,
 * joined with dashes to form group identifiers like 'method' or
 * 'optional-method'.
 */
type MethodGroup = JoinWithDash<
  [OptionalModifier, RequiredModifier, MultilineModifier, MethodSelector]
>

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
  elementNamePattern: regexJsonSchema,
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
   * sorting by value instead of name. Can be null for members without explicit
   * type annotations.
   */
  value: string | null
}
