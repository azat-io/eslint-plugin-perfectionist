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
interface SingleCustomGroup {
  /**
   * Regular expression pattern to match prop values. Props with values matching
   * this pattern will be included in this custom group.
   */
  elementValuePattern?: RegexOption

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
  } & Pick<CommonPartitionOptions, 'partitionByNewLine'> &
    CommonGroupsOptions<SingleCustomGroup> &
    CommonOptions
>[]

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
