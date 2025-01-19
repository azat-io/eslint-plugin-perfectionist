import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'
import type { MakeFixesParameters } from './make-fixes'

import { toSingleLine } from './to-single-line'
import { makeFixes } from './make-fixes'

interface ReportErrorsParameters<MessageIds extends string> {
  context: TSESLint.RuleContext<MessageIds, unknown[]>
  firstUnorderedNodeDependentOnRight?: SortingNode
  ignoreFirstNodeHighestBlockComment?: boolean
  options?: MakeFixesParameters['options']
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  messageIds: MessageIds[]
  nodes: SortingNode[]
  right: SortingNode
  left: SortingNode
}

export let reportErrors = <MessageIds extends string>({
  firstUnorderedNodeDependentOnRight,
  ignoreFirstNodeHighestBlockComment,
  sortedNodes,
  messageIds,
  sourceCode,
  context,
  options,
  nodes,
  right,
  left,
}: ReportErrorsParameters<MessageIds>): void => {
  for (let messageId of messageIds) {
    context.report({
      data: {
        nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
        right: toSingleLine(right.name),
        left: toSingleLine(left.name),
        rightGroup: right.group,
        leftGroup: left.group,
      },
      fix: (fixer: TSESLint.RuleFixer) =>
        makeFixes({
          ignoreFirstNodeHighestBlockComment,
          sortedNodes,
          sourceCode,
          options,
          fixer,
          nodes,
        }),
      node: right.node,
      messageId,
    })
  }
}
