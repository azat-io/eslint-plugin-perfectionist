import type {
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'

import { isNewlinesBetweenOption } from './is-newlines-between-option'
import { UnreachableCaseError } from './unreachable-case-error'

/**
 * Parameters for determining newlines requirement between nodes.
 *
 * Contains group indices and configuration options needed to calculate the
 * required number of newlines between two nodes.
 */
export interface GetNewlinesBetweenOptionParameters {
  /** Configuration options for newlines and groups. */
  options: {
    /**
     * Global newlines configuration: 'always', 'never', 'ignore', or numeric
     * value.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Optional custom groups configuration with possible newlinesInside
     * settings.
     */
    customGroups?: CustomGroupsOption

    /** Groups configuration that may include inline newlines settings. */
    groups: GroupsOptions<string>
  }

  /** Group index of the next/second node. */
  nextNodeGroupIndex: number

  /** Group index of the current/first node. */
  nodeGroupIndex: number
}

/**
 * Get the `newlinesBetween` option to use between two consecutive nodes. The
 * result is based on the global `newlinesBetween` option and the custom groups,
 * which can override the global option.
 *
 * - If the two nodes are in the same custom group, the `newlinesInside` option of
 *   the group is used.
 *
 * @param props - The function arguments.
 * @param props.nextNodeGroupIndex - The next node index to sort.
 * @param props.nodeGroupIndex - The current node index to sort.
 * @param props.options - Newlines between related options.
 * @returns - The `newlinesBetween` option to use.
 */
export function getNewlinesBetweenOption({
  nextNodeGroupIndex,
  nodeGroupIndex,
  options,
}: GetNewlinesBetweenOptionParameters): 'ignore' | number {
  let globalNewlinesBetweenOption = getGlobalNewlinesBetweenOption({
    newlinesBetween: options.newlinesBetween,
    nextNodeGroupIndex,
    nodeGroupIndex,
  })

  let nodeGroup = options.groups[nodeGroupIndex]
  let nextNodeGroup = options.groups[nextNodeGroupIndex]

  /* NewlinesInside check. */
  if (
    options.customGroups &&
    typeof nodeGroup === 'string' &&
    typeof nextNodeGroup === 'string' &&
    nodeGroup === nextNodeGroup
  ) {
    let nodeCustomGroup = options.customGroups.find(
      customGroup => customGroup.groupName === nodeGroup,
    )
    let nextNodeCustomGroup = options.customGroups.find(
      customGroup => customGroup.groupName === nextNodeGroup,
    )

    if (
      nodeCustomGroup &&
      nextNodeCustomGroup &&
      nodeCustomGroup.groupName === nextNodeCustomGroup.groupName
    ) {
      if (nodeCustomGroup.newlinesInside !== undefined) {
        return convertNewlinesBetweenOptionToNumber(
          nodeCustomGroup.newlinesInside,
        )
      }
      return globalNewlinesBetweenOption
    }
  }

  /* Check if a specific newlinesBetween is defined between the two groups. */
  if (nextNodeGroupIndex >= nodeGroupIndex + 2) {
    if (nextNodeGroupIndex === nodeGroupIndex + 2) {
      let groupBetween = options.groups[nodeGroupIndex + 1]!
      if (isNewlinesBetweenOption(groupBetween)) {
        return convertNewlinesBetweenOptionToNumber(
          groupBetween.newlinesBetween,
        )
      }
    } else {
      let relevantGroups = options.groups.slice(
        nodeGroupIndex,
        nextNodeGroupIndex + 1,
      )
      let groupsWithAllNewlinesBetween = buildGroupsWithAllNewlinesBetween(
        relevantGroups,
        globalNewlinesBetweenOption,
      )
      let newlinesBetweenOptions = new Set(
        groupsWithAllNewlinesBetween
          .filter(isNewlinesBetweenOption)
          .map(group => group.newlinesBetween)
          .map(convertNewlinesBetweenOptionToNumber),
      )

      let numberNewlinesBetween = [...newlinesBetweenOptions].filter(
        option => typeof option === 'number',
      )
      let maxNewlinesBetween =
        numberNewlinesBetween.length > 0
          ? Math.max(...numberNewlinesBetween)
          : null
      if (maxNewlinesBetween !== null && maxNewlinesBetween >= 1) {
        return maxNewlinesBetween
      }
      if (newlinesBetweenOptions.has('ignore')) {
        return 'ignore'
      }
      if (maxNewlinesBetween === 0) {
        return 0
      }
    }
  }

  return globalNewlinesBetweenOption
}

/**
 * Inserts newlines settings between groups that don't already have them.
 *
 * Fills in missing newlines settings between adjacent groups using the global
 * newlines option. This ensures every transition between groups has an explicit
 * newlines setting for consistent calculation.
 *
 * @example
 *   buildGroupsWithAllNewlinesBetween(
 *     ['imports', 'types', { newlinesBetween: 2 }, 'functions'],
 *     1,
 *   )
 *   // Returns: [
 *   //   'imports',
 *   //   { newlinesBetween: 1 },  // Added
 *   //   'types',
 *   //   { newlinesBetween: 2 },  // Already existed
 *   //   'functions'
 *   // ]
 *
 * @param groups - Array of groups with optional inline newlines settings.
 * @param globalNewlinesBetweenOption - Default newlines to use for missing
 *   settings.
 * @returns Groups array with newlines settings filled in between all groups.
 */
function buildGroupsWithAllNewlinesBetween(
  groups: GroupsOptions<string>,
  globalNewlinesBetweenOption: 'ignore' | number,
): GroupsOptions<string> {
  let returnValue: GroupsOptions<string> = []
  for (let i = 0; i < groups.length; i++) {
    let group = groups[i]!

    if (!isNewlinesBetweenOption(group)) {
      let previousGroup = groups[i - 1]
      if (previousGroup && !isNewlinesBetweenOption(previousGroup)) {
        returnValue.push({
          newlinesBetween: globalNewlinesBetweenOption,
        })
      }
    }

    returnValue.push(group)
  }
  return returnValue
}

/**
 * Calculates the global newlines requirement based on group indices.
 *
 * Applies the global newlines setting with special handling for nodes in the
 * same group (always returns 0 regardless of global setting). This ensures
 * elements within the same group are not separated by newlines unless
 * explicitly configured otherwise.
 *
 * @param params - Parameters for calculation.
 * @param params.newlinesBetween - Global newlines configuration.
 * @param params.nextNodeGroupIndex - Index of the next/second group.
 * @param params.nodeGroupIndex - Index of the current/first group.
 * @returns Number of required newlines or 'ignore'.
 */
function getGlobalNewlinesBetweenOption({
  nextNodeGroupIndex,
  newlinesBetween,
  nodeGroupIndex,
}: {
  newlinesBetween: NewlinesBetweenOption
  nextNodeGroupIndex: number
  nodeGroupIndex: number
}): 'ignore' | number {
  let numberNewlinesBetween =
    convertNewlinesBetweenOptionToNumber(newlinesBetween)

  if (numberNewlinesBetween === 'ignore') {
    return 'ignore'
  }
  if (nodeGroupIndex === nextNodeGroupIndex) {
    return 0
  }
  return numberNewlinesBetween
}

/**
 * Converts newlines configuration value to a numeric value or 'ignore'.
 *
 * Transforms string configuration values to their numeric equivalents:
 *
 * - 'always' → 1 (one newline required)
 * - 'never' → 0 (no newlines allowed)
 * - 'ignore' → 'ignore' (skip checking)
 * - Number → number (exact count required).
 *
 * @param newlinesBetween - Configuration value to convert.
 * @returns Numeric newlines requirement or 'ignore'.
 * @throws {UnreachableCaseError} If an unknown configuration value is provided.
 */
function convertNewlinesBetweenOptionToNumber(
  newlinesBetween: NewlinesBetweenOption,
): 'ignore' | number {
  if (typeof newlinesBetween === 'number') {
    return newlinesBetween
  }
  switch (newlinesBetween) {
    case 'ignore':
      return 'ignore'
    case 'always':
      return 1
    case 'never':
      return 0
    /* v8 ignore next 2 */
    default:
      throw new UnreachableCaseError(newlinesBetween)
  }
}
