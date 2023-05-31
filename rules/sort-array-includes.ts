import type { TSESTree } from '@typescript-eslint/types'
import type { SortingNode } from '../typings'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { createEslintRule } from '../utils/create-eslint-rule'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortType, SortOrder } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedArrayIncludesOrder'

type Options = [
  Partial<{
    order: SortOrder
    type: SortType
    spreadLast: boolean
  }>,
]

export const RULE_NAME = 'sort-array-includes'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted arrays before include method',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: [
              SortType.alphabetical,
              SortType.natural,
              SortType['line-length'],
            ],
            default: SortType.natural,
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
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
        'Expected "{{second}}" to come before "{{first}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => ({
    MemberExpression: node => {
      if (
        (node.object.type === AST_NODE_TYPES.ArrayExpression ||
          node.object.type === AST_NODE_TYPES.NewExpression) &&
        node.property.type === AST_NODE_TYPES.Identifier &&
        node.property.name === 'includes'
      ) {
        let options = complete(context.options.at(0), {
          type: SortType.alphabetical,
          order: SortOrder.asc,
          spreadLast: false,
        })

        let elements =
          node.object.type === AST_NODE_TYPES.ArrayExpression
            ? node.object.elements
            : node.object.arguments

        if (elements.length > 1) {
          let source = context.getSourceCode()

          let nodes: (SortingNode & { type: string })[] = elements
            .reduce(
              (
                accumulator: (SortingNode & { type: string })[][],
                element: TSESTree.Expression | TSESTree.SpreadElement | null,
              ) => {
                if (element === null) {
                  return accumulator
                }

                accumulator.at(0)!.push({
                  name:
                    element.type === AST_NODE_TYPES.Literal
                      ? element.raw
                      : source.text.slice(...element.range),
                  size: rangeToDiff(element.range),
                  type: element.type,
                  node: element,
                })

                return accumulator
              },
              [[], []],
            )
            .flat()

          pairwise(nodes, (first, second) => {
            let compareValue: boolean

            if (
              options.spreadLast &&
              first.node.type === AST_NODE_TYPES.Literal &&
              second.node.type === AST_NODE_TYPES.SpreadElement
            ) {
              compareValue = false
            } else if (
              options.spreadLast &&
              first.node.type === AST_NODE_TYPES.SpreadElement &&
              second.node.type === AST_NODE_TYPES.Literal
            ) {
              compareValue = true
            } else {
              compareValue = compare(first, second, options)
            }

            if (compareValue) {
              context.report({
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: first.name,
                  second: second.name,
                },
                node: second.node,
                fix: fixer =>
                  sortNodes(fixer, {
                    options,
                    source,
                    nodes,
                  }),
              })
            }
          })
        }
      }
    },
  }),
})
