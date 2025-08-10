import type { GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

/**
 * Type representing a single group or an array of group names. Used in group
 * configuration where elements can belong to multiple subgroups.
 */
type Group = GroupsOptions<string>[number]

/**
 * Determines the index of the group that a node belongs to.
 *
 * Searches through the groups array to find which group contains the node.
 * Supports both simple groups (string) and composite groups (array of strings).
 * For composite groups, the node matches if its group is any element in the
 * array.
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
    let currentGroup = groups[i]

    if (
      node.group === currentGroup ||
      (Array.isArray(currentGroup) &&
        typeof node.group === 'string' &&
        currentGroup.includes(node.group))
    ) {
      return i
    }
  }

  return groups.length
}
