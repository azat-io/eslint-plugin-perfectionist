import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { CommonOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { makeSingleNodeCommentAfterFixes } from '../utils/make-single-node-comment-after-fixes'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { reportErrors, ORDER_ERROR, RIGHT, LEFT } from '../utils/report-errors'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { commonJsonSchemas } from '../utils/common-json-schemas'
import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { compare } from '../utils/compare'

interface SortSwitchCaseSortingNode extends SortingNode<TSESTree.SwitchCase> {
  isDefaultClause: boolean
}

type MessageId = 'unexpectedSwitchCaseOrder'

type Options = [Partial<CommonOptions>]

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
      validateCustomSortConfiguration(options)

      let { sourceCode } = context
      let isDiscriminantTrue =
        switchNode.discriminant.type === 'Literal' &&
        switchNode.discriminant.value === true
      if (isDiscriminantTrue) {
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
          nodes: caseNodesSortingNodeGroup,
          ignoreEslintDisabledNodes: false,
          options,
        })
        hasUnsortedNodes ||= sortedCaseNameSortingNodes.some(
          (node, index) => node !== caseNodesSortingNodeGroup[index],
        )

        let nodeIndexMap = createNodeIndexMap(sortedCaseNameSortingNodes)

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
            messageIds: ['unexpectedSwitchCaseOrder'],
            sortedNodes: sortedCaseNameSortingNodes,
            nodes: caseNodesSortingNodeGroup,
            sourceCode,
            context,
            right,
            left,
          })
        })
      }

      let sortingNodes: SortSwitchCaseSortingNode[] = switchNode.cases.map(
        (caseNode: TSESTree.SwitchCase) => ({
          size: caseNode.test
            ? rangeToDiff(caseNode.test, sourceCode)
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

      // Ensure default is at the end.
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
          messageId: 'unexpectedSwitchCaseOrder',
          node: defaultCase.node,
        })
      }

      // Ensure case blocks are in the correct order.
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
      let sortedSortingNodeGroupsForBlockSort = [
        ...sortingNodeGroupsForBlockSort,
      ]
        .toSorted((a, b) => {
          if (lastBlockCaseShouldStayInPlace) {
            if (a === lastNodeGroup) {
              return 1
            }
            /* v8 ignore start - last element might never be b */
            if (b === lastNodeGroup) {
              return -1
              /* v8 ignore end */
            }
          }

          if (a.some(node => node.isDefaultClause)) {
            return 1
          }
          if (b.some(node => node.isDefaultClause)) {
            return -1
          }
          return compare({
            a: a.at(0)!,
            b: b.at(0)!,
            options,
          })
        })
        .flat()
      let sortingNodeGroupsForBlockSortFlat =
        sortingNodeGroupsForBlockSort.flat()
      pairwise(sortingNodeGroupsForBlockSortFlat, (left, right) => {
        if (!left) {
          return
        }

        let indexOfLeft = sortedSortingNodeGroupsForBlockSort.indexOf(left)
        let indexOfRight = sortedSortingNodeGroupsForBlockSort.indexOf(right)
        if (indexOfLeft < indexOfRight) {
          return
        }
        context.report({
          fix: fixer =>
            hasUnsortedNodes
              ? [] // Raise errors but only sort on second iteration
              : makeFixes({
                  sortedNodes: sortedSortingNodeGroupsForBlockSort,
                  nodes: sortingNodeGroupsForBlockSortFlat,
                  hasCommentAboveMissing: false,
                  sourceCode,
                  fixer,
                }),
          data: {
            [RIGHT]: right.name,
            [LEFT]: left.name,
          },
          messageId: 'unexpectedSwitchCaseOrder',
          node: right.node,
        })
      })
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          ...commonJsonSchemas,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    docs: {
      url: 'https://perfectionist.dev/rules/sort-switch-case',
      description: 'Enforce sorted switch cases.',
      recommended: true,
    },
    messages: {
      unexpectedSwitchCaseOrder: ORDER_ERROR,
    },
    defaultOptions: [defaultOptions],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-switch-case',
})

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

function getCaseName(
  sourceCode: TSESLint.SourceCode,
  caseNode: TSESTree.SwitchCase,
): string {
  if (caseNode.test?.type === 'Literal') {
    return `${caseNode.test.value}`
  } else if (caseNode.test === null) {
    return 'default'
  }
  return sourceCode.getText(caseNode.test)
}

function caseHasBreakOrReturn(caseNode: TSESTree.SwitchCase): boolean {
  let statements =
    caseNode.consequent[0]?.type === 'BlockStatement'
      ? caseNode.consequent[0].body
      : caseNode.consequent

  return statements.some(statementIsBreakOrReturn)
}

function statementIsBreakOrReturn(
  statement: TSESTree.Statement,
): statement is TSESTree.ReturnStatement | TSESTree.BreakStatement {
  return (
    statement.type === 'BreakStatement' || statement.type === 'ReturnStatement'
  )
}
