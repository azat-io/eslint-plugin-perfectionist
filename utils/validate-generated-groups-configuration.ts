import type { CustomGroupsOption, GroupsOptions } from '../types/common-options'

import { validateObjectsInsideGroups } from './validate-objects-inside-groups'
import { validateNoDuplicatedGroups } from './validate-no-duplicated-groups'

/** Parameters for validating generated groups configuration. */
interface ValidateGenerateGroupsConfigurationParameters {
  options: {
    customGroups: CustomGroupsOption
    groups: GroupsOptions<string>
  }
  selectors: string[]
  modifiers: string[]
}

/**
 * Validates that all groups in configuration are either predefined or custom.
 *
 * Ensures that every group specified in the configuration either:
 *
 * 1. Is a valid predefined group (combination of modifiers and selectors)
 * 2. Is defined in customGroups
 * 3. Is the special 'unknown' group.
 *
 * Also validates that there are no duplicate groups.
 *
 * @example
 *   // Valid predefined groups for React imports
 *   validateGeneratedGroupsConfiguration({
 *     options: {
 *       groups: ['react', 'external', 'internal', 'side-effect-import'],
 *       customGroups: [],
 *     },
 *     selectors: ['import', 'export'],
 *     modifiers: ['side-effect', 'type', 'value'],
 *   })
 *   // All groups are valid predefined groups
 *
 * @example
 *   // Invalid group that doesn't exist
 *   validateGeneratedGroupsConfiguration({
 *     options: {
 *       groups: ['my-special-group'], // Not predefined, not in customGroups
 *       customGroups: [],
 *     },
 *     selectors: ['property', 'method'],
 *     modifiers: ['static', 'private'],
 *   })
 *   // Throws: Error: Invalid group(s): my-special-group
 *
 * @example
 *   // Valid with custom groups for class members
 *   validateGeneratedGroupsConfiguration({
 *     options: {
 *       groups: ['static-property', 'constructor', 'lifecycle-methods'],
 *       customGroups: [
 *         {
 *           groupName: 'lifecycle-methods',
 *           elementNamePattern: [
 *             /^componentDidMount$/,
 *             /^componentWillUnmount$/,
 *           ],
 *         },
 *       ],
 *     },
 *     selectors: ['property', 'method', 'constructor'],
 *     modifiers: ['static', 'private', 'public'],
 *   })
 *   // 'static-property' is predefined, 'lifecycle-methods' is custom
 *
 * @param params - Configuration parameters to validate.
 * @throws {Error} If any group is neither predefined nor custom.
 */
export function validateGeneratedGroupsConfiguration({
  selectors,
  modifiers,
  options,
}: ValidateGenerateGroupsConfigurationParameters): void {
  let availableCustomGroupNames = new Set(
    options.customGroups.map(customGroup => customGroup.groupName),
  )
  let invalidGroups = options.groups
    .flat()
    .filter(group => typeof group === 'string')
    .filter(
      group =>
        !isPredefinedGroup(selectors, modifiers, group) &&
        !availableCustomGroupNames.has(group),
    )
  if (invalidGroups.length > 0) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups(options)
  validateObjectsInsideGroups(options)
}

/**
 * Checks if a group name is a valid predefined group.
 *
 * Predefined groups are formed by combining modifiers and selectors with
 * dashes. The function parses the group name from right to left, first
 * extracting the selector (which can be up to 3 words), then the modifiers.
 *
 * @example
 *   // Valid predefined groups
 *   isPredefinedGroup(
 *     ['property', 'method'],
 *     ['static', 'private'],
 *     'static-private-property',
 *   )
 *   // Returns: true (static + private + property)
 *
 * @example
 *   // Special 'unknown' group
 *   isPredefinedGroup([], [], 'unknown')
 *   // Returns: true (always valid)
 *
 * @example
 *   // Invalid group - not matching selectors
 *   isPredefinedGroup(
 *     ['import', 'export'],
 *     ['type', 'value'],
 *     'custom-group',
 *   )
 *   // Returns: false ('group' is not a valid selector)
 *
 * @param allSelectors - Available selectors for the rule.
 * @param allModifiers - Available modifiers for the rule.
 * @param input - Group name to validate.
 * @returns True if the group is a valid predefined combination.
 */
function isPredefinedGroup(
  allSelectors: string[],
  allModifiers: string[],
  input: string,
): boolean {
  if (input === 'unknown') {
    return true
  }

  let elementsSeparatedWithDash = input.split('-')

  let longestAllowedSelector = computeLongestAllowedWord({
    allowedValues: allSelectors,
    elementsSeparatedWithDash,
  })
  if (!longestAllowedSelector) {
    return false
  }

  let modifiersToParse = elementsSeparatedWithDash.slice(
    0,
    -longestAllowedSelector.wordCount,
  )
  let parsedModifiers = new Set<string>()
  while (modifiersToParse.length > 0) {
    let longestAllowedModifier = computeLongestAllowedWord({
      elementsSeparatedWithDash: modifiersToParse,
      allowedValues: allModifiers,
    })
    if (!longestAllowedModifier) {
      return false
    }
    if (parsedModifiers.has(longestAllowedModifier.word)) {
      return false
    }
    parsedModifiers.add(longestAllowedModifier.word)
    modifiersToParse = modifiersToParse.slice(
      0,
      -longestAllowedModifier.wordCount,
    )
  }

  return true
}

/**
 * Finds the longest valid word from the end of a dash-separated array.
 *
 * Attempts to match 3-word, 2-word, then 1-word combinations from the end of
 * the array against allowed values. This is used to parse selectors and
 * modifiers from group names.
 *
 * @example
 *   // Matching a multi-word selector
 *   computeLongestAllowedWord({
 *     elementsSeparatedWithDash: ['static', 'get', 'accessor'],
 *     allowedValues: ['accessor', 'get-accessor', 'property'],
 *   })
 *   // Returns: { word: 'get-accessor', wordCount: 2 }
 *
 * @example
 *   // Matching a single-word modifier
 *   computeLongestAllowedWord({
 *     elementsSeparatedWithDash: ['private', 'static'],
 *     allowedValues: ['static', 'private', 'public'],
 *   })
 *   // Returns: { word: 'static', wordCount: 1 }
 *
 * @param params - Parameters for word matching.
 * @returns Matched word with its word count, or null if no match.
 */
function computeLongestAllowedWord({
  elementsSeparatedWithDash,
  allowedValues,
}: {
  elementsSeparatedWithDash: string[]
  allowedValues: string[]
}): { wordCount: number; word: string } | null {
  let match = [
    { word: elementsSeparatedWithDash.slice(-3).join('-'), wordCount: 3 },
    { word: elementsSeparatedWithDash.slice(-2).join('-'), wordCount: 2 },
    { word: elementsSeparatedWithDash.at(-1)!, wordCount: 1 },
  ]
    .filter(({ wordCount }) => elementsSeparatedWithDash.length >= wordCount)
    .find(({ word }) => word && allowedValues.includes(word))

  if (!match) {
    return null
  }

  return match
}
