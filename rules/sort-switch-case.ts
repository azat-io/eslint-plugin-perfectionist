import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'
import type { Options } from './sort-switch-case/types'

import { buildCaseBlockComparatorByOptionsComputer } from './sort-switch-case/build-case-block-comparator-by-options-computer'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import { makeSingleNodeCommentAfterFixes } from '../utils/make-single-node-comment-after-fixes'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { isConditionExpression } from './sort-switch-case/is-condition-expression'
import { validateCustomSortConfig } from '../utils/validate-custom-sort-config'
import { reportErrors, ORDER_ERROR, RIGHT, LEFT } from '../utils/report-errors'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { createFixProvider } from '../utils/create-fix-provider'
import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'

interface SortSwitchCaseSortingNode extends SortingNode<TSESTree.SwitchCase> {
  isDefaultClause: boolean
}

interface SortSwitchCaseBlock extends SortSwitchCaseSortingNode {
  cases: SortSwitchCaseSortingNode[]
}

const ORDER_ERROR_ID = 'unexpectedSwitchCaseOrder'

type MessageId = typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    SwitchStatement: switchNode => {
      if (!isSortable(switchNode.cases)) {
        return
      }

      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, defaultOptions)

      validateCustomSortConfig(options)

      let { sourceCode } = context
      let isConditionCaseSwitch =
        isConditionExpression(switchNode.discriminant) ||
        switchNode.cases.some(
          caseNode =>
            caseNode.test !== null && isConditionExpression(caseNode.test),
        )
      if (isConditionCaseSwitch) {
        return
      }

      let caseNameSortingNodeGroups = switchNode.cases.reduce(
        (
          accumulator: SortingNode[][],
          caseNode: TSESTree.SwitchCase,
          index: number,
        ) => {
          if (caseNode.test) {
            accumulator.at(-1)!.push({
              size: rangeToDiff(caseNode.test, sourceCode),
              name: getCaseName(sourceCode, caseNode),
              partitionId: accumulator.length,
              isEslintDisabled: false,
              node: caseNode.test,
              group: 'unknown',
            })
          }
          if (
            caseNode.consequent.length > 0 &&
            index !== switchNode.cases.length - 1
          ) {
            accumulator.push([])
          }
          return accumulator
        },
        [[]],
      )

      // For each case group, ensure the nodes are in the correct order.
      let hasUnsortedNodes = false
      for (let caseNodesSortingNodeGroup of caseNameSortingNodeGroups) {
        let sortedCaseNameSortingNodes = sortNodes({
          comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
          nodes: caseNodesSortingNodeGroup,
          ignoreEslintDisabledNodes: false,
          options,
        })
        hasUnsortedNodes ||= sortedCaseNameSortingNodes.some(
          (node, index) => node !== caseNodesSortingNodeGroup[index],
        )

        let nodeIndexMap = createNodeIndexMap(sortedCaseNameSortingNodes)
        let getCaseNameFix = createFixProvider({
          sortedNodes: sortedCaseNameSortingNodes,
          nodes: caseNodesSortingNodeGroup,
          sourceCode,
        })

        pairwise(caseNodesSortingNodeGroup, (left, right) => {
          if (!left) {
            return
          }

          let leftIndex = nodeIndexMap.get(left)!
          let rightIndex = nodeIndexMap.get(right)!

          if (leftIndex < rightIndex) {
            return
          }

          reportErrors({
            messageIds: [ORDER_ERROR_ID],
            getFix: getCaseNameFix,
            context,
            right,
            left,
          })
        })
      }

      let sortingNodes: SortSwitchCaseSortingNode[] = switchNode.cases.map(
        (caseNode: TSESTree.SwitchCase) => ({
          size:
            caseNode.test ?
              rangeToDiff(caseNode.test, sourceCode)
            : 'default'.length,
          name: getCaseName(sourceCode, caseNode),
          addSafetySemicolonWhenInline: true,
          isDefaultClause: !caseNode.test,
          isEslintDisabled: false,
          group: 'unknown',
          partitionId: 0,
          node: caseNode,
        }),
      )

      /* Ensure default is at the end. */
      let sortingNodeGroupsForDefaultSort = reduceCaseSortingNodes(
        sortingNodes,
        caseNode => caseNode.node.consequent.length > 0,
      )
      let sortingNodesGroupWithDefault = sortingNodeGroupsForDefaultSort.find(
        caseNodeGroup => caseNodeGroup.some(node => node.isDefaultClause),
      )
      if (
        sortingNodesGroupWithDefault &&
        !sortingNodesGroupWithDefault.at(-1)!.isDefaultClause
      ) {
        let defaultCase = sortingNodesGroupWithDefault.find(
          node => node.isDefaultClause,
        )!
        let lastCase = sortingNodesGroupWithDefault.at(-1)!
        context.report({
          fix: fixer => {
            let punctuatorAfterLastCase = sourceCode.getTokenAfter(
              lastCase.node.test!,
            )!
            let lastCaseRange = [
              lastCase.node.range[0],
              punctuatorAfterLastCase.range[1],
            ] as const
            return [
              fixer.replaceText(
                defaultCase.node,
                sourceCode.text.slice(...lastCaseRange),
              ),
              fixer.replaceTextRange(
                lastCaseRange,
                sourceCode.getText(defaultCase.node),
              ),
              ...makeSingleNodeCommentAfterFixes({
                sortedNode: punctuatorAfterLastCase,
                node: defaultCase.node,
                sourceCode,
                fixer,
              }),
              ...makeSingleNodeCommentAfterFixes({
                node: punctuatorAfterLastCase,
                sortedNode: defaultCase.node,
                sourceCode,
                fixer,
              }),
            ]
          },
          data: {
            [LEFT]: defaultCase.name,
            [RIGHT]: lastCase.name,
          },
          messageId: ORDER_ERROR_ID,
          node: defaultCase.node,
        })
      }

      /* Ensure case blocks are in the correct order. */
      let caseBlocks: SortSwitchCaseBlock[] = reduceCaseSortingNodes(
        sortingNodes,
        caseNode => caseHasBreakOrReturn(caseNode.node),
      ).map(cases => ({
        ...cases[0]!,
        isDefaultClause: cases.some(caseNode => caseNode.isDefaultClause),
        cases,
      }))
      /**
       * If the last case does not have a return/break, leave its group at its
       * place.
       */
      let lastBlock = caseBlocks.at(-1)!
      let lastBlockToKeepInPlace =
        caseHasBreakOrReturn(lastBlock.cases.at(-1)!.node) ? null : lastBlock
      let sortedBlocks = sortNodes({
        comparatorByOptionsComputer: buildCaseBlockComparatorByOptionsComputer({
          lastBlockToKeepInPlace,
          options,
        }),
        ignoreEslintDisabledNodes: false,
        nodes: caseBlocks,
        options,
      })
      let blockIndexMap = createNodeIndexMap(sortedBlocks)
      let getBlockFix = createFixProvider({
        sortedNodes: sortedBlocks.flatMap(block => block.cases),
        nodes: sortingNodes,
        sourceCode,
      })
      pairwise(caseBlocks, (leftBlock, rightBlock) => {
        if (!leftBlock) {
          return
        }

        if (blockIndexMap.get(leftBlock)! < blockIndexMap.get(rightBlock)!) {
          return
        }

        let left = leftBlock.cases.at(-1)!
        let right = rightBlock.cases[0]!
        context.report({
          fix: fixer =>
            hasUnsortedNodes ?
              [] /* Raise errors but only sort on second iteration. */
            : getBlockFix({ hasCommentAboveMissing: false, fixer }),
          data: {
            [RIGHT]: right.name,
            [LEFT]: left.name,
          },
          messageId: ORDER_ERROR_ID,
          node: right.node,
        })
      })
    },
  }),
  meta: {
    docs: {
      url: 'https://perfectionist.dev/rules/sort-switch-case',
      description: 'Enforce sorted switch cases.',
      recommended: true,
    },
    schema: [
      {
        properties: buildCommonJsonSchemas(),
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-switch-case',
})

/**
 * Groups consecutive switch case nodes into blocks for sorting.
 *
 * Creates partitions of case nodes where each partition ends when the
 * `endsBlock` predicate returns true (typically when a case has a break or
 * return statement).
 *
 * @param caseNodes - Array of switch case sorting nodes to partition.
 * @param endsBlock - Predicate function that determines if a case ends a block.
 * @returns A 2D array where each inner array is a sortable block of cases.
 */
function reduceCaseSortingNodes(
  caseNodes: SortSwitchCaseSortingNode[],
  endsBlock: (caseNode: SortSwitchCaseSortingNode) => boolean,
): SortSwitchCaseSortingNode[][] {
  return caseNodes.reduce(
    (
      accumulator: SortSwitchCaseSortingNode[][],
      caseNode: SortSwitchCaseSortingNode,
      index: number,
    ) => {
      accumulator.at(-1)!.push(caseNode)
      if (endsBlock(caseNode) && index !== caseNodes.length - 1) {
        accumulator.push([])
      }
      return accumulator
    },
    [[]],
  )
}

/**
 * Extracts the name of a switch case for sorting purposes.
 *
 * For literal test values, returns the string representation of the value. For
 * the default case (null test), returns 'default'. For other expressions,
 * returns the source code text.
 *
 * @param sourceCode - The ESLint source code object.
 * @param caseNode - The switch case AST node.
 * @returns The name to use for sorting this case.
 */
function getCaseName(
  sourceCode: TSESLint.SourceCode,
  caseNode: TSESTree.SwitchCase,
): string {
  if (caseNode.test?.type === AST_NODE_TYPES.Literal) {
    return String(caseNode.test.value)
  }
  if (caseNode.test === null) {
    return 'default'
  }
  return sourceCode.getText(caseNode.test)
}

/**
 * Checks if a switch case contains a break or return statement.
 *
 * Examines the case's consequent statements, handling both direct statements
 * and statements wrapped in a block.
 *
 * @param caseNode - The switch case AST node to check.
 * @returns True if the case contains a break or return statement.
 */
function caseHasBreakOrReturn(caseNode: TSESTree.SwitchCase): boolean {
  let statements =
    caseNode.consequent[0]?.type === AST_NODE_TYPES.BlockStatement ?
      caseNode.consequent[0].body
    : caseNode.consequent

  return statements.some(statementIsBreakOrReturn)
}

/**
 * Type guard that checks if a statement is a break or return statement.
 *
 * @param statement - The statement AST node to check.
 * @returns True if the statement is a BreakStatement or ReturnStatement.
 */
function statementIsBreakOrReturn(
  statement: TSESTree.Statement,
): statement is TSESTree.ReturnStatement | TSESTree.BreakStatement {
  return (
    statement.type === AST_NODE_TYPES.BreakStatement ||
    statement.type === AST_NODE_TYPES.ReturnStatement
  )
}
