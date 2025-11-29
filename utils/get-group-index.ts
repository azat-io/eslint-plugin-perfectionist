import type { GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { isGroupWithOverridesOption } from './is-group-with-overrides-option'
import { isNewlinesBetweenOption } from './is-newlines-between-option'
import { UnreachableCaseError } from './unreachable-case-error'

/**
 * Type representing a single group or an array of group names. Used in group
 * configuration where elements can belong to multiple subgroups.
 */
type Group = GroupsOptions[number]

/**
 * Determines the index of the group that a node belongs to.
 *
 * Searches through the groups array to find which group contains the node.
 * Supports simple groups (string), composite groups (array of strings) and
 * objects containing a `group` property. For composite groups, the node matches
 * if its group is any element in the array.
 *
 * The function returns the index of the matching group. If no group matches, it
 * returns the length of the groups array, which conventionally represents the
 * "unknown" group and ensures such nodes are sorted last.
 *
 * @example
 *   const groups = ['imports', ['types', 'interfaces'], 'functions']
 *   const node1 = { group: 'imports', name: 'lodash' }
 *   const node2 = { group: 'types', name: 'User' }
 *   const node3 = { group: 'unknown-group', name: 'misc' }
 *
 *   getGroupIndex(groups, node1) // Returns: 0
 *   getGroupIndex(groups, node2) // Returns: 1 (matches composite group)
 *   getGroupIndex(groups, node3) // Returns: 3 (groups.length, unknown group)
 *
 * @param groups - Array of group configurations (strings or arrays of strings).
 * @param node - Sorting node with a group property to match.
 * @returns Index of the matching group, or groups.length if no match found.
 */
export function getGroupIndex(groups: Group[], node: SortingNode): number {
  for (let max = groups.length, i = 0; i < max; i++) {
    let currentGroup = groups[i]!

    if (doesGroupMatch(currentGroup, node.group)) {
      return i
    }
  }

  return groups.length
}

function doesGroupMatch(group: Group, groupName: string): boolean {
  if (typeof group === 'string' || Array.isArray(group)) {
    return doesStringGroupMatch(group, groupName)
  }
  if (isGroupWithOverridesOption(group)) {
    return doesStringGroupMatch(group.group, groupName)
  }
  /* v8 ignore else -- @preserve Exhaustive guard: other directives are filtered out earlier. */
  if (isNewlinesBetweenOption(group)) {
    return false
  }
  /* v8 ignore next -- @preserve Exhaustive guard: other directives are filtered out earlier. */
  throw new UnreachableCaseError(group)
}

function doesStringGroupMatch(
  group: string[] | string,
  groupName: string,
): boolean {
  if (typeof group === 'string') {
    return group === groupName
  }
  return group.includes(groupName)
}
