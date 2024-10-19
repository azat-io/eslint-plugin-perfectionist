import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  matcherJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedMapElementsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    matcher: 'minimatch' | 'regex'
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

const defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  order: 'asc',
  ignoreCase: true,
  specialCharacters: 'keep',
  matcher: 'minimatch',
  partitionByComment: false,
  partitionByNewLine: false,
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-maps',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted Map elements.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          matcher: matcherJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          partitionByComment: {
            description:
              'Allows you to use comments to separate the maps members into logical groups.',
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
            ],
          },
          partitionByNewLine: {
            description:
              'Allows to use spaces to separate the nodes into logical groups.',
            type: 'boolean',
          },
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
        node.callee.type === 'Identifier' &&
        node.callee.name === 'Map' &&
        node.arguments.length &&
        node.arguments[0]?.type === 'ArrayExpression'
      ) {
        let [{ elements }] = node.arguments

        if (elements.length > 1) {
          let settings = getSettings(context.settings)

          let options = complete(context.options.at(0), settings, {
            ...defaultOptions,
          })

          let sourceCode = getSourceCode(context)
          let partitionComment = options.partitionByComment

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
                  name = sourceCode.text.slice(...left.range)
                }
              } else {
                name = sourceCode.text.slice(...element.range)
              }

              let lastSortingNode = formattedMembers.at(-1)?.at(-1)
              let sortingNode: SortingNode = {
                size: rangeToDiff(element.range),
                node: element,
                name,
              }

              if (
                (partitionComment &&
                  hasPartitionComment(
                    partitionComment,
                    getCommentsBefore(element, sourceCode),
                    options.matcher,
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
              pairwise(nodes, (left, right) => {
                if (isPositive(compare(left, right, options))) {
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
                        sortNodes(nodes, options),
                        sourceCode,
                        options,
                      ),
                  })
                }
              })
            }
          }
        }
      }
    },
  }),
})
