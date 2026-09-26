import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'
import type { Options } from './sort-switch-case/types'

import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import { makeSingleNodeCommentAfterFixes } from '../utils/make-single-node-comment-after-fixes'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { isConditionExpression } from './sort-switch-case/is-condition-expression'
import { validateCustomSortConfig } from '../utils/validate-custom-sort-config'
import { toSingleLine, ORDER_ERROR, RIGHT, LEFT } from '../utils/report-errors'
import { getEslintDisabledRules } from '../utils/get-eslint-disabled-rules'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
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

interface SortSwitchCaseNameSortingNode extends SortingNode {
  caseNode: TSESTree.SwitchCase
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
      let defaultComparator = defaultComparatorByOptionsComputer(options)

      validateCustomSortConfig(options)

      let { sourceCode, id } = context
      let isConditionCaseSwitch =
        isConditionExpression(switchNode.discriminant) ||
        switchNode.cases.some(
          caseNode =>
            caseNode.test !== null && isConditionExpression(caseNode.test),
        )
      if (isConditionCaseSwitch) {
        return
      }

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })

      let sortingNodes: SortSwitchCaseSortingNode[] = switchNode.cases.map(
        (caseNode: TSESTree.SwitchCase) => ({
          isEslintDisabled: isCaseEslintDisabled({
            eslintDisabledLines,
            ruleName: id,
            sourceCode,
            caseNode,
          }),
          size:
            caseNode.test ?
              rangeToDiff(caseNode.test, sourceCode)
            : 'default'.length,
          name: getCaseName(sourceCode, caseNode),
          addSafetySemicolonWhenInline: true,
          isDefaultClause: !caseNode.test,
          group: 'unknown',
          partitionId: 0,
          node: caseNode,
        }),
      )
      let caseNameGroups = reduceCaseSortingNodes(
        sortingNodes,
        caseNode => caseNode.node.consequent.length > 0,
      )

      // For each case group, ensure the nodes are in the correct order.
      let reportedEslintDisabledCases = new Set<TSESTree.Node>()
      let hasUnsortedNodes = false
      for (let [groupIndex, caseGroup] of caseNameGroups.entries()) {
        let caseNameNodes: SortSwitchCaseNameSortingNode[] = caseGroup.flatMap(
          ({ isEslintDisabled, name, size, node }) =>
            node.test ?
              [
                {
                  partitionId: groupIndex + 1,
                  group: 'unknown',
                  isEslintDisabled,
                  node: node.test,
                  caseNode: node,
                  name,
                  size,
                },
              ]
            : [],
        )
        let sortedCaseNameNodes = sortCaseNameSortingNodes(false)
        let sortedCaseNameNodesExcludingEslintDisabled =
          sortCaseNameSortingNodes(true)
        hasUnsortedNodes ||= sortedCaseNameNodesExcludingEslintDisabled.some(
          (node, index) => node !== caseNameNodes[index],
        )

        let nodeIndexMap = createNodeIndexMap(sortedCaseNameNodes)
        let fixedNodeIndexMap = createNodeIndexMap(
          sortedCaseNameNodesExcludingEslintDisabled,
        )
        let getCaseNameFix = createFixProvider({
          sortedNodes: sortedCaseNameNodesExcludingEslintDisabled,
          nodes: caseNameNodes,
          sourceCode,
        })

        pairwise(caseNameNodes, (left, right) => {
          if (!left) {
            return
          }

          if (nodeIndexMap.get(left)! > nodeIndexMap.get(right)!) {
            for (let sortingNode of [left, right]) {
              if (!sortingNode.isEslintDisabled) {
                continue
              }
              reportEslintDisabledCase({
                reportedCases: reportedEslintDisabledCases,
                node: sortingNode.caseNode,
                context,
                right,
                left,
              })
            }
          }

          if (fixedNodeIndexMap.get(left)! < fixedNodeIndexMap.get(right)!) {
            return
          }

          context.report({
            data: {
              [RIGHT]: toSingleLine(right.name),
              [LEFT]: toSingleLine(left.name),
            },
            fix: fixer =>
              getCaseNameFix({ hasCommentAboveMissing: false, fixer }),
            /*
             * ESLint drops the fix along with the report it suppresses, so the
             * error goes to the case that can move.
             */
            node: right.isEslintDisabled ? left.node : right.node,
            messageId: ORDER_ERROR_ID,
          })
        })

        function sortCaseNameSortingNodes(
          ignoreEslintDisabledNodes: boolean,
        ): SortSwitchCaseNameSortingNode[] {
          return sortNodes({
            comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
            ignoreEslintDisabledNodes,
            nodes: caseNameNodes,
            options,
          })
        }
      }

      /* Ensure default is at the end. */
      let sortingNodesGroupWithDefault = caseNameGroups.find(caseNodeGroup =>
        caseNodeGroup.some(node => node.isDefaultClause),
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
          /**
           * A case an ESLint disable directive holds in place cannot be swapped
           * with the default clause, so the error goes to it: ESLint suppresses
           * the report, dropping the fix, and counts the directive as used.
           */
          node: lastCase.isEslintDisabled ? lastCase.node : defaultCase.node,
          messageId: ORDER_ERROR_ID,
        })
      }

      /* Ensure case blocks are in the correct order. */
      let caseBlocks: SortSwitchCaseBlock[] = reduceCaseSortingNodes(
        sortingNodes,
        caseNode => caseHasBreakOrReturn(caseNode.node),
      ).map(cases => ({
        ...cases[0]!,
        isEslintDisabled: cases.some(caseNode => caseNode.isEslintDisabled),
        isDefaultClause: cases.some(caseNode => caseNode.isDefaultClause),
        cases,
      }))
      /**
       * If the last case does not have a return/break, leave its group at its
       * place.
       */
      let lastBlock = caseBlocks.at(-1)!
      let lastBlockCaseShouldStayInPlace = !caseHasBreakOrReturn(
        lastBlock.cases.at(-1)!.node,
      )
      let sortedBlocks = sortCaseBlocks(false)
      let sortedBlocksExcludingEslintDisabled = sortCaseBlocks(true)
      let blockIndexMap = createNodeIndexMap(sortedBlocks)
      let fixedBlockIndexMap = createNodeIndexMap(
        sortedBlocksExcludingEslintDisabled,
      )
      let getBlockFix = createFixProvider({
        sortedNodes: sortedBlocksExcludingEslintDisabled.flatMap(
          block => block.cases,
        ),
        nodes: sortingNodes,
        sourceCode,
      })
      pairwise(caseBlocks, (leftBlock, rightBlock) => {
        if (!leftBlock) {
          return
        }

        let left = leftBlock.cases.at(-1)!
        let right = rightBlock.cases[0]!
        if (blockIndexMap.get(leftBlock)! > blockIndexMap.get(rightBlock)!) {
          for (let block of [leftBlock, rightBlock]) {
            for (let sortingNode of block.cases) {
              if (!sortingNode.isEslintDisabled) {
                continue
              }
              reportEslintDisabledCase({
                reportedCases: reportedEslintDisabledCases,
                node: sortingNode.node,
                context,
                right,
                left,
              })
            }
          }
        }

        if (
          fixedBlockIndexMap.get(leftBlock)! <
          fixedBlockIndexMap.get(rightBlock)!
        ) {
          return
        }

        context.report({
          fix: fixer =>
            hasUnsortedNodes ?
              [] /* Raise errors but only sort on second iteration. */
            : getBlockFix({ hasCommentAboveMissing: false, fixer }),
          data: {
            [RIGHT]: right.name,
            [LEFT]: left.name,
          },
          /*
           * ESLint drops the fix along with the report it suppresses, so the
           * error goes to the case that can move.
           */
          node: right.isEslintDisabled ? left.node : right.node,
          messageId: ORDER_ERROR_ID,
        })
      })

      function sortCaseBlocks(
        ignoreEslintDisabledNodes: boolean,
      ): SortSwitchCaseBlock[] {
        return sortNodes({
          // Blocks use the primary comparator of their first case, without fallback.
          comparatorByOptionsComputer: () => (a, b) => {
            if (lastBlockCaseShouldStayInPlace) {
              if (a === lastBlock) {
                return 1
              }
              /* v8 ignore if -- @preserve last element might never be b. */
              if (b === lastBlock) {
                return -1
              }
            }

            if (a.isDefaultClause) {
              return 1
            }
            if (b.isDefaultClause) {
              return -1
            }

            return defaultComparator(a, b)
          },
          ignoreEslintDisabledNodes,
          nodes: caseBlocks,
          options,
        })
      }
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
 * Checks if a switch case sits on a line where the rule is disabled.
 *
 * `getEslintDisabledLines` reports whole lines, while ESLint opens and closes a
 * disabled block at the exact position of the comment. What counts for a case
 * is therefore the last directive written before it on its own line: holding a
 * case in place that ESLint does not cover would raise an error that nothing
 * suppresses and no fix can clear.
 *
 * @param props - Configuration object.
 * @param props.eslintDisabledLines - Lines where the rule is disabled.
 * @param props.sourceCode - The ESLint source code object.
 * @param props.caseNode - The switch case AST node.
 * @param props.ruleName - Name of the rule to check for disable directives.
 * @returns True if ESLint has the rule disabled for this case.
 */
function isCaseEslintDisabled({
  eslintDisabledLines,
  sourceCode,
  caseNode,
  ruleName,
}: {
  sourceCode: TSESLint.SourceCode
  caseNode: TSESTree.SwitchCase
  eslintDisabledLines: number[]
  ruleName: string
}): boolean {
  if (!isNodeEslintDisabled(caseNode, eslintDisabledLines)) {
    return false
  }

  let directivesBeforeCase = sourceCode
    .getCommentsBefore(caseNode)
    .filter(comment => comment.loc.end.line === caseNode.loc.start.line)
    .map(comment => getEslintDisabledRules(comment.value))
    .filter(
      directive =>
        directive?.rules === 'all' || directive?.rules.includes(ruleName),
    )

  return directivesBeforeCase.at(-1)?.eslintDisableDirective !== 'eslint-enable'
}

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
 * Reports an order error on a case that an ESLint disable directive holds in
 * place.
 *
 * ESLint suppresses this report, and that is what keeps the directive from
 * being reported as unused and removed, which would let the case it protects be
 * sorted on the next run. The report carries no fix: moving the cases that may
 * move is the job of the report on the case that has to move.
 *
 * A case can be part of several unordered pairs, and one report is all the
 * directive needs, so the cases already reported on are skipped.
 *
 * @param props - Configuration object.
 * @param props.reportedCases - Cases already reported on.
 * @param props.context - ESLint rule context used to report the error.
 * @param props.node - Case node to report the error on.
 * @param props.right - Right node of the unordered pair.
 * @param props.left - Left node of the unordered pair.
 */
function reportEslintDisabledCase({
  reportedCases,
  context,
  right,
  node,
  left,
}: {
  context: TSESLint.RuleContext<MessageId, Options>
  reportedCases: Set<TSESTree.Node>
  node: TSESTree.Node
  right: SortingNode
  left: SortingNode
}): void {
  if (reportedCases.has(node)) {
    return
  }
  reportedCases.add(node)

  context.report({
    data: {
      [RIGHT]: right.name,
      [LEFT]: left.name,
    },
    messageId: ORDER_ERROR_ID,
    node,
  })
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
