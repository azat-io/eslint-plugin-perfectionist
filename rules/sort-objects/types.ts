import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  DeprecatedCustomGroupsOption,
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'

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
       * Regular expression pattern to match against the name of the function
       * that contains this object. Useful for applying different sorting rules
       * to objects passed to specific functions.
       */
      callingFunctionNamePattern?: RegexOption

      /**
       * Regular expression pattern to match against all property names. The
       * rule is only applied when all property names match this pattern.
       */
      allNamesMatchPattern?: RegexOption
    }

    /**
     * Custom groups for organizing object members. Allows defining groups based
     * on property names, values, and characteristics.
     */
    customGroups:
      | CustomGroupsOption<SingleCustomGroup>
      | DeprecatedCustomGroupsOption

    /**
     * Controls sorting of destructured objects in destructuring assignments.
     * Can be a boolean to enable/disable sorting, or an object to configure
     * whether to maintain groups in destructured objects.
     *
     * @default true
     */
    destructuredObjects: { groups: boolean } | boolean

    /**
     * Partition object members by comment delimiters. Members separated by
     * specific comments are sorted independently.
     */
    partitionByComment: PartitionByCommentOption

    /**
     * Controls the placement of newlines between different groups of object
     * members.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of object members. Members are sorted
     * within their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition object members by newlines. When true, members
     * separated by empty lines are sorted independently.
     */
    partitionByNewLine: boolean

    /**
     * Whether to sort object declarations (variable declarations with object
     * literals). When false, only sorts objects in other contexts like function
     * arguments.
     *
     * @default true
     */
    objectDeclarations: boolean

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

    /**
     * @deprecated For {@link `destructuredObjects`} and
     *   {@link `objectDeclarations`}. Will be removed in v5.0.0.
     */
    destructureOnly: boolean
  } & CommonOptions
>[]

/**
 * Configuration for a single custom group in object sorting.
 *
 * Allows defining custom groups based on member selectors, modifiers, and
 * patterns for fine-grained control over object member sorting.
 */
export type SingleCustomGroup = {
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
} & (
  | BaseSingleCustomGroup<MultilineSelector>
  | BaseSingleCustomGroup<PropertySelector>
  | BaseSingleCustomGroup<MethodSelector>
  | BaseSingleCustomGroup<MemberSelector>
)

/**
 * Union type of all available selectors for object members.
 *
 * Selectors identify the type of object member for grouping and sorting
 * purposes.
 */
export type Selector =
  | MultilineSelector
  | PropertySelector
  | MemberSelector
  | MethodSelector

/**
 * Union type of all available modifiers for object members.
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

  /** Index signatures are not supported in regular objects. */
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
 * Union type of all possible group identifiers for object members.
 *
 * Groups are used to organize and sort related members together. Can be
 * predefined group types, 'unknown' for unmatched members, or custom string
 * identifiers.
 */
type Group =
  | MultilineGroup
  | PropertyGroup
  | MethodGroup
  | MemberGroup
  | 'unknown'
  | string

/** @deprecated For {@link `MultilineModifier`}. Will be removed in v5.0.0. */
type MultilineGroup = JoinWithDash<
  [OptionalModifier, RequiredModifier, MultilineSelector]
>

/** @deprecated For {@link `MultilineModifier`}. Will be removed in v5.0.0. */
type MultilineSelector = 'multiline'

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
export let allSelectors: Selector[] = [
  'member',
  'method',
  'multiline',
  'property',
]

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
