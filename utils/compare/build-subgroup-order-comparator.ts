import type { Comparator } from './default-comparator-by-options-computer'
import type { OrderOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export function buildSubgroupOrderComparator(
  subgroupOrder: string[] | null,
  order: OrderOption,
): Comparator<SortingNode> {
  if (!subgroupOrder) {
    return () => 0
  }

  let subgroupIndexMap = new Map(
    subgroupOrder.map((name, index) => [name, index]),
  )
  let direction = order === 'desc' ? -1 : 1

  return (a, b) => {
    let aIndex = subgroupIndexMap.get(a.group)
    let bIndex = subgroupIndexMap.get(b.group)
    if (aIndex === undefined || bIndex === undefined) {
      return 0
    }

    return (aIndex - bIndex) * direction
  }
}
