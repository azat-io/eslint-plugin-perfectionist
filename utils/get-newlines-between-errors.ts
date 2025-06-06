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
  computedNewlinesBetween: 'ignore' | number
  right: T
  left: T
}) => 'ignore' | number

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
  if (
    leftGroupIndex > rightGroupIndex ||
    left.partitionId !== right.partitionId
  ) {
    return []
  }

  let newlinesBetween = getNewlinesBetweenOption({
    nextNodeGroupIndex: rightGroupIndex,
    nodeGroupIndex: leftGroupIndex,
    options,
  })
  newlinesBetween =
    newlinesBetweenValueGetter?.({
      computedNewlinesBetween: newlinesBetween,
      right,
      left,
    }) ?? newlinesBetween

  let numberOfEmptyLinesBetween = getLinesBetween(sourceCode, left, right)
  if (newlinesBetween === 'ignore') {
    return []
  }

  if (numberOfEmptyLinesBetween < newlinesBetween) {
    return [missedSpacingError]
  }
  if (numberOfEmptyLinesBetween > newlinesBetween) {
    return [extraSpacingError]
  }
  return []
}
