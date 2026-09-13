import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'
import type { Options } from './sort-switch-case/types'

import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import { makeSingleNodeCommentAfterFixes } from '../utils/make-single-node-comment-after-fixes'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { isConditionExpression } from './sort-switch-case/is-condition-expression'
import { validateCustomSortConfig } from '../utils/validate-custom-sort-config'
import { reportErrors, ORDER_ERROR, RIGHT, LEFT } from '../utils/report-errors'
import { getEslintDisabledRules } from '../utils/get-eslint-disabled-rules'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'

interface SortSwitchCaseSortingNode extends SortingNode<TSESTree.SwitchCase> {
  isDefaultClause: boolean
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

      let caseNameSortingNodeGroups = switchNode.cases.reduce(
        (
          accumulator: SortSwitchCaseNameSortingNode[][],
          caseNode: TSESTree.SwitchCase,
          index: number,
        ) => {
          if (caseNode.test) {
            accumulator.at(-1)!.push({
              isEslintDisabled: isCaseEslintDisabled({
                eslintDisabledLines,
                ruleName: id,
                sourceCode,
                caseNode,
              }),
              size: rangeToDiff(caseNode.test, sourceCode),
              name: getCaseName(sourceCode, caseNode),
              partitionId: accumulator.length,
              node: caseNode.test,
              group: 'unknown',
              caseNode,
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
        let sortedCaseNameSortingNodes = sortCaseNameSortingNodes(false)
        let sortedCaseNameSortingNodesExcludingEslintDisabled =
          sortCaseNameSortingNodes(true)
        hasUnsortedNodes ||=
          sortedCaseNameSortingNodesExcludingEslintDisabled.some(
            (node, index) => node !== caseNodesSortingNodeGroup[index],
          )

        let nodeIndexMap = createNodeIndexMap(sortedCaseNameSortingNodes)

        pairwise(caseNodesSortingNodeGroup, (left, right) => {
          if (!left) {
            return
          }

          if (nodeIndexMap.get(left)! > nodeIndexMap.get(right)!) {
            let eslintDisabledNodes = getEslintDisabledNodes([left, right])
            for (let sortingNode of eslintDisabledNodes) {
              reportEslintDisabledCase({
                node: sortingNode.caseNode,
                context,
                right,
                left,
              })
            }
          }

          if (
            isPairInSortedOrder({
              sortedNodes: sortedCaseNameSortingNodesExcludingEslintDisabled,
              right,
              left,
            })
          ) {
            return
          }

          reportErrors({
            sortedNodes: sortedCaseNameSortingNodesExcludingEslintDisabled,
            reportNode: right.isEslintDisabled ? left.node : undefined,
            nodes: caseNodesSortingNodeGroup,
            messageIds: [ORDER_ERROR_ID],
            sourceCode,
            context,
            right,
            left,
          })
        })

        function sortCaseNameSortingNodes(
          ignoreEslintDisabledNodes: boolean,
        ): SortSwitchCaseNameSortingNode[] {
          return sortNodes({
            comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
            nodes: caseNodesSortingNodeGroup,
            ignoreEslintDisabledNodes,
            options,
          })
        }
      }

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
          node: lastCase.isEslintDisabled ? lastCase.node : defaultCase.node,
          messageId: ORDER_ERROR_ID,
        })
      }

      /* Ensure case blocks are in the correct order. */
      let sortingNodeGroupsForBlockSort = reduceCaseSortingNodes(
        sortingNodes,
        caseNode => caseHasBreakOrReturn(caseNode.node),
      )
      /**
       * If the last case does not have a return/break, leave its group at its
       * place.
       */
      let lastNodeGroup = sortingNodeGroupsForBlockSort.at(-1)
      let lastBlockCaseShouldStayInPlace = !caseHasBreakOrReturn(
        lastNodeGroup!.at(-1)!.node,
      )
      let sortedNodeGroups = [...sortingNodeGroupsForBlockSort].toSorted(
        (a, b) => {
          if (lastBlockCaseShouldStayInPlace) {
            if (a === lastNodeGroup) {
              return 1
            }
            /* v8 ignore if -- @preserve last element might never be b. */
            if (b === lastNodeGroup) {
              return -1
            }
          }

          if (a.some(node => node.isDefaultClause)) {
            return 1
          }
          if (b.some(node => node.isDefaultClause)) {
            return -1
          }

          return defaultComparator(a.at(0)!, b.at(0)!)
        },
      )
      let sortedSortingNodeGroupsForBlockSort = sortedNodeGroups.flat()
      let sortedNodesExcludingEslintDisabled = pinEslintDisabledNodeGroups(
        sortingNodeGroupsForBlockSort,
        sortedNodeGroups,
      ).flat()
      let sortingNodeGroupsForBlockSortFlat =
        sortingNodeGroupsForBlockSort.flat()
      let nodeGroupByNode = new Map<
        SortSwitchCaseSortingNode,
        SortSwitchCaseSortingNode[]
      >()
      for (let nodeGroup of sortingNodeGroupsForBlockSort) {
        for (let sortingNode of nodeGroup) {
          nodeGroupByNode.set(sortingNode, nodeGroup)
        }
      }
      let reportedEslintDisabledNodes = new Set<SortSwitchCaseSortingNode>()
      pairwise(sortingNodeGroupsForBlockSortFlat, (left, right) => {
        if (!left) {
          return
        }

        let indexOfLeft = sortedSortingNodeGroupsForBlockSort.indexOf(left)
        let indexOfRight = sortedSortingNodeGroupsForBlockSort.indexOf(right)
        if (indexOfLeft > indexOfRight) {
          let eslintDisabledNodes = getEslintDisabledNodes([
            ...nodeGroupByNode.get(left)!,
            ...nodeGroupByNode.get(right)!,
          ])
          for (let sortingNode of eslintDisabledNodes) {
            if (!reportedEslintDisabledNodes.has(sortingNode)) {
              reportedEslintDisabledNodes.add(sortingNode)
              reportEslintDisabledCase({
                node: sortingNode.node,
                context,
                right,
                left,
              })
            }
          }
        }

        if (
          isPairInSortedOrder({
            sortedNodes: sortedNodesExcludingEslintDisabled,
            right,
            left,
          })
        ) {
          return
        }

        context.report({
          fix: fixer =>
            hasUnsortedNodes ?
              [] /* Raise errors but only sort on second iteration. */
            : makeFixes({
                sortedNodes: sortedNodesExcludingEslintDisabled,
                nodes: sortingNodeGroupsForBlockSortFlat,
                hasCommentAboveMissing: false,
                sourceCode,
                fixer,
              }),
          data: {
            [RIGHT]: right.name,
            [LEFT]: left.name,
          },
          node: right.isEslintDisabled ? left.node : right.node,
          messageId: ORDER_ERROR_ID,
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
    .filter(eslintDisabledRules =>
      doesDirectiveApplyToRule(eslintDisabledRules, ruleName),
    )

  return directivesBeforeCase.at(-1)?.eslintDisableDirective !== 'eslint-enable'
}

/**
 * Keeps the case blocks holding an ESLint disable directive at their position.
 *
 * The fixer moves whole blocks of cases at once, so a block is held in place as
 * soon as one of its cases sits on a line where the rule is disabled: pinning a
 * single case of a moving block would separate the fallthrough labels from the
 * body they fall into.
 *
 * Held blocks are taken out of the sorted blocks and put back at the index they
 * had in the source code, the way `sortNodes` does it for single nodes.
 *
 * @param nodeGroups - Blocks of cases in source code order.
 * @param sortedNodeGroups - The same blocks in sorted order.
 * @returns The sorted blocks with the disabled ones back at their position.
 */
function pinEslintDisabledNodeGroups(
  nodeGroups: SortSwitchCaseSortingNode[][],
  sortedNodeGroups: SortSwitchCaseSortingNode[][],
): SortSwitchCaseSortingNode[][] {
  let sortedNodeGroupsExcludingEslintDisabled = sortedNodeGroups.filter(
    nodeGroup => getEslintDisabledNodes(nodeGroup).length === 0,
  )

  /* Add ignored nodes at the same position as they were before linting. */
  for (let [index, nodeGroup] of nodeGroups.entries()) {
    if (getEslintDisabledNodes(nodeGroup).length > 0) {
      sortedNodeGroupsExcludingEslintDisabled.splice(index, 0, nodeGroup)
    }
  }

  return sortedNodeGroupsExcludingEslintDisabled
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
 * @param props - Configuration object.
 * @param props.context - ESLint rule context used to report the error.
 * @param props.node - Case node to report the error on.
 * @param props.right - Right node of the unordered pair.
 * @param props.left - Left node of the unordered pair.
 */
function reportEslintDisabledCase({
  context,
  right,
  node,
  left,
}: {
  context: TSESLint.RuleContext<MessageId, Options>
  node: TSESTree.Node
  right: SortingNode
  left: SortingNode
}): void {
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
 * Checks if an ESLint disable directive applies to a given rule.
 *
 * @param eslintDisabledRules - Directive parsed out of a comment.
 * @param ruleName - Name of the rule the directive has to apply to.
 * @returns True if the directive covers the rule.
 */
function doesDirectiveApplyToRule(
  eslintDisabledRules: ReturnType<typeof getEslintDisabledRules>,
  ruleName: string,
): boolean {
  if (!eslintDisabledRules) {
    return false
  }
  return (
    eslintDisabledRules.rules === 'all' ||
    eslintDisabledRules.rules.includes(ruleName)
  )
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

/**
 * Checks if a pair of nodes is already in the order the fixer would produce.
 *
 * The pair can be unordered against the plain sorting and still be final here:
 * that happens when an ESLint disable directive holds one of the two cases at
 * its position.
 *
 * @param props - Configuration object.
 * @param props.sortedNodes - Nodes in sorted order, with the ones an ESLint
 *   disable directive holds in place kept at their position.
 * @param props.right - Right node of the pair.
 * @param props.left - Left node of the pair.
 * @returns True if the fixer would leave the pair in its current order.
 */
function isPairInSortedOrder<T extends SortingNode>({
  sortedNodes,
  right,
  left,
}: {
  sortedNodes: T[]
  right: T
  left: T
}): boolean {
  return sortedNodes.indexOf(left) < sortedNodes.indexOf(right)
}

/**
 * Finds the cases that an ESLint disable directive holds in place.
 *
 * @param nodeGroup - Block of switch case sorting nodes.
 * @returns The cases the rule is disabled for.
 */
function getEslintDisabledNodes<T extends SortingNode>(nodeGroup: T[]): T[] {
  return nodeGroup.filter(sortingNode => sortingNode.isEslintDisabled)
}
