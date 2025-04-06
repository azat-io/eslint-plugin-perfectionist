import type { GroupsOptions } from '../../types/common-options'

import { isNewlinesBetweenOption } from '../../utils/is-newlines-between-option'

export let isSideEffectOnlyGroup = (
  group: GroupsOptions<string>[0],
): boolean => {
  if (isNewlinesBetweenOption(group)) {
    return false
  }
  if (typeof group === 'string') {
    return group === 'side-effect' || group === 'side-effect-style'
  }

  return group.every(isSideEffectOnlyGroup)
}
