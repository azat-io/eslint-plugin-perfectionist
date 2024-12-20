import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types'

import {
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { makeCommentAfterFixes } from '../utils/make-comment-after-fixes'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { compare } from '../utils/compare'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

interface SortSwitchCaseSortingNode extends SortingNode<TSESTree.SwitchCase> {
  isDefaultClause: boolean
}

type MESSAGE_ID = 'unexpectedSwitchCaseOrder'

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    SwitchStatement: switchNode => {
      if (!isSortable(switchNode.cases)) {
        return
      }

      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)

      let sourceCode = getSourceCode(context)
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
              isEslintDisabled: false,
              node: caseNode.test,
            })
          }
          if (
            caseNode.consequent.length &&
            index !== switchNode.cases.length - 1
          ) {
            accumulator.push([])
          }
          return accumulator
        },
        [[]],
      )

      // For each case group, ensure the nodes are in the correct order
      let hasUnsortedNodes = false
      for (let caseNodesSortingNodeGroup of caseNameSortingNodeGroups) {
        let sortedCaseNameSortingNodes = sortNodes(
          caseNodesSortingNodeGroup,
          options,
        )
        hasUnsortedNodes ||= sortedCaseNameSortingNodes.some(
          (node, index) => node !== caseNodesSortingNodeGroup[index],
        )

        let nodeIndexMap = createNodeIndexMap(sortedCaseNameSortingNodes)

        pairwise(caseNodesSortingNodeGroup, (left, right) => {
          let leftIndex = nodeIndexMap.get(left)!
          let rightIndex = nodeIndexMap.get(right)!

          if (leftIndex < rightIndex) {
            return
          }

          context.report({
            fix: fixer =>
              makeFixes({
                sortedNodes: sortedCaseNameSortingNodes,
                nodes: caseNodesSortingNodeGroup,
                sourceCode,
                fixer,
              }),
            data: {
              right: right.name,
              left: left.name,
            },
            messageId: 'unexpectedSwitchCaseOrder',
            node: right.node,
          })
        })
      }

      let sortingNodes = switchNode.cases.map(
        (caseNode: TSESTree.SwitchCase) => ({
          size: caseNode.test
            ? rangeToDiff(caseNode.test, sourceCode)
            : 'default'.length,
          name: getCaseName(sourceCode, caseNode),
          addSafetySemicolonWhenInline: true,
          isDefaultClause: !caseNode.test,
          isEslintDisabled: false,
          node: caseNode,
        }),
      )

      // Ensure default is at the end
      let sortingNodeGroupsForDefaultSort = reduceCaseSortingNodes(
        sortingNodes,
        caseNode => !!caseNode.node.consequent.length,
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
              ...makeCommentAfterFixes({
                sortedNode: punctuatorAfterLastCase,
                node: defaultCase.node,
                sourceCode,
                fixer,
              }),
              ...makeCommentAfterFixes({
                node: punctuatorAfterLastCase,
                sortedNode: defaultCase.node,
                sourceCode,
                fixer,
              }),
            ]
          },
          data: {
            left: defaultCase.name,
            right: lastCase.name,
          },
          messageId: 'unexpectedSwitchCaseOrder',
          node: defaultCase.node,
        })
      }

      // Ensure case blocks are in the correct order
      let sortingNodeGroupsForBlockSort = reduceCaseSortingNodes(
        sortingNodes,
        caseNode => caseHasBreakOrReturn(caseNode.node),
      )
      // If the last case does not have a return/break, leave its group at its place
      let lastNodeGroup = sortingNodeGroupsForBlockSort.at(-1)
      let lastBlockCaseShouldStayInPlace = !caseHasBreakOrReturn(
        lastNodeGroup!.at(-1)!.node,
      )
      let sortedSortingNodeGroupsForBlockSort = [
        ...sortingNodeGroupsForBlockSort,
      ]
        .sort((a, b) => {
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
          return compare(a.at(0)!, b.at(0)!, options)
        })
        .flat()
      let sortingNodeGroupsForBlockSortFlat =
        sortingNodeGroupsForBlockSort.flat()
      pairwise(sortingNodeGroupsForBlockSortFlat, (left, right) => {
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
                  sourceCode,
                  fixer,
                }),
          data: {
            right: right.name,
            left: left.name,
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
          specialCharacters: specialCharactersJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          order: orderJsonSchema,
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
      unexpectedSwitchCaseOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-switch-case',
})

let getCaseName = (
  sourceCode: TSESLint.SourceCode,
  caseNode: TSESTree.SwitchCase,
): string => {
  if (caseNode.test?.type === 'Literal') {
    return `${caseNode.test.value}`
  } else if (caseNode.test === null) {
    return 'default'
  }
  return sourceCode.getText(caseNode.test)
}

let reduceCaseSortingNodes = (
  caseNodes: SortSwitchCaseSortingNode[],
  endsBlock: (caseNode: SortSwitchCaseSortingNode) => boolean,
): SortSwitchCaseSortingNode[][] =>
  caseNodes.reduce(
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

let caseHasBreakOrReturn = (caseNode: TSESTree.SwitchCase): boolean => {
  let statements =
    caseNode.consequent[0]?.type === 'BlockStatement'
      ? caseNode.consequent[0].body
      : caseNode.consequent

  return statements.some(statementIsBreakOrReturn)
}

let statementIsBreakOrReturn = (
  statement: TSESTree.Statement,
): statement is TSESTree.ReturnStatement | TSESTree.BreakStatement =>
  statement.type === 'BreakStatement' || statement.type === 'ReturnStatement'
