import type { Comparator } from './default-comparator-by-options-computer'
import type { GroupsOptions } from '../../types/common-groups-options'
import type { OrderOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import { isGroupWithOverridesOption } from '../is-group-with-overrides-option'
import { isNewlinesBetweenOption } from '../is-newlines-between-option'
import { UnreachableCaseError } from '../unreachable-case-error'

export function getSubgroupOrder(
  group: GroupsOptions[number] | undefined,
): string[] | null {
  if (!group) {
    return null
  }
  if (typeof group === 'string' || Array.isArray(group)) {
    return Array.isArray(group) ? group : null
  }
  if (isGroupWithOverridesOption(group)) {
    return Array.isArray(group.group) ? group.group : null
  }
  /* v8 ignore else -- @preserve Exhaustive guard: other directives are filtered out earlier. */
  if (isNewlinesBetweenOption(group)) {
    return null
  }
  /* v8 ignore next -- @preserve Exhaustive guard: other directives are filtered out earlier. */
  throw new UnreachableCaseError(group)
}

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
