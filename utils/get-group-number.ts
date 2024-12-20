import type { SortingNode } from '../types'

export let getGroupNumber = (
  groups: (string[] | string)[],
  node: SortingNode,
): number => {
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
