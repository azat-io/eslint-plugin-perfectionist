import type { TSESLint } from '@typescript-eslint/utils'

import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { getLinesBetween } from './get-lines-between'

export type NewlinesBetweenValueGetter<T extends SortingNode> = (props: {
  computedNewlinesBetween: NewlinesBetweenOption
  right: T
  left: T
}) => NewlinesBetweenOption

interface GetNewlinesBetweenErrorsParameters<
  MessageIds extends string,
  T extends SortingNode,
> {
  options: {
    customGroups?: DeprecatedCustomGroupsOption | CustomGroupsOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<string>
  }
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>
  sourceCode: TSESLint.SourceCode
  missedSpacingError: MessageIds
  extraSpacingError: MessageIds
  rightGroupIndex: number
  leftGroupIndex: number
  right: T
  left: T
}

export let getNewlinesBetweenErrors = <
  MessageIds extends string,
  T extends SortingNode,
>({
  newlinesBetweenValueGetter,
  missedSpacingError,
  extraSpacingError,
  rightGroupIndex,
  leftGroupIndex,
  sourceCode,
  options,
  right,
  left,
}: GetNewlinesBetweenErrorsParameters<MessageIds, T>): MessageIds[] => {
  let newlinesBetween = getNewlinesBetweenOption({
    nextSortingNode: right,
    sortingNode: left,
    options,
  })
  newlinesBetween =
    newlinesBetweenValueGetter?.({
      computedNewlinesBetween: newlinesBetween,
      right,
      left,
    }) ?? newlinesBetween
  if (leftGroupIndex > rightGroupIndex) {
    return []
  }
  let numberOfEmptyLinesBetween = getLinesBetween(sourceCode, left, right)
  switch (newlinesBetween) {
    case 'ignore':
      return []
    case 'never':
      return numberOfEmptyLinesBetween > 0 ? [extraSpacingError] : []
    case 'always':
      if (numberOfEmptyLinesBetween === 0) {
        return [missedSpacingError]
      } else if (numberOfEmptyLinesBetween > 1) {
        return [extraSpacingError]
      }
  }
  return []
}
