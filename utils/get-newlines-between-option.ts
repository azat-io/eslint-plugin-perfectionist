import type {
  NewlinesBetweenOption,
  CommonGroupsOptions,
  GroupsOptions,
} from '../types/common-groups-options'

import { isGroupWithOverridesOption } from './is-group-with-overrides-option'
import { isNewlinesBetweenOption } from './is-newlines-between-option'
import { computeGroupName } from './compute-group-name'

/**
 * Parameters for determining newlines requirement between nodes.
 *
 * Contains group indices and configuration options needed to calculate the
 * required number of newlines between two nodes.
 */
export interface GetNewlinesBetweenOptionParameters {
  /** Configuration options for newlines and groups. */
  options: CommonGroupsOptions<unknown, unknown, string>

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
}: GetNewlinesBetweenOptionParameters): NewlinesBetweenOption {
  /* NewlinesInside check. */
  if (nodeGroupIndex === nextNodeGroupIndex) {
    return computeNewlinesInsideOption({
      groupIndex: nodeGroupIndex,
      options,
    })
  }

  /* Check if a specific newlinesBetween is defined between the two groups. */
  if (nextNodeGroupIndex >= nodeGroupIndex + 2) {
    return computeNewlinesBetweenOptionForDifferentGroups({
      nextNodeGroupIndex,
      nodeGroupIndex,
      options,
    })
  }

  return options.newlinesBetween
}

function computeNewlinesBetweenOptionForDifferentGroups({
  nextNodeGroupIndex,
  nodeGroupIndex,
  options,
}: {
  options: GetNewlinesBetweenOptionParameters['options']
  nextNodeGroupIndex: number
  nodeGroupIndex: number
}): NewlinesBetweenOption {
  if (nextNodeGroupIndex === nodeGroupIndex + 2) {
    let groupBetween = options.groups[nodeGroupIndex + 1]!
    if (isNewlinesBetweenOption(groupBetween)) {
      return groupBetween.newlinesBetween
    }
    return options.newlinesBetween
  }

  let relevantGroups = options.groups.slice(
    nodeGroupIndex,
    nextNodeGroupIndex + 1,
  )
  let groupsWithAllNewlinesBetween = buildGroupsWithAllNewlinesBetween(
    relevantGroups,
    options.newlinesBetween,
  )
  let newlinesBetweenOptions = new Set(
    groupsWithAllNewlinesBetween
      .filter(isNewlinesBetweenOption)
      .map(group => group.newlinesBetween),
  )

  let numberNewlinesBetween = [...newlinesBetweenOptions].filter(
    option => typeof option === 'number',
  )
  let maxNewlinesBetween =
    numberNewlinesBetween.length > 0 ? Math.max(...numberNewlinesBetween) : null

  if (maxNewlinesBetween !== null && maxNewlinesBetween >= 1) {
    return maxNewlinesBetween
  }
  if (newlinesBetweenOptions.has('ignore')) {
    return 'ignore'
  }
  return 0
}

function computeNewlinesInsideOption({
  groupIndex,
  options,
}: {
  options: GetNewlinesBetweenOptionParameters['options']
  groupIndex: number
}): NewlinesBetweenOption {
  let globalNewlinesBetweenOption =
    options.newlinesBetween === 'ignore' ? options.newlinesBetween : 0

  let group = options.groups[groupIndex]
  if (!group) {
    return globalNewlinesBetweenOption
  }

  let groupName = computeGroupName(group)
  let nodeCustomGroup = options.customGroups.find(
    customGroup => customGroup.groupName === groupName,
  )

  let groupOverrideNewlinesInside = isGroupWithOverridesOption(group)
    ? group.newlinesInside
    : null
  return (
    nodeCustomGroup?.newlinesInside ??
    groupOverrideNewlinesInside ??
    globalNewlinesBetweenOption
  )
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
  groups: GroupsOptions,
  globalNewlinesBetweenOption: NewlinesBetweenOption,
): GroupsOptions {
  let returnValue: GroupsOptions = []
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
