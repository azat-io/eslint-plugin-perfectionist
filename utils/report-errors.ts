import type { TSESLint } from '@typescript-eslint/utils'

import type { NewlinesBetweenValueGetter } from './get-newlines-between-errors'
import type { CommonPartitionOptions } from '../types/common-partition-options'
import type { CommonGroupsOptions } from '../types/common-groups-options'
import type { SortingNode } from '../types/sorting-node'

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

/**
 * Parameters for reporting ESLint errors with auto-fix support.
 *
 * @template MessageIds - Union of available message IDs for the rule.
 * @template T - Type of sorting node extending the base SortingNode.
 */
interface ReportErrorsParameters<
  MessageIds extends string,
  T extends SortingNode,
> {
  options?: Pick<CommonPartitionOptions, 'partitionByComment'> &
    CommonGroupsOptions<string, unknown, unknown>
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>
  context: TSESLint.RuleContext<MessageIds, unknown[]>
  ignoreFirstNodeHighestBlockComment?: boolean
  firstUnorderedNodeDependentOnRight?: T
  sourceCode: TSESLint.SourceCode
  commentAboveMissing?: string
  messageIds: MessageIds[]
  sortedNodes: T[]
  left: null | T
  nodes: T[]
  right: T
}

/**
 * Reports ESLint errors with contextual data and auto-fix support.
 *
 * Generates ESLint error reports for each provided message ID, including:
 *
 * - Contextual data for error messages (element names, groups, dependencies)
 * - Auto-fix function that applies all necessary corrections
 * - Node location for error highlighting.
 *
 * The function supports dynamic message templates with placeholders that are
 * replaced with actual values:
 *
 * - {{left}} / {{right}} - Element names in the comparison
 * - {{leftGroup}} / {{rightGroup}} - Group names
 * - {{nodeDependentOnRight}} - Name of dependent element
 * - {{missedCommentAbove}} - Missing comment text.
 *
 * @example
 *   // Reporting import order violation
 *   reportErrors({
 *     messageIds: ['unexpectedOrder'],
 *     left: { name: 'useState', group: 'react' },
 *     right: { name: 'React', group: 'react' },
 *     // Error: "Expected 'React' to come before 'useState'"
 *   })
 *
 * @example
 *   // Reporting dependency violation in TypeScript interfaces
 *   reportErrors({
 *   messageIds: ['unexpectedDependencyOrder'],
 *   right: { name: 'User', ... },
 *   firstUnorderedNodeDependentOnRight: { name: 'AdminUser extends User', ... },
 *   // Error: "Expected 'User' to come before 'AdminUser extends User' due to dependency"
 *   });
 *
 * @example
 *   // Reporting missing newlines between import groups
 *   reportErrors({
 *     messageIds: ['missedSpacingBetweenMembers'],
 *     left: { name: 'React', group: 'external' },
 *     right: { name: './utils', group: 'internal' },
 *     // Error: "Expected newline between external and internal imports"
 *   })
 *
 * @template MessageIds - Union of message IDs.
 * @template T - Type of sorting node.
 * @param params - Parameters for error reporting.
 */
export function reportErrors<MessageIds extends string, T extends SortingNode>({
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
}: ReportErrorsParameters<MessageIds, T>): void {
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

/**
 * Converts multi-line strings to single-line for error messages.
 *
 * Normalizes element names that may span multiple lines (like template
 * literals, multi-line imports, or complex expressions) into a single line
 * format suitable for error messages.
 *
 * @example
 *   toSingleLine(`
 *     import {
 *       Component
 *     } from 'react'
 *   `)
 *   // Returns: "import { Component } from 'react'"
 *
 * @param string - Multi-line string to normalize.
 * @returns Single-line string with normalized whitespace.
 */
function toSingleLine(string: string): string {
  return string.replaceAll(/\s{2,}/gu, ' ').trim()
}
