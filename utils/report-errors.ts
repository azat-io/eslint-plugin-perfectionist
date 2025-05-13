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
  messageIds: MessageIds[]
  sortedNodes: T[]
  nodes: T[]
  right: T
  left: T
}

export let reportErrors = <MessageIds extends string, T extends SortingNode>({
  firstUnorderedNodeDependentOnRight,
  ignoreFirstNodeHighestBlockComment,
  newlinesBetweenValueGetter,
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
      fix: (fixer: TSESLint.RuleFixer) =>
        makeFixes({
          ignoreFirstNodeHighestBlockComment,
          newlinesBetweenValueGetter,
          sortedNodes,
          sourceCode,
          options,
          fixer,
          nodes,
        }),
      data: {
        [NODE_DEPENDENT_ON_RIGHT]: firstUnorderedNodeDependentOnRight?.name,
        [RIGHT]: toSingleLine(right.name),
        [LEFT]: toSingleLine(left.name),
        [RIGHT_GROUP]: right.group,
        [LEFT_GROUP]: left.group,
      },
      node: right.node,
      messageId,
    })
  }
}

let toSingleLine = (string: string): string =>
  string.replaceAll(/\s{2,}/gu, ' ').trim()
