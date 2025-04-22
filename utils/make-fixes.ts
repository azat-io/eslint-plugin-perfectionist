import type { TSESLint } from '@typescript-eslint/utils'

import type {
  DeprecatedCustomGroupsOption,
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { NewlinesBetweenValueGetter } from './get-newlines-between-errors'
import type { SortingNode } from '../types/sorting-node'

import { makeNewlinesBetweenFixes } from './make-newlines-between-fixes'
import { makeCommentAfterFixes } from './make-comment-after-fixes'
import { makeOrderFixes } from './make-order-fixes'

export interface MakeFixesParameters<T extends SortingNode> {
  options?: {
    customGroups?: DeprecatedCustomGroupsOption | CustomGroupsOption
    partitionByComment?: PartitionByCommentOption
    newlinesBetween?: NewlinesBetweenOption
    groups?: GroupsOptions<string>
  }
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>
  ignoreFirstNodeHighestBlockComment?: boolean
  sourceCode: TSESLint.SourceCode
  fixer: TSESLint.RuleFixer
  sortedNodes: T[]
  nodes: T[]
}

export let makeFixes = <T extends SortingNode>({
  ignoreFirstNodeHighestBlockComment,
  newlinesBetweenValueGetter,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeFixesParameters<T>): TSESLint.RuleFix[] => {
  let orderFixes = makeOrderFixes({
    ignoreFirstNodeHighestBlockComment,
    sortedNodes,
    sourceCode,
    options,
    nodes,
    fixer,
  })

  let commentAfterFixes = makeCommentAfterFixes({
    sortedNodes,
    sourceCode,
    nodes,
    fixer,
  })
  if (
    commentAfterFixes.length > 0 ||
    !options?.groups ||
    !options.newlinesBetween
  ) {
    return [...orderFixes, ...commentAfterFixes]
  }

  let newlinesFixes = makeNewlinesBetweenFixes({
    options: {
      ...options,
      newlinesBetween: options.newlinesBetween,
      groups: options.groups,
    },
    newlinesBetweenValueGetter,
    sortedNodes,
    sourceCode,
    fixer,
    nodes,
  })

  return [...orderFixes, ...newlinesFixes]
}
