import type { AnyOfCustomGroup } from '../types/common-groups-options'
import type { RegexOption } from '../types/common-options'

import { matches } from './matches'

/**
 * Parameters for testing if an element matches a custom group.
 *
 * Contains all the properties of an element that can be used for matching
 * against custom group criteria.
 */
export interface DoesCustomGroupMatchParameters {
  /**
   * Optional value of the element. Used for matching against
   * elementValuePattern in custom groups.
   */
  elementValue?: string | null

  /**
   * Optional list of decorator names applied to the element. Used for matching
   * against decoratorNamePattern in custom groups.
   */
  decorators?: string[]

  /**
   * List of modifiers applied to the element (e.g., 'static', 'private',
   * 'async'). Must include all modifiers specified in the custom group.
   */
  modifiers: string[]

  /**
   * List of selectors that describe the element type. Used for matching against
   * the selector field in custom groups.
   */
  selectors: string[]

  /**
   * Name of the element. Used for matching against elementNamePattern in custom
   * groups.
   */
  elementName: string
}

/**
 * Base structure for a single custom group configuration.
 *
 * Defines matching criteria that an element must satisfy to belong to this
 * custom group. All specified criteria must match for the element to be
 * considered part of the group.
 */
interface BaseCustomGroupMatchOptions {
  /**
   * Pattern to match against decorator names. Element must have at least one
   * decorator matching this pattern.
   */
  decoratorNamePattern?: RegexOption

  /**
   * Pattern to match against the element's value. Used for matching literal
   * values, initializers, or expressions.
   */
  elementValuePattern?: RegexOption

  /**
   * Regular expression pattern to match the element's name. Elements matching
   * this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption

  /**
   * List of required modifiers. Element must have ALL specified modifiers to
   * match.
   */
  modifiers?: string[]

  /**
   * Required selector type. Element must have this exact selector to match.
   */
  selector?: string
}

/**
 * Checks whether an element matches the criteria of a custom group.
 *
 * Supports both single custom groups and "anyOf" groups (where matching any
 * subgroup is sufficient). For single groups, all specified criteria must
 * match. For "anyOf" groups, at least one subgroup must match.
 *
 * @example
 *
 * ```ts
 * // Single custom group
 * doesCustomGroupMatch({
 *   customGroup: {
 *     selector: 'property',
 *     modifiers: ['static'],
 *     elementNamePattern: 'on*',
 *   },
 *   elementName: 'onClick',
 *   selectors: ['property'],
 *   modifiers: ['static', 'readonly'],
 *   elementValue: null,
 *   decorators: [],
 * })
 * // Returns: true
 * ```
 *
 * @example
 *
 * ```ts
 * // AnyOf custom group
 * doesCustomGroupMatch({
 *   customGroup: {
 *     anyOf: [
 *       { selector: 'method' },
 *       { selector: 'property', modifiers: ['static'] },
 *     ],
 *   },
 *   elementName: 'foo',
 *   selectors: ['method'],
 *   modifiers: [],
 *   elementValue: null,
 * })
 * // Returns: true (matches first subgroup)
 * ```
 *
 * @template CustomGroupMatchOptions - Type of custom group match options.
 * @param props - Combined parameters including the custom group and element
 *   properties.
 * @returns True if the element matches the custom group criteria, false
 *   otherwise.
 */
export function doesCustomGroupMatch<
  CustomGroupMatchOptions extends BaseCustomGroupMatchOptions,
>(
  props: {
    customGroup:
      | AnyOfCustomGroup<CustomGroupMatchOptions>
      | CustomGroupMatchOptions
  } & DoesCustomGroupMatchParameters,
): boolean {
  if ('anyOf' in props.customGroup) {
    return props.customGroup.anyOf.some(subgroup =>
      doesSingleCustomGroupMatch({
        ...props,
        customGroup: subgroup,
      }),
    )
  }

  return doesSingleCustomGroupMatch({
    ...props,
    customGroup: props.customGroup,
  })
}

/**
 * Checks whether an element matches a single custom group's criteria.
 *
 * Tests each criterion in sequence, returning false as soon as any criterion
 * fails. All specified criteria must match for the function to return true. The
 * checks are performed in the following order:
 *
 * 1. Selector match (exact)
 * 2. Modifiers match (all required modifiers must be present)
 * 3. Element name pattern match
 * 4. Element value pattern match
 * 5. Decorator name pattern match (at least one decorator must match).
 *
 * @param params - Parameters for matching.
 * @param params.customGroup - Custom group configuration with matching
 *   criteria.
 * @param params.elementName - Name of the element to test.
 * @param params.elementValue - Optional value of the element.
 * @param params.selectors - Element's selectors.
 * @param params.modifiers - Element's modifiers.
 * @param params.decorators - Element's decorators.
 * @returns True if all specified criteria match, false otherwise.
 */
function doesSingleCustomGroupMatch({
  elementValue,
  customGroup,
  elementName,
  decorators,
  selectors,
  modifiers,
}: {
  customGroup: BaseCustomGroupMatchOptions
  elementValue?: string | null
  decorators?: string[]
  selectors?: string[]
  modifiers?: string[]
  elementName: string
}): boolean {
  if (customGroup.selector && !selectors?.includes(customGroup.selector)) {
    return false
  }

  if (customGroup.modifiers) {
    for (let modifier of customGroup.modifiers) {
      if (!modifiers?.includes(modifier)) {
        return false
      }
    }
  }

  if ('elementNamePattern' in customGroup && customGroup.elementNamePattern) {
    let matchesElementNamePattern: boolean = matches(
      elementName,
      customGroup.elementNamePattern,
    )
    if (!matchesElementNamePattern) {
      return false
    }
  }

  if ('elementValuePattern' in customGroup && customGroup.elementValuePattern) {
    let matchesElementValuePattern: boolean = matches(
      elementValue ?? '',
      customGroup.elementValuePattern,
    )
    if (!matchesElementValuePattern) {
      return false
    }
  }

  if (
    'decoratorNamePattern' in customGroup &&
    customGroup.decoratorNamePattern
  ) {
    let decoratorPattern = customGroup.decoratorNamePattern
    let matchesDecoratorNamePattern = decorators?.some(decorator =>
      matches(decorator, decoratorPattern),
    )
    if (!matchesDecoratorNamePattern) {
      return false
    }
  }

  return true
}
