import type { GroupsOptions } from '../types/common-options'

export function validateObjectsInsideGroups({
  groups,
}: {
  groups: GroupsOptions<string>
}): void {
  let isPreviousElementObject = false
  for (let group of groups) {
    if (typeof group === 'string' || Array.isArray(group)) {
      isPreviousElementObject = false
      continue
    }

    if (isPreviousElementObject) {
      throw new Error(
        'Consecutive objects (`newlinesBetween` or `commentAbove` are not allowed: merge them into a single object',
      )
    }
    isPreviousElementObject = true
  }
}
