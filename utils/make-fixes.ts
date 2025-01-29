import type { TSESLint } from '@typescript-eslint/utils'

import type {
  DeprecatedCustomGroupsOption,
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { makeCommentAfterFixes } from './make-comment-after-fixes'
import { makeNewlinesFixes } from './make-newlines-fixes'
import { makeOrderFixes } from './make-order-fixes'

export interface MakeFixesParameters<T extends SortingNode> {
  options?: {
    customGroups?: DeprecatedCustomGroupsOption | CustomGroupsOption
    partitionByComment?: PartitionByCommentOption
    newlinesBetween?: NewlinesBetweenOption
    groups?: GroupsOptions<string>
  }
  ignoreFirstNodeHighestBlockComment?: boolean
  sourceCode: TSESLint.SourceCode
  fixer: TSESLint.RuleFixer
  sortedNodes: T[]
  nodes: T[]
}

export let makeFixes = <T extends SortingNode>({
  ignoreFirstNodeHighestBlockComment,
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

  let newlinesFixes = makeNewlinesFixes({
    options: {
      ...options,
      newlinesBetween: options.newlinesBetween,
      groups: options.groups,
    },
    sortedNodes,
    sourceCode,
    fixer,
    nodes,
  })

  return [...orderFixes, ...newlinesFixes]
}
