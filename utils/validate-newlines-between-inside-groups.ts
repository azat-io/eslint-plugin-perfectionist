import type { GroupsOptions } from '../types/common-options'

import { isNewlinesBetweenOption } from './is-newlines-between-option'

export let validateNewlinesBetweenInsideGroups = ({
  groups,
}: {
  groups: GroupsOptions<string>
}): void => {
  let isPreviousElementNewlinesBetween = false
  for (let groupElement of groups) {
    if (!isNewlinesBetweenOption(groupElement)) {
      isPreviousElementNewlinesBetween = false
      continue
    }
    // There should not be two consecutive `newlinesBetween` objects
    if (isPreviousElementNewlinesBetween) {
      throw new Error("Consecutive 'newlinesBetween' objects are not allowed")
    }
    isPreviousElementNewlinesBetween = true
  }
}
