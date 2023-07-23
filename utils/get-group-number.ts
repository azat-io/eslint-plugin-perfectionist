import type { SortingNode } from "../typings"

export let getGroupNumber = (groups: (string[] | string)[], node: SortingNode): number => {
  for (let i = 0, max = groups.length; i < max; i++) {
    let currentGroup = groups[i]

    if (
      node.group === currentGroup ||
      (Array.isArray(currentGroup) && typeof node.group === 'string' && currentGroup.includes(node.group))
    ) {
      return i
    }
  }

  return groups.length
}
