import type { CommonGroupsOptions } from '../types/common-groups-options'

import { validateObjectsInsideGroups } from './validate-objects-inside-groups'
import { validateNoDuplicatedGroups } from './validate-no-duplicated-groups'
import { parsePredefinedGroup } from './parse-predefined-group'
import { computeGroupsNames } from './compute-groups-names'

/**
 * Parameters for validating generated groups configuration.
 */
interface ValidateGenerateGroupsConfigParameters {
  options: Pick<
    CommonGroupsOptions<string, unknown, unknown>,
    'customGroups' | 'groups'
  >
  selectors: readonly string[]
  modifiers: readonly string[]
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
 *
 * ```ts
 * // Valid predefined groups for React imports
 * validateGeneratedGroupsConfiguration({
 *   options: {
 *     groups: ['react', 'external', 'internal', 'side-effect-import'],
 *     customGroups: [],
 *   },
 *   selectors: ['import', 'export'],
 *   modifiers: ['side-effect', 'type', 'value'],
 * })
 * // All groups are valid predefined groups
 * ```
 *
 * @example
 *
 * ```ts
 * // Invalid group that doesn't exist
 * validateGeneratedGroupsConfiguration({
 *   options: {
 *     groups: ['my-special-group'], // Not predefined, not in customGroups
 *     customGroups: [],
 *   },
 *   selectors: ['property', 'method'],
 *   modifiers: ['static', 'private'],
 * })
 * // Throws: Error: Invalid group(s): my-special-group
 * ```
 *
 * @example
 *
 * ```ts
 * // Valid with custom groups for class members
 * validateGeneratedGroupsConfiguration({
 *   options: {
 *     groups: ['static-property', 'constructor', 'lifecycle-methods'],
 *     customGroups: [
 *       {
 *         groupName: 'lifecycle-methods',
 *         elementNamePattern: [
 *           /^componentDidMount$/,
 *           /^componentWillUnmount$/,
 *         ],
 *       },
 *     ],
 *   },
 *   selectors: ['property', 'method', 'constructor'],
 *   modifiers: ['static', 'private', 'public'],
 * })
 * // 'static-property' is predefined, 'lifecycle-methods' is custom
 * ```
 *
 * @param params - Configuration parameters to validate.
 * @throws {Error} If any group is neither predefined nor custom.
 */
export function validateGroupsConfig({
  selectors,
  modifiers,
  options,
}: ValidateGenerateGroupsConfigParameters): void {
  let availableCustomGroupNames = new Set(
    options.customGroups.map(customGroup => customGroup.groupName),
  )
  let invalidGroups = computeGroupsNames(options.groups).filter(
    group =>
      group !== 'unknown' &&
      !parsePredefinedGroup({
        allSelectors: selectors,
        allModifiers: modifiers,
        name: group,
      }) &&
      !availableCustomGroupNames.has(group),
  )
  if (invalidGroups.length > 0) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups(options)
  validateObjectsInsideGroups(options)
}
