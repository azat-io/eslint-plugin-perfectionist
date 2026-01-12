import type { NewlinesBetweenValueGetter } from '../../utils/get-newlines-between-errors'
import type { NewlinesBetweenOption } from '../../types/common-groups-options'
import type { SortClassesSortingNode } from './types'

export let newlinesBetweenValueGetter: NewlinesBetweenValueGetter<
  SortClassesSortingNode
> = ({ computedNewlinesBetween, right, left }): NewlinesBetweenOption => {
  if (
    left.overloadSignaturesGroupId !== null &&
    left.overloadSignaturesGroupId === right.overloadSignaturesGroupId
  ) {
    return 0
  }
  return computedNewlinesBetween
}
