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
import { makeCommentAboveFixes } from './make-comment-above-fixes'
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
  hasCommentAboveMissing: boolean
  fixer: TSESLint.RuleFixer
  sortedNodes: T[]
  nodes: T[]
}

export function makeFixes<T extends SortingNode>({
  ignoreFirstNodeHighestBlockComment,
  newlinesBetweenValueGetter,
  hasCommentAboveMissing,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeFixesParameters<T>): TSESLint.RuleFix[] {
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
  if (commentAfterFixes.length > 0) {
    return [...orderFixes, ...commentAfterFixes]
  }

  if (options?.groups && options.newlinesBetween !== undefined) {
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
    if (newlinesFixes.length > 0) {
      return [...orderFixes, ...newlinesFixes]
    }
  }

  if (orderFixes.length > 0) {
    return orderFixes
  }

  if (!hasCommentAboveMissing || !options?.groups) {
    return []
  }

  return makeCommentAboveFixes({
    options: {
      ...options,
      groups: options.groups,
    },
    sortedNodes,
    sourceCode,
    fixer,
  })
}
