import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import {
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { makeCommentAfterFixes } from '../utils/make-comment-after-fixes'
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

type MESSAGE_ID = 'unexpectedSwitchCaseOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

interface SortSwitchCaseSortingNode extends SortingNode<TSESTree.SwitchCase> {
  isDefaultClause: boolean
}

let defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  order: 'asc',
  locales: 'en-US',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-switch-case',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted switch cases.',
      url: 'https://perfectionist.dev/rules/sort-switch-case',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          locales: localesJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedSwitchCaseOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    SwitchStatement: switchNode => {
      if (!isSortable(switchNode.cases)) {
        return
      }

      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, defaultOptions)

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
              node: caseNode.test,
              isEslintDisabled: false,
              name: getCaseName(sourceCode, caseNode),
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

        pairwise(caseNodesSortingNodeGroup, (left, right) => {
          let indexOfLeft = sortedCaseNameSortingNodes.indexOf(left)
          let indexOfRight = sortedCaseNameSortingNodes.indexOf(right)
          if (indexOfLeft < indexOfRight) {
            return
          }

          context.report({
            messageId: 'unexpectedSwitchCaseOrder',
            data: {
              left: left.name,
              right: right.name,
            },
            node: right.node,
            fix: fixer =>
              makeFixes(
                fixer,
                caseNodesSortingNodeGroup,
                sortedCaseNameSortingNodes,
                sourceCode,
              ),
          })
        })
      }

      let sortingNodes = switchNode.cases.map(
        (caseNode: TSESTree.SwitchCase) => ({
          size: caseNode.test
            ? rangeToDiff(caseNode.test, sourceCode)
            : 'default'.length,
          node: caseNode,
          isEslintDisabled: false,
          isDefaultClause: !caseNode.test,
          name: getCaseName(sourceCode, caseNode),
          addSafetySemicolonWhenInline: true,
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
          messageId: 'unexpectedSwitchCaseOrder',
          data: {
            left: defaultCase.name,
            right: lastCase.name,
          },
          node: defaultCase.node,
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
              ...makeCommentAfterFixes(
                fixer,
                defaultCase.node,
                punctuatorAfterLastCase,
                sourceCode,
              ),
              ...makeCommentAfterFixes(
                fixer,
                punctuatorAfterLastCase,
                defaultCase.node,
                sourceCode,
              ),
            ]
          },
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
          messageId: 'unexpectedSwitchCaseOrder',
          data: {
            left: left.name,
            right: right.name,
          },
          node: right.node,
          fix: fixer =>
            hasUnsortedNodes
              ? [] // Raise errors but only sort on second iteration
              : makeFixes(
                  fixer,
                  sortingNodeGroupsForBlockSortFlat,
                  sortedSortingNodeGroupsForBlockSort,
                  sourceCode,
                ),
        })
      })
    },
  }),
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
  if (caseNode.consequent.length === 0) {
    return false
  }
  if (caseNode.consequent[0]?.type === 'BlockStatement') {
    return caseNode.consequent[0].body.some(statementIsBreakOrReturn)
  }
  return caseNode.consequent.some(currentConsequent =>
    statementIsBreakOrReturn(currentConsequent),
  )
}

let statementIsBreakOrReturn = (
  statement: TSESTree.Statement,
): statement is TSESTree.ReturnStatement | TSESTree.BreakStatement =>
  statement.type === 'BreakStatement' || statement.type === 'ReturnStatement'
