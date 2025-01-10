import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { makeOrderAndCommentsAfterFixes } from './make-order-and-comments-after-fixes'
import { makeNewlinesFixes } from './make-newlines-fixes'

interface MakeOrderCommentsAfterAndNewlinesFixesParameters {
  options: {
    partitionByComment:
      | {
          block?: string[] | boolean | string
          line?: string[] | boolean | string
        }
      | string[]
      | boolean
      | string
    groups: (
      | { newlinesBetween: 'ignore' | 'always' | 'never' }
      | string[]
      | string
    )[]
    customGroups?: Record<string, string[] | string> | CustomGroup[]
    newlinesBetween: 'ignore' | 'always' | 'never'
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

export let makeOrderCommentsAfterAndNewlinesFixes = ({
  ignoreFirstNodeHighestBlockComment,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeOrderCommentsAfterAndNewlinesFixesParameters): TSESLint.RuleFix[] => [
  ...makeOrderAndCommentsAfterFixes({
    ignoreFirstNodeHighestBlockComment,
    sortedNodes,
    sourceCode,
    options,
    fixer,
    nodes,
  }),
  ...makeNewlinesFixes({
    sortedNodes,
    sourceCode,
    options,
    fixer,
    nodes,
  }),
]
