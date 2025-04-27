import type { TSESLint } from '@typescript-eslint/utils'

import type { NewlinesBetweenValueGetter } from './get-newlines-between-errors'
import type { SortingNode } from '../types/sorting-node'
import type { MakeFixesParameters } from './make-fixes'

import { makeFixes } from './make-fixes'

const NODE_DEPENDENT_ON_RIGHT = 'nodeDependentOnRight'
export const RIGHT = 'right'
const RIGHT_GROUP = 'rightGroup'
export const LEFT = 'left'
const LEFT_GROUP = 'leftGroup'
const MISSED_COMMENT_ABOVE = 'missedCommentAbove'

export const ORDER_ERROR =
  `Expected "{{${RIGHT}}}" to come before "{{${LEFT}}}".` as const
export const DEPENDENCY_ORDER_ERROR =
  `Expected dependency "{{${RIGHT}}}" to come before "{{${NODE_DEPENDENT_ON_RIGHT}}}".` as const
export const GROUP_ORDER_ERROR =
  `Expected "{{${RIGHT}}}" ({{${RIGHT_GROUP}}}) to come before "{{${LEFT}}}" ({{${LEFT_GROUP}}}).` as const
export const EXTRA_SPACING_ERROR =
  `Extra spacing between "{{${LEFT}}}" and "{{${RIGHT}}}" objects.` as const
export const MISSED_SPACING_ERROR =
  `Missed spacing between "{{${LEFT}}}" and "{{${RIGHT}}}".` as const
export const MISSED_COMMENT_ABOVE_ERROR =
  `Missed comment "{{${MISSED_COMMENT_ABOVE}}}" above "{{${RIGHT}}}".` as const

interface ReportErrorsParameters<
  MessageIds extends string,
  T extends SortingNode,
> {
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>
  context: TSESLint.RuleContext<MessageIds, unknown[]>
  ignoreFirstNodeHighestBlockComment?: boolean
  options?: MakeFixesParameters<T>['options']
  firstUnorderedNodeDependentOnRight?: T
  sourceCode: TSESLint.SourceCode
  commentAboveMissing?: string
  messageIds: MessageIds[]
  sortedNodes: T[]
  left: null | T
  nodes: T[]
  right: T
}

export let reportErrors = <MessageIds extends string, T extends SortingNode>({
  firstUnorderedNodeDependentOnRight,
  ignoreFirstNodeHighestBlockComment,
  newlinesBetweenValueGetter,
  commentAboveMissing,
  sortedNodes,
  messageIds,
  sourceCode,
  context,
  options,
  nodes,
  right,
  left,
}: ReportErrorsParameters<MessageIds, T>): void => {
  for (let messageId of messageIds) {
    context.report({
      data: {
        [NODE_DEPENDENT_ON_RIGHT]: firstUnorderedNodeDependentOnRight?.name,
        [MISSED_COMMENT_ABOVE]: commentAboveMissing,
        [LEFT]: toSingleLine(left?.name ?? ''),
        [RIGHT]: toSingleLine(right.name),
        [RIGHT_GROUP]: right.group,
        [LEFT_GROUP]: left?.group,
      },
      fix: (fixer: TSESLint.RuleFixer) =>
        makeFixes({
          hasCommentAboveMissing: !!commentAboveMissing,
          ignoreFirstNodeHighestBlockComment,
          newlinesBetweenValueGetter,
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

let toSingleLine = (string: string): string =>
  string.replaceAll(/\s{2,}/gu, ' ').trim()
