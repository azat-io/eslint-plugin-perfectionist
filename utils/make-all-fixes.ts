import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { makeCommentAfterFixes } from './make-comment-after-fixes'
import { makeNewlinesFixes } from './make-newlines-fixes'
import { makeOrderFixes } from './make-order-fixes'

interface MakeAllFixesParameters {
  options?: {
    partitionByComment?:
      | {
          block?: string[] | boolean | string
          line?: string[] | boolean | string
        }
      | string[]
      | boolean
      | string
    groups?: (
      | { newlinesBetween: 'ignore' | 'always' | 'never' }
      | string[]
      | string
    )[]
    customGroups?: Record<string, string[] | string> | CustomGroup[]
    newlinesBetween?: 'ignore' | 'always' | 'never'
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

export let makeAllFixes = ({
  ignoreFirstNodeHighestBlockComment,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeAllFixesParameters): TSESLint.RuleFix[] => {
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
