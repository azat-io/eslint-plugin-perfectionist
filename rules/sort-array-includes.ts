import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedArrayIncludesOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    spreadLast: boolean
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-array-includes'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted arrays before include method',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: ['alphabetical', 'natural', 'line-length'],
            default: 'alphabetical',
            type: 'string',
          },
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
            type: 'string',
          },
          ignoreCase: {
            type: 'boolean',
            default: false,
          },
          spreadLast: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedArrayIncludesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    MemberExpression: node => {
      if (
        (node.object.type === 'ArrayExpression' ||
          node.object.type === 'NewExpression') &&
        node.property.type === 'Identifier' &&
        node.property.name === 'includes'
      ) {
        let elements =
          node.object.type === 'ArrayExpression'
            ? node.object.elements
            : node.object.arguments

        if (elements.length > 1) {
          let options = complete(context.options.at(0), {
            type: 'alphabetical',
            order: 'asc',
            ignoreCase: false,
            spreadLast: false,
          } as const)

          let nodes: ({ type: string } & SortingNode)[] = elements
            .reduce(
              (
                accumulator: ({ type: string } & SortingNode)[][],
                element: TSESTree.SpreadElement | TSESTree.Expression | null,
              ) => {
                if (element !== null) {
                  accumulator.at(0)!.push({
                    name:
                      element.type === 'Literal'
                        ? `${element.value}`
                        : context.sourceCode.text.slice(...element.range),
                    size: rangeToDiff(element.range),
                    type: element.type,
                    node: element,
                  })
                }

                return accumulator
              },
              [[], []],
            )
            .flat()

          pairwise(nodes, (left, right) => {
            let compareValue: boolean

            if (
              options.spreadLast &&
              left.node.type === 'Literal' &&
              right.node.type === 'SpreadElement'
            ) {
              compareValue = false
            } else if (
              options.spreadLast &&
              left.node.type === 'SpreadElement' &&
              right.node.type === 'Literal'
            ) {
              compareValue = true
            } else {
              compareValue = isPositive(compare(left, right, options))
            }

            if (compareValue) {
              context.report({
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: toSingleLine(left.name),
                  right: toSingleLine(right.name),
                },
                node: right.node,
                fix: fixer => {
                  let sortedNodes = sortNodes(nodes, options)

                  if (options.spreadLast) {
                    for (let i = 0, max = sortedNodes.length; i < max; i++) {
                      if (sortedNodes.at(i)!.node.type === 'SpreadElement') {
                        sortedNodes.push(sortedNodes.splice(i, 1).at(0)!)
                      }
                    }
                  }

                  return makeFixes(
                    fixer,
                    nodes,
                    sortedNodes,
                    context.sourceCode,
                  )
                },
              })
            }
          })
        }
      }
    },
  }),
})
