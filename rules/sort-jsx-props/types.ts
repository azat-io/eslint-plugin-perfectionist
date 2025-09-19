import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
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
 * Configuration options for the sort-jsx-props rule.
 *
 * This rule enforces consistent ordering of JSX element props/attributes to
 * improve code readability and maintainability.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching. Allows applying the
     * rule only to specific JSX elements.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all prop names. The rule is
       * only applied when all prop names match this pattern.
       */
      allNamesMatchPattern?: RegexOption

      /**
       * Regular expression pattern to match against JSX element tag names. The
       * rule is only applied to elements with matching tag names.
       */
      tagMatchesPattern?: RegexOption
    }

    /**
     * Custom groups for organizing JSX props. Allows defining groups based on
     * prop names, values, and characteristics.
     */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /** Controls the placement of newlines between different groups of JSX props. */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of JSX props. Props are sorted within
     * their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition JSX props by newlines. When true, props separated by
     * empty lines are sorted independently.
     */
    partitionByNewLine: boolean
  } & CommonOptions
>[]

/**
 * Defines a custom group for JSX prop categorization.
 *
 * Custom groups allow fine-grained control over how JSX props are grouped and
 * sorted based on their names, values, and characteristics.
 *
 * @example
 *   {
 *     "selector": "prop",
 *     "modifiers": ["shorthand"],
 *     "elementNamePattern": "^data-"
 *   }
 */
export interface SingleCustomGroup {
  /**
   * Regular expression pattern to match prop values. Props with values matching
   * this pattern will be included in this custom group.
   */
  elementValuePattern?: RegexOption

  /**
   * Regular expression pattern to match prop names. Props with names matching
   * this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption

  /**
   * List of modifiers that props must have to be included in this group. Can
   * include 'shorthand' for props without values or 'multiline' for multi-line
   * props.
   */
  modifiers?: Modifier[]

  /**
   * The selector type for this group. Can be 'prop' for regular props,
   * 'multiline' for multi-line props, or 'shorthand' for shorthand props.
   */
  selector?: Selector
}

/**
 * Union type of all available JSX prop modifiers. Used to identify specific
 * characteristics of JSX props.
 */
export type Modifier = MultilineModifier | ShorthandModifier

/**
 * Union type of all available JSX prop selectors. Used to categorize different
 * types of JSX props.
 */
export type Selector = PropertySelector

/**
 * Represents all possible group combinations for regular JSX props. Combines
 * modifiers with the property selector using dash notation.
 */
type PropertyGroup = JoinWithDash<
  [ShorthandModifier, MultilineModifier, PropertySelector]
>

/**
 * Represents a group identifier for JSX prop categorization. Can be a
 * predefined group, 'unknown' for uncategorized props, or a custom group name.
 */
type Group = PropertyGroup | 'unknown' | string

/** Modifier for JSX props that span multiple lines. */
type MultilineModifier = 'multiline'

/** Modifier for JSX props without explicit values (shorthand boolean props). */
type ShorthandModifier = 'shorthand'

/** Selector for regular JSX props/attributes. */
type PropertySelector = 'prop'

/**
 * Complete list of available JSX prop selectors. Used for validation and JSON
 * schema generation.
 */
export let allSelectors: Selector[] = ['prop']

/**
 * Complete list of available JSX prop modifiers. Used for validation and JSON
 * schema generation.
 */
export let allModifiers: Modifier[] = ['shorthand', 'multiline']

/**
 * JSON schema definition for validating single custom group configurations.
 * Used by ESLint to validate rule options at configuration time.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementValuePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
}
