import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID = 'unexpectedMapElementsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

let defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  order: 'asc',
  ignoreCase: true,
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  locales: 'en-US',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-maps',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted Map elements.',
      url: 'https://perfectionist.dev/rules/sort-maps',
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
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the maps members into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedMapElementsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    NewExpression: node => {
      if (
        node.callee.type !== 'Identifier' ||
        node.callee.name !== 'Map' ||
        !node.arguments.length ||
        node.arguments[0]?.type !== 'ArrayExpression'
      ) {
        return
      }
      let [{ elements }] = node.arguments
      if (!isSortable(elements)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        sourceCode,
        ruleName: context.id,
      })

      let parts: TSESTree.Expression[][] = elements.reduce(
        (
          accumulator: TSESTree.Expression[][],
          element: TSESTree.SpreadElement | TSESTree.Expression | null,
        ) => {
          if (element === null || element.type === 'SpreadElement') {
            accumulator.push([])
          } else {
            accumulator.at(-1)!.push(element)
          }
          return accumulator
        },
        [[]],
      )
      for (let part of parts) {
        let formattedMembers: SortingNode[][] = [[]]
        for (let element of part) {
          let name: string

          if (element.type === 'ArrayExpression') {
            let [left] = element.elements

            if (!left) {
              name = `${left}`
            } else if (left.type === 'Literal') {
              name = left.raw
            } else {
              name = sourceCode.getText(left)
            }
          } else {
            name = sourceCode.getText(element)
          }

          let lastSortingNode = formattedMembers.at(-1)?.at(-1)
          let sortingNode: SortingNode = {
            size: rangeToDiff(element, sourceCode),
            node: element,
            isEslintDisabled: isNodeEslintDisabled(
              element,
              eslintDisabledLines,
            ),
            name,
          }

          if (
            (options.partitionByComment &&
              hasPartitionComment(
                options.partitionByComment,
                getCommentsBefore(element, sourceCode),
              )) ||
            (options.partitionByNewLine &&
              lastSortingNode &&
              getLinesBetween(sourceCode, lastSortingNode, sortingNode))
          ) {
            formattedMembers.push([])
          }

          formattedMembers.at(-1)!.push(sortingNode)
        }

        for (let nodes of formattedMembers) {
          let sortNodesExcludingEslintDisabled = (
            ignoreEslintDisabledNodes: boolean,
          ): SortingNode[] =>
            sortNodes(nodes, options, { ignoreEslintDisabledNodes })
          let sortedNodes = sortNodesExcludingEslintDisabled(false)
          let sortedNodesExcludingEslintDisabled =
            sortNodesExcludingEslintDisabled(true)

          pairwise(nodes, (left, right) => {
            let indexOfLeft = sortedNodes.indexOf(left)
            let indexOfRight = sortedNodes.indexOf(right)
            let indexOfRightExcludingEslintDisabled =
              sortedNodesExcludingEslintDisabled.indexOf(right)
            if (
              indexOfLeft < indexOfRight &&
              indexOfLeft < indexOfRightExcludingEslintDisabled
            ) {
              return
            }

            context.report({
              messageId: 'unexpectedMapElementsOrder',
              data: {
                left: toSingleLine(left.name),
                right: toSingleLine(right.name),
              },
              node: right.node,
              fix: fixer =>
                makeFixes(
                  fixer,
                  nodes,
                  sortedNodesExcludingEslintDisabled,
                  sourceCode,
                  options,
                ),
            })
          })
        }
      }
    },
  }),
})
