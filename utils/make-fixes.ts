import type { TSESLint } from '@typescript-eslint/utils'

import type {
  PartitionByCommentOption,
  GroupOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { makeCommentAfterFixes } from './make-comment-after-fixes'
import { makeNewlinesFixes } from './make-newlines-fixes'
import { makeOrderFixes } from './make-order-fixes'

export interface MakeFixesParameters {
  options?: {
    customGroups?: Record<string, string[] | string> | CustomGroup[]
    newlinesBetween?: 'ignore' | 'always' | 'never'
    partitionByComment?: PartitionByCommentOption
    groups?: GroupOptions<string>
  }
  ignoreFirstNodeHighestBlockComment?: boolean
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  fixer: TSESLint.RuleFixer
  nodes: SortingNode[]
}

interface CustomGroup {
  newlinesInside?: 'always' | 'never'
  groupName: string
}

export let makeFixes = ({
  ignoreFirstNodeHighestBlockComment,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeFixesParameters): TSESLint.RuleFix[] => {
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
    commentAfterFixes.length ||
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
