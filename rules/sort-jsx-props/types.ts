import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'
import { buildRegexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

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
  } & Omit<
    AllCommonOptions<
      TypeOption,
      AdditionalSortOptions,
      CustomGroupMatchOptions
    >,
    'partitionByComment'
  >
>[]

/**
 * Union type of all available JSX prop modifiers. Used to identify specific
 * characteristics of JSX props.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Union type of all available JSX prop selectors. Used to categorize different
 * types of JSX props.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Additional configuration for a single custom group.
 *
 * @example
 *
 * ```ts
 * {
 *   "selector": "prop",
 *   "modifiers": ["shorthand"]
 * }
 * ```
 */
interface CustomGroupMatchOptions {
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

type AdditionalSortOptions = object

/**
 * Complete list of available JSX prop selectors. Used for validation and JSON
 * schema generation.
 */
export let allSelectors = ['prop'] as const

/**
 * Complete list of available JSX prop modifiers. Used for validation and JSON
 * schema generation.
 */
export let allModifiers = ['shorthand', 'multiline'] as const

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
  elementValuePattern: buildRegexJsonSchema(),
}
